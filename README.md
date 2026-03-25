# Brainfeed Magazine

This repository has **two separate projects**: frontend (React) and backend (Node/Express API).

## Project structure

```
brainfeed-collective-main/
├── frontend/     # React + Vite app (pages, admin, UI)
├── backend/      # Node/Express API (auth, posts, MongoDB, Cloudinary)
└── README.md
```

## Quick start

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: set MONGO_URI, JWT_SECRET, CLOUDINARY_*, ADMIN_EMAIL, ADMIN_PASSWORD
npm install
npm start
```

API runs at **http://localhost:3001**.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at **http://localhost:8080**. In dev, `/api` requests are proxied to the backend (3001).

### 3. Deployment (production)

**Backend** (Railway, Render, Fly.io, etc.)

- **Important:** In Railway, set **Root Directory** to `backend` (or use the monorepo root with `npm start`, which runs the API from `backend/`). If the wrong folder is deployed, you may get **404** on newer routes (e.g. flipbooks).
- Deploy the `backend/` folder. Set these env vars in the platform:
  - `MONGO_URI`, `JWT_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
  - `ADMIN_EMAIL`, `ADMIN_PASSWORD`
  - Optional: `PORT` (default 3001), `HOST` (default 0.0.0.0)
  - Optional: `CORS_ORIGIN` or `FRONTEND_URL` – your frontend URL(s), comma-separated, so the API only accepts requests from your site. Leave unset to allow all origins.
- Start command: `npm start` (runs `node index.cjs`).

**Frontend** (Vercel, Netlify, etc.)

- Set **build-time** env var: `VITE_API_URL` = your backend URL (e.g. `https://your-api.railway.app`). This is baked into the build; set it in the platform’s “Environment variables” before building.
- Build: `npm run build`. Publish the `dist/` folder.
- SPA routing: `frontend/vercel.json` and `frontend/netlify.toml` are included so `/admin/posts`, `/news`, etc. work on refresh. Other hosts: serve `index.html` for all routes (single-page app).

**Common deployment errors**

| Issue | Fix |
|-------|-----|
| White screen / API fails in production | Set `VITE_API_URL` to backend URL and **rebuild** the frontend. |
| CORS errors | Set `CORS_ORIGIN` (or `FRONTEND_URL`) on the backend to your frontend URL. |
| 404 on refresh (e.g. `/admin/posts`) | Use the included `vercel.json` / `netlify.toml`, or configure your host to serve `index.html` for all routes. |
| **404 on `/api/admin/flipbooks`** (flipbook admin) | Redeploy the **backend** from latest code. On Railway, **Root Directory** = `backend`. Verify in a browser: `https://YOUR-API.railway.app/api/capabilities` — should return JSON with `"flipbooks": true`. If that URL 404s, the running server is old or not this repo’s `backend`. |
| Admin 401 after deploy | Ensure backend has `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `MONGO_URI` set and MongoDB is reachable. |

**Security:** Never commit `.env` (it’s in `.gitignore`). Use strong `JWT_SECRET` and `ADMIN_PASSWORD` in production.

## Routing

- **Frontend**: All page routes (/, /about, /news, /blog, /admin/*, etc.) are handled by React Router. No changes needed.
- **Backend**: API routes under `/api/*` (auth, admin, posts). No overlap with frontend routes.

## Feature checklist (verify each works)

| Feature | How to verify |
|--------|----------------|
| **Home** | Open `/` – hero, news, magazine section load. |
| **About** | Open `/about` – text and magazine editions. |
| **News** | Open `/news` – list from API (`/api/articles`). Filter by category, search. |
| **Blog** | Open `/blog` – list from API (`/api/posts/blogs`). Pagination, filter, search. |
| **Subscribe** | Open `/subscribe` – plans and cart. |
| **Contact** | Open `/contact` – form and address. |
| **Policy pages** | `/cancellation-refund-policy`, `/privacy-policy`, `/shipping-policy`, `/terms-and-conditions` – content loads. |
| **User auth** | `/login`, `/signup` – sign up, log in, then `/profile` – update profile. |
| **Cart** | Add items from Subscribe, open `/cart`. |
| **Admin** | Open `/admin/login` – log in with `.env` ADMIN_EMAIL / ADMIN_PASSWORD. Then: **News posts**, **Blog posts** (list), **Add news** / **Add blog** (create with title, content, featured image, format tabs). Edit/delete from list. Selected post shows **views** at bottom. |
| **API** | Backend must be running (e.g. `cd backend && npm start`). Frontend dev proxies `/api` to `http://localhost:3001`. |

## Run from root (optional)

From the repo root (same folder as `frontend/` and `backend/`):

```bash
npm run install:all   # once: installs deps in frontend + backend
npm run server        # terminal 1 – starts backend (port 3001)
npm run dev           # terminal 2 – starts frontend (port 8080)
```

If `install:all` fails on Windows PowerShell, run manually:

```bash
cd frontend && npm install
cd ../backend && npm install
```

## Troubleshooting

- **Admin 401**: Ensure backend has `.env` with `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `MONGO_URI`. Restart backend after changing `.env`.
- **News/Blog empty**: Backend must be running and MongoDB connected. Add posts via Admin to see them.
- **API calls fail in dev**: Frontend runs on 8080 and proxies `/api` to 3001. Ensure backend is running on 3001.
- **API calls fail in production**: Set `VITE_API_URL` to your backend URL when building the frontend (`npm run build`).
