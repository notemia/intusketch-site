#!/usr/bin/env python3
"""Merge native legal/support/privacy/terms strings; normalize support email; refresh *.js."""
from __future__ import annotations

import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent
BUNDLES = ROOT / "bundles"
LOCALES = ("en", "ru", "de", "es", "zh", "ko")
OLD_MAIL = "support@intusketch.app"
NEW_MAIL = "intusketch@gmail.com"


def scrub_emails(obj: dict) -> None:
    for k, v in obj.items():
        if isinstance(v, str) and OLD_MAIL in v:
            obj[k] = v.replace(OLD_MAIL, NEW_MAIL)


def main() -> None:
    for code in LOCALES:
        path = ROOT / f"{code}.json"
        data = json.loads(path.read_text(encoding="utf-8"))
        bundle = BUNDLES / f"legal_{code}.json"
        if bundle.exists():
            patch = json.loads(bundle.read_text(encoding="utf-8"))
            data.update(patch)
        scrub_emails(data)
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    # Static HTML fallbacks & site.js
    docs = ROOT.parent
    for p in docs.rglob("*"):
        if p.suffix not in {".html", ".js"}:
            continue
        text = p.read_text(encoding="utf-8")
        if OLD_MAIL in text:
            p.write_text(text.replace(OLD_MAIL, NEW_MAIL), encoding="utf-8")

    subprocess.run([sys.executable, str(ROOT / "emit_js.py")], check=True)


if __name__ == "__main__":
    main()
