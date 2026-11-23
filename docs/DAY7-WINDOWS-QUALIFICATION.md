# Day 7 — minimal private Windows handoff

Current owner workflow: [Day9 single acceptance handoff](DAY9-OWNER-ACCEPTANCE.md).
The historical instructions below remain reference; do not run both workflows or
duplicate inference attempts. Day9 requires separate narrow EN/AR authorization.

Run in the existing checkout on the owner device. No installation, runtime startup,
AI_ENABLED assignment or inference is included in the read-only steps below.
Never send credentials, prompts, raw OHLC, private records or model prose in chat.

## 1. Existing reviewed identity and inventory only

Keep the exact existing model/digest and all existing limits privately configured.
Do not replace a missing value with a guess or download a model. These commands
read the existing authorized loopback inventory; they do not call generation:

```powershell
if (-not $env:THN_AI_MODEL -or $env:THN_AI_EXPECTED_DIGEST -notmatch '^[a-f0-9]{64}$') { throw 'Existing reviewed model/digest required.' }
$inventoryText = node scripts/pilot-local-ai.mjs --check --model $env:THN_AI_MODEL en
if ($LASTEXITCODE -ne 0) { throw 'Stop: existing inventory unavailable. Do not start/install anything.' }
$inventory = $inventoryText | ConvertFrom-Json
$digestMatch = $inventory.digest -eq $env:THN_AI_EXPECTED_DIGEST
[pscustomobject]@{ model=$inventory.model; installedIdentityChecked=$inventory.modelInspectionVerified; digestMatch=$digestMatch; generationTested=$inventory.generationTested }
if (-not $digestMatch) { throw 'Stop: reviewed digest mismatch.' }
```

Then use the existing private plan from Day6, without changing its limits:

```powershell
node scripts/prepare-local-ai.mjs --plan "$planPath"
if ($LASTEXITCODE -ne 0) { throw 'Stop: private plan/settings/budget not valid.' }
```

This is still NOT_VERIFIED, not model acceptance. A valid plan or reachable runtime
never establishes source quality, model quality or financial competence.

## 2. Future qualification — separate owner approval required

No inference may be initiated on the strength of Day6/Day7 software PASS. The
specific next authorization is **one English request, then one Arabic request**
using the existing exact installed model, unchanged12s and existing remaining
cumulative budgets. No automatic retry, new weights, service startup or provider
change. Preserve the prior12003ms NO_GO until an actual accepted result exists.

After that separate approval, use the already running local THN application:

1. Select the instrument/timeframe and inspect the actual current source. Open
   Evidence interpretation. Source mismatch/staleness/quality blockers must stay.
2. In optional local access, use the private token and check existing weights.
   Select the authorized local mode explicitly. Do not put the token in a question.
3. Ask one English evidence question, such as “Analyze the supporting and opposing
   evidence”. Inspect the actual cited source facts, context and uncertainty.
4. Stop if timeout, source refusal or invalid response occurs. Do not retry or
   change budgets to obtain PASS. Correct WAIT is not a software defect.
5. Only if accepted, switch to Arabic and ask “حلل الأدلة الداعمة والمعارضة”. This
   creates a current-language review, not a translated or silently reused answer.
6. Retain the source/record privately. Share only the minimal aggregate below.
   Use synthetic fixtures only if explicitly testing the model contract; label
   them SYNTHETIC and never claim actual market/Ticket qualification.

Minimal redacted fields per attempt: EN/AR, real-source versus synthetic,
requested model, reviewed-digest match, deterministic/llm-assisted, fixed failure
code, source-context matched/fresh, citation/claim counts, measured elapsed ms,
12s exceeded or not, human EN/AR review PASS/FAIL, financialExecution=false.
Do not share source rows, source timestamps, token, session ID or answer prose.

A successful pair is an initial observation, not full repeated model qualification.
Keep the original repeated-case, opposition, negative-evidence, bounded cumulative
budget and human-review gates. Missing real source/model/Ticket evidence means
NOT_VERIFIED/NO_GO for the26 November release review. No main/Production or execution.
