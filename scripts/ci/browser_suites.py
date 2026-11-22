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

# Approved A+ acceptance is additive; all forty earlier suites stay unchanged.
PRECISION_SUITES = ['precision']

def select_precision_suites(env):
    select_suites(env)
    if env.get('THN_BROWSER_SHARD_INDEX') is None:
        return list(PRECISION_SUITES)
    index, count = int(env['THN_BROWSER_SHARD_INDEX']), int(env['THN_BROWSER_SHARD_COUNT'])
    return [suite for position, suite in enumerate(PRECISION_SUITES) if position % count == index]

# Original THN identity reconciliation extends every earlier acceptance suite.
HERITAGE_SUITES = ['heritage']

def select_heritage_suites(env):
    select_suites(env)
    if env.get('THN_BROWSER_SHARD_INDEX') is None:
        return list(HERITAGE_SUITES)
    index, count = int(env['THN_BROWSER_SHARD_INDEX']), int(env['THN_BROWSER_SHARD_COUNT'])
    return [suite for position, suite in enumerate(HERITAGE_SUITES) if position % count == index]

# Decision Center testing extends all42 verified workflows; no original selector changes.
DECISION_VALIDATION_SUITES = ['decision_validation']

def select_decision_validation_suites(env):
    select_suites(env)
    if env.get('THN_BROWSER_SHARD_INDEX') is None:
        return list(DECISION_VALIDATION_SUITES)
    index, count = int(env['THN_BROWSER_SHARD_INDEX']), int(env['THN_BROWSER_SHARD_COUNT'])
    return [suite for position, suite in enumerate(DECISION_VALIDATION_SUITES) if position % count == index]

# Phase2 assistant lifecycle acceptance is additive to every original suite.
PHASE2_SUITES = ['phase2_interpretation']

def select_phase2_suites(env):
    select_suites(env)
    if env.get('THN_BROWSER_SHARD_INDEX') is None:
        return list(PHASE2_SUITES)
    index, count = int(env['THN_BROWSER_SHARD_INDEX']), int(env['THN_BROWSER_SHARD_COUNT'])
    return [suite for position, suite in enumerate(PHASE2_SUITES) if position % count == index]

# Day5 extends the existing gate; every earlier roster/assertion remains unchanged.
DAY5_SUITES = ['day5']

def select_day5_suites(env):
    select_suites(env)
    if env.get('THN_BROWSER_SHARD_INDEX') is None:
        return list(DAY5_SUITES)
    index, count = int(env['THN_BROWSER_SHARD_INDEX']), int(env['THN_BROWSER_SHARD_COUNT'])
    return [suite for position, suite in enumerate(DAY5_SUITES) if position % count == index]

# Focused Day6 acceptance extends all45 original suites. Offset balances its
# matrix onto the second existing worker; no original suite is moved or skipped.
DAY6_SUITES = ['day6']

def select_day6_suites(env):
    select_suites(env)
    if env.get('THN_BROWSER_SHARD_INDEX') is None:
        return list(DAY6_SUITES)
    index, count = int(env['THN_BROWSER_SHARD_INDEX']), int(env['THN_BROWSER_SHARD_COUNT'])
    return [suite for position, suite in enumerate(DAY6_SUITES) if (position + 1) % count == index]

# Operational diagnostics extend all46 original suites; no earlier roster moves.
READINESS_SUITES = ['readiness']
def select_readiness_suites(env):
    select_suites(env)
    if env.get('THN_BROWSER_SHARD_INDEX') is None:
        return list(READINESS_SUITES)
    index, count = int(env['THN_BROWSER_SHARD_INDEX']), int(env['THN_BROWSER_SHARD_COUNT'])
    return [suite for position,suite in enumerate(READINESS_SUITES) if (position+1)%count==index]

# Aggregate provider-quality UI coverage extends every existing suite.
PROVIDER_QUALITY_SUITES = ['provider_quality']
def select_provider_quality_suites(env):
    select_suites(env)
    if env.get('THN_BROWSER_SHARD_INDEX') is None:
        return list(PROVIDER_QUALITY_SUITES)
    index,count=int(env['THN_BROWSER_SHARD_INDEX']),int(env['THN_BROWSER_SHARD_COUNT'])
    return [suite for position,suite in enumerate(PROVIDER_QUALITY_SUITES) if (position+1)%count==index]

# Day7 actual UI/API/worker protocol fixture; all48 prior suites retained.
DAY7_RESEARCH_SUITES=['day7_research']
def select_day7_research_suites(env):
    select_suites(env)
    if env.get('THN_BROWSER_SHARD_INDEX') is None:return list(DAY7_RESEARCH_SUITES)
    index,count=int(env['THN_BROWSER_SHARD_INDEX']),int(env['THN_BROWSER_SHARD_COUNT'])
    return [suite for position,suite in enumerate(DAY7_RESEARCH_SUITES) if (position+1)%count==index]
