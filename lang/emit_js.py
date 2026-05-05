#!/usr/bin/env python3
"""Emit window.INTUSKETCH_I18N.<locale> bundles from *.json (same key order as JSON)."""
from __future__ import annotations

import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent
LOCALES = ("en", "ru", "de", "es", "zh", "ko")


def main() -> None:
    for code in LOCALES:
        data = json.loads((ROOT / f"{code}.json").read_text(encoding="utf-8"))
        dumped = json.dumps(data, ensure_ascii=False, indent=0)
        text = (
            "window.INTUSKETCH_I18N = window.INTUSKETCH_I18N || {};\n"
            f"window.INTUSKETCH_I18N.{code} = {dumped};\n"
        )
        (ROOT / f"{code}.js").write_text(text, encoding="utf-8")
        print(code, len(data), "keys")


if __name__ == "__main__":
    main()
