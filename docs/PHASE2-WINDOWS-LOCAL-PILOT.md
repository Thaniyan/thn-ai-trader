# Phase 2.3 — Windows local pilot readiness and first genuine Qwen3 response

This is a **user-operated, opt-in local evaluation** for an existing THN AI Trader clone checked out at `feature/ai-evidence-interpreter-phase2-20261116`. It is NOT a guide to switch Production AI on. Do not use the public Vercel Preview for access-token entry or run trading services. No installation is performed by the readiness command.

## Why the test is not yet completed

In the isolated assistant execution container on 2026-11-17, `ollama` was absent, its loopback API was unreachable, the container could not resolve `ollama.com`, and available Node was 22.16 rather than the repo's Node >=24.5 requirement. The separate Windows device has **not** been inspected. A downloaded model, installed Ollama and a real accepted response are not claimed.

## Step 1 — Read-only Windows prerequisites (PowerShell)

In a local terminal, NOT in Production, run:

```powershell
Get-Command ollama -ErrorAction SilentlyContinue
Get-Command node -ErrorAction SilentlyContinue
node --version
ollama list
```

`node --version` needs v24.5.0 or newer for this project. `ollama list` should identify **actual installed weights**; a model name advertised online is not proof of installation. If a command is missing, stop and first choose an operator-approved installation path. Official references: https://ollama.com/download and https://nodejs.org/en/download . Never paste secrets or private model outputs into GitHub issues or chat.

## Step 2 — Optional operator-only setup

Only **on a computer its owner authorizes**, install the official Ollama Windows app and a supported non-cloud model. Candidate `qwen3:1.7b` has nominal artifact size approximately 1.4GB and is within the existing 2GiB model-file guard, but its actual disk/RAM use and correctness must be measured. The separate installation/download requires the device owner's approval, network access and adequate storage.

A human operator may choose to execute `ollama pull qwen3:1.7b` in PowerShell **after** those checks. THN will never download a model automatically. Use `ollama list` to confirm exact tag.

## Step 3 — Check installed metadata, no inference

From the **existing project repository directory**, with its Phase 2 development branch checked out, run:

```powershell
node scripts/pilot-local-ai.mjs --check --model qwen3:1.7b en
```

Expected result if compatible: `mode: "read-only"`, exact model tag, SHA-256 digest, size, and `generationTested: false`. A failed check must not be described as success. No paid provider, hosted service or generation is used by this command.

## Step 4 — Explicit local-only generation

For a separately authorized local inference attempt, provide environment variables **only in the temporary PowerShell session**. Use a private randomly generated token and **do not publish or echo it**. These settings enable research-only inference on local `127.0.0.1:11434`, not Vercel:

```powershell
$env:THN_AI_PROVIDER = "ollama"
$env:THN_AI_MODEL = "qwen3:1.7b"
$env:THN_AI_ENABLED = "1"
$env:THN_AI_AUTH_TOKEN = [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
$env:THN_AI_MAX_REQUESTS = "2"
$env:THN_AI_MAX_OUTPUT_TOKENS = "500"
$env:THN_AI_TOTAL_TOKEN_CEILING = "12000"
$env:THN_AI_CONTEXT_TOKENS = "8192"
$env:THN_LOCAL_PAPER = "0"
node scripts/pilot-local-ai.mjs --run --model qwen3:1.7b en
node scripts/pilot-local-ai.mjs --run --model qwen3:1.7b ar
```

Do NOT use this on a public Preview, or add any `THN_AI_*` token to Vercel. The script uses exclusively synthetic frozen observations, the existing strict THN generation validator and bounded local Ollama model adapter. One run can fail because a small model cannot produce the strict schema within 12 seconds, or because token/context limits are insufficient. Report a rejection honestly and do not loosen guards to make the output pass.

Windows PowerShell 5.1 does not include `[Convert]::ToHexString`; if needed, use Windows PowerShell 7 or generate the token without displaying it using `[BitConverter]::ToString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).Replace('-', '')`.

## Step 5 — Evidence and interpretation limits

Collect only redacted output: local digest, acceptance/fallback status, citation/claim counts, latency if accepted, EN/AR quality observations and actual failure reason category. Do not share any access token, raw model response or private input.

The current pilot CLI **does not yet produce a complete human-rated quality report or proven statistical calibration**. It accepts only exact source-matched claims, rejects numerical predictions/guarantees, and cannot modify trading decisions or order permissions. Record real-model accuracy and operational reliability separately from offline simulated CI outcomes.

If the model is unavailable, installation is disallowed, or the owner cannot use the machine, stop. We can continue development and CI without inventing real inference results.

Release: PR #23 remains draft and unmerged. No Production deployment, paid account, hosted model activation, paper/live trading or broker orders without explicit separate approval.
