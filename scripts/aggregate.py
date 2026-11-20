#!/usr/bin/env python3
"""Deduplicate guests/clips and aggregate all statistics for the Millionaire Secrets dashboard."""

import csv
import json
import math
import re
from collections import Counter, defaultdict
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CLEAN_DIR = ROOT / "data" / "clean"
EXTRACTED_DIR = ROOT / "data" / "extracted"
AGG_DIR = ROOT / "data" / "aggregated"
TAXONOMY_PATH = ROOT / "data" / "taxonomy.json"

GENERIC_PATTERNS = re.compile(
    r"\b(unnamed|anonymous|millionaire|billionaire|owner|founder|entrepreneur|investor|executive|man|woman|guy|lady|guest|stranger|shopper|golfer|resident|driver|ceo|lawyer|doctor|professional|developer|broker|attorney|marketer|builder|trader|realtor|dentist|surgeon|agent|contractor|partner|manager|director|president|consultant|creator|athlete|couple|pair|family|team)\b",
    re.I,
)

OTHER_TAG_MAP = {
    "OTHER:Choose the Right Life Partner": "Choose the Right Life Partner",
    "OTHER:Choose a Supportive Life Partner": "Choose the Right Life Partner",
    "OTHER:Set Up Proper Legal Entity Structure": "Financial Literacy & Knowing Your Numbers",
    "OTHER:Optimize Entity Structure & Write-Offs": "Financial Literacy & Knowing Your Numbers",
    "OTHER:Document Business Deductions Thoroughly": "Financial Literacy & Knowing Your Numbers",
    "OTHER:Don't Spend Cash Needed for Taxes": "Financial Literacy & Knowing Your Numbers",
    "OTHER:Use the Augusta Rule (IRC 280A)": "Financial Literacy & Knowing Your Numbers",
    "OTHER:Reinvest Tax Savings Into Cash-Flow Assets": "Invest Consistently & Let Compounding Work",
    "OTHER:Fire Misaligned Employees Decisively": "Hire A-Players & Delegate",
    "OTHER:Build a Values-Driven Company Culture": "Hire A-Players & Delegate",
    "OTHER:Build Recurring Revenue Models": "Choose the Right Industry / Big Market",
    "OTHER:Invest Heavily in Marketing & Visibility": "Leverage Social Media & Personal Brand",
    "OTHER:Prioritize Street Smarts Over Book Smarts": "Bias Toward Action (Just Start)",
    "OTHER:Embrace Change as Opportunity": "Overcome Fear & Take Calculated Risks",
    "OTHER:Adapt Quickly & Embrace New Technology": "Continuous Learning & Reading",
}


def load_taxonomy() -> dict:
    return json.loads(TAXONOMY_PATH.read_text(encoding="utf-8"))


def normalize_name(name: str) -> str:
    s = re.sub(r"\b(mr|mrs|ms|dr|sir|prof)\.?\s+", "", name.strip(), flags=re.I)
    s = re.sub(r"[^a-z0-9\s]", "", s.lower())
    norm = re.sub(r"\s+", " ", s).strip()
    aliases = {
        "shaq": "shaquille oneal",
        "shaquille o neal": "shaquille oneal",
        "patrick bet david": "patrick betdavid",
        "anthony buzbee": "tony buzbee",
        "reed hoffman": "reid hoffman",
        "mohammed binghatti": "muhammad binghatti",
        "muhammad benghadi": "muhammad binghatti",
        "shawn meaik": "shawn meaike",
        "todd napola": "todd nepola",
        "grant mint": "grant mitt",
        "eric spafford": "eric spofford",
    }
    return aliases.get(norm, norm)


def is_proper_named_person(name: str) -> bool:
    """Heuristic: true if guest_name looks like an actual person's proper name (not generic role label)."""
    norm = normalize_name(name)
    if not norm or len(norm) < 4:
        return False
    tokens = norm.split()
    if len(tokens) < 2 or len(tokens) > 4:
        # Allow well-known single-name celebrities like "shaq"
        if norm in {"shaq"}:
            return True
        return False
    if GENERIC_PATTERNS.search(norm):
        return False
    # Check title case / mostly alphabetic words
    if any(any(ch.isdigit() for ch in t) for t in tokens):
        return False
    return True


