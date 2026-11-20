"""Workflow script to extract structured millionaire interviews and advice from cleaned transcripts."""

import json
from pathlib import Path

ROOT = Path(WORKSPACES[0]) if WORKSPACES else Path("/Users/maertorp/Projects/millionaires-secret")
CLEAN_DIR = ROOT / "data" / "clean"
EXTRACTED_DIR = ROOT / "data" / "extracted"
TAXONOMY_PATH = ROOT / "data" / "taxonomy.json"

EXTRACTED_DIR.mkdir(parents=True, exist_ok=True)
taxonomy = json.loads(TAXONOMY_PATH.read_text(encoding="utf-8"))

TAG_LINES = "\n".join(
    f'- "{t["tag"]}" [{t["category"]} | {t["type"]} | {t["actionability"]}]: {t["desc"]}'
    for t in taxonomy["canonical_tags"]
)
INDUSTRY_ENUM = taxonomy["industries"]
WEALTH_ENUM = taxonomy["wealth_tiers"]
ORIGIN_ENUM = taxonomy["origin_types"]
CATEGORY_ENUM = list(taxonomy["categories"].keys())

EXTRACTION_SCHEMA = {
    "type": "object",
    "required": ["video_id", "video_type", "is_compilation_warning", "guests"],
    "properties": {
        "video_id": {"type": "string"},
        "video_type": {
            "type": "string",
            "enum": ["street_multi", "deep_dive_single", "topic_compilation", "non_interview"],
        },
        "is_compilation_warning": {"type": "boolean"},
        "guests": {
            "type": "array",
            "items": {
                "type": "object",
                "required": [
                    "guest_name",
                    "role_or_title",
                    "industry",
                    "wealth_tier",
                    "wealth_detail",
                    "origin_type",
                    "first_money_or_break",
                    "zero_start_advice",
                    "recommended_skills",
                    "recommended_books_or_mentors",
                    "advice_items",
                ],
                "properties": {
                    "guest_name": {"type": "string"},
                    "role_or_title": {"type": "string"},
                    "industry": {"type": "string", "enum": INDUSTRY_ENUM},
                    "wealth_tier": {"type": "string", "enum": WEALTH_ENUM},
                    "wealth_detail": {"type": "string"},
                    "origin_type": {"type": "string", "enum": ORIGIN_ENUM},
                    "first_money_or_break": {"type": "string"},
                    "zero_start_advice": {"type": "string"},
                    "recommended_skills": {"type": "array", "items": {"type": "string"}},
                    "recommended_books_or_mentors": {"type": "array", "items": {"type": "string"}},
                    "advice_items": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "required": [
                                "canonical_tag",
                                "category",
                                "type",
                                "actionability",
                                "summary_zh",
                                "summary_en",
                                "quote",
                                "timestamp_sec",
                            ],
                            "properties": {
                                "canonical_tag": {"type": "string"},
                                "category": {"type": "string", "enum": CATEGORY_ENUM},
                                "type": {"type": "string", "enum": ["advice_do", "warning_dont", "regret"]},
                                "actionability": {
                                    "type": "string",
                                    "enum": ["high_actionable", "strategic_principle", "mindset_general"],
                                },
                                "summary_zh": {"type": "string"},
                                "summary_en": {"type": "string"},
                                "quote": {"type": "string"},
                                "timestamp_sec": {"type": "integer"},
                            },
                        },
                    },
                },
            },
        },
    },
}


