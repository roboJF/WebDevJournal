# Muse (MERN)

Current features: account creation, login, and creating/viewing/editing/deleting journal entries.
Frontend and backend are fully separate apps
with their own `package.json`, dependencies, and `.env`. Only formatting configuration is shared at the project root.

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

## Code formatting

Prettier is a development dependency in each app and is installed by running `npm install`
inside `frontend` or `backend`. From either app directory, run `npm run format` to format
that app, or `npm run format:check` to check formatting without changing files.
Both apps use the root `.prettierrc.json` and `.prettierignore` configuration.
Generated files, dependencies, and environment files are excluded. There is no root npm package.

## Environment variables

### backend/.env

| Variable           | Required | Default                  | Notes                                                   |
| ------------------ | -------- | ------------------------ | ------------------------------------------------------- |
| `MONGODB_URI`      | yes      |                          | Local or Atlas connection string                        |
| `JWT_SECRET`       | yes      |                          | 32+ random chars; the server refuses to start otherwise |
| `CLIENT_ORIGIN`    | yes      |                          | Frontend origin(s), comma separated, no trailing slash  |
| `NODE_ENV`         | no       | `development`            | Set `production` when hosting                           |
| `PORT`             | no       | `5000`                   | Hosts usually inject this                               |
| `JWT_EXPIRES_DAYS` | no       | `7`                      | Login lifetime (token and cookie)                       |
| `BCRYPT_ROUNDS`    | no       | `12`                     |                                                         |
| `COOKIE_NAME`      | no       | `journal_token`          |                                                         |
| `COOKIE_SECURE`    | no       | dev `false`, prod `true` |                                                         |
| `COOKIE_SAMESITE`  | no       | dev `lax`, prod `none`   | `none` requires `COOKIE_SECURE=true`                    |
| `COOKIE_DOMAIN`    | no       | unset                    | e.g. `.example.com` for subdomain setups                |
| `TRUST_PROXY`      | no       | dev `0`, prod `1`        | Number of proxies in front of the API                   |

### frontend/.env.local

| Variable       | Notes                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| `VITE_API_URL` | API base URL, no `/api` suffix. Baked in at **build time**. Empty in a production build = same origin. |

## Deploying

The app reads everything from env vars, so moving to a host is just setting them there.

1. **Database:** create a MongoDB Atlas cluster, allow your API host's IP, and use its URI as `MONGODB_URI`.
2. **Backend** (Render, Railway, Fly, etc.): root directory `backend`, build `npm install`, start `npm start`.
   Set `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, and `CLIENT_ORIGIN=https://<your-frontend>`.
3. **Vercel frontend:** root directory `frontend`, build `npm run build`, output `dist`.
   Set the Production `VITE_API_URL` variable to an empty value (no quotes or whitespace), then rebuild.
   `frontend/vercel.json` forwards `/api/*` to `https://muse-p0p6.onrender.com/api/*` before the SPA fallback.
   Update that destination if the Render service URL changes. API responses are not cached.
   For other frontend hosts without an API proxy, set `VITE_API_URL=https://<your-api>`.
   Netlify's SPA fallback is included in `public/_redirects` but does not proxy API requests.
4. **Cookies:** login uses an httpOnly cookie, so the cookie settings must match your domain layout:
   - _Vercel API proxy_ (recommended for this deployment): set Render's `COOKIE_SAMESITE=lax`,
     `COOKIE_SECURE=true`, and `CLIENT_ORIGIN=https://muse-rho-sepia.vercel.app`. Leave `COOKIE_DOMAIN`
     unset. The browser receives its cookie from the frontend domain, avoiding third-party cookies.
   - _Direct API requests across different sites_ (e.g. `app.vercel.app` + `api.onrender.com`): require
     `SameSite=None; Secure`, but Safari and some privacy browsers still block these third-party cookies.
   - _Same parent domain_ (e.g. `example.com` + `api.example.com`): **recommended.** Set
     `COOKIE_SAMESITE=lax` and optionally `COOKIE_DOMAIN=.example.com`.

## API

| Method | Path                    | Body                       | Result                                                 |
| ------ | ----------------------- | -------------------------- | ------------------------------------------------------ |
| POST   | `/api/auth/register`    | `{ username, password }`   | `201 { user }` + auth cookie                           |
| POST   | `/api/auth/login`       | `{ username, password }`   | `200 { user }` + auth cookie                           |
| POST   | `/api/auth/logout`      |                            | `200`, cookie cleared                                  |
| GET    | `/api/auth/me`          |                            | `200 { user }` or `401`                                |
| GET    | `/api/health`           |                            | `200 { status: "ok" }`                                 |
| GET    | `/api/entries`          |                            | `200 { entries }`, current user's entries              |
| GET    | `/api/entries/:entryId` |                            | `200 { entry }`, current user's entry or `404`         |
| POST   | `/api/entries`          | `{ title, date, content }` | `201 { entry }`                                        |
| PUT    | `/api/entries/:entryId` | `{ title, date, content }` | `200 { entry }`, current user's updated entry or `404` |
| DELETE | `/api/entries/:entryId` |                            | `204`, permanently deleted, or `404`                   |

Errors look like `{ message, errors?: { field: message } }`.

Entries require login. Dates use `YYYY-MM-DD`; titles are limited to 200 characters
and content to 100,000 characters. Entry encryption is not implemented yet;
titles and content are currently stored as plain text.
The home page shows clickable previews with each entry's title, date, and a short excerpt.
Full entries open at `/entries/:entryId`, which also supports direct links and refreshing.
Full entry pages show Last modified with the saved modification date and time in the viewer's local
timezone. The API returns `createdAt` and `updatedAt`; MongoDB timestamps update automatically on save.
New entry opens the creation form at `/entries/new`. Saving opens the saved entry;
Cancel returns to the list without saving.
The three-dot menu on each preview and the Edit button on the full entry open `/entries/:entryId/edit`.
The edit form starts with the saved title, date, and content. Saving opens the updated entry;
Cancel returns to the entry without saving changes. Only the owner can update an entry.
Delete is available in each preview's three-dot menu and beside Edit on the full entry page.
A confirmation dialog names the entry and offers Cancel or Delete entry. Deletion permanently
removes the entry; there is no trash, recovery period, or restore feature. Only the owner can delete it.
After a successful deletion, an Entry deleted popup appears in the same dialog. Select OK to dismiss
it and update the list, or return to the list if the entry was deleted from its full page.

Run backend route tests with `cd backend` then `npm test`. Tests mock database operations
and do not connect to your MongoDB instance.

## Security notes

- Passwords hashed with bcrypt (72-byte limit enforced); hash is never returned by queries.
- Login returns the same error for unknown user and wrong password, and compares against a dummy hash
  so timing doesn't leak which usernames exist.
- JWT lives in an httpOnly cookie (not readable by JS / not in localStorage).
- CORS is locked to `CLIENT_ORIGIN`; only JSON bodies are accepted; `helmet` headers; rate limiting on
  login/register.
- When you add state-changing routes later, consider CSRF tokens if you keep `SameSite=None`.
