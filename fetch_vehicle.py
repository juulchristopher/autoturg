#!/usr/bin/env python3
"""
Look up vehicle data from Transpordiamet ATV API or mntstat.ee fallback.

Priority:
  1. ATV API (abi.ria.ee/teabevarav/) — requires API key
  2. mntstat.ee scraper — public, no auth needed

Usage:
  python fetch_vehicle.py 123ABC              # lookup by reg number
  python fetch_vehicle.py --vin WBAPH5C55BA1  # lookup by VIN
  python fetch_vehicle.py 123ABC --json       # JSON output
  python fetch_vehicle.py --serve             # start HTTP proxy server

Environment variables:
  ATV_API_KEY     — Transpordiamet ATV API key (from formal application)
  ATV_API_URL     — ATV API base URL (default: https://abi.ria.ee/teabevarav/api/v1)
  PROXY_PORT      — HTTP proxy port (default: 8080)
  ALLOWED_ORIGINS — Comma-separated allowed CORS origins (default: *)
"""

import json, re, sys, os, argparse
from urllib.request import urlopen, Request
from urllib.parse import quote, urlencode
from urllib.error import URLError, HTTPError
from http.server import HTTPServer, BaseHTTPRequestHandler

# Import mntstat.ee scraper as fallback
from scrape_vehicle import search_by_reg as mntstat_search

# ═════════════════════════════════════════════════
# ATV API CLIENT
# ═════════════════════════════════════════════════
ATV_API_KEY = os.environ.get("ATV_API_KEY", "")
ATV_API_URL = os.environ.get("ATV_API_URL", "https://abi.ria.ee/teabevarav/api/v1")


def atv_lookup_reg(reg_number: str) -> dict:
    """Look up vehicle by registration number via ATV API.
    Returns normalized vehicle dict or None if API unavailable."""
    if not ATV_API_KEY:
        return None

    reg = re.sub(r'[^A-Z0-9]', '', reg_number.upper())
    url = f"{ATV_API_URL}/vehicles?regNumber={quote(reg)}"

    try:
        req = Request(url, headers={
            "Authorization": f"Bearer {ATV_API_KEY}",
            "Accept": "application/json",
            "User-Agent": "autoturg-bot/1.0"
        })
        with urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())

        if not data or (isinstance(data, list) and len(data) == 0):
            return {"error": f"Vehicle '{reg}' not found in ATV registry"}

        # ATV API may return a list or single object
        vehicle = data[0] if isinstance(data, list) else data

        # Normalize to our schema
        return normalize_atv_response(vehicle, reg)

    except HTTPError as e:
        if e.code == 401:
            return {"error": "ATV API key invalid or expired"}
        if e.code == 404:
            return {"error": f"Vehicle '{reg}' not found"}
        return {"error": f"ATV API error: HTTP {e.code}"}
    except (URLError, Exception) as e:
        return {"error": f"ATV API unavailable: {e}"}


def atv_lookup_vin(vin: str) -> dict:
    """Look up vehicle by VIN via ATV API."""
    if not ATV_API_KEY:
        return None

    vin = vin.strip().upper()
    if len(vin) != 17:
        return {"error": "Invalid VIN (must be 17 characters)"}

    url = f"{ATV_API_URL}/vehicles?vin={quote(vin)}"

    try:
        req = Request(url, headers={
            "Authorization": f"Bearer {ATV_API_KEY}",
            "Accept": "application/json",
            "User-Agent": "autoturg-bot/1.0"
        })
        with urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())

        if not data or (isinstance(data, list) and len(data) == 0):
            return {"error": f"VIN '{vin}' not found in ATV registry"}

        vehicle = data[0] if isinstance(data, list) else data
        return normalize_atv_response(vehicle, vehicle.get("regNumber", ""))

    except HTTPError as e:
        return {"error": f"ATV API error: HTTP {e.code}"}
    except (URLError, Exception) as e:
        return {"error": f"ATV API unavailable: {e}"}


def normalize_atv_response(raw: dict, reg_number: str) -> dict:
    """Normalize ATV API response to our VehicleLookup schema.

    ATV API field names may vary — this maps common patterns.
    Update this mapping once you have actual API documentation.
    """
    def get(keys, default=None):
        """Try multiple possible field names."""
        if isinstance(keys, str):
            keys = [keys]
        for k in keys:
            if k in raw:
                return raw[k]
            # Try camelCase and snake_case variations
            camel = k[0].lower() + k[1:]
            if camel in raw:
                return raw[camel]
        return default

    return {
        "source": "atv",
        "regNumber": reg_number,
        "vin": get(["vin", "VIN", "vinCode"], ""),
        "make": str(get(["make", "mark", "manufacturer"], "")).upper(),
        "model": get(["model", "mudel", "modelName"], ""),
        "variant": get(["variant", "version", "trim"], ""),
        "prodYear": _int(get(["prodYear", "productionYear", "year", "aasta"])),
        "bodyType": get(["bodyType", "keretüüp", "bodyStyle"], ""),
        "color": get(["color", "värv", "colour"], ""),
        "fuelType": get(["fuelType", "mootoritüüp", "fuel"], ""),
        "transmission": get(["transmission", "käigukast", "gearbox"], ""),
        "powerKw": _int(get(["powerKw", "power", "kw"])),
        "engineCc": _int(get(["engineCc", "engineVolume", "cc", "displacement"])),
        "weightKg": _int(get(["weightKg", "weight", "kg", "mass"])),
        "firstRegDate": get(["firstRegDate", "firstRegistration", "esmane_reg"], ""),
        "firstRegInEstonia": get(["firstRegInEstonia", "estoniaRegistration"], ""),
        "status": get(["status", "staatus", "registrationStatus"], ""),
        "county": get(["county", "maakond", "region"], ""),
        "ownerChangeCount": _int(get(["ownerChangeCount", "ownerChanges"])),
    }


