# PLM Cloud Backup Worker

Cloudflare Worker + D1 backend for PLM helper cloud backup, cloud insight logs, AI summaries, and hosted assets.

## 手机远程工作台

部署后访问 `https://velvet.qzz.io/remote/`，可作为 PWA 添加到手机桌面。用户用云备份姓名和备份密码登录；Worker 只用密码计算现有备份身份并签发 7 天远程会话，不保存原始密码。产品备份仍在手机浏览器内通过 PBKDF2 + AES-GCM 解密。

手机端不上传文件。它只把生成资产、刷新定稿、扫描本机 XLSX + ZIP 并加入魔法上传、文字提醒等指令写入 D1。桌面资产工作台在线时每 5 秒主动领取一条指令，按电脑已配置的产品根目录查找文件，并回传成功或失败结果。电脑关闭时任务保留在队列中。

升级现有环境时先重跑 `schema.sql`，再部署 Worker 和静态资源。远程会话复用现有的 `WORKER_TOKEN_SECRET`，无需新增密钥：

```powershell
npm run db:migrate:remote
npm run ui:build
npm run deploy
```

## Setup

```powershell
cd cloudflare\plm-cloud-backup
npm.cmd install
npx.cmd wrangler login
npx.cmd wrangler d1 create plm-cloud-backup-db
```

Copy the `database_id` printed by Cloudflare into `wrangler.toml`.

Then create the remote tables:

```powershell
npx.cmd wrangler d1 execute plm-cloud-backup-db --remote --file=./schema.sql
```

The feedback migration uses `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS`, so its table/index statements can be rerun safely when upgrading. The feedback loop adds the `feedback_entries` table; rerun the same command after deploying this Worker version so existing databases receive the new table and indexes. Very old local databases may still need the existing `magic_upload_enabled` column migration before the complete legacy schema can be replayed.

Build the versioned runtime asset manifest, then deploy the Worker and its Static Assets together:

```powershell
npm run assets:manifest -- 2026-07-19.4
npm run deploy
```

Worker Static Assets stores brand compliance data, tube rules/specs, the Excel template, the SVG icon package, and the full userscript UI stylesheet under `static/assets/`. The userscript persists the last complete package in GM storage and refreshes it at most once per day. Cached CSS remains available offline; a compact local skeleton stylesheet covers first-run offline startup.

Brand compliance data is seeded from the runtime asset into D1 on first use. Administrators can then add, edit, or delete distributor, EU REP, UK REP, and US REP fields from `/admin`. The userscript reads `/brand-compliance` on every page load and falls back to its cached runtime asset if the request fails.

To rebuild the seed and runtime fallback from a new CSV:

```powershell
npm run brands:import -- "C:\path\to\brand-addresses.csv"
npm run assets:manifest -- 2026-07-26.1
```

Set an API key for write endpoints:

```powershell
npx.cmd wrangler secret put API_KEY
```

Set the independent signing secret used to exchange a logged-in PLM session for
a short-lived Worker token. Keep this secret only in Cloudflare Worker secrets:

```powershell
npx.cmd wrangler secret put WORKER_TOKEN_SECRET
```

Userscript 2.8.9 and later sends the current PLM Bearer token only to
`POST /auth/exchange`. The Worker validates that session through the PLM user
info endpoint, discards the PLM token, and returns an 8-hour Worker token. The
userscript keeps only that Worker token in userscript-manager storage and
renews it after expiry or a 401 response. Older userscripts remain compatible
through `x-api-key` while the migration is rolled out; rotate `API_KEY` after
all old userscripts have been replaced.

Set the Zhipu API key for AI insight summaries:

```powershell
npx.cmd wrangler secret put ZHIPU_API_KEY
```

Set the ModelScope access token for ingredient PDF normalization, toy copywriting, and the Qwen insight option. These calls use `Qwen/Qwen3.5-397B-A17B` first. The detail-image-3 ingredient audit uses the lighter vision model `Qwen/Qwen3-VL-8B-Instruct` so image checks do not require the 397B model quota:

```powershell
npx.cmd wrangler secret put MODELSCOPE_ACCESS_TOKEN
```

Optional ModelScope overrides:

```powershell
npx.cmd wrangler secret put MODELSCOPE_MODEL
# value: Qwen/Qwen3.5-397B-A17B
npx.cmd wrangler secret put MODELSCOPE_TIMEOUT_MS
# value: 25000
```

Keep Gemini configured as the automatic fallback when ModelScope is unavailable, rate-limited, times out, or returns an invalid result:

```powershell
npx.cmd wrangler secret put GEMINI_API_KEY
npx.cmd wrangler secret put GEMINI_FALLBACK_MODEL
# value: gemini-3.1-flash-lite
```

Optional AI provider/model override for insight reports and rule summarization:

```powershell
npx.cmd wrangler secret put AI_PROVIDER
# value: modelscope, gemini, or zhipu
```

Optional Zhipu model override:

```powershell
npx.cmd wrangler secret put ZHIPU_MODEL
```

Optional AI rule-summary tuning:

