# Existing WSL2 staging: inventory, upgrade and rollback

No installation or publication is authorized by this document. Run the inventory only until separate explicit approval. Keep credentials, certificates, databases and backups private.

## Read-only inventory

Extract the candidate into a separate directory after verifying its ZIP checksum (`sha256sum --check RELEASE.zip.sha256`). Set `INSTANCE` to the existing installed package root (the directory containing backend, local, manifest.json and .local-staging), and `CANDIDATE` to the separately extracted thn-local-staging directory. Do not point either variable at production.

```bash
python3 "$CANDIDATE/local/validate-package.py" "$CANDIDATE"
python3 "$CANDIDATE/local/inspect-instance.py" "$INSTANCE"
node "$INSTANCE/local/manage.mjs" status
```

Inventory reports installed commit/version, tool versions, disk headroom, SQLite integrity/schema fingerprint, open positions including Gold, pending orders and backup checksum counts without exposing rows or secrets. A Git checkout or unknown/modified package requires a separately reviewed migration: the helper deliberately refuses it. Supported source releases are 374bc7808c0b6cee2072a4ced70f026888548465 and 2bfd4fce59e3a27cccc526bc38eba3f71730d28b, with exact canonical source hashes. Actual local schema and matching-key backup readiness remain owner checks. Never delete a writer lock to force a transition.

## After explicit installation approval only

Pin `APPROVED_SHA` to the exact commit in the separately reviewed release manifest; do not substitute a branch name. Ensure Node >=24.5, compatible Caddy, disk headroom, a verified matching database/credential backup, and an existing canonical source release. Read the recovery limitations before acknowledging any open positions/orders.

```bash
node "$INSTANCE/local/manage.mjs" backup
node "$INSTANCE/local/manage.mjs" stop
python3 "$CANDIDATE/local/inspect-instance.py" "$INSTANCE"
python3 "$CANDIDATE/local/transition-release.py" apply "$INSTANCE" "$CANDIDATE" --expected-sha "$APPROVED_SHA" --explicitly-approved --acknowledge-open-positions
node "$INSTANCE/local/manage.mjs" start
node "$INSTANCE/local/manage.mjs" verify --restart
```

Use the existing tool PATH/Caddy configuration from the installed kit. Do not run init, reset, restore or a fresh installer against the existing instance. The source-only helper retains .local-staging, credentials, private CA, SQLite, dependencies and backups; refuses collisions/unknown source edits; journals atomic file replacements and retains previous code. Existing Gold positions remain recorded: proxy/unavailable prices cannot close them. Cancel pending orders, inspect recovery status and reduce separately priced positions if permitted. New exposure stays blocked while legacy exposure cannot be valued. Wait for a verified exact instrument source; never substitute a manual price or delete the position. A new separately funded paper account may be used independently without transferring or rewriting the old book.

Inspect the owner-authenticated recovery button, balance, position and ledger counts after restart. verify uses disposable test accounts; it does not prove real-world pricing or WSL browser trust. Stop if integrity, ownership or accounting differs. A trusted local HTTPS certificate, cross-tab signout, EN/AR layouts, refresh, cancellation and actual market hours require local browser checks.

## After explicit rollback approval only

```bash
node "$INSTANCE/local/manage.mjs" stop
python3 "$CANDIDATE/local/transition-release.py" rollback "$INSTANCE" "$CANDIDATE" --expected-sha "$APPROVED_SHA" --explicitly-approved --acknowledge-open-positions
node "$INSTANCE/local/manage.mjs" start
node "$INSTANCE/local/manage.mjs" verify --restart
```

Use the separately retained candidate helper even if apply was interrupted. It accepts only recorded old/new file mixtures and removes its own partial files. Unknown edits cause refusal. Rollback restores source and keeps current compatible SQLite data, including intervening paper fills. Database backup restore is a separate, potentially lossy action requiring explicit approval and matching keys; it is never automatic. Do not erase the transition journal or previous source until acceptance. Repeating apply with an existing backup is intentionally refused.

## Publication gate

Owner must confirm repository privacy, permissions, main SHA, branch protection, webhooks, GitHub Apps, Actions workflows, environments, deployments, and Vercel/Render integrations/exclusions for ALL branches. Private visibility alone does not prevent deployment. Read-only owner commands include `gh api repos/Thaniyan/thn-ai-trader-staging`, and the suffixes `/hooks`, `/actions/workflows`, `/environments`, `/deployments`, `/branches/main/protection`; review installed GitHub Apps and hosting dashboards separately. Do not share tokens.

Only after those checks and separate publication approval: recheck remote main still equals the baseline, verify local exact SHA and clean status, then propose `git push origin APPROVED_SHA:refs/heads/main` (replace APPROVED_SHA with the reviewed literal SHA). Never force push. No publication command has been executed.
