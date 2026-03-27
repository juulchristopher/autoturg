#!/usr/bin/env python3
"""
Fetch vehicle pricing data from multiple sources and produce prices.json.

Sources:
  - mobile.de Search API (HTTP Basic auth)
  - AutoScout24 Listing API (OAuth)
  - auto24.ee (HTML scraping)

Usage:
  python fetch_prices.py              # fetch from all configured sources
  python fetch_prices.py --source auto24   # fetch from one source
  python fetch_prices.py --sample     # generate realistic sample data
"""

import json, os, re, sys, time, random, statistics
from datetime import date
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
from html.parser import HTMLParser

PRICES_FILE = Path(__file__).resolve().parent / "prices.json"

# ── Make normalization ──────────────────────────
MAKE_ALIASES = {
    "VW": "VOLKSWAGEN",
    "MERCEDES": "MERCEDES-BENZ",
    "MB": "MERCEDES-BENZ",
    "ALFA ROMEO": "ALFA ROMEO",
    "ALFAROMEO": "ALFA ROMEO",
    "LAND ROVER": "LAND ROVER",
    "LANDROVER": "LAND ROVER",
}

def normalize_make(raw):
    """Canonical UPPERCASE make name."""
    s = raw.strip().upper()
    return MAKE_ALIASES.get(s, s)

def normalize_model(raw):
    """Uppercase, stripped model name."""
    return raw.strip().upper()

# ── Models to search ────────────────────────────
# Top Estonian market models by transaction volume
SEARCH_MODELS = [
    ("BMW", "X5"), ("BMW", "320D"), ("BMW", "520D"), ("BMW", "530D"),
    ("VOLKSWAGEN", "GOLF"), ("VOLKSWAGEN", "PASSAT"), ("VOLKSWAGEN", "TIGUAN"),
    ("TOYOTA", "COROLLA"), ("TOYOTA", "RAV4"), ("TOYOTA", "YARIS"),
    ("MERCEDES-BENZ", "C220D"), ("MERCEDES-BENZ", "E220D"), ("MERCEDES-BENZ", "GLC"),
    ("AUDI", "A4"), ("AUDI", "A6"), ("AUDI", "Q5"),
    ("VOLVO", "XC60"), ("VOLVO", "V60"), ("VOLVO", "XC90"),
    ("SKODA", "OCTAVIA"), ("SKODA", "SUPERB"), ("SKODA", "KODIAQ"),
    ("FORD", "FOCUS"), ("FORD", "KUGA"),
    ("HYUNDAI", "TUCSON"), ("HYUNDAI", "I30"),
    ("KIA", "SPORTAGE"), ("KIA", "CEED"),
]

# ═════════════════════════════════════════════════
# SOURCE: mobile.de
# ═════════════════════════════════════════════════
MOBILE_DE_USER = os.environ.get("MOBILE_DE_USER", "")
MOBILE_DE_PASS = os.environ.get("MOBILE_DE_PASS", "")

def fetch_mobilede(make, model, year_from, year_to):
    """Fetch listings from mobile.de Search API. Returns list of ListingPrice dicts."""
    if not MOBILE_DE_USER or not MOBILE_DE_PASS:
        return []

    import base64
    auth = base64.b64encode(f"{MOBILE_DE_USER}:{MOBILE_DE_PASS}".encode()).decode()

    url = (
        f"https://services.mobile.de/search-api/search"
        f"?makeModelVariant1.makeId={make}"
        f"&makeModelVariant1.modelDescription={model}"
        f"&minFirstRegistrationDate={year_from}-01-01"
        f"&maxFirstRegistrationDate={year_to}-12-31"
        f"&maxResults=50"
    )

    try:
        req = Request(url, headers={
            "Authorization": f"Basic {auth}",
            "Accept": "application/json",
            "User-Agent": "autoturg-bot/1.0"
        })
        with urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())

        listings = []
        for item in data.get("searchResult", {}).get("items", []):
            try:
                listings.append({
                    "source": "mobile.de",
                    "sourceId": str(item.get("id", "")),
                    "make": normalize_make(make),
                    "model": normalize_model(model),
                    "variant": "",
                    "prodYear": int(item.get("firstRegistration", "")[:4]) if item.get("firstRegistration") else None,
                    "mileage": item.get("mileage", {}).get("value", 0),
                    "fuelType": item.get("fuelType", ""),
                    "price": item.get("price", {}).get("value", 0),
                    "currency": "EUR",
                    "listedDate": date.today().isoformat(),
                    "url": item.get("url", "")
                })
            except (KeyError, ValueError):
                continue
        return listings
    except (URLError, HTTPError) as e:
        print(f"  mobile.de error for {make} {model}: {e}", file=sys.stderr)
        return []

