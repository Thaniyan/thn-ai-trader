import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';

test('browser preflight rejects package, browser, image-path and font drift',()=>{
  const result=execFileSync('python3',['-c',`
import importlib.util
spec=importlib.util.spec_from_file_location('environment','scripts/ci/check-browser-environment.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
path='/ms-playwright/chromium-1234/chrome-linux64/chrome'
browser={'revision':'1234','browserVersion':'151.0.7922.34'}
m.validate_versions('1.62.0',browser,path)
cases=[('1.61.0',browser,path),('1.62.0',{**browser,'revision':'1233'},path),('1.62.0',{**browser,'browserVersion':'150.0'},path),('1.62.0',browser,'/usr/bin/chromium')]
for args in cases:
 try:m.validate_versions(*args)
 except RuntimeError:pass
 else:raise AssertionError('Accepted incompatible browser environment')
packages={name:'install ok installed' for name in m.FONT_PACKAGES}
m.validate_fonts(packages,'FreeSans')
for name in m.FONT_PACKAGES:
 try:m.validate_fonts({**packages,name:'unknown ok not-installed'},'FreeSans')
 except RuntimeError:pass
 else:raise AssertionError('Accepted missing font '+name)
try:m.validate_fonts(packages,'   ')
except RuntimeError:pass
else:raise AssertionError('Accepted missing Arabic glyph coverage')
for weight,postscript in [(400,'DejaVuSans'),(700,'DejaVuSans-Bold')]:
 font={'familyName':'DejaVu Sans','postScriptName':postscript,'glyphCount':11,'isCustomFont':False}
 m.validate_dejavu_rendering([font],weight)
 for fonts in [[],[{**font,'familyName':'Liberation Sans'}],[{**font,'postScriptName':'LiberationSans-Bold'}],[{**font,'isCustomFont':True}],[{**font,'glyphCount':0}]]:
  try:m.validate_dejavu_rendering(fonts,weight)
  except RuntimeError:pass
  else:raise AssertionError('Accepted substituted or absent DejaVu font')
print('PASS: browser drift, every missing upstream font, missing Arabic coverage')
`],{encoding:'utf8'});
  assert.match(result,/PASS:/);
});

test('CI uses immutable matching browser image and retains fail-closed full regression gate',()=>{
  const workflow=fs.readFileSync('.github/workflows/ci.yml','utf8');
  const browser=workflow.split('  browser_shards:')[1].split('  browser:')[0];
  assert.match(browser,/mcr\.microsoft\.com\/playwright\/python:v1\.62\.0-noble@sha256:aa81288e738725378becba5b3e06cb0f3a7f012a610e87e8d767a090ea3f740d/);
  assert.doesNotMatch(browser,/playwright install|apt-get|continue-on-error/);
  assert.match(browser,/--require-hashes --only-binary=:all:/);
  assert.ok(browser.indexOf('install-test-fonts.py')<browser.indexOf('check-browser-environment.py'));
  assert.doesNotMatch(browser,/--base-config/);
  assert.ok(browser.indexOf('check-browser-environment.py')<browser.indexOf('run: npm run test:browser'));
  assert.match(browser,/shard: \[0, 1\]/);
  assert.match(browser,/THN_BROWSER_SHARD_COUNT: 2/);
  assert.match(workflow,/test "\$SHARD_RESULT" = success/);
});

test('font installer verifies bytes before writing and preserves the base font configuration',()=>{
  const result=execFileSync('python3',['-c',`
import importlib.util,io,tarfile,hashlib,tempfile,pathlib,xml.etree.ElementTree as ET
spec=importlib.util.spec_from_file_location('installer','scripts/ci/install-test-fonts.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
archive=io.BytesIO()
with tarfile.open(fileobj=archive,mode='w:bz2') as output:
 for name in list(m.REQUIRED)+['LICENSE','../../escape.ttf']:
  path=m.PREFIX+('/LICENSE' if name=='LICENSE' else '/ttf/'+name)
  content=b'inert unit fixture, not an actual font';info=tarfile.TarInfo(path);info.size=len(content);output.addfile(info,io.BytesIO(content))
data=archive.getvalue()
with tempfile.TemporaryDirectory() as folder:
 root=pathlib.Path(folder)/'fonts & cache';base=pathlib.Path(folder)/'base.conf';base.write_text('<fontconfig/>')
 try:m.install(data,root,base)
 except RuntimeError as error:assert 'checksum' in str(error)
 else:raise AssertionError('Unverified archive accepted')
 assert not root.exists()
 m.ARCHIVE_SHA256=hashlib.sha256(data).hexdigest() # Unit-only archive; runtime has no checksum override.
 manifest=m.install(data,root,base)
 assert set(manifest['fonts'])==m.REQUIRED
 assert (root/'LICENSE').read_bytes()==b'inert unit fixture, not an actual font'
 config=ET.parse(root/'fonts.conf').getroot()
 assert config.find('include').text==str(base.resolve())
 assert config.find('dir').text==str(root/'fonts')
 assert not config.findall('match') and not config.findall('alias')
 assert not (pathlib.Path(folder)/'escape.ttf').exists()
print('PASS: checksum blocks writes; full base configuration retained; no path traversal or alias replacement')
`],{encoding:'utf8'});
  assert.match(result,/PASS:/);
});
