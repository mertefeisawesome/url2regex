"""Build the extension and create its Chrome Web Store upload ZIP.

Run from any directory with: python3 extension/package.py
Only explicitly selected runtime files enter the archive.
"""

import json
from pathlib import Path
import subprocess
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parent
subprocess.run(["node", str(root / "build.mjs")], check=True)
dist = root / "dist"
manifest = json.loads((dist / "manifest.json").read_text())
files = ["manifest.json", "popup.html", "popup.js", "popup.css", "lib/index.js", "lib/validation.js", "LICENSE"]
files.extend(manifest["icons"].values())
destination = root / f"url2regex-{manifest['version']}.zip"
with ZipFile(destination, "w", ZIP_DEFLATED) as archive:
    for name in files:
        archive.write(dist / name, name)
print(f"Upload ZIP: {destination}")
