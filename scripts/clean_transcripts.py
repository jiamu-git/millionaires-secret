#!/usr/bin/env python3
"""Clean YouTube .vtt subtitles (deduplicating rolling captions) and merge with .info.json metadata."""

import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT / "data" / "raw" / "videos"
PLAYLIST_PATH = ROOT / "data" / "raw" / "playlist.json"
CLEAN_DIR = ROOT / "data" / "clean"

TIME_RE = re.compile(
    r"(?:(\d+):)?(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(?:(\d+):)?(\d{2}):(\d{2})[.,](\d{3})"
)
TAG_RE = re.compile(r"<[^>]+>")


def to_seconds(h: str | None, m: str, s: str, ms: str) -> float:
    hours = int(h) if h else 0
    return hours * 3600 + int(m) * 60 + int(s) + int(ms) / 1000.0


def fmt_ts(sec: float) -> str:
    sec_i = max(0, int(sec))
    h, rem = divmod(sec_i, 3600)
    m, s = divmod(rem, 60)
    if h > 0:
        return f"{h:d}:{m:02d}:{s:02d}"
    return f"{m:02d}:{s:02d}"


def parse_vtt(vtt_path: Path) -> list[dict]:
    """Parse VTT into deduplicated timestamped lines."""
    raw = vtt_path.read_text(encoding="utf-8", errors="replace")
    blocks = re.split(r"\r?\n\r?\n", raw)
    segments: list[dict] = []
    last_line = ""

    for block in blocks:
        lines = [ln.strip() for ln in block.splitlines() if ln.strip()]
        if not lines:
            continue
        time_idx = None
        m = None
        for idx, ln in enumerate(lines):
            m = TIME_RE.search(ln)
            if m:
                time_idx = idx
                break
        if time_idx is None or m is None:
            continue

        start = to_seconds(m.group(1), m.group(2), m.group(3), m.group(4))
        end = to_seconds(m.group(5), m.group(6), m.group(7), m.group(8))
        text_lines = lines[time_idx + 1 :]
        if not text_lines:
            continue

        cleaned_lines = []
        for tl in text_lines:
            txt = TAG_RE.sub("", tl)
            txt = html.unescape(txt)
            txt = re.sub(r"\s+", " ", txt).strip()
            if txt:
                cleaned_lines.append(txt)

        if not cleaned_lines:
            continue

        for txt in cleaned_lines:
            if txt == last_line:
                continue
            # Handle rolling caption prefix overlap
            if last_line and txt.startswith(last_line) and len(txt) > len(last_line):
                suffix = txt[len(last_line) :].strip()
                if suffix:
                    segments.append({"start": round(start, 1), "end": round(end, 1), "text": suffix})
                last_line = txt
                continue
            # Also skip if current line is already contained at the end of recent lines
            if segments and txt == segments[-1]["text"]:
                continue
            segments.append({"start": round(start, 1), "end": round(end, 1), "text": txt})
            last_line = txt

    # Coalesce short lines into ~15-second or sentence-like chunks for readability & token efficiency
    chunks: list[dict] = []
    buf_text: list[str] = []
    buf_start: float | None = None
    buf_end: float = 0.0

    for seg in segments:
        if buf_start is None:
            buf_start = seg["start"]
        buf_text.append(seg["text"])
        buf_end = seg["end"]
        joined = " ".join(buf_text)
        if len(joined) >= 220 or (buf_end - buf_start >= 18 and joined.endswith((".", "?", "!"))):
            chunks.append(
                {
                    "start": int(buf_start),
                    "ts": fmt_ts(buf_start),
                    "text": joined,
                }
            )
            buf_text = []
            buf_start = None

    if buf_text and buf_start is not None:
        chunks.append(
            {
                "start": int(buf_start),
                "ts": fmt_ts(buf_start),
                "text": " ".join(buf_text),
            }
        )
    return chunks


def main() -> None:
    CLEAN_DIR.mkdir(parents=True, exist_ok=True)
    playlist = json.loads(PLAYLIST_PATH.read_text())
    stats = {"total": len(playlist), "cleaned": 0, "missing_info": 0, "missing_vtt": 0}

    index = []
    for item in playlist:
        vid = item["id"]
        info_path = RAW_DIR / f"{vid}.info.json"
        if not info_path.exists():
            stats["missing_info"] += 1
            continue
        info = json.loads(info_path.read_text(encoding="utf-8"))

        vtt_files = sorted(RAW_DIR.glob(f"{vid}.*.vtt"))
        if not vtt_files:
            stats["missing_vtt"] += 1
            continue

        # Prefer manual/primary en over en-orig if both exist
        vtt_path = next((p for p in vtt_files if p.name.endswith(".en.vtt")), vtt_files[0])
        chunks = parse_vtt(vtt_path)

        chapters = [
            {
                "start": int(c.get("start_time", 0)),
                "end": int(c.get("end_time", 0)),
                "title": c.get("title", ""),
            }
            for c in (info.get("chapters") or [])
        ]

        record = {
            "id": vid,
            "url": f"https://www.youtube.com/watch?v={vid}",
            "title": info.get("title") or item.get("title"),
            "upload_date": info.get("upload_date", ""),
            "duration": info.get("duration") or item.get("duration", 0),
            "view_count": info.get("view_count") or item.get("view_count", 0),
            "like_count": info.get("like_count") or 0,
            "comment_count": info.get("comment_count") or 0,
            "chapters": chapters,
            "transcript_chunks": chunks,
            "word_count": sum(len(c["text"].split()) for c in chunks),
        }
        (CLEAN_DIR / f"{vid}.json").write_text(json.dumps(record, ensure_ascii=False, indent=2))
        stats["cleaned"] += 1
        index.append(
            {
                "id": vid,
                "title": record["title"],
                "upload_date": record["upload_date"],
                "duration": record["duration"],
                "view_count": record["view_count"],
                "like_count": record["like_count"],
                "chapter_count": len(chapters),
                "word_count": record["word_count"],
            }
        )

    (CLEAN_DIR / "_index.json").write_text(json.dumps(index, ensure_ascii=False, indent=2))
    print("Clean stats:", stats)


if __name__ == "__main__":
    main()
