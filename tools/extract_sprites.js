#!/usr/bin/env node
/**
 * Extracts the base64 PNG data embedded in src/script/029-dog-sprites.js into
 * real .png files, for the GitHub Pages ("web") build variant.
 *
 * Usage: node tools/extract_sprites.js <path-to-029-dog-sprites.js> <output-dir>
 * Prints a JSON manifest to stdout: { stageKeys: [...], sprites: { breed: { stage: { coat: "filename.png" } } } }
 *
 * This does NOT modify the source file - src/script/029-dog-sprites.js remains
 * the single source of truth (base64-inlined) used by build.py for the
 * claude.ai Artifact single-file build. This script only reads it.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const [, , srcPath, outDir] = process.argv;
if (!srcPath || !outDir) {
  console.error("usage: node extract_sprites.js <029-dog-sprites.js> <outDir>");
  process.exit(1);
}

const code = fs.readFileSync(srcPath, "utf8");
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(code, sandbox, { filename: srcPath });

const DOG_SPRITES = sandbox.DOG_SPRITES;
const STAGE_KEYS = sandbox.DOG_SPRITE_STAGE_KEYS;
if (!DOG_SPRITES || !STAGE_KEYS) {
  console.error("failed to extract DOG_SPRITES / DOG_SPRITE_STAGE_KEYS from " + srcPath);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

const manifest = {};
let count = 0;
for (const breed of Object.keys(DOG_SPRITES)) {
  manifest[breed] = {};
  for (const stage of Object.keys(DOG_SPRITES[breed])) {
    manifest[breed][stage] = {};
    for (const coat of Object.keys(DOG_SPRITES[breed][stage])) {
      const dataUri = DOG_SPRITES[breed][stage][coat];
      const m = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(dataUri);
      if (!m) {
        console.error(`unexpected data URI format for ${breed}/${stage}/${coat}`);
        process.exit(1);
      }
      const buf = Buffer.from(m[1], "base64");
      const fname = `${breed}-${stage}-${coat}.png`;
      fs.writeFileSync(path.join(outDir, fname), buf);
      manifest[breed][stage][coat] = fname;
      count++;
    }
  }
}

console.log(JSON.stringify({ stageKeys: STAGE_KEYS, sprites: manifest, count }));
