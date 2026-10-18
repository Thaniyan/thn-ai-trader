"""Checksum-pinned workflow linter, installed temporarily outside source."""
import hashlib, io, pathlib, subprocess, tarfile, tempfile, urllib.request

url = 'https://github.com/rhysd/actionlint/releases/download/v1.7.7/actionlint_1.7.7_linux_amd64.tar.gz'
expected = '023070a287cd8cccd71515fedc843f1985bf96c436b7effaecce67290e7e0757'
data = urllib.request.urlopen(url, timeout=60).read()
if hashlib.sha256(data).hexdigest() != expected:
    raise SystemExit('actionlint archive checksum mismatch')
with tempfile.TemporaryDirectory(prefix='thn-actionlint-') as folder:
    binary = pathlib.Path(folder) / 'actionlint'
    with tarfile.open(fileobj=io.BytesIO(data), mode='r:gz') as archive:
        binary.write_bytes(archive.extractfile('actionlint').read())
    binary.chmod(0o700)
    subprocess.run([str(binary), '.github/workflows/ci.yml'], check=True)