def build_prompt(record: dict) -> str:
    chapters_text = "\n".join(
        f"- [{c['start']}s - {c['end']}s] {c['title']}" for c in record.get("chapters", [])
    ) or "(none)"
    transcript_lines = "\n".join(
        f"[{c['start']}s] {c['text']}" for c in record.get("transcript_chunks", [])
    )
    return f"""Extract structured billionaire/millionaire interview data from this YouTube video transcript of @theschoolofhardknocks.

VIDEO METADATA:
- video_id: {record['id']}
- title: {record['title']}
- upload_date: {record.get('upload_date', '')}
- duration_sec: {record.get('duration', 0)}

CHAPTERS:
{chapters_text}

CANONICAL ADVICE TAGS (choose the exact best-matching tag string; ONLY use "OTHER:<Concise English Tag>" if none genuinely fits):
{TAG_LINES}

STANDARDIZED SKILL NAMES (prefer from this list when applicable):
{", ".join(taxonomy["skills"])}

INSTRUCTIONS:
1. Classify video_type:
   - "street_multi": street/neighborhood/event interviews with multiple guests.
   - "deep_dive_single": 1-on-1 / day-in-the-life interview focused on 1 primary guest (plus maybe brief cameo).
   - "topic_compilation": thematic mashup or "I Interviewed 30 Billionaires" style compilation featuring clips across many interviews.
   - "non_interview": early solo commentary/listicle/news video with NO wealthy guest interviews. Set guests=[] for non_interview.
2. Set is_compilation_warning=true if the video recycles or stitches clips from multiple prior shoots/cities/topics.
3. For each substantive wealthy interviewee (skip people who declined, security guards, gate staff, or host promos):
   - Use exact name from transcript/chapters/title if known (e.g. "Tony Buzbee", "Marcus Lemonis"); otherwise give a specific descriptive identifier like "River Oaks Payment Processing Founder" (NOT just "Millionaire #1").
   - Only fill wealth_detail with explicitly stated figures (e.g., "$30B net worth", "$15M/yr"); leave "" if not explicitly mentioned. Match wealth_tier strictly to evidence ("Unspecified" if unknown).
   - Summarize first_money_or_break and zero_start_advice in concise Chinese (leave "" if not discussed).
   - Extract EVERY distinct piece of advice, business principle, investment lesson, warning, or regret into advice_items. Do NOT repeat the same canonical_tag twice for the same guest in one video.
   - Each advice_item MUST have verbatim/near-verbatim short English quote and accurate timestamp_sec matching the [Xs] prefix where it was spoken, plus crisp summary_zh (8-22 Chinese chars) and summary_en.
4. Return result strictly via the finish tool.

TRANSCRIPT:
{transcript_lines}
"""


def save_result(vid: str, res: dict) -> None:
    if isinstance(res, dict):
        res["video_id"] = vid
    (EXTRACTED_DIR / f"{vid}.json").write_text(
        json.dumps(res, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def make_agent(record: dict):
    return agent(
        prompt=build_prompt(record),
        schema=EXTRACTION_SCHEMA,
        role=f"Extract {record['id']}",
        model="flash",
    )


phase("Load cleaned transcripts")
limit = int(args.get("limit", 0))
batch_size = int(args.get("batch_size", 10))

clean_files = sorted(
    p for p in CLEAN_DIR.glob("*.json") if p.name != "_index.json"
)
pending = []
for p in clean_files:
    vid = p.stem
    if (EXTRACTED_DIR / f"{vid}.json").exists():
        continue
    rec = json.loads(p.read_text(encoding="utf-8"))
    if rec.get("word_count", 0) < 20:
        continue
    pending.append(rec)

if limit > 0:
    pending = pending[:limit]

log(f"Total clean files: {len(clean_files)}, pending extraction: {len(pending)}")

phase("Parallel extraction")
done_count = 0
error_ids = []

for idx in range(0, len(pending), batch_size):
    batch = pending[idx : idx + batch_size]
    batch_num = idx // batch_size + 1
    total_batches = (len(pending) + batch_size - 1) // batch_size
    log(f"Running batch {batch_num}/{total_batches} ({len(batch)} videos)...")
    try:
        results = await parallel(batch, make_agent)
        for rec, res in zip(batch, results):
            save_result(rec["id"], res)
            done_count += 1
    except Exception as exc:
        log(f"Batch {batch_num} error ({exc}); falling back to sequential retry...")
        for rec in batch:
            vid = rec["id"]
            if (EXTRACTED_DIR / f"{vid}.json").exists():
                continue
            try:
                res = await make_agent(rec)
                save_result(vid, res)
                done_count += 1
            except Exception as inner_exc:
                log(f"FAILED {vid}: {inner_exc}")
                error_ids.append(vid)

log(f"Extraction finished: saved={done_count}, errors={len(error_ids)}, error_ids={error_ids}")
print(json.dumps({"saved": done_count, "errors": error_ids}))