def normalize_book_or_mentor(text: str) -> str:
    s = re.sub(r"['\"“”‘’.,!?]", "", text).strip()
    s = re.sub(r"\s+", " ", s)
    low = s.lower()
    aliases = {
        "rich dad poor dad": "Rich Dad Poor Dad (Robert Kiyosaki)",
        "think and grow rich": "Think and Grow Rich (Napoleon Hill)",
        "how to win friends and influence people": "How to Win Friends and Influence People (Dale Carnegie)",
        "the bible": "The Bible",
        "bible": "The Bible",
        "the richest man in babylon": "The Richest Man in Babylon",
        "48 laws of power": "The 48 Laws of Power (Robert Greene)",
        "the 48 laws of power": "The 48 Laws of Power (Robert Greene)",
        "atomic habits": "Atomic Habits (James Clear)",
        "the intelligent investor": "The Intelligent Investor (Benjamin Graham)",
        "zero to one": "Zero to One (Peter Thiel)",
        "the almanack of naval ravikant": "The Almanack of Naval Ravikant",
        "principles": "Principles (Ray Dalio)",
        "shoe dog": "Shoe Dog (Phil Knight)",
        "the 4-hour workweek": "The 4-Hour Workweek (Tim Ferriss)",
        "the 4 hour workweek": "The 4-Hour Workweek (Tim Ferriss)",
        "warren buffett": "Warren Buffett",
        "elon musk": "Elon Musk",
        "tony robbins": "Tony Robbins",
        "alex hormozi": "Alex Hormozi",
        "grant cardone": "Grant Cardone",
        "charlie munger": "Charlie Munger",
        "steve jobs": "Steve Jobs",
    }
    if low in {"his father", "his dad", "father", "dad", "my father", "my dad", "his father (primary mentor)"}:
        return "Father / Dad (Family Mentor)"
    if low in {"his mother", "his mom", "mother", "mom", "my mother", "my mom"}:
        return "Mother (Family Mentor)"
    for key, canonical in aliases.items():
        if low == key or (key in low and len(low) < len(key) + 32):
            return canonical
    return s


def norm_quote_tokens(text: str) -> tuple[str, set[str]]:
    na = re.sub(r"[^a-z0-9\s]", "", text.lower())
    na = re.sub(r"\s+", " ", na).strip()
    stop = {"the", "a", "an", "and", "or", "to", "of", "in", "is", "it", "you", "your", "that", "for", "i", "my", "we", "on", "be"}
    tokens = {w for w in na.split() if len(w) > 2 and w not in stop}
    return na, tokens


def quote_similarity(na: str, ta: set[str], nb: str, tb: set[str]) -> float:
    if not na or not nb:
        return 0.0
    if na in nb or nb in na:
        return 0.92
    if not ta or not tb:
        return 0.0
    inter = len(ta & tb)
    if inter < 4 or (inter / min(len(ta), len(tb))) < 0.55:
        return 0.0
    return SequenceMatcher(None, na[:240], nb[:240]).ratio()


def wealth_rank(tier: str) -> int:
    order = {
        "Billionaire ($1B+)": 5,
        "Decamillionaire+ ($10M-$999M)": 4,
        "Millionaire ($1M-$9.9M)": 3,
        "High Earner ($300k-$999k/yr)": 2,
        "Unspecified": 1,
    }
    return order.get(tier, 0)


