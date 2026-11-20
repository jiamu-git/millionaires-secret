#!/usr/bin/env python3
"""Fetch metadata (.info.json) and English subtitles (.vtt) for channel videos via yt-dlp."""

import argparse
import concurrent.futures
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PLAYLIST_PATH = ROOT / "data" / "raw" / "playlist.json"
OUT_DIR = ROOT / "data" / "raw" / "videos"


def pick_fallback_lang(info_path: Path) -> str | None:
    if not info_path.exists():
        return "en"
    info = json.loads(info_path.read_text(encoding="utf-8"))
    subs = info.get("subtitles") or {}
    auto = info.get("automatic_captions") or {}
    for lang in ("en", "en-US", "en-GB", "en-orig"):
        if lang in subs:
            return lang
    for lang in ("en-orig", "en", "en-US", "en-GB"):
        if lang in auto:
            return lang
    return None


def fetch_video(video: dict, sub_langs: str | None = None) -> tuple[str, bool, str]:
    vid = video["id"]
    info_path = OUT_DIR / f"{vid}.info.json"
    vtt_candidates = list(OUT_DIR.glob(f"{vid}.*.vtt"))
    if info_path.exists() and vtt_candidates:
        return vid, True, "cached"

    lang = sub_langs
    if lang is None:
        lang = pick_fallback_lang(info_path)
        if lang is None:
            return vid, False, "no_english_subs_in_info"

    url = f"https://www.youtube.com/watch?v={vid}"
    cmd = [
        "yt-dlp",
        "--no-update",
        "--quiet",
        "--no-warnings",
        "--skip-download",
        "--no-overwrites",
        "--ignore-errors",
        "--sleep-requests",
        "0.25",
        "--write-info-json",
        "--write-subs",
        "--write-auto-subs",
        "--sub-langs",
        lang,
        "--sub-format",
        "vtt",
        "--extractor-args",
        "youtube:skip=hls,dash",
        "-o",
        str(OUT_DIR / "%(id)s.%(ext)s"),
        url,
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    has_info = info_path.exists()
    has_vtt = bool(list(OUT_DIR.glob(f"{vid}.*.vtt")))
    if has_info and has_vtt:
        return vid, True, f"ok({lang})"
    if has_info and not has_vtt:
        return vid, False, f"no_vtt({lang}): {res.stderr.strip()[:200]}"
    return vid, False, f"err({res.returncode}): {res.stderr.strip()[:200]}"


def run_pass(videos: list[dict], workers: int, sub_langs: str | None, label: str) -> list[dict]:
    ok_count = 0
    failed = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(fetch_video, v, sub_langs): v for v in videos}
        for idx, fut in enumerate(concurrent.futures.as_completed(futures), 1):
            v = futures[fut]
            vid, ok, msg = fut.result()
            if ok:
                ok_count += 1
            else:
                failed.append((v, msg))
            if idx % 10 == 0 or idx == len(videos):
                print(
                    f"[{label}] {idx}/{len(videos)} ok={ok_count} pending={len(failed)}",
                    flush=True,
                )
    if failed:
        print(f"[{label}] sample failures:", [(v["id"], m) for v, m in failed[:5]], flush=True)
    return [v for v, _ in failed]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--workers", type=int, default=6)
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    videos = json.loads(PLAYLIST_PATH.read_text())
    if args.limit > 0:
        videos = videos[: args.limit]

    # Pass 1: fetch info + en-orig (avoids YouTube 429 on tlang=en auto-translations)
    remaining = run_pass(videos, args.workers, "en-orig", "pass1-en-orig")

    # Pass 2: for any missing videos, inspect .info.json and fall back to en/en-US/en-GB sequentially
    if remaining:
        print(f"\nRunning sequential fallback pass for {len(remaining)} videos...", flush=True)
        remaining = run_pass(remaining, 2, None, "pass2-fallback")

    print(f"\nDone. Total={len(videos)}, Remaining failures={len(remaining)}")
    if remaining:
        print("Failed IDs:", [v["id"] for v in remaining])


if __name__ == "__main__":
    main()
