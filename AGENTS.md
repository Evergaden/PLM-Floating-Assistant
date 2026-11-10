# PLM Beta Agent Guide

## Project

- This repository contains a browser userscript and its optional Cloudflare backend.
- The userscript is plain JavaScript for Tampermonkey/Violentmonkey. It injects the PLM floating assistant into the logged-in PLM page.
- The backend is a Cloudflare Worker using D1 for cloud backup, pack recommendations, insight data, and optional AI integrations.

## Directory Map

- `src/*.module.js`: the userscript source of truth. Feature modules (`src/*.module.js`) plus core domains (`src/core-*.module.js`) and product-development parts (`src/product-development/pd-*.module.js`), spliced in order by the build into the artifact.
- `outputs/plm-material-summary.user.js`: build artifact and its skeleton (metadata header, panel constants, release-synced CSS literals, module markers). Generated — do not hand-edit module regions.
- `scripts/build-userscript.js`: splices `src/` modules into the artifact between `// <name-module>` markers (supports `files: []` for multi-file modules).
- `scripts/build-userscript-release.js`: builds the installable `.min` / `.workspace-preview` variants; syncs the six CSS literals from `ui-src/modules/` and rebuilds the minified outputs.
- `scripts/check-*.cjs`, `scripts/test-*.cjs`: focused regression checks (28 scripts, string-slice + node:vm based).
- `scripts/run-checks.cjs` and `scripts/check-build-sync.cjs`: one-shot suite runner and the src↔outputs drift guard.
- `package.json` (root): `npm run check` / `build` / `sync` entry points.
- `docs/refactor-log.md`: refactor baseline and decisions.
- `cloudflare/plm-cloud-backup/src/index.js`: Worker entry point.
- `cloudflare/plm-cloud-backup/schema.sql`: D1 schema.
- `cloudflare/plm-cloud-backup/wrangler.toml`: Worker and D1 binding configuration.
- `cloudflare/plm-cloud-backup/package.json`: Worker scripts and Wrangler dependency.
- `outputs/excel-test/`: local Excel-generation test artifact and helper.
- `tmp/`, `tmp_plm_js/`, and `work/`: local investigation or generated material; do not treat as production source.

## Working Rules

- Check `git status --short` before editing. Do not discard unrelated user changes.
- Edit userscript logic in `src/*.module.js`, then run `node scripts/build-userscript.js` (or `npm run build`) to regenerate the artifact, and rebuild the installable variants with `node scripts/build-userscript-release.js` (+ `--workspace-preview`). Never edit module regions inside `outputs/` directly — the next build overwrites them; only the skeleton (metadata header, panel constants, CSS literals) lives there.
- `scripts/check-build-sync.cjs` must stay green: if it fails, one side of src/outputs was edited without the other. Run the build and review the diff; lost outputs-only edits cannot be recovered from src.
- Preserve existing GM/local storage keys, backup payload compatibility, and cached SKU data fields. Add backward-compatible defaults when extending data.
- When changing the userscript, update both `SCRIPT_VERSION` and the metadata `@version` together.
- Follow the existing light-glass UI language and responsive panel constraints. Keep current user-dragged layout and settings intact.
- For the 今日工作台 tabs, preserve the existing `.pfh-ledger-tabs` and `.pfh-ledger-tab-indicator` DOM nodes during tab changes; refresh only the content below the tabs. Keep the indicator motion on `left`/`width` with `cubic-bezier(.25,1.2,.35,1)`, and do not restore full `renderShell()` tab redraws, transform-based tab animations, or the legacy `.is-tab-transition` class.
- Use `apply_patch` for manual edits. Prefer ASCII in code; Chinese UI/document text is acceptable where needed.
- Treat PLM DOM selectors, upload flow, and drawer automation as fragile integrations. Do not broadly refactor them without browser verification.
- Do not run browser verification for userscript changes. The user must manually update the installed userscript first and will perform the browser checks; report that verification as pending instead.
- Keep API keys, Worker secrets, local credential files, and `.dev.vars` out of source control and out of the userscript.
- Do not run destructive Git commands such as `git reset --hard` or overwrite user data/cache files.
- Treat `cloudflare/plm-cloud-backup/ui-src/` as the only editable source for hosted UI CSS. Never edit versioned `static/assets/v15/ui-*.css` files directly.
- New canonical UI rules belong in `ui-src/modules/`; migrate complete component rule sets out of `ui-src/legacy.css` instead of appending overrides. Use `ui-src/compat/` only for documented temporary bridges.
- Run `npm run ui:build` after changing UI source. The complexity budgets in `ui-src/release.json` must not be increased to make a build pass; reduce the underlying cascade debt instead.

## Commands

From repository root:

```powershell
npm run check                # full suite: 28 check/test scripts + build-sync guard + node --check + git diff --check
npm run build                # splice src/ modules into outputs/plm-material-summary.user.js
npm run sync                 # build + rebuild installable variants (min / workspace-preview)
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
npm run ui:build
npm run ui:check
node --check src\index.js
```

- Two check scripts need optional deps: `@napi-rs/canvas` (point `PLM_CANVAS_MODULE` at it) for the minified size-worker and barcode checks; they are reported as SKIP when missing.
- Use the local Wrangler dependency through `npm run` or `npx.cmd wrangler`; do not assume global `wrangler` is installed.

## Verification Before Completion

- Run syntax validation and `git diff --check` for every userscript or Worker code change.
- Run focused checks for changed parsing, formatting, storage, or API behavior.
- For PLM UI/automation changes, verify the affected interaction in a logged-in browser when available.
- For Worker deployment changes, verify `/health` and any changed authenticated endpoint after deployment.
- Review the final diff, then commit the completed change with a focused message.