```powershell
npx.cmd wrangler secret put AI_CLASSIFY_TIMEOUT_MS
# value: 28000
npx.cmd wrangler secret put AI_CLASSIFY_ATTEMPTS
# value: 2
```


Deploy:

```powershell
npx.cmd wrangler deploy
```

Useful verification commands:

```powershell
$headers=@{'x-api-key'='YOUR_API_KEY'}
Invoke-RestMethod -Uri 'https://velvet.qzz.io/health' -Method Get
Invoke-RestMethod -Uri 'https://velvet.qzz.io/insights/ai-status' -Method Get -Headers $headers
Invoke-RestMethod -Uri 'https://velvet.qzz.io/insights/rules' -Method Get -Headers $headers
```

## Endpoints

- `GET /health`
- `GET /remote/` (可安装手机 PWA)
- `POST /remote-api/login`
- `GET /remote-api/backup`
- `GET /remote-api/overview`
- `GET|POST /remote-api/tasks`
- `POST /remote-api/device/poll`
- `POST /remote-api/device/result`
- `POST /auth/exchange` (PLM Bearer session to short-lived Worker token)
- `GET /assets/manifest.json`
- `GET /assets/v1/runtime-data.json`
- `GET /assets/v1/excel-template.xlsx`
- `GET /assets/v1/icons.json`
- `GET /assets/v1/ui-2.5.183.css`

`GET /assets/manifest.json?plm-ui=<ui-version>-<script-version>` returns the matching
versioned UI descriptor when that stylesheet is still available. This keeps older
installed userscripts compatible when a newer cloud UI is deployed.
- `POST /backup/save`
- `GET /backup/load?backupId=...` (legacy `backupKey` is still accepted)
- `POST /backup/chunk`
- `GET /backup/load-chunk?backupId=...&snapshotId=...&chunkIndex=...`
- `POST /ingredients/normalize`
- `POST /toy-copywriting/complete`
- `POST /insights/record`
- `GET /insights/summary`
- `GET /insights/report`
- `GET /insights/ai-report`
- `GET /insights/ai-status`
- `GET /insights/recommend?sku=...&productType=...&name=...`
- `GET /insights/rules`
- `POST /feedback/submit`
- `GET /feedback/mine?name=...`
- `POST /admin/feedback/save` (管理员 Session)

Protected endpoints accept the short-lived Worker Bearer token. Older clients
may continue using `x-api-key` while `API_KEY` is configured.

Backups written by userscript 2.6.105 and later use browser-side AES-GCM encryption. The Worker stores the encrypted envelope and, when necessary, stores its compressed ciphertext in `user_backup_chunks`. The client can still read legacy plaintext/compressed backups and rewrites them in the encrypted format on the next save. Run `schema.sql` once after upgrading the Worker so the chunk table exists.

## Behavior

- Pack counts are calculated silently in the userscript from the current package dimensions and are not uploaded to the Worker.
- `/assets/*` is served directly by Worker Static Assets. The manifest is short-cached; versioned objects are immutable and long-cached.
- `/brand-compliance` returns the current D1-maintained brand address data for the userscript.
- `/insights/record` stores price history, product type, and data-quality issues from the userscript.
- `/insights/recommend` recommends purchase price from cloud history. The userscript also has local history fallback.
- `/insights/rules` groups missing-field issues into data-cleaning rule candidates and marks high-priority cases where the page was read but parsing failed.
- `/feedback/submit` accepts `feature`, `usage`, `data`, or `other`, stores up to 2000 characters, attaches the script/page/SKU context, and limits each PLM name to 10 submissions per rolling 24 hours.
- `/feedback/mine` returns the latest 50 entries for the supplied PLM name. The admin page lists feedback and lets an administrator set `pending`, `processing`, or `resolved` plus a reply of up to 4000 characters.
- `/ingredients/normalize` and `/toy-copywriting/complete` call ModelScope `Qwen/Qwen3.5-397B-A17B` first, then automatically fall back to Gemini. Image-only ingredient PDFs are rendered to images in the userscript for Qwen vision input; the original PDF is retained for Gemini fallback. `/ai-image/ingredient-audit` uses `Qwen/Qwen3-VL-8B-Instruct` first, then the same Gemini fallback chain.
- `/ai-image/product-development-one-shot` is the human dietary supplement formula route used inside the product-development “编辑文案” view: with `stage=ingredient`, the userscript reads the selected SKU's PLM benchmark image, reference URL, product type, and selected template metadata, then returns only an editable ingredient-table draft. The operator must correct and confirm that table before `/ai-image/product-development-copywriting` receives the confirmed rows, amounts, `Other Ingredients`, product type, and selected copywriting template. The URL is retained as provenance and is not fetched by the Worker; Supplement Facts PDF export remains gated by client-side validation, and the final DOCX uses the selected template. All formula, COA, stability, and claim decisions remain subject to supplier and regulatory review.
- `/insights/ai-report` calls the selected AI model for a concise Chinese insight report. The ModelScope Qwen option automatically falls back to Gemini. If all configured AI providers are missing, busy, or time out, it returns a rule-based fallback report.

Secrets must stay in Worker environment variables. Do not put API keys into the userscript.
