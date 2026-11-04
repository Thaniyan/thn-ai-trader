"""Real favorite/context and calculator journeys; offline provider data only."""
import itertools
import json
import os
import pathlib
from playwright.sync_api import sync_playwright, expect

out = pathlib.Path('work/workflow-polish')
out.mkdir(parents=True, exist_ok=True)
results = {'checks': [], 'profiles': [], 'errors': [], 'data': 'Offline fixtures, not live market or broker evidence'}
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    page.route('https://**/*', lambda r: r.abort())
    page.on('pageerror', lambda e: results['errors'].append(str(e)))
    page.goto(os.environ['TEST_URL'])
    page.wait_for_selector('#flowRiskBudget', state='attached')
    page.wait_for_function('THNDecision.brief() && THNResearch.series()')
    def go(view):
        page.locator('.nav-stack [data-view=' + view + ']').click()
        expect(page.locator('#view-' + view)).to_be_visible()

    go('markets')
    for symbol in ['GBPUSD', 'USDJPY']:
        page.locator('#r66Search').fill(symbol)
        page.locator('[data-pro-star=' + symbol + ']').click()
    go('dashboard')
    expect(page.locator('#flowWatchlist [data-symbol]')).to_have_count(2)
    page.evaluate('window.__polishChart = THNResearch.chart')
    page.locator('#flowWatchlist [data-symbol=GBPUSD]').click()
    page.wait_for_function('THNResearch.series()?.symbol === "GBPUSD" && THNDecision.brief()?.symbol === "GBPUSD"')
    assert page.evaluate('THNResearch.chart === window.__polishChart')
    assert page.locator('#qCandles').count() == 1
    expect(page.locator('#flowWatchlist [data-symbol=GBPUSD]')).to_have_attribute('aria-pressed', 'true')
    go('trading')
    expect(page.locator('#view-trading #flowWatchlist')).to_be_visible()
    page.reload()
    page.wait_for_selector('#flowWatchlist [data-symbol=USDJPY]')
    page.locator('#flowWatchlist [data-symbol=USDJPY]').click()
    page.wait_for_function('THNResearch.series()?.symbol === "USDJPY"')
    go('markets')
    page.locator('#r66Search').fill('GBPUSD')
    page.locator('[data-pro-star=GBPUSD]').click()
    go('dashboard')
    expect(page.locator('#flowWatchlist [data-symbol=GBPUSD]')).to_have_count(0)
    expect(page.locator('#flowWatchlist [data-symbol=USDJPY]')).to_have_count(1)
    results['checks'].append('UI favorites persist/reload/remove; shared chart identity and context preserved in Dashboard and Terminal')

    page.locator('#qSymbol').fill('EURUSD')
    page.locator('#qSymbol').press('Tab')
    page.wait_for_function('THNResearch.series()?.symbol === "EURUSD"')
    go('risk')
    assert page.locator('#workRiskForm fieldset').count() == 3
    assert page.locator('#flowRiskBudget').bounding_box()['y'] < page.locator('#evoRisk').bounding_box()['y']
    for ident, value in {'planCapital':'10000', 'planRisk':'1', 'planEntry':'1.1', 'planStop':'1.09', 'planTarget':'1.12', 'planLeverage':'100', 'qRisk_spread':'0', 'qRisk_slippage':'0', 'qRisk_commission':'0'}.items():
        page.locator('#' + ident).fill(value)
    page.locator('#planSide').select_option('BUY')
    page.locator('#workRiskForm button[type=submit]').click()
    page.wait_for_function('THNDecision.plan()?.budget === 100')
    assert page.evaluate('THNDecision.plan().plannedStopLossWithCosts') == 100
    assert page.evaluate('THNDecision.plan().executionAuthorized') is False
    save = page.locator('#evoRisk [data-evo=save-plan]')
    expect(save).to_be_enabled()
    expect(save).to_have_attribute('aria-describedby', 'evoPlanSaveReadiness')
    expect(page.locator('#evoPlanSaveReadiness')).to_contain_text('Saved in this browser only')
    page.locator('#evoPlanSaveReadiness').scroll_into_view_if_needed()
    page.screenshot(path=str(out / 'matched-plan-save-readiness.png'), animations='disabled')
    # Plan validation alone must not promise that matching research can be saved.
    page.route('**/api/research/brief?**', lambda r:r.fulfill(status=503,json={'ok':False,'code':'MARKET_DATA_UNAVAILABLE'}))
    page.evaluate('THNDecision.reload()')
    page.wait_for_function('THNDecision.brief()===null && THNDecision.failure()')
    assert page.evaluate('THNDecision.plan().budget') == 100
    expect(save).to_be_disabled()
    expect(page.locator('#evoPlanSaveReadiness')).to_contain_text('Matching research is unavailable')
    page.screenshot(path=str(out / 'missing-research-save-readiness.png'), animations='disabled')
    assert page.evaluate('THNLibrary.records().length') == 0
    page.locator('.terminal-topbar [data-language=ar]').click()
    expect(page.locator('#evoPlanSaveReadiness')).to_contain_text('البحث المطابق غير متاح')
    page.locator('.terminal-topbar [data-language=en]').click()
    page.unroute('**/api/research/brief?**')
    page.evaluate('THNDecision.reload()')
    page.wait_for_function('THNDecision.brief() && THNDecision.brief().selected.provenance.hash===THNContext.get().datasetId')
    expect(save).to_be_enabled()
    save.click()
    page.wait_for_function('THNLibrary.records().length===1')
    record=page.evaluate('THNLibrary.records()[0]')
    assert record['plan']['context']['datasetHash']==record['brief']['selected']['provenance']['hash']
    assert record['plan']['executionAuthorized'] is False
    assert page.evaluate('getJournal().length') == 0
    go('risk')
    page.locator('#planStop').fill('1.095')
    assert page.evaluate('THNDecision.plan()') is None
    expect(save).to_be_disabled()
    expect(page.locator('#evoPlanSaveReadiness')).to_contain_text('Validate your hypothetical plan above')
    results['checks'].append('Grouped original inputs produce authoritative USD100 hypothetical risk; editing invalidates the plan; execution stays unauthorized')

    page.add_script_tag(path=os.environ['AXE_PATH'])
    for width, language, theme in itertools.product([1440, 768, 390, 240, 160], ['en', 'ar'], ['dark', 'light']):
        page.set_viewport_size({'width': width, 'height': 1000})
        page.locator('.terminal-topbar [data-language=' + language + ']').click()
        page.evaluate('(t) => document.documentElement.dataset.theme = t', theme)
        for view in ['dashboard', 'markets', 'risk']:
            go(view)
            assert not page.evaluate('document.documentElement.scrollWidth > innerWidth + 1'), (width, language, theme, view)
            if view == 'risk':
                for group in page.locator('.flow-risk-group').all():
                    assert group.evaluate('e => e.scrollWidth <= e.clientWidth + 1'), (width, language, theme, group.get_attribute('id'))
            if view == 'dashboard':
                button = page.locator('#flowWatchlist [data-symbol=USDJPY]')
                button.focus()
                assert button.evaluate('e => { const r=e.getBoundingClientRect(); return r.left>=-1 && r.right<=innerWidth+1; }')
            if width in [1440, 390]:
                violations = page.evaluate('async () => (await axe.run(document.querySelector(".view-active"), {runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21aa"]}})).violations.map(v => ({id:v.id,nodes:v.nodes.map(n=>n.target)}))')
                assert not violations, (width, language, theme, view, violations)
                if (language, theme) in [('en', 'dark'), ('ar', 'light')]:
                    page.evaluate('scrollTo(0,0)')
                    page.screenshot(path=str(out / f'candidate-{view}-{width}-{language}-{theme}.png'), animations='disabled')
            results['profiles'].append([width, language, theme, view])
    assert not results['errors'], results['errors']
    browser.close()
(out / 'results.json').write_text(json.dumps(results, indent=2))
print(json.dumps({'checks': results['checks'], 'profiles': len(results['profiles']), 'errors': results['errors']}))
