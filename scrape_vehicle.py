#!/usr/bin/env python3
"""
Scrape vehicle data from mntstat.ee by registration number.

Usage:
    python scrape_vehicle.py 123ABC
    python scrape_vehicle.py 123ABC --json

mntstat.ee is a public vehicle database of 829K+ registered vehicles in Estonia.
Endpoints:
  - search.php?reg_nr=XXX — search by registration number (GET)
  - search.php?make[]=BMW&from=2020&to=2025 — search by filters (GET)
  - data.php (POST aid=N&type=model) — get models dropdown for a make

Table columns: Staatus, Kokku, Mark, Mudel, Keretüüp, Aasta, Värv, Mootoritüüp, Käigukast, Kw, CC, Kg, Maakond
"""

import json, re, sys, argparse
from urllib.request import urlopen, Request
from urllib.parse import quote
from urllib.error import URLError, HTTPError


BASE_URL = "https://www.mntstat.ee"

# Column indices in the results table
COLUMNS = ['status', 'count', 'make', 'model', 'bodyType', 'year',
           'color', 'fuelType', 'transmission', 'powerKw', 'engineCc',
           'weightKg', 'county']


def fetch(url: str) -> str:
    """Fetch a URL and return the response body as string."""
    req = Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "et,en;q=0.9",
    })
    with urlopen(req, timeout=30) as resp:
        return resp.read().decode('utf-8', errors='replace')


def parse_table(html: str) -> list:
    """Parse the searchResult table from mntstat.ee HTML.
    Returns list of dicts with vehicle data."""

    # Find the searchResult table content
    match = re.search(
        r'<table[^>]*id=["\']searchResult["\'][^>]*>(.*?)</table>',
        html, re.DOTALL
    )
    if not match:
        return []

    table_html = match.group(1)

    # Check for error message
    if 'Palun sisesta' in table_html or 'ei leitud' in table_html:
        return []

    # Extract all <td> cell values in order
    cells = re.findall(r'<td[^>]*>(.*?)</td>', table_html, re.DOTALL)
    cells = [c.strip() for c in cells]

    if not cells:
        return []

    # Group cells into rows of len(COLUMNS)
    num_cols = len(COLUMNS)
    vehicles = []

    for i in range(0, len(cells), num_cols):
        row_cells = cells[i:i + num_cols]
        if len(row_cells) < num_cols:
            break

        vehicle = {}
        for j, col_name in enumerate(COLUMNS):
            val = row_cells[j]
            if val and val != '-':
                # Type conversions
                if col_name in ('year', 'powerKw', 'engineCc', 'weightKg', 'count'):
                    try:
                        val = int(val)
                    except ValueError:
                        pass
                elif col_name == 'make':
                    val = val.upper()
                vehicle[col_name] = val

        vehicles.append(vehicle)

    return vehicles


def search_by_reg(reg_number: str) -> dict:
    """Search mntstat.ee by registration number. Returns first match or error."""
    reg = re.sub(r'[^A-Z0-9]', '', reg_number.upper())
    if not reg:
        return {"error": "Empty registration number"}

    url = f"{BASE_URL}/search.php?reg_nr={quote(reg)}"

    try:
        html = fetch(url)
    except (URLError, HTTPError) as e:
        return {"error": f"Failed to reach mntstat.ee: {e}"}

    vehicles = parse_table(html)

    if not vehicles:
        if 'ei leitud' in html.lower():
            return {"error": f"Vehicle with registration number '{reg}' not found"}
        return {"error": "No results found"}

    # Return first match with regNumber added
    result = vehicles[0]
    result['regNumber'] = reg
    return result


def search_by_filters(make=None, model=None, year_from=None, year_to=None, limit=25) -> list:
    """Search mntstat.ee by filters. Returns list of vehicle dicts."""
    params = []
    if make:
        params.append(f"make%5B%5D={quote(make)}")
    if model:
        params.append(f"model%5B%5D={quote(model)}")
    if year_from:
        params.append(f"from={year_from}")
    if year_to:
        params.append(f"to={year_to}")

    if not params:
        return []

    url = f"{BASE_URL}/search.php?{'&'.join(params)}"

    try:
        html = fetch(url)
    except (URLError, HTTPError) as e:
        return []

    vehicles = parse_table(html)
    return vehicles[:limit]


def main():
    parser = argparse.ArgumentParser(
        description='Look up vehicle data from mntstat.ee by registration number'
    )
    parser.add_argument('reg_number', help='Estonian vehicle registration number (e.g. 123ABC)')
    parser.add_argument('--json', action='store_true', help='Output as JSON')
    args = parser.parse_args()

    result = search_by_reg(args.reg_number)

    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        if 'error' in result:
            print(f"Error: {result['error']}")
            sys.exit(1)

        print(f"Vehicle: {result.get('regNumber', '?')}")
        print(f"  Make:         {result.get('make', '—')}")
        print(f"  Model:        {result.get('model', '—')}")
        print(f"  Year:         {result.get('year', '—')}")
        print(f"  Body type:    {result.get('bodyType', '—')}")
        print(f"  Color:        {result.get('color', '—')}")
        print(f"  Fuel type:    {result.get('fuelType', '—')}")
        print(f"  Transmission: {result.get('transmission', '—')}")
        print(f"  Power:        {result.get('powerKw', '—')} kW")
        print(f"  Engine:       {result.get('engineCc', '—')} cc")
        print(f"  Weight:       {result.get('weightKg', '—')} kg")
        print(f"  County:       {result.get('county', '—')}")
        print(f"  Status:       {result.get('status', '—')}")


if __name__ == "__main__":
    main()
