# Genuine local AI research — operator setup and limits

The recommendation workspace works without an LLM, using explicitly labeled research rules and the existing numerical engines. It does not call those rules AI-generated output. Genuine explanations require a successful, matching, cited response from the existing authenticated provider adapter.

No model is installed or running in the current development environment. No weights were downloaded, no model was activated, and no inference-quality claim is made by this release.

## Install and inspect on your local workstation

1. Install Ollama through its official installer on the workstation that will run THN. Start its local service on the existing supported `http://127.0.0.1:11434` endpoint. The application does not contact arbitrary remote endpoints or your personal computer's localhost from Vercel.
2. Choose and install a non-cloud completion model with structured JSON output support. Existing guards accept verified local weights between 1 MiB and 2 GiB and a 2048–8192-token context. Installation is not evidence of financial quality or successful THN generation. No particular model is represented here as validated.
3. Inspect its actual tag with `ollama list`. Then run the read-only check, substituting your installed tag:

```sh
node scripts/check-local-ai.mjs --model your-installed-model-tag
```

The helper reuses the existing backend model inspection, verifies local metadata/digest/size and rejects cloud/incompatible models. It does not install, download, generate, activate a provider or change application configuration. A failed check exits nonzero. A successful check still reports `generationTested: false`.

## Explicit, authenticated local configuration

Supply an actual installed `THN_AI_MODEL`, `THN_AI_PROVIDER=ollama`, `THN_AI_ENABLED=1` and a strong private `THN_AI_AUTH_TOKEN` through your local environment. Never put tokens in Git, browser storage, screenshots or chat. Keep `THN_LOCAL_PAPER=0` for research-only use. The adapter also requires all three explicit bounded budgets:

- `THN_AI_MAX_REQUESTS`: 1–20 requests per process.
- `THN_AI_MAX_OUTPUT_TOKENS`: 32–800 per response.
- `THN_AI_TOTAL_TOKEN_CEILING`: 1–50000 reserved tokens per process.

`THN_AI_CONTEXT_TOKENS` defaults to 4096 within the existing context limits; `THN_AI_TIMEOUT_MS` is bounded at 12 seconds. These are local process limits, not a durable hosted quota or spend budget. Do not set hosted flags such as `VERCEL` when intentionally running the local-only pilot. Use the regular local start command and inspect the application's service/mode labels.

In Settings, choose **Inspect model availability** to open the existing local pilot in AI Research. For an authorized local session, provide the local access token in the existing memory-only password field, check the runtime and explicitly select the model mode. Request a research review. Model generation is never silently enabled by selecting a market, changing language/theme, opening an old report or navigating.

## What counts as genuine model output

A configured provider or installed model is not a successful generation. The recommendation workspace uses the actual returned provider/model only when the existing server accepts the response, model calls occurred, citations match the frozen evidence, language/context/hash match, and the result is fresh and not imported, rejected or downgraded. Otherwise it retains explicit rule-based evidence and a truthful fallback label.

The model interprets supplied observations. Authoritative prices, indicator values, position sizing and historical results remain owned by the existing engines. It cannot create orders, invent numerical levels or probabilities, override context/risk blockers, or turn an unverified quote into entry authority. Historical strategy tests do not validate a current trade entry.

Hosted generation remains disabled by the existing security architecture. Providing public hosted inference would require separately reviewed authentication, privacy and durable budget coordination; this UI overhaul does not weaken that boundary or create infrastructure.
