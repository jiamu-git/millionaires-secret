#!/usr/bin/env python3
"""Audit extracted and aggregated dataset for quality, duplicates, and unmapped tags."""

import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "data" / "aggregated" / "dashboard_data.json"
EXTRACTED_DIR = ROOT / "data" / "extracted"
CLEAN_DIR = ROOT / "data" / "clean"


def main() -> None:
    clean_ids = {p.stem for p in CLEAN_DIR.glob("*.json") if p.name != "_index.json"}
    extracted_ids = {p.stem for p in EXTRACTED_DIR.glob("*.json")}
    missing = sorted(clean_ids - extracted_ids)
    print(f"Cleaned transcripts: {len(clean_ids)}, Extracted JSONs: {len(extracted_ids)}, Missing: {missing}")

    if not DATA_PATH.exists():
        print("dashboard_data.json not yet generated.")
        return

    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    ov = data["overview"]
    print("Unique guests:", ov["unique_guests_count"], "(raw appearances:", ov["total_raw_guest_appearances"], ")")
    print("Unique advice endorsements:", ov["total_unique_advice_endorsements"])

    # Check OTHER tags across all extracted files
    other = Counter()
    bad_ts = 0
    empty_quotes = 0
    for p in sorted(EXTRACTED_DIR.glob("*.json")):
        ext = json.loads(p.read_text(encoding="utf-8"))
        cpath = CLEAN_DIR / f"{p.stem}.json"
        dur = json.loads(cpath.read_text())["duration"] if cpath.exists() else 99999
        for g in ext.get("guests", []):
            for a in g.get("advice_items", []):
                if not a.get("quote", "").strip():
                    empty_quotes += 1
                if int(a.get("timestamp_sec", 0) or 0) > dur + 15:
                    bad_ts += 1
                t = a.get("canonical_tag", "")
                if t not in {r["tag"] for r in data["advice_rankings"]}:
                    other[t] += 1

    print(f"Empty quotes: {empty_quotes}, Out-of-bounds timestamps: {bad_ts}")
    print("Top unmapped OTHER tags:", other.most_common(25))

    # Print top 10 ranking summary
    print("\nTop 10 Unique-Guest Advice Rankings:")
    for item in data["advice_rankings"][:10]:
        print(
            f"  #{item['rank']:2d} {item['tag_zh']} ({item['tag']}) — "
            f"{item['unique_guest_count']} guests ({item['unique_guest_pct']}%), "
            f"raw={item['raw_mention_count']}"
        )


if __name__ == "__main__":
    main()