def main() -> None:
    AGG_DIR.mkdir(parents=True, exist_ok=True)
    taxonomy = load_taxonomy()
    tag_lookup = {t["tag"]: t for t in taxonomy["canonical_tags"]}

    clean_map: dict[str, dict] = {}
    for p in sorted(CLEAN_DIR.glob("*.json")):
        if p.name == "_index.json":
            continue
        rec = json.loads(p.read_text(encoding="utf-8"))
        clean_map[rec["id"]] = rec

    extracted_files = sorted(EXTRACTED_DIR.glob("*.json"))
    video_records = []
    raw_appearances = []
    other_tags_counter = Counter()

    video_type_counts = Counter()
    for ep in extracted_files:
        ext = json.loads(ep.read_text(encoding="utf-8"))
        vid = ext["video_id"]
        meta = clean_map.get(vid, {})
        vtype = ext.get("video_type", "street_multi")
        video_type_counts[vtype] += 1
        guests = ext.get("guests", []) or []

        video_records.append(
            {
                "id": vid,
                "url": f"https://www.youtube.com/watch?v={vid}",
                "title": meta.get("title", vid),
                "upload_date": meta.get("upload_date", ""),
                "year": (meta.get("upload_date") or "")[:4] or "Unknown",
                "duration": meta.get("duration", 0),
                "view_count": meta.get("view_count", 0),
                "like_count": meta.get("like_count", 0),
                "word_count": meta.get("word_count", 0),
                "video_type": vtype,
                "is_compilation_warning": bool(ext.get("is_compilation_warning", False)),
                "guest_count": len(guests),
            }
        )

        if vtype == "non_interview":
            continue

        for g_idx, g in enumerate(guests):
            advice_items = g.get("advice_items", []) or []
            for item in advice_items:
                ctag = OTHER_TAG_MAP.get(item.get("canonical_tag", ""), item.get("canonical_tag", ""))
                item["canonical_tag"] = ctag
                if ctag not in tag_lookup:
                    other_tags_counter[ctag] += 1
            raw_appearances.append(
                {
                    "video_id": vid,
                    "video_title": meta.get("title", vid),
                    "upload_date": meta.get("upload_date", ""),
                    "year": (meta.get("upload_date") or "")[:4] or "Unknown",
                    "view_count": meta.get("view_count", 0),
                    "like_count": meta.get("like_count", 0),
                    "video_type": vtype,
                    "is_compilation": bool(ext.get("is_compilation_warning", False))
                    or vtype == "topic_compilation",
                    "guest_index": g_idx,
                    "guest": g,
                }
            )

    extracted_ids = {ep.stem for ep in extracted_files}
    playlist = json.loads((ROOT / "data" / "raw" / "playlist.json").read_text(encoding="utf-8"))
    for item in playlist:
        vid = item["id"]
        if vid in extracted_ids:
            continue
        info_path = ROOT / "data" / "raw" / "videos" / f"{vid}.info.json"
        info = json.loads(info_path.read_text(encoding="utf-8")) if info_path.exists() else {}
        vtype = "no_transcript"
        video_type_counts[vtype] += 1
        video_records.append(
            {
                "id": vid,
                "url": f"https://www.youtube.com/watch?v={vid}",
                "title": info.get("title") or item.get("title", vid),
                "upload_date": info.get("upload_date", ""),
                "year": (info.get("upload_date") or "")[:4] or "Unknown",
                "duration": info.get("duration") or item.get("duration", 0),
                "view_count": info.get("view_count") or item.get("view_count", 0),
                "like_count": info.get("like_count") or 0,
                "word_count": 0,
                "video_type": vtype,
                "is_compilation_warning": False,
                "guest_count": 0,
            }
        )

    # Sort non-compilation appearances first so original interviews become canonical anchors
    raw_appearances.sort(
        key=lambda x: (
            1 if x["is_compilation"] else 0,
            0 if x["video_type"] == "deep_dive_single" else 1,
            -x["view_count"],
        )
    )

    deduped_guests: dict[str, dict] = {}
    name_to_key: dict[str, str] = {}
    quote_index: list[tuple[str, set[str], str, str]] = []  # (norm_q, tokens, canonical_tag, guest_key)
    compilation_clips_deduped = 0

    for app in raw_appearances:
        g = app["guest"]
        gname = (g.get("guest_name") or "").strip() or "Unnamed Guest"
        norm = normalize_name(gname)
        proper = is_proper_named_person(gname)

        matched_key = None
        if proper and norm in name_to_key:
            matched_key = name_to_key[norm]
        elif app["is_compilation"]:
            # Check quote similarity against already indexed guests to merge recycled compilation clips
            for item in g.get("advice_items", []) or []:
                q = item.get("quote", "")
                ctag = item.get("canonical_tag", "")
                if len(q) < 25:
                    continue
                nq, tq = norm_quote_tokens(q)
                for prev_nq, prev_tq, prev_tag, prev_key in quote_index:
                    sim = quote_similarity(nq, tq, prev_nq, prev_tq)
                    if (prev_tag == ctag and sim >= 0.70) or (len(nq) >= 40 and sim >= 0.80):
                        matched_key = prev_key
                        break
                if matched_key:
                    break

        if matched_key is None:
            if proper:
                matched_key = f"person:{norm}"
                name_to_key[norm] = matched_key
            else:
                matched_key = f"clip:{app['video_id']}:{app['guest_index']}"

            deduped_guests[matched_key] = {
                "guest_key": matched_key,
                "guest_name": gname,
                "is_named": proper,
                "role_or_title": g.get("role_or_title", ""),
                "industry": g.get("industry", "Other / Unspecified"),
                "wealth_tier": g.get("wealth_tier", "Unspecified"),
                "wealth_detail": g.get("wealth_detail", ""),
                "origin_type": g.get("origin_type", "Unspecified"),
                "first_money_or_break": g.get("first_money_or_break", ""),
                "zero_start_advice": g.get("zero_start_advice", ""),
                "recommended_skills": set(g.get("recommended_skills", []) or []),
                "recommended_books_or_mentors": set(
                    normalize_book_or_mentor(x)
                    for x in (g.get("recommended_books_or_mentors", []) or [])
                    if x and x.strip()
                ),
                "appearances": [],
                "advice_by_tag": {},
                "raw_advice_items": [],
            }

        dg = deduped_guests[matched_key]
        dg["appearances"].append(
            {
                "video_id": app["video_id"],
                "video_title": app["video_title"],
                "upload_date": app["upload_date"],
                "year": app["year"],
                "view_count": app["view_count"],
                "video_type": app["video_type"],
                "is_compilation": app["is_compilation"],
            }
        )
        # Upgrade profile fields if richer info appears
        if wealth_rank(g.get("wealth_tier", "Unspecified")) > wealth_rank(dg["wealth_tier"]):
            dg["wealth_tier"] = g.get("wealth_tier", "Unspecified")
        if len(g.get("wealth_detail", "")) > len(dg["wealth_detail"]):
            dg["wealth_detail"] = g.get("wealth_detail", "")
        if dg["industry"] == "Other / Unspecified" and g.get("industry", "Other / Unspecified") != "Other / Unspecified":
            dg["industry"] = g["industry"]
        if dg["origin_type"] == "Unspecified" and g.get("origin_type", "Unspecified") != "Unspecified":
            dg["origin_type"] = g["origin_type"]
        if len(g.get("first_money_or_break", "")) > len(dg["first_money_or_break"]):
            dg["first_money_or_break"] = g["first_money_or_break"]
        if len(g.get("zero_start_advice", "")) > len(dg["zero_start_advice"]):
            dg["zero_start_advice"] = g["zero_start_advice"]
        if len(g.get("role_or_title", "")) > len(dg["role_or_title"]):
            dg["role_or_title"] = g["role_or_title"]
        for sk in g.get("recommended_skills", []) or []:
            if sk and sk.strip():
                dg["recommended_skills"].add(sk.strip())
        for bm in g.get("recommended_books_or_mentors", []) or []:
            if bm and bm.strip():
                dg["recommended_books_or_mentors"].add(normalize_book_or_mentor(bm))

        for item in g.get("advice_items", []) or []:
            ctag = item.get("canonical_tag", "")
            quote_entry = {
                "canonical_tag": ctag,
                "category": item.get("category", ""),
                "type": item.get("type", "advice_do"),
                "actionability": item.get("actionability", "strategic_principle"),
                "summary_zh": item.get("summary_zh", ""),
                "summary_en": item.get("summary_en", ""),
                "quote": item.get("quote", ""),
                "timestamp_sec": int(item.get("timestamp_sec", 0) or 0),
                "video_id": app["video_id"],
                "video_title": app["video_title"],
                "upload_date": app["upload_date"],
                "year": app["year"],
                "view_count": app["view_count"],
                "is_compilation": app["is_compilation"],
            }
            dg["raw_advice_items"].append(quote_entry)
            if ctag in tag_lookup:
                nq, tq = norm_quote_tokens(quote_entry["quote"])
                quote_index.append((nq, tq, ctag, matched_key))
                prev = dg["advice_by_tag"].get(ctag)
                if prev is None or (prev["is_compilation"] and not app["is_compilation"]) or len(quote_entry["quote"]) > len(prev["quote"]):
                    dg["advice_by_tag"][ctag] = quote_entry

    guests_list = list(deduped_guests.values())
    total_unique_guests = len(guests_list)
    compilation_clips_deduped = max(0, len(raw_appearances) - total_unique_guests)

    # Aggregate advice rankings
    tag_stats = {}
    for t in taxonomy["canonical_tags"]:
        tag_name = t["tag"]
        tag_stats[tag_name] = {
            "tag": tag_name,
            "tag_zh": t["zh"],
            "desc": t["desc"],
            "category": t["category"],
            "category_zh": taxonomy["categories"][t["category"]],
            "type": t["type"],
            "actionability": t["actionability"],
            "unique_guest_count": 0,
            "unique_guest_pct": 0.0,
            "non_compilation_guest_count": 0,
            "raw_mention_count": 0,
            "view_weighted_score": 0.0,
            "by_wealth_tier": Counter(),
            "by_industry": Counter(),
            "by_origin": Counter(),
            "by_year": Counter(),
            "quotes": [],
        }

    skill_counter = Counter()
    book_counter = Counter()
    industry_stats = defaultdict(lambda: {"count": 0, "wealth_tiers": Counter(), "tags": Counter()})
    wealth_stats = defaultdict(lambda: {"count": 0, "tags": Counter()})
    origin_stats = defaultdict(lambda: {"count": 0, "tags": Counter()})
    zero_start_list = []

    trans_path = AGG_DIR / "guest_translations_en.json"
    guest_trans = json.loads(trans_path.read_text(encoding="utf-8")) if trans_path.exists() else {}

    for dg in guests_list:
        ind = dg["industry"]
        wt = dg["wealth_tier"]
        orig = dg["origin_type"]
        tr = guest_trans.get(dg["guest_key"], {})
        industry_stats[ind]["count"] += 1
        industry_stats[ind]["wealth_tiers"][wt] += 1
        wealth_stats[wt]["count"] += 1
        origin_stats[orig]["count"] += 1

        for sk in dg["recommended_skills"]:
            skill_counter[sk] += 1
        for bm in dg["recommended_books_or_mentors"]:
            book_counter[bm] += 1

        if dg["zero_start_advice"]:
            primary_app = dg["appearances"][0]
            zero_start_list.append(
                {
                    "guest_name": dg["guest_name"],
                    "role_or_title": dg["role_or_title"],
                    "industry": ind,
                    "wealth_tier": wt,
                    "wealth_detail": dg["wealth_detail"],
                    "zero_start_advice": dg["zero_start_advice"],
                    "zero_start_advice_en": tr.get("zero_start_advice_en", ""),
                    "video_id": primary_app["video_id"],
                    "video_title": primary_app["video_title"],
                    "view_count": primary_app["view_count"],
                }
            )

        for raw_item in dg["raw_advice_items"]:
            ctag = raw_item["canonical_tag"]
            if ctag in tag_stats:
                tag_stats[ctag]["raw_mention_count"] += 1

        for ctag, qentry in dg["advice_by_tag"].items():
            st = tag_stats[ctag]
            st["unique_guest_count"] += 1
            if not qentry["is_compilation"]:
                st["non_compilation_guest_count"] += 1
            st["view_weighted_score"] += math.log10(max(qentry["view_count"], 100))
            st["by_wealth_tier"][wt] += 1
            st["by_industry"][ind] += 1
            st["by_origin"][orig] += 1
            st["by_year"][qentry["year"]] += 1
            st["quotes"].append(
                {
                    "guest_name": dg["guest_name"],
                    "role_or_title": dg["role_or_title"],
                    "industry": ind,
                    "wealth_tier": wt,
                    "wealth_detail": dg["wealth_detail"],
                    "origin_type": orig,
                    "video_id": qentry["video_id"],
                    "video_title": qentry["video_title"],
                    "upload_date": qentry["upload_date"],
                    "view_count": qentry["view_count"],
                    "timestamp_sec": qentry["timestamp_sec"],
                    "quote": qentry["quote"],
                    "summary_zh": qentry["summary_zh"],
                    "summary_en": qentry["summary_en"],
                }
            )
            industry_stats[ind]["tags"][ctag] += 1
            wealth_stats[wt]["tags"][ctag] += 1
            origin_stats[orig]["tags"][ctag] += 1

    ranked_advice = sorted(
        tag_stats.values(),
        key=lambda x: (-x["unique_guest_count"], -x["non_compilation_guest_count"], -x["raw_mention_count"]),
    )
    for idx, st in enumerate(ranked_advice, 1):
        st["rank"] = idx
        st["unique_guest_pct"] = round(
            (st["unique_guest_count"] / total_unique_guests * 100) if total_unique_guests else 0.0,
            1,
        )
        st["view_weighted_score"] = round(st["view_weighted_score"], 1)
        st["by_wealth_tier"] = dict(st["by_wealth_tier"])
        st["by_industry"] = dict(st["by_industry"])
        st["by_origin"] = dict(st["by_origin"])
        st["by_year"] = dict(st["by_year"])
        st["quotes"].sort(key=lambda q: (-q["view_count"], -len(q["quote"])))

    # Serialize clean guests directory
    serializable_guests = []
    for dg in guests_list:
        primary_app = dg["appearances"][0]
        serializable_guests.append(
            {
                "guest_key": dg["guest_key"],
                "guest_name": dg["guest_name"],
                "is_named": dg["is_named"],
                "role_or_title": dg["role_or_title"],
                "industry": dg["industry"],
                "industry_zh": taxonomy["industries_zh"].get(dg["industry"], dg["industry"]),
                "wealth_tier": dg["wealth_tier"],
                "wealth_tier_zh": taxonomy["wealth_tiers_zh"].get(dg["wealth_tier"], dg["wealth_tier"]),
                "wealth_detail": dg["wealth_detail"],
                "origin_type": dg["origin_type"],
                "origin_type_zh": taxonomy["origin_types_zh"].get(dg["origin_type"], dg["origin_type"]),
                "first_money_or_break": dg["first_money_or_break"],
                "first_money_or_break_en": guest_trans.get(dg["guest_key"], {}).get("first_money_or_break_en", ""),
                "zero_start_advice": dg["zero_start_advice"],
                "zero_start_advice_en": guest_trans.get(dg["guest_key"], {}).get("zero_start_advice_en", ""),
                "recommended_skills": sorted(dg["recommended_skills"]),
                "recommended_books_or_mentors": sorted(dg["recommended_books_or_mentors"]),
                "appearance_count": len(dg["appearances"]),
                "primary_video_id": primary_app["video_id"],
                "primary_video_title": primary_app["video_title"],
                "max_view_count": max(a["view_count"] for a in dg["appearances"]),
                "appearances": dg["appearances"],
                "advice_tags": list(dg["advice_by_tag"].keys()),
                "advice_items": list(dg["advice_by_tag"].values()),
            }
        )
    serializable_guests.sort(key=lambda g: (-len(g["advice_items"]), -g["max_view_count"]))

    industries_summary = []
    for ind in taxonomy["industries"]:
        st = industry_stats[ind]
        if st["count"] == 0:
            continue
        industries_summary.append(
            {
                "industry": ind,
                "industry_zh": taxonomy["industries_zh"].get(ind, ind),
                "count": st["count"],
                "pct": round(st["count"] / total_unique_guests * 100, 1) if total_unique_guests else 0.0,
                "wealth_tiers": dict(st["wealth_tiers"]),
                "top_tags": [
                    {"tag": k, "tag_zh": tag_lookup[k]["zh"], "count": v}
                    for k, v in st["tags"].most_common(5)
                ],
            }
        )
    industries_summary.sort(key=lambda x: -x["count"])

    wealth_summary = []
    for wt in taxonomy["wealth_tiers"]:
        st = wealth_stats[wt]
        wealth_summary.append(
            {
                "wealth_tier": wt,
                "wealth_tier_zh": taxonomy["wealth_tiers_zh"].get(wt, wt),
                "count": st["count"],
                "pct": round(st["count"] / total_unique_guests * 100, 1) if total_unique_guests else 0.0,
                "top_tags": [
                    {"tag": k, "tag_zh": tag_lookup[k]["zh"], "count": v, "pct": round(v / st["count"] * 100, 1) if st["count"] else 0.0}
                    for k, v in st["tags"].most_common(10)
                ],
            }
        )

    origin_summary = []
    for orig in taxonomy["origin_types"]:
        st = origin_stats[orig]
        origin_summary.append(
            {
                "origin_type": orig,
                "origin_type_zh": taxonomy["origin_types_zh"].get(orig, orig),
                "count": st["count"],
                "pct": round(st["count"] / total_unique_guests * 100, 1) if total_unique_guests else 0.0,
                "top_tags": [
                    {"tag": k, "tag_zh": tag_lookup[k]["zh"], "count": v}
                    for k, v in st["tags"].most_common(6)
                ],
            }
        )

    upload_dates = [v["upload_date"] for v in video_records if v["upload_date"]]
    interview_videos = [
        v for v in video_records if v["video_type"] not in {"non_interview", "no_transcript"}
    ]

    dashboard_data = {
        "generated_at": "2026-11-18",
        "overview": {
            "channel_handle": "@theschoolofhardknocks",
            "channel_url": "https://www.youtube.com/@theschoolofhardknocks/videos",
            "total_playlist_videos": len(json.loads((ROOT / "data" / "raw" / "playlist.json").read_text())),
            "cleaned_transcripts": len(clean_map),
            "extracted_videos": len(extracted_files),
            "interview_videos": len(interview_videos),
            "non_interview_videos": video_type_counts["non_interview"],
            "video_type_counts": dict(video_type_counts),
            "total_raw_guest_appearances": len(raw_appearances),
            "unique_guests_count": total_unique_guests,
            "compilation_clips_deduped": compilation_clips_deduped,
            "total_unique_advice_endorsements": sum(st["unique_guest_count"] for st in ranked_advice),
            "total_raw_advice_mentions": sum(st["raw_mention_count"] for st in ranked_advice),
            "total_views_analyzed": sum(v["view_count"] for v in interview_videos),
            "date_min": min(upload_dates) if upload_dates else "",
            "date_max": max(upload_dates) if upload_dates else "",
            "unmapped_other_tags": dict(other_tags_counter.most_common(30)),
        },
        "taxonomy": taxonomy,
        "advice_rankings": ranked_advice,
        "industries": industries_summary,
        "wealth_tiers": wealth_summary,
        "origins": origin_summary,
        "skills_ranking": [
            {
                "skill": k,
                "skill_zh": taxonomy["skills_zh"].get(k, k),
                "count": v,
                "pct": round(v / total_unique_guests * 100, 1) if total_unique_guests else 0.0,
            }
            for k, v in skill_counter.most_common(25)
        ],
        "books_and_mentors": [
            {"name": k, "count": v}
            for k, v in book_counter.most_common(40)
            if v >= 2
        ],
        "zero_start_playbook": sorted(zero_start_list, key=lambda x: -x["view_count"]),
        "guests": serializable_guests,
        "videos": sorted(video_records, key=lambda v: v["upload_date"], reverse=True),
    }

    payload = json.dumps(dashboard_data, ensure_ascii=False, indent=2)
    (AGG_DIR / "dashboard_data.json").write_text(payload, encoding="utf-8")
    web_public = ROOT / "web" / "public"
    web_public.mkdir(parents=True, exist_ok=True)
    (web_public / "dashboard_data.json").write_text(payload, encoding="utf-8")

    # Also export CSVs for spreadsheet exploration
    with (AGG_DIR / "advice_ranking.csv").open("w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["Rank", "Tag", "Tag_ZH", "Category", "Type", "Actionability", "Unique_Guests", "Guest_Pct", "Non_Compilation_Guests", "Raw_Mentions", "View_Weighted_Score"])
        for st in ranked_advice:
            w.writerow([
                st["rank"], st["tag"], st["tag_zh"], st["category_zh"], st["type"],
                st["actionability"], st["unique_guest_count"], st["unique_guest_pct"],
                st["non_compilation_guest_count"], st["raw_mention_count"], st["view_weighted_score"],
            ])

    with (AGG_DIR / "guests.csv").open("w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f)
        w.writerow(["Guest_Name", "Role", "Industry", "Wealth_Tier", "Wealth_Detail", "Origin", "Advice_Count", "Advice_Tags", "First_Break", "Zero_Start", "Primary_Video"])
        for g in serializable_guests:
            w.writerow([
                g["guest_name"], g["role_or_title"], g["industry_zh"], g["wealth_tier_zh"],
                g["wealth_detail"], g["origin_type_zh"], len(g["advice_items"]),
                "; ".join(g["advice_tags"]), g["first_money_or_break"], g["zero_start_advice"],
                f"https://www.youtube.com/watch?v={g['primary_video_id']}",
            ])

    print("Aggregation complete!")
    print("Overview:", json.dumps(dashboard_data["overview"], ensure_ascii=False, indent=2))
    if other_tags_counter:
        print("Top unmapped OTHER tags:", other_tags_counter.most_common(15))


if __name__ == "__main__":
    main()
