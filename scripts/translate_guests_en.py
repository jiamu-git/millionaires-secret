"""Workflow script to translate guest origin stories and $0 advice into natural English."""

import json
from pathlib import Path

ROOT = Path(WORKSPACES[0]) if WORKSPACES else Path("/Users/maertorp/Projects/millionaires-secret")
DASH_PATH = ROOT / "data" / "aggregated" / "dashboard_data.json"
OUT_PATH = ROOT / "data" / "aggregated" / "guest_translations_en.json"

SCHEMA = {
    "type": "object",
    "required": ["items"],
    "properties": {
        "items": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["guest_key", "first_money_or_break_en", "zero_start_advice_en"],
                "properties": {
                    "guest_key": {"type": "string"},
                    "first_money_or_break_en": {"type": "string"},
                    "zero_start_advice_en": {"type": "string"},
                },
            },
        }
    },
}


def build_prompt(batch: list[dict]) -> str:
    payload = json.dumps(batch, ensure_ascii=False)
    return f"""Translate the Chinese fields `first_money_or_break` and `zero_start_advice` for each guest into crisp, natural, idiomatic English (1-2 sentences each, preserving exact numbers, dollar figures, and company/person names). If an input field is empty string "", output "" for that field. Do not use em dashes (U+2014).

Return strictly via finish tool preserving exact `guest_key` values.

INPUT:
{payload}
"""


phase("Load guests needing English translation")
data = json.loads(DASH_PATH.read_text(encoding="utf-8"))
existing = {}
if OUT_PATH.exists():
    existing = json.loads(OUT_PATH.read_text(encoding="utf-8"))

pending = []
for g in data["guests"]:
    k = g["guest_key"]
    if k in existing:
        continue
    if g.get("first_money_or_break") or g.get("zero_start_advice"):
        pending.append(
            {
                "guest_key": k,
                "guest_name": g.get("guest_name", ""),
                "first_money_or_break": g.get("first_money_or_break", ""),
                "zero_start_advice": g.get("zero_start_advice", ""),
            }
        )

log(f"Existing translations: {len(existing)}, pending: {len(pending)}")

phase("Translate batches in parallel")
BATCH_SIZE = 45
batches = [pending[i : i + BATCH_SIZE] for i in range(0, len(pending), BATCH_SIZE)]

if batches:
    results = await parallel(
        batches,
        lambda b: agent(
            prompt=build_prompt(b),
            schema=SCHEMA,
            role="Translate guest summaries to English",
            model="flash",
        ),
    )
    for res in results:
        for item in res.get("items", []):
            existing[item["guest_key"]] = {
                "first_money_or_break_en": item.get("first_money_or_break_en", ""),
                "zero_start_advice_en": item.get("zero_start_advice_en", ""),
            }

OUT_PATH.write_text(json.dumps(existing, ensure_ascii=False, indent=2), encoding="utf-8")
log(f"Saved {len(existing)} translations to {OUT_PATH}")
print(json.dumps({"total": len(existing)}))
