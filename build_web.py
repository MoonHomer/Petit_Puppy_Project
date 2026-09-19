#!/usr/bin/env python3
"""
Build script for the GitHub Pages ("web") variant of the game.

Unlike build.py (which produces a single self-contained furball-diary.html
for the claude.ai Artifact platform - a hard requirement there, no external
files, images inlined as base64), this script has no such constraint. It
produces a multi-file static site under docs/ (GitHub Pages default source
folder for "Deploy from a branch"):

    docs/index.html          - full HTML document (doctype/head/body)
    docs/styles.css          - copy of src/styles.css
    docs/game.js             - all src/script/*.js concatenated, in the same
                                (function(){ ... })() wrapper build.py uses -
                                so scoping/closures behave identically to the
                                Artifact build (e.g. `state` still is NOT a
                                global). 029-dog-sprites.js is replaced with a
                                variant that points at real files instead of
                                inlined base64 (see below).
    docs/assets/sprites/*.png - the 144 dog sprites as real PNG files,
                                extracted from src/script/029-dog-sprites.js
                                by tools/extract_sprites.js. Real files are
                                actually *smaller* than the base64 text they
                                replace (base64 inflates size by ~33%), and -
                                unlike a single inlined HTML - they're each
                                cacheable by the browser independently.

src/script/029-dog-sprites.js remains the single source of truth (edit it,
not the generated docs/game.js) - this script derives the web variant from
it fresh on every run, so there's nothing to keep manually in sync.

Usage:
    python3 build_web.py            # writes docs/
    python3 build_web.py --check    # also runs build.py --check first
"""
import argparse
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / "src"
SCRIPT_DIR = SRC / "script"
DOCS = ROOT / "docs"
SPRITES_SRC = SCRIPT_DIR / "029-dog-sprites.js"
SPRITES_OUT_DIR = DOCS / "assets" / "sprites"
EXTRACT_SCRIPT = ROOT / "tools" / "extract_sprites.js"

DATA_URI_RE = re.compile(r'"data:image/png;base64,[A-Za-z0-9+/=]+"')


def read(path: pathlib.Path) -> str:
    return path.read_text(encoding="utf-8")


def extract_sprites() -> dict:
    """Runs tools/extract_sprites.js, writes PNG files into docs/assets/sprites/,
    and returns the manifest dict {stageKeys, sprites, count}."""
    if SPRITES_OUT_DIR.exists():
        for f in SPRITES_OUT_DIR.glob("*.png"):
            f.unlink()
    SPRITES_OUT_DIR.mkdir(parents=True, exist_ok=True)
    result = subprocess.run(
        ["node", str(EXTRACT_SCRIPT), str(SPRITES_SRC), str(SPRITES_OUT_DIR)],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        sys.stderr.write(result.stderr)
        raise SystemExit("extract_sprites.js failed")
    return json.loads(result.stdout)


def build_web_sprites_js(manifest: dict) -> str:
    """Replaces every base64 data URI in 029-dog-sprites.js with a relative
    path into assets/sprites/, keeping everything else (comments,
    DOG_SPRITE_STAGE_KEYS, getDogSpriteImage(), formatting) byte-identical.
    getDogSpriteImage() just does `img.src = dataUri` - a relative URL works
    exactly the same way a data: URI does, so the function needs no changes."""
    original = read(SPRITES_SRC)

    # Walk the same nested structure the extractor did, in the same order,
    # and replace each literal data-URI string with its file's relative path.
    # We do this with a stateful regex substitution keyed on breed/stage
    # context markers so we don't need a full JS parser here either.
    breed_re = re.compile(r'^\s{4}(\w+):\s*\{\s*$', re.MULTILINE)
    stage_re = re.compile(r'^\s{6}(\w+):\s*\{')

    lines = original.split("\n")
    current_breed = None
    out_lines = []
    for line in lines:
        bm = breed_re.match(line)
        if bm and bm.group(1) in manifest["sprites"]:
            current_breed = bm.group(1)
            out_lines.append(line)
            continue
        sm = stage_re.match(line)
        if sm and current_breed and sm.group(1) in manifest["sprites"][current_breed]:
            stage = sm.group(1)
            coat_map = manifest["sprites"][current_breed][stage]

            def repl(m, _breed=current_breed, _stage=stage, _coats=coat_map):
                # m is a full `coat:"data:...."` match region is handled below
                return m

            # Replace each coat's data URI on this line individually.
            new_line = line
            for coat, fname in coat_map.items():
                pat = re.compile(
                    re.escape(coat) + r':"data:image/png;base64,[A-Za-z0-9+/=]+"'
                )
                new_line = pat.sub(f'{coat}:"assets/sprites/{fname}"', new_line, count=1)
            out_lines.append(new_line)
            continue
        out_lines.append(line)

    result = "\n".join(out_lines)
    remaining = DATA_URI_RE.findall(result)
    if remaining:
        raise SystemExit(
            f"{len(remaining)} base64 data URI(s) were not replaced in the web "
            f"sprite variant - extraction/substitution logic is out of sync "
            f"with 029-dog-sprites.js's structure and needs fixing before this "
            f"can be trusted."
        )
    # Sanity: same number of path replacements as the manifest's sprite count.
    path_count = result.count("assets/sprites/")
    if path_count != manifest["count"]:
        raise SystemExit(
            f"expected {manifest['count']} sprite path substitutions, made {path_count}"
        )
    return result


def build_game_js(web_sprites_js: str) -> str:
    script_files = sorted(SCRIPT_DIR.glob("*.js"))
    if not script_files:
        raise SystemExit(f"no script modules found under {SCRIPT_DIR}")
    parts = []
    for p in script_files:
        if p.name == SPRITES_SRC.name:
            parts.append(web_sprites_js)
        else:
            parts.append(read(p))
    script_body = "".join(parts)
    return "(function(){\n" + script_body + "})();\n"


def build_index_html() -> str:
    head = read(SRC / "head-meta.html")
    body = read(SRC / "body-markup.html")
    return (
        "<!DOCTYPE html>\n"
        '<html lang="ko">\n'
        "<head>\n"
        '<meta charset="UTF-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">\n'
        + head
        + '<link rel="stylesheet" href="styles.css">\n'
        "</head>\n"
        "<body>\n"
        + body
        + '\n<script src="game.js"></script>\n'
        "</body>\n"
        "</html>\n"
    )


def build():
    DOCS.mkdir(exist_ok=True)

    manifest = extract_sprites()
    web_sprites_js = build_web_sprites_js(manifest)
    game_js = build_game_js(web_sprites_js)
    (DOCS / "game.js").write_text(game_js, encoding="utf-8")

    styles = read(SRC / "styles.css")
    (DOCS / "styles.css").write_text(styles, encoding="utf-8")

    index_html = build_index_html()
    (DOCS / "index.html").write_text(index_html, encoding="utf-8")

    # GitHub Pages: without this file, Pages runs the site through Jekyll,
    # which ignores/mangles files and folders starting with "_" and can
    # interfere with plain static sites. This disables that processing.
    (DOCS / ".nojekyll").write_text("", encoding="utf-8")

    total_bytes = sum(f.stat().st_size for f in DOCS.rglob("*") if f.is_file())
    print(f"wrote {DOCS}/ ({manifest['count']} sprites, {total_bytes} bytes total)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true",
                     help="also run build.py --check first (single-file Artifact build)")
    args = ap.parse_args()

    if args.check:
        result = subprocess.run([sys.executable, str(ROOT / "build.py"), "--check"])
        if result.returncode != 0:
            sys.exit(result.returncode)

    build()


if __name__ == "__main__":
    main()
