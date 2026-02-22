# How to check your Vercel backend is working

Replace `https://your-project.vercel.app` with your real deployment URL (from Vercel dashboard or the deploy success page).

---

## 1. Health check (no auth)

Open in browser or run:

```bash
curl https://your-project.vercel.app/api
```

**Expected:** JSON like `{"status":"ok",...}` or similar. Status 200 = backend is up.

---

## 2. Swagger docs (no auth)

Open in browser:

```
https://your-project.vercel.app/api/docs
```

**Expected:** Swagger UI with your API endpoints. If it loads, the app and docs are working.

---

## 3. Public GET endpoints (no auth)

Try these in browser or with `curl`:

```bash
# Outfit styles (public list)
curl https://your-project.vercel.app/api/outfit/styles

# Weather today (needs query params; may 400 without lat/long)
curl "https://your-project.vercel.app/api/weather/today?latitude=37.77&longitude=-122.42"
```

---

## 4. Auth-protected endpoints

Most routes require a JWT. To test:

1. **Register:**  
   `POST https://your-project.vercel.app/api/auth/register`  
   Body (JSON): `{"email":"test@example.com","password":"YourPassword123!","name":"Test"}`

2. **Login:**  
   `POST https://your-project.vercel.app/api/auth/login`  
   Body (JSON): `{"email":"test@example.com","password":"YourPassword123!"}`

3. Use the `access_token` from the login response in the header:  
   `Authorization: Bearer <access_token>`

4. Call a protected route, e.g.:  
   `GET https://your-project.vercel.app/api/auth/me`  
   with the `Authorization` header.

---

## 5. Quick checklist

| Check              | URL                          | Expected                    |
|--------------------|------------------------------|-----------------------------|
| Health             | `GET /api`                   | 200, JSON with status       |
| Swagger            | `GET /api/docs`              | 200, Swagger UI             |
| Outfit styles      | `GET /api/outfit/styles`     | 200, array of styles        |
| Register           | `POST /api/auth/register`    | 201, user + token           |
| Login              | `POST /api/auth/login`       | 201, access_token           |
| Me (with token)    | `GET /api/auth/me`           | 200, user object            |

If all of these work, your backend deployment is working.
