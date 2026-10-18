"""Deterministic, allowlisted ZIP of an already source-verified static artifact."""
import json
import pathlib
import stat
import subprocess
import sys
import zipfile

root = pathlib.Path(sys.argv[1]).resolve()
out = pathlib.Path(sys.argv[2]).resolve()
if out.exists() or root == out or root in out.parents:
    raise SystemExit('Choose a new ZIP path outside the artifact')
subprocess.run(['node', 'verify-build.mjs', '--source'], cwd=root, check=True)
manifest = json.loads((root / 'manifest.json').read_text())
names = sorted([*manifest['sha256'], 'manifest.json', 'vercel.json'])
with zipfile.ZipFile(out, 'x', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for name in names:
        entry = zipfile.ZipInfo(name, date_time=(2020, 1, 1, 0, 0, 0))
        entry.create_system = 3
        entry.external_attr = (stat.S_IFREG | 0o644) << 16
        entry.compress_type = zipfile.ZIP_DEFLATED
        archive.writestr(entry, (root / name).read_bytes(), compresslevel=9)
print(out)
