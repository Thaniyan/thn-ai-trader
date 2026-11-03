"""Dashboard confidence and accessible charts/readable prices are product requirements.
Uses the packaged application and offline provider fixtures from the browser runner.
"""
import itertools
import json
import os
import pathlib
from playwright.sync_api import sync_playwright, expect

out = pathlib.Path('work/design-refinement')
out.mkdir(parents=True, exist_ok=True)
results = {'source': 'Local candidate with offline market fixtures; not Production', 'profiles': [], 'errors': []}

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    page.on('pageerror', lambda e: results['errors'].append(str(e)))
    page.route('https://**/*', lambda route: route.abort())
    page.goto(os.environ['TEST_URL'])
    page.wait_for_function('window.THNEvolution && THNResearch.series() && THNDecision.brief()')
    page.evaluate('document.fonts.ready')
    page.evaluate('window.__visualChart = THNResearch.chart')

    for width, language, theme in itertools.product([1440, 768, 390], ['en', 'ar'], ['dark', 'light']):
        height = 844 if width == 390 else 1000
        page.set_viewport_size({'width': width, 'height': height})
        page.locator('.terminal-topbar [data-language=' + language + ']').click()
        page.evaluate('(theme) => document.documentElement.dataset.theme = theme', theme)
        # Keyboard focus must reveal every destination in the compact nav.
        for nav in page.locator('.nav-stack [data-view]').all():
            nav.evaluate('e => e.blur()')
            nav.focus()
            assert nav.evaluate('(e) => { const r=e.getBoundingClientRect(); return r.left>=-1 && r.right<=innerWidth+1; }'), (width, language, theme, nav.inner_text(), nav.bounding_box())

        for view in ['dashboard', 'trading']:
            page.locator('.nav-stack [data-view=' + view + ']').click()
            page.evaluate('scrollTo(0, 0)')
            page.wait_for_function('() => !document.querySelector(".view-active").getAnimations({subtree:true}).some(a => a.playState === "running" && a.effect?.getComputedTiming().endTime !== Infinity)')
            assert page.evaluate('THNResearch.chart === window.__visualChart')
            assert page.locator('#qCandles').count() == 1
            box = page.locator('#qCandles').bounding_box()
            visible = max(0, min(box['height'], height - box['y']))
            if view == 'dashboard':
                # Owner correction: confidence belongs on the opening Dashboard.
                # The chart remains directly below it and accessible by scrolling.
                confidence = page.locator('#dashboardConviction').bounding_box()
                assert confidence['y'] >= 0 and confidence['y'] + confidence['height'] <= height, (width, language, theme, confidence)
                page.locator('#qCandles').scroll_into_view_if_needed()
                expect(page.locator('#qCandles')).to_be_in_viewport(ratio=.2)
                scrolled = page.locator('#qCandles').bounding_box()
                visible_after_scroll = max(0, min(scrolled['y'] + scrolled['height'], height) - max(0, scrolled['y']))
                assert visible_after_scroll >= (200 if width == 390 else 350), (width, language, theme, view, scrolled)
                page.evaluate('scrollTo(0, 0)')
            else:
                assert visible >= (200 if width == 390 else 350), (width, language, theme, view, box)
            # The previous tablet layout broke a single observed price over two lines.
            assert page.locator('#proObservedClose').evaluate('e => { const r=document.createRange(); r.selectNodeContents(e); return r.getClientRects().length === 1; }')
            assert not page.evaluate('document.documentElement.scrollWidth > innerWidth + 1')
            expect(page.locator('#proObservedLabel')).to_be_visible()
            expect(page.locator('#qCandles')).to_be_visible()
            if view == 'dashboard':
                expect(page.locator('#evoProviderState')).to_be_visible()
                expect(page.locator('#qSymbol')).to_be_visible()
                expect(page.locator('#qInterval')).to_be_visible()
            results['profiles'].append({'width': width, 'language': language, 'theme': theme, 'view': view, 'chart': box, 'visibleChartHeight': visible})
            if (language, theme) in [('en', 'dark'), ('ar', 'light')]:
                page.screenshot(path=str(out / f'candidate-{view}-{width}-{language}-{theme}.png'), animations='disabled')

    assert not results['errors'], results['errors']
    browser.close()

(out / 'validation.json').write_text(json.dumps(results, indent=2))
print(json.dumps({'profiles': len(results['profiles']), 'errors': results['errors']}))