def _int(val):
    """Safe int conversion."""
    if val is None:
        return None
    try:
        return int(val)
    except (ValueError, TypeError):
        return None


# ═════════════════════════════════════════════════
# UNIFIED LOOKUP (ATV → mntstat.ee fallback)
# ═════════════════════════════════════════════════
def lookup_vehicle(reg_number: str) -> dict:
    """Look up vehicle by reg number. Tries ATV API first, falls back to mntstat.ee."""

    # Try ATV API
    result = atv_lookup_reg(reg_number)
    if result is not None and "error" not in result:
        return result

    atv_error = result.get("error", "") if result else "ATV API not configured"

    # Fallback to mntstat.ee scraper
    try:
        mntstat_result = mntstat_search(reg_number)
        if "error" not in mntstat_result:
            mntstat_result["source"] = "mntstat"
            return mntstat_result
    except Exception as e:
        pass

    # Both failed
    if result and "error" in result:
        return result
    return {"error": f"Vehicle not found. ATV: {atv_error}"}


def lookup_by_vin(vin: str) -> dict:
    """Look up vehicle by VIN. ATV API only (mntstat.ee doesn't support VIN lookup)."""
    result = atv_lookup_vin(vin)
    if result is not None:
        return result
    return {"error": "VIN lookup requires ATV API credentials. Configure ATV_API_KEY."}


# ═════════════════════════════════════════════════
# HTTP PROXY SERVER (for client-side access)
# ═════════════════════════════════════════════════
PROXY_PORT = int(os.environ.get("PROXY_PORT", "8080"))
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "*")


class VehicleProxyHandler(BaseHTTPRequestHandler):
    """Simple HTTP proxy that bridges client-side JS to vehicle lookup APIs."""

    def do_OPTIONS(self):
        """Handle CORS preflight."""
        self.send_response(204)
        self._cors_headers()
        self.end_headers()

    def do_GET(self):
        """Handle vehicle lookup requests.

        Endpoints:
          GET /api/vehicle?reg=123ABC
          GET /api/vehicle?vin=WBAPH5C55BA123456
          GET /api/health
        """
        path = self.path.split("?")[0]

        if path == "/api/health":
            self._json_response({"status": "ok", "atvConfigured": bool(ATV_API_KEY)})
            return

        if path != "/api/vehicle":
            self.send_error(404, "Not found")
            return

        # Parse query params
        from urllib.parse import urlparse, parse_qs
        params = parse_qs(urlparse(self.path).query)

        reg = params.get("reg", [None])[0]
        vin = params.get("vin", [None])[0]

        if reg:
            result = lookup_vehicle(reg)
        elif vin:
            result = lookup_by_vin(vin)
        else:
            self._json_response({"error": "Provide ?reg=123ABC or ?vin=WBAPH5C55BA123456"}, 400)
            return

        status = 200 if "error" not in result else 404
        self._json_response({"data": result, "meta": {"source": result.get("source", "unknown")}}, status)

    def _cors_headers(self):
        origin = ALLOWED_ORIGINS
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _json_response(self, data, status=200):
        self.send_response(status)
        self._cors_headers()
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

    def log_message(self, format, *args):
        print(f"[proxy] {args[0]}")


def run_proxy():
    """Start the vehicle lookup proxy server."""
    server = HTTPServer(("0.0.0.0", PROXY_PORT), VehicleProxyHandler)
    print(f"Vehicle proxy running on http://localhost:{PROXY_PORT}")
    print(f"  ATV API: {'configured' if ATV_API_KEY else 'not configured (using mntstat.ee fallback)'}")
    print(f"  CORS origins: {ALLOWED_ORIGINS}")
    print(f"  Endpoints:")
    print(f"    GET /api/vehicle?reg=123ABC")
    print(f"    GET /api/vehicle?vin=WBAPH5C55BA123456")
    print(f"    GET /api/health")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nProxy stopped.")


# ═════════════════════════════════════════════════
# CLI
# ═════════════════════════════════════════════════
def main():
    parser = argparse.ArgumentParser(
        description="Look up vehicle data from ATV API or mntstat.ee"
    )
    parser.add_argument("query", nargs="?", help="Registration number (e.g. 123ABC)")
    parser.add_argument("--vin", help="Look up by VIN instead of reg number")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    parser.add_argument("--serve", action="store_true", help="Start HTTP proxy server")
    args = parser.parse_args()

    if args.serve:
        run_proxy()
        return

    if args.vin:
        result = lookup_by_vin(args.vin)
    elif args.query:
        result = lookup_vehicle(args.query)
    else:
        parser.print_help()
        return

    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        if "error" in result:
            print(f"Error: {result['error']}")
            sys.exit(1)

        source = result.get("source", "unknown")
        print(f"Vehicle: {result.get('regNumber', '?')} [source: {source}]")
        for key in ["vin", "make", "model", "variant", "prodYear", "bodyType",
                     "color", "fuelType", "transmission", "powerKw", "engineCc",
                     "weightKg", "county", "status", "firstRegDate", "firstRegInEstonia"]:
            val = result.get(key)
            if val:
                label = key.replace("_", " ").title()
                print(f"  {label:20s} {val}")


if __name__ == "__main__":
    main()
