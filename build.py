#!/usr/bin/env python3
"""
Build script for furball-diary.html (petit-mung / 쁘띠멍 프로젝트).

The published game must remain a single self-contained HTML file (a hard
requirement of the claude.ai Artifact platform - no external file loading
except a few whitelisted CDNs for libraries, which this project doesn't use).

This script assembles that single file from a modular source tree under
src/, so future edits touch one small, clearly-named file instead of
scrolling through one ~7,500-line monolith. It changes nothing about the
shipped game - the assembled output is byte-for-byte identical to the
hand-edited version it replaces (verified via `python3 build.py --check`).

Usage:
    python3 build.py                 # writes furball-diary.html
    python3 build.py --check         # writes to a temp file and diffs
                                        against the current furball-diary.html
    python3 build.py --out PATH      # write to a custom path instead
"""
import argparse
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / "src"
SCRIPT_DIR = SRC / "script"
DEFAULT_OUT = ROOT / "furball-diary.html"


def read(path: pathlib.Path) -> str:
    return path.read_text(encoding="utf-8")


def build() -> str:
    head = read(SRC / "head-meta.html")
    styles = read(SRC / "styles.css")
    body = read(SRC / "body-markup.html")

    script_files = sorted(SCRIPT_DIR.glob("*.js"))
    if not script_files:
        raise SystemExit(f"no script modules found under {SCRIPT_DIR}")
    script_body = "".join(read(p) for p in script_files)

    # Reproduce the exact original layout: a single blank line separates
    # head-meta from <style>, body-markup from <script>, and so on - see
    # the comments in each part below for the corresponding original line.
    parts = [
        head,                 # original lines 1-6
        "<style>\n",          # original line 7
        styles,               # original lines 8-1678
        "</style>\n",         # original line 1679
        "\n",                 # original line 1680 (blank)
        body,                 # original lines 1681-2156
        "\n",                 # original line 2157 (blank)
        "<script>\n",         # original line 2158
        "(function(){\n",     # original line 2159
        script_body,          # original lines 2160-7452
        "})();\n",            # original line 7453
        "</script>\n",        # original line 7454 (local file ends with a
                               # trailing newline - confirmed via `od -c`)
    ]
    return "".join(parts)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true",
                     help="build to a temp file and diff against furball-diary.html instead of writing")
    ap.add_argument("--out", default=str(DEFAULT_OUT))
    args = ap.parse_args()

    output = build()

    if args.check:
        tmp = ROOT / ".build-check.html"
        tmp.write_text(output, encoding="utf-8")
        result = subprocess.run(["diff", "-u", str(DEFAULT_OUT), str(tmp)])
        tmp.unlink()
        if result.returncode == 0:
            print("OK: build output is byte-identical to furball-diary.html")
        else:
            print("DIFF FOUND (see above) - build output does not match furball-diary.html", file=sys.stderr)
            sys.exit(1)
        return

    out_path = pathlib.Path(args.out)
    out_path.write_text(output, encoding="utf-8")
    print(f"wrote {out_path} ({len(output)} bytes, {output.count(chr(10))+1} lines)")


if __name__ == "__main__":
    main()
