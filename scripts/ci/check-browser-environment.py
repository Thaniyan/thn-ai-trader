"""Fail closed before browser tests if the official CI image/tooling drifts.

No downloads or package installation: the version-matched Microsoft image contains
Chromium and the complete upstream Ubuntu 24.04 OS/font dependency set.
"""
import importlib.metadata
import ctypes
import json
import os
from pathlib import Path
import subprocess
import sys

PLAYWRIGHT_VERSION = '1.62.0'
CHROMIUM_REVISION = '1234'
CHROMIUM_VERSION = '151.0.7922.34'
# All font packages in Playwright 1.62.0 nativeDeps ubuntu24.04-x64.tools.
FONT_PACKAGES = (
    'fonts-noto-color-emoji', 'fonts-unifont', 'xfonts-cyrillic',
    'xfonts-scalable', 'fonts-liberation', 'fonts-ipafont-gothic',
    'fonts-wqy-zenhei', 'fonts-tlwg-loma-otf', 'fonts-freefont-ttf',
)


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def validate_versions(version, browser, executable):
    require(version == PLAYWRIGHT_VERSION, 'Pinned Playwright version mismatch')
    require(browser.get('revision') == CHROMIUM_REVISION, 'Chromium revision mismatch')
    require(browser.get('browserVersion') == CHROMIUM_VERSION, 'Chromium version mismatch')
    expected = Path('/ms-playwright') / ('chromium-' + CHROMIUM_REVISION) / 'chrome-linux64/chrome'
    require(Path(executable) == expected, 'Browser must come from the pinned CI image')


def validate_fonts(packages, arabic_fonts):
    for name in FONT_PACKAGES:
        require(packages.get(name) == 'install ok installed', 'Missing upstream font package: ' + name)
    require(bool(arabic_fonts.strip()), 'Arabic glyph font coverage unavailable')


def arabic_font_family():
    # libfontconfig1 is an upstream required dependency; its optional CLI is not.
    # Inspect the matched font's real character map without adding an OS package.
    fc = ctypes.CDLL('libfontconfig.so.1')
    ptr = ctypes.c_void_p
    class FontSet(ctypes.Structure):
        _fields_ = [('nfont', ctypes.c_int), ('sfont', ctypes.c_int), ('fonts', ctypes.POINTER(ptr))]
    signatures = {
        'FcInit': (ctypes.c_int, []),
        'FcNameParse': (ptr, [ctypes.c_char_p]),
        'FcConfigSubstitute': (ctypes.c_int, [ptr, ptr, ctypes.c_int]),
        'FcDefaultSubstitute': (None, [ptr]),
        'FcFontSort': (ctypes.POINTER(FontSet), [ptr, ptr, ctypes.c_int, ptr, ctypes.POINTER(ctypes.c_int)]),
        'FcFontSetDestroy': (None, [ctypes.POINTER(FontSet)]),
        'FcPatternGetCharSet': (ctypes.c_int, [ptr, ctypes.c_char_p, ctypes.c_int, ctypes.POINTER(ptr)]),
        'FcCharSetHasChar': (ctypes.c_int, [ptr, ctypes.c_uint]),
        'FcPatternGetString': (ctypes.c_int, [ptr, ctypes.c_char_p, ctypes.c_int, ctypes.POINTER(ctypes.c_char_p)]),
        'FcPatternDestroy': (None, [ptr]),
    }
    for name, (result, arguments) in signatures.items():
        function = getattr(fc, name)
        function.restype, function.argtypes = result, arguments
    require(fc.FcInit(), 'Fontconfig initialization failed')
    pattern = fc.FcNameParse(b'sans:lang=ar')
    require(pattern, 'Arabic font pattern unavailable')
    fonts = None
    try:
        require(fc.FcConfigSubstitute(None, pattern, 0), 'Arabic font configuration failed')
        fc.FcDefaultSubstitute(pattern)
        status = ctypes.c_int()
        fonts = fc.FcFontSort(None, pattern, 0, None, ctypes.byref(status))
        require(fonts and status.value == 0, 'Arabic font fallback set unavailable')
        for index in range(fonts.contents.nfont):
            font = fonts.contents.fonts[index]
            charset, family = ptr(), ctypes.c_char_p()
            if fc.FcPatternGetCharSet(font, b'charset', 0, ctypes.byref(charset)) != 0:
                continue
            if not all(fc.FcCharSetHasChar(charset, ord(char)) for char in 'تحليل السوق' if char != ' '):
                continue
            require(fc.FcPatternGetString(font, b'family', 0, ctypes.byref(family)) == 0 and family.value,
                    'Arabic font family unavailable')
            return family.value.decode('utf8')
        raise RuntimeError('Configured fonts lack required Arabic glyphs')
    finally:
        if fonts:
            fc.FcFontSetDestroy(fonts)
        fc.FcPatternDestroy(pattern)


def main():
    import playwright
    from playwright.sync_api import sync_playwright

    require(sys.version_info[:3] == (3, 12, 14), 'Pinned Python version mismatch')
    release = dict(line.split('=', 1) for line in Path('/etc/os-release').read_text().splitlines() if '=' in line)
    require(release.get('ID', '').strip('"') == 'ubuntu' and
            release.get('VERSION_ID', '').strip('"') == '24.04', 'Expected official Noble image')
    version = importlib.metadata.version('playwright')
    metadata = json.loads((Path(playwright.__file__).parent / 'driver/package/browsers.json').read_text())
    chromium = next(b for b in metadata['browsers'] if b['name'] == 'chromium')
    packages = {name: subprocess.check_output(
        ['dpkg-query', '-W', '-f=${Status}', name], text=True).strip() for name in FONT_PACKAGES}
    arabic = arabic_font_family()
    validate_fonts(packages, arabic)
    with sync_playwright() as p:
        executable = p.chromium.executable_path
        validate_versions(version, chromium, executable)
        require(os.access(executable, os.X_OK), 'Pinned Chromium is not executable')
        browser = p.chromium.launch(executable_path=executable, args=['--no-sandbox'])
        try:
            require(browser.version == CHROMIUM_VERSION, 'Running browser version mismatch')
            page = browser.new_page()
            page.set_content('<html lang="ar" dir="rtl"><body><button>تحليل السوق</button></body></html>')
            require(page.get_by_role('button', name='تحليل السوق').is_visible(), 'Arabic browser smoke failed')
            require(page.evaluate('getComputedStyle(document.body).direction') == 'rtl', 'RTL browser smoke failed')
        finally:
            browser.close()
    require(bool(os.environ.get('GITHUB_ENV')), 'GITHUB_ENV is required to bind every suite to the checked browser')
    with open(os.environ['GITHUB_ENV'], 'a') as output:
        output.write('CHROMIUM_PATH=' + executable + '\n')
    print(json.dumps({'playwright': version, 'chromiumRevision': CHROMIUM_REVISION,
                      'chromium': CHROMIUM_VERSION, 'executable': executable,
                      'fontPackages': packages, 'arabicFontFamily': arabic}, indent=2))


if __name__ == '__main__':
    main()
