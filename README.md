# Arie Savvy Creator Portal

A content creator portal built with React, Express, and MongoDB. The repository keeps the frontend and backend in separate folders; the API follows an MVC layout (`models`, `controllers`, `routes`, and middleware).

## Features

- Public home and social-style explore feed with search, category/video/post filters, content details, likes, comments, view counts, and share links.
- Google sign-in with creator access reserved for `ariesavy9@gmail.com`; all other Google identities are viewers.
- Viewer Google or email/password sign-in, plus a protected creator dashboard for content CRUD, draft/published/scheduled states, analytics, and comment moderation.
- Published content is browsable without an account; sign in to like or comment. Public YouTube uploads can be played in Ethera, while private and unlisted uploads are excluded from the public feed.
- The creator name is taken from the linked YouTube channel, and the profile photo is taken from the creator's Google profile.
- MongoDB persistence with validated Mongoose models, JWT authentication, CORS, security headers, and sign-in rate limiting.

## Run locally

1. Install Node.js 18 or newer and create a MongoDB Atlas cluster.
2. From the project root, run `npm install` to install the root process runner.
3. In `backend`, run `npm install`. In `frontend`, run `npm install`.
4. Copy `backend/.env.example` to `backend/.env` and set all required values. Copy `frontend/.env.example` to `frontend/.env` and set the Google client ID. Do not commit either `.env` file.
5. From the project root, run `npm start` to start the API and React app together.
6. Open `http://localhost:3000`. The verified Google account `ariesavy9@gmail.com` opens the creator dashboard, including when an older session has a stale viewer role. Other Google accounts are treated as viewers and can also create or access a viewer email/password account.

Generate secrets locally instead of reusing any credential from the notes: use a strong random `JWT_SECRET` and a 32-byte hexadecimal `TOKEN_ENCRYPTION_KEY` (for example, `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`). Google Identity Services verifies the account email. Only `ariesavy9@gmail.com` receives creator privileges; every other Google account is provisioned as a viewer and sent to the public content portal. Viewer email/password accounts are stored in MongoDB with hashed passwords. To authorize YouTube access for the creator, use **Social channels → Connect YouTube**; the Google OAuth app must have YouTube Data API v3 enabled and the backend redirect URI registered. Facebook is available only under **Social channels** for linking a managed Page; it is not a sign-in option. Configure `http://localhost:3000` as the authorized JavaScript origin for Google.

The creator connects their YouTube channel and a Facebook Page from **Creator studio → Social channels**. Facebook channel connection uses a full-page authorization redirect with Meta Login for Business configuration ID `1147158737755594`, set as `FACEBOOK_CONFIG_ID` in `backend/.env`. The backend constructs the authorization URL with `config_id` and `response_type=code`; it does not manually pass Facebook permissions as `scope`. Set `FACEBOOK_APP_ID` and its matching 32-character App Secret from the same Meta app in `backend/.env`; restart the backend after changing either value. Its local callback URI is `http://localhost:5000/api/social/facebook/callback`; register that exact URI in the Meta app's valid OAuth redirect URI list. The callback exchanges the code on the server using the app secret. If Google reports `redirect_uri_mismatch` when linking YouTube, register `http://localhost:5000/api/social/google/callback` under the Google OAuth client's authorized redirect URIs; the URI must exactly match `GOOGLE_REDIRECT_URI` in `backend/.env`. After connecting, use **Sync posts** in Social channels or the content library to import up to 50 recent public YouTube uploads and up to 100 Facebook Page posts. A YouTube sync also refreshes the creator display name from the channel and profile image from the linked Google account. These imported items can be organized, edited, and removed from Ethera; edits do not publish back to YouTube or Facebook. When both connected accounts return the same email, Ethera indicates the match and combines their imported posts in the creator library. The Create React App development server proxies local `/api` calls to port 5000. In production, set `REACT_APP_API_URL` in the frontend build environment to the backend base URL (without `/api`), and configure `CLIENT_URL` and both OAuth redirect URIs on the backend for the deployed domains.

If sign-in reports that the database is disconnected, add your current development machine IP to the MongoDB Atlas project's **Network Access → IP Access List**, confirm the Atlas database user and connection string are valid, then restart the backend. The API remains available while Atlas is unreachable and retries the database connection every 15 seconds; `/api/health/database` reports whether MongoDB is ready.

## Deployment

- Deploy `backend` to Render (Node service, start command `npm start`) and set the variables from `backend/.env.example` in the service dashboard.
- Deploy `frontend` to Vercel or Netlify with the root directory set to `frontend`, build command `npm run build`, and output directory `build`. Set `REACT_APP_API_URL` to the deployed API origin.
- Use MongoDB Atlas for the production database, restrict network access where possible, and use unique production credentials.

## API overview

- `POST /api/auth/google` (verified Google creator sign-in / account creation)
- `POST /api/auth/viewer/register`, `POST /api/auth/viewer/login` (viewer email/password)
- `GET /api/profile`
- `GET /api/contents` (public; published content supports `search`, `category`, `type`, and `platform`)
- `GET /api/contents/:id`, `POST /api/contents/:id/view`, `POST /api/contents/:id/like`
- `POST /api/contents`, `PUT /api/contents/:id`, `DELETE /api/contents/:id` (creator JWT required)
- `POST /api/comments`, `GET /api/comments/:contentId`
- `GET /api/comments/manage/all`, `PATCH /api/comments/:id`, `DELETE /api/comments/:id` (creator JWT required)
- `GET /api/dashboard/stats` (creator JWT required)
- `POST /api/social/connect/google`, `POST /api/social/connect/facebook`, and provider OAuth callbacks (creator JWT required to start)
- `GET /api/social/accounts`, `POST /api/social/sync/:provider` (creator JWT required)

Google sign-in creates creator accounts. Viewer registration creates MongoDB-backed viewer accounts. Creator accounts sign in through Google only.
