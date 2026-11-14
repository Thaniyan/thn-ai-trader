"""Add checksum-pinned test fonts without APT, root access or application changes."""
import argparse
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import tarfile
import urllib.request
from xml.sax.saxutils import escape

ARCHIVE_URL = 'https://github.com/dejavu-fonts/dejavu-fonts/releases/download/version_2_37/dejavu-fonts-ttf-2.37.tar.bz2'
ARCHIVE_SHA256 = 'fa9ca4d13871dd122f61258a80d01751d603b4d3ee14095d65453b4e846e17d7'
PREFIX = 'dejavu-fonts-ttf-2.37'
REQUIRED = {'DejaVuSans.ttf', 'DejaVuSans-Bold.ttf', 'DejaVuSans-Oblique.ttf', 'DejaVuSans-BoldOblique.ttf'}


def unpack_verified_archive(data):
    if hashlib.sha256(data).hexdigest() != ARCHIVE_SHA256:
        raise RuntimeError('DejaVu archive checksum mismatch')
    fonts, license_text = {}, None
    with tarfile.open(fileobj=io.BytesIO(data), mode='r:bz2') as archive:
        for member in archive.getmembers():
            if not member.isfile():
                continue
            name = PurePosixPath(member.name)
            if name.parent == PurePosixPath(PREFIX, 'ttf') and name.name.startswith('DejaVu') and name.suffix == '.ttf':
                fonts[name.name] = archive.extractfile(member).read()
            elif member.name == PREFIX + '/LICENSE':
                license_text = archive.extractfile(member).read()
    if not REQUIRED.issubset(fonts) or not license_text:
        raise RuntimeError('Verified DejaVu archive lacks required styles or license')
    return fonts, license_text


def install(data, root, base_config):
    fonts, license_text = unpack_verified_archive(data)
    root, base_config = Path(root).resolve(), Path(base_config).resolve()
    if not base_config.is_file() or any(c in str(root) for c in '\r\n'):
        raise RuntimeError('Invalid font environment path')
    font_dir = root / 'fonts'
    font_dir.mkdir(parents=True, exist_ok=True)
    (root / 'cache').mkdir(exist_ok=True)
    for name, content in fonts.items():
        (font_dir / name).write_bytes(content)
    (root / 'LICENSE').write_bytes(license_text)
    # Include the full existing configuration; add fonts, never replace aliases
    # or remove the official image's multilingual/system font directories.
    config = root / 'fonts.conf'
    config.write_text('<?xml version="1.0"?>\n<!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">\n'
                      '<fontconfig>\n <include ignore_missing="no">' + escape(str(base_config)) + '</include>\n'
                      ' <dir>' + escape(str(font_dir)) + '</dir>\n'
                      ' <cachedir>' + escape(str(root / 'cache')) + '</cachedir>\n</fontconfig>\n')
    manifest = {'source': ARCHIVE_URL, 'archiveSHA256': ARCHIVE_SHA256,
                'fontconfig': str(config), 'baseConfig': str(base_config),
                'fonts': {name: hashlib.sha256(content).hexdigest() for name, content in sorted(fonts.items())}}
    (root / 'font-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    return manifest


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', required=True, help='Job-private writable temporary directory')
    parser.add_argument('--base-config', default='/etc/fonts/fonts.conf')
    args = parser.parse_args()
    if not os.environ.get('GITHUB_ENV'):
        raise RuntimeError('GITHUB_ENV required to register fonts for subsequent CI steps')
    with urllib.request.urlopen(ARCHIVE_URL, timeout=60) as response:
        data = response.read(8 * 1024 * 1024 + 1)
    if len(data) > 8 * 1024 * 1024:
        raise RuntimeError('DejaVu archive exceeds the expected download bound')
    manifest = install(data, args.root, args.base_config)
    with open(os.environ['GITHUB_ENV'], 'a') as output:
        output.write('FONTCONFIG_FILE=' + manifest['fontconfig'] + '\n')
    print(json.dumps(manifest, indent=2))


if __name__ == '__main__':
    main()
