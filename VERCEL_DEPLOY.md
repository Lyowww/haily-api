# Deploy haily-api to Vercel (free) – step by step

Follow these steps to get your NestJS API running on Vercel’s free tier.

---

## Before you start

1. **Code in Git**  
   Your project should be in a Git repo (GitHub, GitLab, or Bitbucket). Vercel deploys from Git.

2. **Free services for DB, Redis, storage** (so the app has somewhere to run):
   - **Database:** [Neon](https://neon.tech) (Postgres, free tier) or [PlanetScale](https://planetscale.com) (MySQL, free tier) or keep SQLite for minimal testing.
   - **Redis:** [Upstash](https://upstash.com) (Redis, free tier, works well with Vercel).
   - **S3-compatible storage:** [Cloudflare R2](https://www.cloudflare.com/products/r2/) (free tier) or [DigitalOcean Spaces](https://www.digitalocean.com/products/spaces) (trial).
   - **OpenAI:** [OpenAI API key](https://platform.openai.com/api-keys) (pay-as-you-go; no free tier but you only pay for usage).

---

## Step 1: Create a Vercel account

1. Go to [vercel.com](https://vercel.com).
2. Click **Sign Up** and sign in with **GitHub** (or GitLab/Bitbucket).
3. Approve Vercel’s access to your repositories when asked.

---

## Step 2: Push your project to GitHub

If the project isn’t on GitHub yet:

```bash
cd /Users/lyovhovhannisyan/Desktop/haily-api
git init
git add .
git commit -m "Initial commit"
# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

Use your real repo URL and branch name.

---

## Step 3: Create a new project on Vercel

1. Go to [vercel.com/new](https://vercel.com/new).
2. **Import** your repository (e.g. `YOUR_USERNAME/haily-api`).
3. Click **Import** on the repo.

---

## Step 4: Configure the project

On the “Configure Project” screen:

- **Framework Preset:** leave as **Other** or **NestJS** if shown.
- **Root Directory:** leave blank (project root).
- **Build Command:** should be `npm run build` (or leave default; we set it in `package.json`).
- **Output Directory:** leave blank (NestJS is a serverless API, not a static export).
- **Install Command:** `npm install` (default).

Do **not** click Deploy yet. Add environment variables first.

---

## Step 5: Add environment variables

1. On the same page, open the **Environment Variables** section.
2. Add each variable (name + value). Use **Production** (and optionally Preview if you want):

| Name | Value (use your real values) |
|------|-----------------------------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Your DB URL, e.g. Neon: `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require` |
| `REDIS_URL` | Your Redis URL, e.g. Upstash: `rediss://default:xxx@xxx.upstash.io:6379` |
| `S3_ENDPOINT` | e.g. `https://xxx.r2.cloudflarestorage.com` or your S3-compatible endpoint |
| `S3_BUCKET` | Your bucket name |
| `S3_ACCESS_KEY` | Your access key |
| `S3_SECRET_KEY` | Your secret key |
| `OPENAI_API_KEY` | `sk-...` from OpenAI |
| `JWT_SECRET` | At least 32 characters (e.g. run `openssl rand -base64 32` and paste) |

Optional:

- `PORT` – leave unset (Vercel sets it).
- `CORS_ORIGINS` – e.g. `https://your-frontend.vercel.app` (comma-separated if multiple).

3. Save / add each variable.

---

## Step 6: Deploy

1. Click **Deploy**.
2. Wait for the build to finish (a few minutes the first time).
3. If the build fails, open the **Build Logs** and fix the error (often a missing env var or Prisma/DB issue).

---

## Step 7: Run database migrations

Vercel does **not** run `prisma migrate deploy` for you. You have two options.

**Option A – Run migrations from your machine (simplest):**

```bash
# Set DATABASE_URL to the same value as in Vercel (your production DB)
export DATABASE_URL="postgresql://..."
npm run prisma:migrate:deploy
```

**Option B – Run migrations in Vercel build:**  
Add a postbuild script so migrations run on every deploy (only if your DB allows connections from Vercel’s build IPs):

```json
"scripts": {
  "build": "prisma generate && nest build",
  "vercel-build": "prisma generate && prisma migrate deploy && nest build"
}
```

Then in Vercel project settings, set **Build Command** to `npm run vercel-build`. If your DB or Prisma set-up doesn’t allow this (e.g. IP allowlist), use Option A.

---

## Step 8: Get your API URL

- After a successful deploy, Vercel shows a URL like:  
  `https://your-project-xxx.vercel.app`
- Your API routes are under:  
  `https://your-project-xxx.vercel.app/api/...`  
  (because the app uses `setGlobalPrefix('api')`).
- Swagger docs (if enabled):  
  `https://your-project-xxx.vercel.app/api/docs`

---

## Step 9: Set CORS for your frontend

If you have a frontend on another domain (e.g. another Vercel app):

1. In Vercel, go to your **API project** → **Settings** → **Environment Variables**.
2. Add or edit:  
   `CORS_ORIGINS` = `https://your-frontend.vercel.app`
3. Redeploy (Deployments → ⋮ on latest → Redeploy).

---

## Free tier limits (Hobby)

- **Bandwidth:** 100 GB/month.
- **Serverless execution:** 10 s timeout (Hobby); 60 s on Pro.
- **Builds:** 100 GB-hours/month.
- **No persistent WebSockets:** The help-center WebSocket gateway will not work in the usual way on serverless; only HTTP request/response is reliable.

If you hit limits or need longer timeouts, consider Vercel Pro or another host (Railway, Render, Fly.io) for this API.

---

## Your .env vs Vercel

- **Local:** Your `.env` file is only for running the app on your machine. It is in `.gitignore` and must **never** be committed.
- **Vercel:** Env vars are set in the Vercel dashboard (Project → Settings → Environment Variables). Vercel does **not** read your `.env` file. Add every variable there with the **exact names** from `VERCEL_ENV_NAMES.md`.
- **S3 and JWT on Vercel:** Use **real** S3 credentials and a **strong** JWT secret (e.g. `openssl rand -base64 32`). Placeholder values like `your-access-key-here` will cause "Environment validation failed" at runtime.

---

## Quick checklist

- [ ] Repo pushed to GitHub (or GitLab/Bitbucket).
- [ ] Vercel project created and connected to repo.
- [ ] All 8 required env vars set (DATABASE_URL, REDIS_URL, S3_*, OPENAI_API_KEY, JWT_SECRET).
- [ ] Database created (e.g. Neon) and migrations run (`prisma migrate deploy`).
- [ ] Redis created (e.g. Upstash) and REDIS_URL set.
- [ ] S3-compatible bucket created and S3_* set.
- [ ] Deploy triggered and build succeeded.
- [ ] API URL tested: `https://your-project.vercel.app/api/...`.

---

## Troubleshooting

- **“Environment validation failed”**  
  One or more required env vars are missing or wrong. Check names and values in Vercel → Settings → Environment Variables.

- **“Prisma Client did not initialize”**  
  Build must run `prisma generate`. Our `package.json` has `"build": "prisma generate && nest build"`. If you use a custom build command, include `prisma generate` before `nest build`.

- **Build fails (module not found, TypeScript, etc.)**  
  Run `npm run build` locally; fix any errors. Commit and push, then redeploy.

- **502 or timeout**  
  Cold start or slow DB/Redis. On free tier, timeout is 10 s; optimize or move to a host with longer limits if needed.
