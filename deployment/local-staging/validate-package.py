"""Verify an untouched offline release before initialization; rejects extra files and links."""
import hashlib,json,pathlib,re,sys
root=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '.').resolve()
manifest=json.loads((root/'manifest.json').read_text())
if not re.fullmatch('[0-9a-f]{40}',manifest.get('commit','')) or manifest.get('purpose')!='LOCAL_ONLY_UNDEPLOYED':raise SystemExit('Invalid release identity')
expected=set(manifest['sha256'])|{'manifest.json'};observed=set()
for p in root.rglob('*'):
 if p.is_symlink():raise SystemExit('Release symlink rejected')
 if p.is_file():observed.add(str(p.relative_to(root)))
if expected!=observed:raise SystemExit('Unexpected or missing release files')
for name,digest in manifest['sha256'].items():
 relative=pathlib.Path(name);p=root/relative
 if relative.is_absolute() or '..' in relative.parts or not p.resolve().is_relative_to(root) or hashlib.sha256(p.read_bytes()).hexdigest()!=digest:raise SystemExit('Release checksum mismatch')
print('Release checksums PASS; application commit '+manifest['commit'])
