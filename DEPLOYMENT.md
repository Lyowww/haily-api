# Deployment Guide – haily-api

This app fails at startup until **required environment variables** are set. Use this checklist for local runs and for deploying to a server.

---

## 1. Required environment variables

Create a `.env` file in the **project root** (or set these in your host’s environment / secrets). The app reads `.env` and `.env.local` from the project root.

| Variable | Description | Example |
|----------|-------------|---------|
| **DATABASE_URL** | Database connection string | `postgresql://user:pass@host:5432/dbname` or `./database.sqlite` |
| **REDIS_URL** | Redis URL | `redis://localhost:6379` or `redis://:pass@host:6379` |
| **S3_ENDPOINT** | S3-compatible endpoint URL | `https://s3.amazonaws.com` or MinIO/Spaces URL |
| **S3_BUCKET** | Bucket name | `my-app-uploads` |
| **S3_ACCESS_KEY** | S3 access key | Your provider access key |
| **S3_SECRET_KEY** | S3 secret key | Your provider secret key |
| **OPENAI_API_KEY** | OpenAI API key | `sk-...` from [OpenAI API keys](https://platform.openai.com/api-keys) |
| **JWT_SECRET** | Secret for JWT signing (min 32 chars) | e.g. `openssl rand -base64 32` |

Optional:

| Variable | Description | Default |
|----------|-------------|---------|
| **NODE_ENV** | `development` \| `production` \| `test` | `development` |
| **PORT** | HTTP port | `3000` |
| **CORS_ORIGINS** | Allowed origins, comma-separated | In dev: `http://localhost:8081`, `http://localhost:19006` |

---

## 2. Quick start (local)

```bash
# 1. Copy the example env file
cp .env.example .env

# 2. Edit .env and set every required variable (no placeholder values for production)
#    - DATABASE_URL, REDIS_URL, S3_*, OPENAI_API_KEY, JWT_SECRET

# 3. Install dependencies (if not already)
npm install

# 4. Generate Prisma client and run DB migrations
npm run prisma:generate
npm run prisma:migrate:deploy

# 5. (Optional) Seed DB
npm run prisma:seed

# 6. Start the API
npm start
# or production build then run:
npm run build && npm run start:prod
```

For local dev you can use:

- **Database:** SQLite, e.g. `DATABASE_URL=./database.sqlite`
- **Redis:** local Redis, e.g. `REDIS_URL=redis://localhost:6379`
- **S3:** MinIO or DigitalOcean Spaces / AWS with real or test credentials

---

## 3. Deploying to a server

### 3.1 Provision services

- **Database:** PostgreSQL (or MySQL) recommended for production; SQLite is allowed but not ideal for multi-process/high traffic.
- **Redis:** Managed Redis (e.g. Redis Cloud, ElastiCache) or a VM with Redis.
- **Object storage:** S3-compatible (AWS S3, MinIO, DigitalOcean Spaces, etc.).
- **OpenAI:** API key from OpenAI (required for AI features).

### 3.2 Set environment variables

On the server (or in your platform’s config), set all required variables. **Do not** commit `.env` or real secrets to git.

Example (Linux/macOS):

```bash
export NODE_ENV=production
export PORT=3000
export DATABASE_URL="postgresql://user:password@host:5432/dbname"
export REDIS_URL="redis://:password@redis-host:6379"
export S3_ENDPOINT="https://s3.amazonaws.com"
export S3_BUCKET="your-bucket"
export S3_ACCESS_KEY="..."
export S3_SECRET_KEY="..."
export OPENAI_API_KEY="sk-..."
export JWT_SECRET="your-32-char-minimum-secret"
# Optional: restrict CORS
export CORS_ORIGINS="https://your-frontend.com"
```

Platforms (Railway, Render, Fly.io, Heroku, etc.): use their “Environment variables” or “Secrets” UI and set the same names.

### 3.3 Build and run

```bash
# Install production dependencies only (if you use separate install step)
npm ci

# Generate Prisma client
npm run prisma:generate

# Run pending migrations (use this in production, not migrate dev)
npm run prisma:migrate:deploy

# Build the app
npm run build

# Start the app (production)
npm run start:prod
```

Use a process manager (systemd, PM2, or your platform’s start command) to run `node dist/main` or `npm run start:prod` and restart on failure.

---

## 4. libvips / “GNotificationCenterDelegate” warning

You may see:

```text
Class GNotificationCenterDelegate is implemented in both ... sharp ... and ... @imgly/background-removal-node ...
```

This comes from two different native libvips builds (one from `sharp`, one from `@imgly/background-removal-node`). It can sometimes cause crashes; often the app still runs.

- **Option A:** Ignore for now; if you see crashes in background-removal or image code, consider the next options.
- **Option B:** Ensure both packages use a compatible Node/OS and, if possible, align sharp versions (e.g. match the version used by `@imgly/background-removal-node`).
- **Option C:** If you don’t need background-removal in production, you could lazy-load that dependency or run it in a separate worker to isolate the duplicate native lib.

---

## 5. Checklist before go-live

- [ ] All 8 required env vars set (no placeholders).
- [ ] `JWT_SECRET` is at least 32 characters and kept secret.
- [ ] `DATABASE_URL` points to the correct DB; migrations applied (`prisma:migrate:deploy`).
- [ ] Redis is reachable from the app (`REDIS_URL`).
- [ ] S3 bucket exists; credentials have read/write (and list if your code uses it).
- [ ] CORS is restricted in production (`CORS_ORIGINS`).
- [ ] Process manager or platform restarts the app on crash.
- [ ] HTTPS and firewall rules configured on the host or load balancer.

After that, deploying is: set env → `prisma:generate` → `prisma:migrate:deploy` → `npm run build` → `npm run start:prod` (or `node dist/main`).
