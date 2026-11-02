"""THN identity stays coherent and readable across the complete application.
Screenshots use offline provider fixtures and do not establish live capabilities.
"""
import itertools
import json
import os
import pathlib
from playwright.sync_api import sync_playwright, expect

out = pathlib.Path('work/visual-identity')
out.mkdir(parents=True, exist_ok=True)
results = {'profiles': [], 'accessibility': [], 'errors': [], 'data': 'Local packaged application; offline provider fixtures'}
views = ['dashboard', 'markets', 'trading', 'ai', 'risk', 'portfolio', 'journal', 'brokers', 'settings']
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    page.route('https://**/*', lambda r: r.abort())
    page.on('pageerror', lambda e: results['errors'].append(str(e)))
    page.goto(os.environ['TEST_URL'])
    page.wait_for_selector('.identity-workspace-label', state='attached')
    page.wait_for_function('window.THNEvolution && THNDecision.brief()')
    page.add_script_tag(path=os.environ['AXE_PATH'])
    for width, language, theme in itertools.product([1440, 768, 390, 240, 160], ['en', 'ar'], ['dark', 'light']):
        page.set_viewport_size({'width': width, 'height': 1000})
        page.locator('.terminal-topbar [data-language=' + language + ']').click()
        page.evaluate('(t) => document.documentElement.dataset.theme = t', theme)
        expect(page.locator('#themeBtn svg')).to_have_count(1)
        assert page.locator('#themeBtn').get_attribute('aria-label')
        for view in views:
            page.locator('.nav-stack [data-view=' + view + ']').click()
            assert not page.evaluate('document.documentElement.scrollWidth > innerWidth + 1'), (width, language, theme, view)
            visible_marks = page.locator('.brand-text strong, .terminal-topbar .wordmark').evaluate_all('es => es.filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== "hidden").map(e => e.textContent.replace(/\\s+/g," ").trim())')
            assert visible_marks == ['THN AI TRADER'], (width, language, theme, view, visible_marks)
            if width == 1440:
                expect(page.locator('#proRouteTitle')).to_be_visible()
            if width in [1440, 390]:
                violations = page.evaluate('async () => (await axe.run([...document.querySelectorAll(".sidebar,.terminal-topbar,.view-active")], {runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))')
                results['accessibility'].append([width, language, theme, view, violations])
                assert not violations, results['accessibility'][-1]
                if (language, theme) in [('en', 'dark'), ('ar', 'light')]:
                    page.evaluate('scrollTo({top:0,behavior:"instant"})')
                    page.screenshot(path=str(out / f'candidate-{view}-{width}-{language}-{theme}.png'), animations='disabled')
            results['profiles'].append([width, language, theme, view])
        if width == 1440:
            footer = page.locator('.sidebar .side-card')
            footer.scroll_into_view_if_needed()
            violations = page.evaluate('async () => (await axe.run(document.querySelector(".sidebar .side-card"), {runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))')
            results['accessibility'].append([width, language, theme, 'navigation-footer', violations])
            assert not violations, results['accessibility'][-1]
            page.locator('.sidebar').evaluate('e => e.scrollTop = 0')
    assert not results['errors'], results['errors']
    browser.close()
(out / 'results.json').write_text(json.dumps(results, indent=2))
print(json.dumps({'profiles': len(results['profiles']), 'accessibilityScans': len(results['accessibility']), 'errors': results['errors']}))
