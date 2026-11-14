"""One authoritative browser roster; optional CI shards cover it exactly once."""
SUITES = ['workstation','research','research_outage','quality','decision','library_reliability','maturity','terminal','intelligence','intelligence_memory','layout','pilot','trust','professional','journal_lifecycle','trading_remediation','evolution','consolidation','experience','consistency','recovery','assisted_desk','paper_review','evidence_workflow','broker_workspace','visual_refinement','workflow_polish','visual_identity','confidence','dashboard_confidence','research_risk','workspace_hierarchy','unified_workspace','research_studio','responsive_fonts','command_center','command_workbench','institutional_desk']

def select_suites(env):
    index, count = env.get('THN_BROWSER_SHARD_INDEX'), env.get('THN_BROWSER_SHARD_COUNT')
    if index is None and count is None:
        return list(SUITES)
    if index is None or count is None:
        raise ValueError('Both browser shard index and count are required')
    if not str(index).isdigit() or not str(count).isdigit():
        raise ValueError('Browser shard configuration must contain nonnegative integers')
    index, count = int(index), int(count)
    if not 1 <= count <= len(SUITES) or not 0 <= index < count:
        raise ValueError('Browser shard configuration is out of range')
    return [suite for position, suite in enumerate(SUITES) if position % count == index]


# Additional product acceptance suites extend the gate without changing the
# canonical roster or any original sharding assertions.
TRUST_SUITES = ['command_trust','command_trust_candidate']

def select_trust_suites(env):
    select_suites(env)  # Preserve the same strict shard-configuration validation.
    if env.get('THN_BROWSER_SHARD_INDEX') is None:
        return list(TRUST_SUITES)
    index, count = int(env['THN_BROWSER_SHARD_INDEX']), int(env['THN_BROWSER_SHARD_COUNT'])
    return [suite for position, suite in enumerate(TRUST_SUITES) if position % count == index]