# ═════════════════════════════════════════════════
# SOURCE: AutoScout24
# ═════════════════════════════════════════════════
AS24_CLIENT_ID = os.environ.get("AUTOSCOUT24_CLIENT_ID", "")
AS24_CLIENT_SECRET = os.environ.get("AUTOSCOUT24_CLIENT_SECRET", "")

def fetch_autoscout24(make, model, year_from, year_to):
    """Fetch listings from AutoScout24 API. Returns list of ListingPrice dicts."""
    if not AS24_CLIENT_ID or not AS24_CLIENT_SECRET:
        return []

    # OAuth token
    try:
        token_req = Request(
            "https://accounts.autoscout24.com/oauth/token",
            data=f"grant_type=client_credentials&client_id={AS24_CLIENT_ID}&client_secret={AS24_CLIENT_SECRET}".encode(),
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            method="POST"
        )
        with urlopen(token_req, timeout=15) as resp:
            token = json.loads(resp.read().decode()).get("access_token", "")
    except (URLError, HTTPError) as e:
        print(f"  AutoScout24 auth error: {e}", file=sys.stderr)
        return []

    url = (
        f"https://api.autoscout24.com/listings"
        f"?make={make}&model={model}"
        f"&yearFrom={year_from}&yearTo={year_to}"
        f"&sort=standard&page=1&size=50"
    )

    try:
        req = Request(url, headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "User-Agent": "autoturg-bot/1.0"
        })
        with urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())

        listings = []
        for item in data.get("listings", []):
            try:
                listings.append({
                    "source": "autoscout24",
                    "sourceId": str(item.get("id", "")),
                    "make": normalize_make(make),
                    "model": normalize_model(model),
                    "variant": item.get("version", ""),
                    "prodYear": item.get("registrationYear"),
                    "mileage": item.get("mileage", 0),
                    "fuelType": item.get("fuelType", ""),
                    "price": item.get("price", 0),
                    "currency": "EUR",
                    "listedDate": date.today().isoformat(),
                    "url": item.get("detailUrl", "")
                })
            except (KeyError, ValueError):
                continue
        return listings
    except (URLError, HTTPError) as e:
        print(f"  AutoScout24 error for {make} {model}: {e}", file=sys.stderr)
        return []


# ═════════════════════════════════════════════════
# SOURCE: auto24.ee (HTML scraping)
# ═════════════════════════════════════════════════
class Auto24Parser(HTMLParser):
    """Parse auto24.ee search results table."""
    def __init__(self):
        super().__init__()
        self.listings = []
        self._in_row = False
        self._cells = []
        self._cell_text = ""
        self._in_cell = False

    def handle_starttag(self, tag, attrs):
        if tag == "tr":
            self._in_row = True
            self._cells = []
        elif tag == "td" and self._in_row:
            self._in_cell = True
            self._cell_text = ""

    def handle_data(self, data):
        if self._in_cell:
            self._cell_text += data.strip()

    def handle_endtag(self, tag):
        if tag == "td" and self._in_cell:
            self._cells.append(self._cell_text)
            self._in_cell = False
        elif tag == "tr" and self._in_row:
            self._in_row = False
            if len(self._cells) >= 5:
                self.listings.append(self._cells)

def fetch_auto24(make, model, year_from, year_to):
    """Scrape auto24.ee listings. Returns list of ListingPrice dicts.

    NOTE: auto24.ee and autoportaal.ee both block automated scraping:
    - auto24.ee: Cloudflare bot protection (HTTP 403 on all requests)
    - autoportaal.ee: JavaScript-rendered content (requires headless browser)

    This function is a no-op stub until a partnership/API is established.
    Run with --sample to generate representative pricing data.
    """
    return []


# ═════════════════════════════════════════════════
# AGGREGATION
# ═════════════════════════════════════════════════
def compute_aggregates(listings):
    """Group listings by (make, model, prodYear) and compute price statistics."""
    from collections import defaultdict

    groups = defaultdict(list)
    for lst in listings:
        if lst.get("price", 0) <= 0 or not lst.get("prodYear"):
            continue
        key = (lst["make"], lst["model"], lst["prodYear"])
        groups[key].append(lst)

    aggregates = []
    for (make, model, year), items in sorted(groups.items()):
        prices = sorted(p["price"] for p in items)
        mileages = [p["mileage"] for p in items if p.get("mileage", 0) > 0]
        n = len(prices)
        if n < 2:
            continue

        def percentile(data, pct):
            k = (len(data) - 1) * pct / 100
            f = int(k)
            c = f + 1
            if c >= len(data):
                return data[f]
            return data[f] + (k - f) * (data[c] - data[f])

        aggregates.append({
            "make": make,
            "model": model,
            "variant": "",
            "prodYear": year,
            "sampleSize": n,
            "medianPrice": int(statistics.median(prices)),
            "p25Price": int(percentile(prices, 25)),
            "p75Price": int(percentile(prices, 75)),
            "minPrice": prices[0],
            "maxPrice": prices[-1],
            "avgMileage": int(statistics.mean(mileages)) if mileages else 0,
            "lastUpdated": date.today().isoformat()
        })

    return aggregates


