"""Shared canonical taxonomy loader."""

import json
from pathlib import Path

TAXONOMY_PATH = Path(__file__).resolve().parent.parent / "data" / "taxonomy.json"
TAXONOMY = json.loads(TAXONOMY_PATH.read_text(encoding="utf-8"))
TAG_LOOKUP = {t["tag"]: t for t in TAXONOMY["canonical_tags"]}
