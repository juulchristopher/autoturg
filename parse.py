#!/usr/bin/env python3
"""
Fetch the latest Transpordiamet infoleht xlsx and parse järelturg data into data.json.
Merges new month into existing data.json so history accumulates.
"""

import json, re, sys, os
from datetime import date, timedelta
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

import openpyxl

MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
BASE_URL = "https://www.transpordiamet.ee/sites/default/files/documents"
DATA_FILE = Path(__file__).resolve().parent / "data.json"

SKIP_MAKES = {'KOKKU', 'TOTAL', 'ZUSAMMEN', 'SUM', 'MARK', 'MÄRK'}


def xlsx_url(month: int, year: int) -> str:
    mm = str(month).zfill(2)
    return f"{BASE_URL}/{year}-{mm}/INFOLEHT-{mm}{year}.xlsx"


def download(url: str) -> bytes:
    req = Request(url, headers={"User-Agent": "Mozilla/5.0 (autoturg-bot)"})
    with urlopen(req, timeout=60) as resp:
        return resp.read()


def find_jarelturg_sheet(wb: openpyxl.Workbook):
    """Return the worksheet that contains järelturg / used-car data."""
    priority = []
    rest = []
    for name in wb.sheetnames:
        lo = name.lower()
        if any(k in lo for k in ('järelturg', 'jarelturg', 'omaniku', 'owner', 'used', 'kasutatud')):
            priority.append(name)
        else:
            rest.append(name)
    for name in priority + rest:
        ws = wb[name]
        if ws.max_row and ws.max_row >= 3:
            for row in ws.iter_rows(min_row=1, max_row=min(25, ws.max_row), values_only=False):
                for cell in row:
                    val = str(cell.value or '').lower().strip()
                    if val in ('mark', 'märk', 'make'):
                        return ws
    return None


def parse_sheet(ws) -> list:
    """Parse a järelturg worksheet into rows of {make, model, variant, fullModel, prodYear, count}."""
    rows_out = []
    header_row = None
    make_col = model_col = prod_col = count_col = None

    for ri, row in enumerate(ws.iter_rows(min_row=1, max_row=min(25, ws.max_row), values_only=True), start=1):
        cells = [str(c or '').lower().strip() for c in row]
        mk_idx = next((i for i, c in enumerate(cells) if c in ('mark', 'märk', 'make')), None)
        if mk_idx is not None:
            header_row = ri
            make_col = mk_idx
            model_col = next((i for i, c in enumerate(cells) if i != mk_idx and (c in ('mudel', 'model') or 'mudel' in c)), None)
            if model_col is None:
                model_col = mk_idx + 1
            prod_col = next((i for i, c in enumerate(cells) if 'aasta' in c or c == 'year' or 'tootmis' in c), None)
            count_col = next((i for i, c in enumerate(cells) if c in ('arv', 'kokku', 'hulk', 'transactions') or 'count' in c), None)
            if count_col is None:
                count_col = len(cells) - 1
            break

    if header_row is None or make_col is None:
        return []

    for row in ws.iter_rows(min_row=header_row + 1, max_row=ws.max_row, values_only=True):
        vals = list(row)
        make = str(vals[make_col] or '').strip().upper()
        if not make or make in SKIP_MAKES:
            continue

        full_model = str(vals[model_col] or '').strip().upper() if model_col is not None and model_col < len(vals) else ''

        parts = full_model.split(None, 1)
        model = parts[0] if parts else ''
        variant = parts[1] if len(parts) > 1 else ''

        prod_year = None
        if prod_col is not None and prod_col < len(vals):
            try:
                py = int(vals[prod_col])
                if 1950 <= py <= date.today().year + 1:
                    prod_year = py
            except (ValueError, TypeError):
                pass

        count = 0
        if count_col is not None and count_col < len(vals):
            try:
                count = int(str(vals[count_col] or '0').replace(' ', '').replace(',', ''))
            except (ValueError, TypeError):
                pass

        if count <= 0:
            start = max(make_col, model_col or 0, prod_col or 0) + 1
            for j in range(start, len(vals)):
                try:
                    count += int(str(vals[j] or '0').replace(' ', '').replace(',', ''))
                except (ValueError, TypeError):
                    pass

        if count > 0:
            rows_out.append({
                "make": make,
                "model": model,
                "variant": variant,
                "fullModel": full_model,
                "prodYear": prod_year,
                "count": count,
            })

    return rows_out


def load_data() -> dict:
    if DATA_FILE.exists():
        with open(DATA_FILE) as f:
            return json.load(f)
    return {"months": []}


def save_data(data: dict):
    data["months"].sort(key=lambda m: m["year"] * 100 + m["month"])
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def main():
    today = date.today()
    # The file for month M is published around the 20th of month M+1,
    # so we fetch the previous month's data
    target = today.replace(day=1) - timedelta(days=1)
    month, year = target.month, target.year

    print(f"Fetching infoleht for {MONTHS_EN[month-1]} {year}...")
    url = xlsx_url(month, year)
    print(f"  URL: {url}")

    try:
        raw = download(url)
    except (URLError, HTTPError) as e:
        print(f"  Download failed: {e}")
        sys.exit(1)

    if len(raw) < 1000:
        print("  File too small — likely not valid")
        sys.exit(1)

    tmp = DATA_FILE.parent / f"_tmp_infoleht.xlsx"
    tmp.write_bytes(raw)

    try:
        wb = openpyxl.load_workbook(tmp, read_only=True, data_only=True)
        ws = find_jarelturg_sheet(wb)
        if ws is None:
            print(f"  No järelturg sheet found in {wb.sheetnames}")
            sys.exit(1)

        rows = parse_sheet(ws)
        wb.close()

        if not rows:
            print("  No data rows parsed")
            sys.exit(1)

        print(f"  Parsed {len(rows)} rows from sheet '{ws.title}'")

        data = load_data()
        data["months"] = [m for m in data["months"] if not (m["year"] == year and m["month"] == month)]
        data["months"].append({
            "year": year,
            "month": month,
            "label": f"{MONTHS_EN[month-1]} {year}",
            "sheetUsed": ws.title,
            "rows": rows,
        })
        save_data(data)
        print(f"  Saved to {DATA_FILE} ({len(data['months'])} months total)")

    finally:
        tmp.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
