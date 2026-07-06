# PLM Cloud Backup Worker

Cloudflare Worker + D1 backend for PLM helper cloud backup and shared carton pack-count recommendations.

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

Set the Zhipu API key for AI pack-count estimation:

```powershell
npx.cmd wrangler secret put ZHIPU_API_KEY
```

Optional model override:

```powershell
npx.cmd wrangler secret put ZHIPU_MODEL
```

Deploy:

```powershell
npx.cmd wrangler deploy
```

## Endpoints

- `GET /health`
- `POST /backup/save`
- `GET /backup/load?backupKey=...`
- `POST /pack/record`
- `GET /pack/recommend?boxKey=...`
- `POST /pack/ai-estimate`

Write endpoints require `x-api-key` when `API_KEY` is configured.
`/pack/ai-estimate` first checks existing history. If no record exists, it calls Zhipu, stores the estimated pack count into D1, and returns it.
