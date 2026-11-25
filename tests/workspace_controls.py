"""Exercise native progressive-disclosure controls through their visible summaries.
No application state, record, analysis or test assertion is changed.
"""
def control(page, selector):
    page.wait_for_function("window.THNEvolution",timeout=30000)
    target=page.locator(selector)
    # Current workspace disclosures; legacy tests still explicitly exercise their own controls.
    ids=target.first.evaluate('''e=>{const ids=[];for(let p=e.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS'&&['workspaceMore','commandAdvancedChart','precisionSchoolContext','dashboardSourceDetails','commandRationale','studioValidationAudit','studioNumericalAudit','proChartTools','proTVRecovery','evoEvaluation','evoExperiments','evoBriefDetails','evoProviderDetails','evoRiskConditions','evoOutcomes','evoDanger','l65Recovery','researchSchools','researchScenarios','researchEvidence','researchConclusion','workspaceTechnicalDetails','workspaceRecommendationDetails'].includes(p.id)&&!p.open)ids.unshift(p.id);const row=e.closest('#dashboardEvidence>div'),summary=document.getElementById('dashboardDataStatus');if(row&&summary?.getAttribute('aria-controls')?.split(' ').includes(row.id)&&!summary.parentElement.open)ids.unshift(summary.parentElement.id);return ids;}''')
    for ident in ids:
        page.locator('#'+ident+' > summary').click()
        page.wait_for_function('(id)=>document.getElementById(id).open',arg=ident)
    return target
