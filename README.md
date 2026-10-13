# Muse (MERN)

Baseline: account creation + login. Frontend and backend are fully separate apps
with their own `package.json`, dependencies, and `.env`. Nothing is shared.

```
muse/
├── backend/    Express 5 + Mongoose API   (port 5000)
└── frontend/   React + Vite SPA           (port 5173)
```

## Run locally

Requires Node 18+ and a MongoDB instance (local or Atlas).

```bash
# Terminal 1: API
cd backend
npm install
cp .env.example .env        # then set JWT_SECRET (and MONGODB_URI if not local)
npm run dev

# Terminal 2: UI
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:5173.

## Environment variables

### backend/.env

| Variable | Required | Default | Notes |
|---|---|---|---|
| `MONGODB_URI` | yes | | Local or Atlas connection string |
| `JWT_SECRET` | yes | | 32+ random chars; the server refuses to start otherwise |
| `CLIENT_ORIGIN` | yes | | Frontend origin(s), comma separated, no trailing slash |
| `NODE_ENV` | no | `development` | Set `production` when hosting |
| `PORT` | no | `5000` | Hosts usually inject this |
| `JWT_EXPIRES_DAYS` | no | `7` | Login lifetime (token and cookie) |
| `BCRYPT_ROUNDS` | no | `12` | |
| `COOKIE_NAME` | no | `journal_token` | |
| `COOKIE_SECURE` | no | dev `false`, prod `true` | |
| `COOKIE_SAMESITE` | no | dev `lax`, prod `none` | `none` requires `COOKIE_SECURE=true` |
| `COOKIE_DOMAIN` | no | unset | e.g. `.example.com` for subdomain setups |
| `TRUST_PROXY` | no | dev `0`, prod `1` | Number of proxies in front of the API |

### frontend/.env.local

| Variable | Notes |
|---|---|
| `VITE_API_URL` | API base URL, no `/api` suffix. Baked in at **build time**. Empty in a production build = same origin. |

## Deploying

The app reads everything from env vars, so moving to a host is just setting them there.

1. **Database:** create a MongoDB Atlas cluster, allow your API host's IP, and use its URI as `MONGODB_URI`.
2. **Backend** (Render, Railway, Fly, etc.): root directory `backend`, build `npm install`, start `npm start`.
   Set `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, and `CLIENT_ORIGIN=https://<your-frontend>`.
3. **Frontend** (Vercel, Netlify, Cloudflare Pages, etc.): root directory `frontend`, build `npm run build`,
   output `dist`. Set `VITE_API_URL=https://<your-api>`. SPA rewrite files for Netlify (`public/_redirects`)
   and Vercel (`vercel.json`) are included.
4. **Cookies:** login uses an httpOnly cookie, so the cookie settings must match your domain layout:
   - *Different sites* (e.g. `app.vercel.app` + `api.onrender.com`): the production defaults work
     (`SameSite=None; Secure`). Note that Safari and some privacy browsers block third-party cookies,
     which can break login in this setup.
   - *Same parent domain* (e.g. `example.com` + `api.example.com`): **recommended.** Set
     `COOKIE_SAMESITE=lax` and optionally `COOKIE_DOMAIN=.example.com`.

## API

| Method | Path | Body | Result |
|---|---|---|---|
| POST | `/api/auth/register` | `{ username, password }` | `201 { user }` + auth cookie |
| POST | `/api/auth/login` | `{ username, password }` | `200 { user }` + auth cookie |
| POST | `/api/auth/logout` | | `200`, cookie cleared |
| GET | `/api/auth/me` | | `200 { user }` or `401` |
| GET | `/api/health` | | `200 { status: "ok" }` |

Errors look like `{ message, errors?: { field: message } }`.

## Security notes

- Passwords hashed with bcrypt (72-byte limit enforced); hash is never returned by queries.
- Login returns the same error for unknown user and wrong password, and compares against a dummy hash
  so timing doesn't leak which usernames exist.
- JWT lives in an httpOnly cookie (not readable by JS / not in localStorage).
- CORS is locked to `CLIENT_ORIGIN`; only JSON bodies are accepted; `helmet` headers; rate limiting on
  login/register.
- When you add state-changing routes later, consider CSRF tokens if you keep `SameSite=None`.
