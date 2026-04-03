# SplitSlop Deployment Guide

Complete guide to deploy SplitSlop on free tiers: **Neon** (database), **Render** (backend), and **Vercel** (frontend).

## Prerequisites

- A GitHub account with the repo pushed
- Accounts on [Neon](https://neon.tech), [Render](https://render.com), and [Vercel](https://vercel.com)
- A [Google Cloud](https://console.cloud.google.com) account for OAuth

---

## Step 1: Database (Neon)

1. Log in to [neon.tech](https://neon.tech) and click **New Project**
2. Name it `splitslop` (or anything), pick the region closest to you
3. Once created, go to **Dashboard > Connection Details**
4. Copy the **connection string** — it looks like:
   ```
   postgresql://neondb_owner:abc123@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. Run the database migration from your local machine:
   ```bash
   cd server
   DATABASE_URL="<your-neon-connection-string>" node db/migrate.js
   ```
   You should see: `Migration completed successfully`

> **Save the connection string** — you'll need it for Render.

---

## Step 2: Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project (or select an existing one)
3. Navigate to **APIs & Services > OAuth consent screen**
   - User Type: **External**
   - App name: `SplitSlop`
   - Add your email as a test user (required while in testing mode)
   - Click through the remaining steps
4. Navigate to **APIs & Services > Credentials > Create Credentials > OAuth client ID**
   - Application type: **Web application**
   - Name: `SplitSlop Web`
   - **Authorized JavaScript origins**: leave empty for now
   - **Authorized redirect URIs**: leave empty for now (you'll add the Render URL after step 3)
5. Copy the **Client ID** and **Client Secret**

> **Save both values** — you'll need them for Render.

---

## Step 3: Backend (Render)

1. Go to [render.com](https://render.com) and click **New > Web Service**
2. Connect your GitHub repository
3. Configure the service:

   | Setting | Value |
   |---------|-------|
   | **Name** | `splitslop-api` |
   | **Region** | Same as your Neon region if possible |
   | **Branch** | `main` (or your feature branch) |
   | **Root Directory** | `server` |
   | **Runtime** | Node |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Instance Type** | Free |

4. Add these **Environment Variables**:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Your Neon connection string from Step 1 |
   | `JWT_SECRET` | A random secret string (generate with `openssl rand -hex 32`) |
   | `GOOGLE_CLIENT_ID` | From Step 2 |
   | `GOOGLE_CLIENT_SECRET` | From Step 2 |
   | `CLIENT_URL` | `PLACEHOLDER` (update after Vercel deploy in Step 4) |
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |

5. Click **Create Web Service**
6. Wait for the build to finish. Once live, copy your service URL (e.g. `https://splitslop-api.onrender.com`)
7. Verify it works:
   ```
   curl https://splitslop-api.onrender.com/health
   # Should return: {"status":"ok"}
   ```

> **Important**: Render free tier services spin down after 15 minutes of inactivity. The first request after idle takes ~30 seconds to cold-start. Subsequent requests are fast.

---

## Step 4: Frontend (Vercel)

### Option A: Via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and click **Add New > Project**
2. Import your GitHub repository
3. Configure:

   | Setting | Value |
   |---------|-------|
   | **Root Directory** | `client` |
   | **Framework Preset** | Vite (auto-detected) |
   | **Build Command** | `npm run build` (default) |
   | **Output Directory** | `dist` (default) |

4. Add **Environment Variable**:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | Your Render URL (e.g. `https://splitslop-api.onrender.com`) |

5. Click **Deploy**
6. Once deployed, copy your Vercel URL (e.g. `https://your-app.vercel.app`)

### Option B: Via Vercel CLI

```bash
cd client
npm i -g vercel
vercel login
vercel deploy --prod
```

When prompted, set the root directory to `client`. Then add the environment variable:

```bash
vercel env add VITE_API_URL production
# Enter your Render URL when prompted
vercel deploy --prod   # Redeploy to pick up the env var
```

### Custom Domain (Optional)

To use a nicer `*.vercel.app` subdomain:

1. Go to your Vercel project **Settings > Domains**
2. Add a domain like `splitslop.vercel.app`
3. If using a custom domain, update `CLIENT_URL` on Render to match

---

## Step 5: Wire Everything Together

Now that both services are deployed, update the cross-references:

### 5a. Update Render's CLIENT_URL

1. Go to your Render service **Dashboard > Environment**
2. Change `CLIENT_URL` from `PLACEHOLDER` to your Vercel URL:
   ```
   https://splitslop.vercel.app
   ```
3. Render will auto-redeploy with the new value

### 5b. Update Google OAuth Redirect URI

1. Go to [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials)
2. Click on your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, add:
   ```
   https://splitslop-api.onrender.com/auth/google/callback
   ```
   (Replace with your actual Render URL)
4. Click **Save**

> **This step is critical** — without it, Google will reject login attempts with a `redirect_uri_mismatch` error.

---

## Step 6: Verify

1. Visit your Vercel URL (e.g. `https://splitslop.vercel.app`)
2. You should see the login page with the "Sign in with Google" button
3. Click it — you'll be redirected to Google's login
4. After authenticating, you should land on the dashboard
5. Try creating a group, adding an expense, and checking balances

---

## Troubleshooting

### "redirect_uri_mismatch" error from Google
- Make sure the redirect URI in Google Console **exactly** matches: `https://<your-render-url>/auth/google/callback`
- There should be no trailing slash
- The protocol must be `https://`

### Login succeeds but redirects to wrong domain
- Verify `CLIENT_URL` on Render matches your Vercel URL exactly
- After changing `CLIENT_URL`, Render must redeploy (trigger manually if auto-deploy is off)
- Clear your browser cache or use incognito

### Backend returns 500 errors
- Check Render logs: Dashboard > your service > Logs
- Most likely cause: `DATABASE_URL` is incorrect or Neon project is suspended
- Verify Neon is active and the connection string is correct

### Frontend shows blank page
- Check browser console for errors
- Verify `VITE_API_URL` env var is set correctly on Vercel
- **Important**: `VITE_*` env vars are baked in at build time. After changing them, you must **redeploy** on Vercel

### Render service keeps sleeping
- Free tier spins down after 15 min of inactivity
- First request after sleep takes ~30s
- No fix on free tier — this is expected behavior
- Upgrade to Render's paid tier ($7/mo) for always-on

### Database connection errors
- Neon free tier suspends after 5 min of inactivity (configurable up to 5 days in project settings)
- Go to Neon dashboard and increase the auto-suspend timeout
- If you see SSL errors, ensure `NODE_ENV=production` is set on Render

---

## Environment Variables Reference

### Backend (Render)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `CLIENT_URL` | Yes | Frontend URL for OAuth redirects (e.g. `https://splitslop.vercel.app`) |
| `NODE_ENV` | Yes | Set to `production` |
| `PORT` | No | Render uses `10000` by default |

### Frontend (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend URL (e.g. `https://splitslop-api.onrender.com`) |

> **Note**: `VITE_*` variables are embedded at build time, not runtime. You must redeploy after changing them.

---

## Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Vercel      │────▶│   Render          │────▶│   Neon        │
│   (Frontend)  │     │   (Backend API)   │     │   (Postgres)  │
│               │     │                   │     │               │
│  React + Vite │     │  Express + Node   │     │  PostgreSQL   │
│  Static files │     │  Google OAuth     │     │  6 tables     │
│               │     │  JWT auth         │     │               │
└──────────────┘     └──────────────────┘     └──────────────┘
       ▲                      ▲
       │                      │
       └── VITE_API_URL ──────┘
              (API calls)
```

### OAuth Flow

```
1. User clicks "Sign in with Google" on Vercel frontend
2. Browser redirects to → Render backend /auth/google
3. Backend redirects to → Google OAuth consent screen
4. User authenticates with Google
5. Google redirects to → Render backend /auth/google/callback
6. Backend creates/updates user in Neon database
7. Backend generates JWT token
8. Backend redirects to → Vercel frontend /auth/callback?token=<jwt>
9. Frontend stores JWT in localStorage
10. Frontend uses JWT for all subsequent API calls
```

---

## Updating the App

When you push changes to your GitHub branch:

- **Vercel**: Auto-deploys on push (if connected via GitHub integration) or run `vercel deploy --prod`
- **Render**: Auto-deploys on push (if auto-deploy is enabled) or click "Manual Deploy" in the dashboard
- **Database**: Run migrations manually if schema changes:
  ```bash
  DATABASE_URL="<your-neon-url>" node server/db/migrate.js
  ```

---

## Cost

All services used are on **free tiers**:

| Service | Free Tier Limits |
|---------|-----------------|
| **Neon** | 0.5 GB storage, 190 compute hours/month, auto-suspend after inactivity |
| **Render** | 750 hours/month, spins down after 15 min idle, 512 MB RAM |
| **Vercel** | 100 GB bandwidth/month, 6000 build minutes/month |

These limits are more than sufficient for a small group of friends using the app casually.