# ═════════════════════════════════════════════════
# SAMPLE DATA GENERATION
# ═════════════════════════════════════════════════
def generate_sample_data():
    """Generate realistic sample pricing data for the Estonian market."""

    # Base prices (median for 2020 model, EUR) and depreciation rates
    MODEL_PRICES = {
        ("BMW", "X5"):            {"base": 42000, "depr": 0.12, "mileage": 18000},
        ("BMW", "320D"):          {"base": 28000, "depr": 0.13, "mileage": 22000},
        ("BMW", "520D"):          {"base": 32000, "depr": 0.13, "mileage": 20000},
        ("BMW", "530D"):          {"base": 36000, "depr": 0.12, "mileage": 19000},
        ("VOLKSWAGEN", "GOLF"):   {"base": 22000, "depr": 0.11, "mileage": 16000},
        ("VOLKSWAGEN", "PASSAT"): {"base": 25000, "depr": 0.12, "mileage": 22000},
        ("VOLKSWAGEN", "TIGUAN"): {"base": 28000, "depr": 0.10, "mileage": 17000},
        ("TOYOTA", "COROLLA"):    {"base": 21000, "depr": 0.08, "mileage": 15000},
        ("TOYOTA", "RAV4"):       {"base": 32000, "depr": 0.07, "mileage": 16000},
        ("TOYOTA", "YARIS"):      {"base": 16000, "depr": 0.09, "mileage": 12000},
        ("MERCEDES-BENZ", "C220D"):{"base": 30000, "depr": 0.13, "mileage": 20000},
        ("MERCEDES-BENZ", "E220D"):{"base": 38000, "depr": 0.12, "mileage": 18000},
        ("MERCEDES-BENZ", "GLC"): {"base": 40000, "depr": 0.11, "mileage": 17000},
        ("AUDI", "A4"):           {"base": 28000, "depr": 0.12, "mileage": 20000},
        ("AUDI", "A6"):           {"base": 35000, "depr": 0.12, "mileage": 19000},
        ("AUDI", "Q5"):           {"base": 38000, "depr": 0.10, "mileage": 17000},
        ("VOLVO", "XC60"):        {"base": 36000, "depr": 0.11, "mileage": 17000},
        ("VOLVO", "V60"):         {"base": 30000, "depr": 0.12, "mileage": 19000},
        ("VOLVO", "XC90"):        {"base": 48000, "depr": 0.11, "mileage": 16000},
        ("SKODA", "OCTAVIA"):     {"base": 22000, "depr": 0.10, "mileage": 18000},
        ("SKODA", "SUPERB"):      {"base": 27000, "depr": 0.11, "mileage": 20000},
        ("SKODA", "KODIAQ"):      {"base": 30000, "depr": 0.09, "mileage": 16000},
        ("FORD", "FOCUS"):        {"base": 19000, "depr": 0.14, "mileage": 18000},
        ("FORD", "KUGA"):         {"base": 26000, "depr": 0.12, "mileage": 17000},
        ("HYUNDAI", "TUCSON"):    {"base": 28000, "depr": 0.09, "mileage": 16000},
        ("HYUNDAI", "I30"):       {"base": 19000, "depr": 0.11, "mileage": 15000},
        ("KIA", "SPORTAGE"):      {"base": 27000, "depr": 0.09, "mileage": 16000},
        ("KIA", "CEED"):          {"base": 19000, "depr": 0.10, "mileage": 15000},
    }

    SOURCES = ["mobile.de", "autoscout24", "auto24.ee"]
    current_year = 2026
    random.seed(42)  # reproducible

    all_listings = []
    all_aggregates = []

    for (make, model), info in MODEL_PRICES.items():
        base_price = info["base"]
        depr_rate = info["depr"]
        annual_km = info["mileage"]

        for prod_year in range(2016, 2025):
            age = current_year - prod_year
            # Depreciated median price
            median_price = int(base_price * ((1 - depr_rate) ** age))
            if median_price < 2000:
                continue

            # Spread: ±15% IQR, ±30% min/max
            p25 = int(median_price * 0.88)
            p75 = int(median_price * 1.12)
            min_price = int(median_price * 0.72)
            max_price = int(median_price * 1.30)

            avg_mileage = annual_km * age
            sample_size = random.randint(15, 80)

            all_aggregates.append({
                "make": make,
                "model": model,
                "variant": "",
                "prodYear": prod_year,
                "sampleSize": sample_size,
                "medianPrice": median_price,
                "p25Price": p25,
                "p75Price": p75,
                "minPrice": min_price,
                "maxPrice": max_price,
                "avgMileage": avg_mileage,
                "lastUpdated": "2026-03-26"
            })

            # Generate individual listings
            n_listings = random.randint(3, 6)
            for _ in range(n_listings):
                source = random.choice(SOURCES)
                price = int(random.gauss(median_price, median_price * 0.12))
                price = max(min_price, min(max_price, price))
                mileage = int(random.gauss(avg_mileage, avg_mileage * 0.25))
                mileage = max(5000, mileage)

                all_listings.append({
                    "source": source,
                    "sourceId": f"sample-{make}-{model}-{prod_year}-{random.randint(1000,9999)}",
                    "make": make,
                    "model": model,
                    "variant": "",
                    "prodYear": prod_year,
                    "mileage": mileage,
                    "fuelType": random.choice(["diesel", "petrol", "hybrid"]),
                    "price": price,
                    "currency": "EUR",
                    "listedDate": "2026-03-26",
                    "url": f"https://{source.replace('.ee','')}/listing/sample"
                })

    return {
        "lastUpdated": "2026-03-26",
        "aggregates": sorted(all_aggregates, key=lambda a: (a["make"], a["model"], a["prodYear"])),
        "listings": all_listings
    }


