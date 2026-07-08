# PLM Cloud Backup Worker

Cloudflare Worker + D1 backend for PLM helper cloud backup, shared carton pack-count recommendations, cloud insight logs, AI summaries, and Feishu export/sync.

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

Set an API key for write endpoints:

```powershell
npx.cmd wrangler secret put API_KEY
```

Set the Zhipu API key for AI insight summaries:

```powershell
npx.cmd wrangler secret put ZHIPU_API_KEY
```

Optional AI provider/model override. Defaults stay on Zhipu/GLM; use these to switch insight reports and rule summarization to Gemini:

```powershell
npx.cmd wrangler secret put AI_PROVIDER
# value: gemini
npx.cmd wrangler secret put GEMINI_API_KEY
npx.cmd wrangler secret put GEMINI_MODEL
# value: gemini-3.5-flash
```

Optional Zhipu model override:

```powershell
npx.cmd wrangler secret put ZHIPU_MODEL
```

Set Feishu credentials only if you want direct Feishu Bitable sync:

```powershell
npx.cmd wrangler secret put FEISHU_APP_ID
npx.cmd wrangler secret put FEISHU_APP_SECRET
npx.cmd wrangler secret put FEISHU_BITABLE_APP_TOKEN
npx.cmd wrangler secret put FEISHU_BITABLE_TABLE_ID
```

Create these exact fields in the target Feishu Bitable table:

```text
记录类型
SKU
品牌
商品名
商品类型
价格
装箱数
包装尺寸
产品尺寸
缺失字段
来源
记录时间
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
Invoke-RestMethod -Uri 'https://velvet.qzz.io/insights/feishu-status' -Method Get -Headers $headers
Invoke-RestMethod -Uri 'https://velvet.qzz.io/insights/rules' -Method Get -Headers $headers
```

## Endpoints

- `GET /health`
- `POST /backup/save`
- `GET /backup/load?backupKey=...`
- `POST /pack/record`
- `GET /pack/recommend?boxKey=...`
- `POST /pack/ai-estimate`
- `POST /insights/record`
- `GET /insights/summary`
- `GET /insights/report`
- `GET /insights/ai-report`
- `GET /insights/ai-status`
- `GET /insights/feishu-tsv`
- `GET /insights/feishu-status`
- `POST /insights/feishu-sync`
- `GET /insights/recommend?sku=...&productType=...&name=...`
- `GET /insights/rules`

Write endpoints require `x-api-key` when `API_KEY` is configured.

## Behavior

- `/pack/ai-estimate` first checks existing history. If no record exists, it calculates the maximum pack count locally from the default outer carton size and stores the result.
- `/insights/record` stores price history, product type, and data-quality issues from the userscript.
- `/insights/recommend` recommends purchase price from cloud history. The userscript also has local history fallback.
- `/insights/rules` groups missing-field issues into data-cleaning rule candidates and marks high-priority cases where the page was read but parsing failed.
- `/insights/ai-report` calls the configured AI model for a concise Chinese insight report. Configure `AI_PROVIDER=gemini` and `GEMINI_MODEL=gemini-3.5-flash` to avoid GLM rate limits. If AI is missing, busy, or times out, it returns a rule-based fallback report.
- `/insights/feishu-tsv` returns TSV that can be pasted directly into Feishu Sheets/Bitable.
- `/insights/feishu-sync` writes records directly to Feishu Bitable when Feishu secrets are configured. Synced records are deduplicated in D1.

Secrets must stay in Worker environment variables. Do not put API keys or Feishu secrets into the userscript.
