# Environment variable names for Vercel

Set these **exact names** in Vercel → Your Project → **Settings** → **Environment Variables** (Production and Preview if you want).

Copy-paste the names (values are secret; add them in the dashboard):

```
NODE_ENV
PORT
CORS_ORIGINS
DATABASE_URL
REDIS_URL
S3_ENDPOINT
S3_BUCKET
S3_ACCESS_KEY
S3_SECRET_KEY
OPENAI_API_KEY
JWT_SECRET
```

**Required for the app to start:**  
`DATABASE_URL`, `REDIS_URL`, `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `OPENAI_API_KEY`, `JWT_SECRET`

**Optional:**  
`NODE_ENV` (use `production`), `PORT` (Vercel sets this), `CORS_ORIGINS` (e.g. `https://your-frontend.vercel.app`)

**Important:**
- Use your **Neon** `DATABASE_URL` and **Upstash** `REDIS_URL` (with `rediss://` and real token).
- Use **real S3 (or R2/Spaces) credentials**—placeholder values will fail validation.
- Use a **strong JWT_SECRET** in production (e.g. run `openssl rand -base64 32` and paste).