# ═════════════════════════════════════════════════
# FILE I/O
# ═════════════════════════════════════════════════
def load_prices():
    """Load existing prices.json."""
    if PRICES_FILE.exists():
        return json.loads(PRICES_FILE.read_text("utf-8"))
    return {"lastUpdated": "", "aggregates": [], "listings": []}

def save_prices(data):
    """Save prices.json."""
    PRICES_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", "utf-8")
    n_agg = len(data.get("aggregates", []))
    n_lst = len(data.get("listings", []))
    print(f"Saved {n_agg} aggregates, {n_lst} listings to {PRICES_FILE.name}")


# ═════════════════════════════════════════════════
# MAIN
# ═════════════════════════════════════════════════
def main():
    if "--sample" in sys.argv:
        print("Generating sample pricing data...")
        data = generate_sample_data()
        save_prices(data)
        return

    # Determine which sources to use
    source_filter = None
    if "--source" in sys.argv:
        idx = sys.argv.index("--source")
        if idx + 1 < len(sys.argv):
            source_filter = sys.argv[idx + 1].lower()

    source_funcs = {
        "mobilede": fetch_mobilede,
        "mobile.de": fetch_mobilede,
        "autoscout24": fetch_autoscout24,
        "auto24": fetch_auto24,
        "auto24.ee": fetch_auto24,
    }

    # Check which sources are configured
    configured = []
    if MOBILE_DE_USER and MOBILE_DE_PASS:
        configured.append("mobile.de")
    if AS24_CLIENT_ID and AS24_CLIENT_SECRET:
        configured.append("autoscout24")
    configured.append("auto24.ee")  # no auth needed

    if source_filter:
        func = source_funcs.get(source_filter)
        if not func:
            print(f"Unknown source: {source_filter}. Available: {', '.join(source_funcs.keys())}", file=sys.stderr)
            sys.exit(1)
        sources_to_use = [(source_filter, func)]
    else:
        sources_to_use = [(name, source_funcs[name]) for name in configured]

    print(f"Fetching prices from: {', '.join(name for name, _ in sources_to_use)}")

    all_listings = []
    for make, model in SEARCH_MODELS:
        print(f"  {make} {model}...")
        for source_name, fetch_fn in sources_to_use:
            listings = fetch_fn(make, model, 2016, 2025)
            all_listings.extend(listings)
            if listings:
                print(f"    {source_name}: {len(listings)} listings")
            time.sleep(1)  # rate limiting

    if not all_listings:
        print("No listings fetched. Run with --sample to generate sample data.")
        return

    # Compute aggregates
    aggregates = compute_aggregates(all_listings)

    data = {
        "lastUpdated": date.today().isoformat(),
        "aggregates": aggregates,
        "listings": all_listings
    }

    save_prices(data)

if __name__ == "__main__":
    main()
