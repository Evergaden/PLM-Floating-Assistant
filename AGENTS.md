# PLM Beta Agent Guide

## Project

- This repository contains a browser userscript and its optional Cloudflare backend.
- The userscript is plain JavaScript for Tampermonkey/Violentmonkey. It injects the PLM floating assistant into the logged-in PLM page.
- The backend is a Cloudflare Worker using D1 for cloud backup, pack recommendations, insight data, and optional AI/Feishu integrations.

## Directory Map

- `outputs/plm-material-summary.user.js`: primary userscript and main UI/business logic.
- `cloudflare/plm-cloud-backup/src/index.js`: Worker entry point.
- `cloudflare/plm-cloud-backup/schema.sql`: D1 schema.
- `cloudflare/plm-cloud-backup/wrangler.toml`: Worker and D1 binding configuration.
- `cloudflare/plm-cloud-backup/package.json`: Worker scripts and Wrangler dependency.
- `outputs/excel-test/`: local Excel-generation test artifact and helper.
- `tmp/`, `tmp_plm_js/`, and `work/`: local investigation or generated material; do not treat as production source.

## Working Rules

- Check `git status --short` before editing. Do not discard unrelated user changes.
- Keep userscript changes scoped to `outputs/plm-material-summary.user.js` unless the task requires Worker behavior or schema changes.
- Preserve existing GM/local storage keys, backup payload compatibility, and cached SKU data fields. Add backward-compatible defaults when extending data.
- When changing the userscript, update both `SCRIPT_VERSION` and the metadata `@version` together.
- Follow the existing light-glass UI language and responsive panel constraints. Keep current user-dragged layout and settings intact.
- Use `apply_patch` for manual edits. Prefer ASCII in code; Chinese UI/document text is acceptable where needed.
- Treat PLM DOM selectors, upload flow, and drawer automation as fragile integrations. Do not broadly refactor them without browser verification.
- Keep API keys, Worker secrets, local credential files, and `.dev.vars` out of source control and out of the userscript.
- Do not run destructive Git commands such as `git reset --hard` or overwrite user data/cache files.

## Commands

From repository root:

```powershell
node --check outputs/plm-material-summary.user.js
git diff --check
```

Worker commands:

```powershell
cd cloudflare\plm-cloud-backup
npm.cmd install
npm run dev
npm run deploy
npm run db:migrate:local
npm run db:migrate:remote
node --check src\index.js
```

- No repository-wide automated test, build, or type-check script is currently configured.
- Use the local Wrangler dependency through `npm run` or `npx.cmd wrangler`; do not assume global `wrangler` is installed.

## Verification Before Completion

- Run syntax validation and `git diff --check` for every userscript or Worker code change.
- Run focused checks for changed parsing, formatting, storage, or API behavior.
- For PLM UI/automation changes, verify the affected interaction in a logged-in browser when available.
- For Worker deployment changes, verify `/health` and any changed authenticated endpoint after deployment.
- Review the final diff, then commit the completed change with a focused message.
