# SplitSlop - Expense Sharing App

A Splitwise alternative for sharing expenses with friends. Supports group-based and 1-on-1 expense splitting with Google SSO.

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS (hosted on Vercel)
- **Backend**: Node.js + Express (hosted on Render)
- **Database**: PostgreSQL (hosted on Neon)
- **Auth**: Google OAuth 2.0 + JWT

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL (or a Neon database URL)
- Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

### Setup

1. **Clone and install dependencies:**
```bash
cd client && npm install
cd ../server && npm install
```

2. **Configure environment variables:**
```bash
cp server/.env.example server/.env
# Edit server/.env with your values
```

3. **Run database migrations:**
```bash
cd server && npm run migrate
```

4. **Start development servers:**
```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

The frontend runs on http://localhost:5173 and proxies API requests to the backend on port 3001.

## Deployment

### 1. Database (Neon)
- Create a free project at [neon.tech](https://neon.tech)
- Copy the connection string for `DATABASE_URL`
- Run migrations: `DATABASE_URL=<your-url> npm run migrate`

### 2. Backend (Render)
- Create a new Web Service from your GitHub repo
- Set root directory to `server`
- Build command: `npm install`
- Start command: `npm start`
- Add environment variables: `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`, `CLIENT_URL`

### 3. Frontend (Vercel)
- Import your GitHub repo
- Set root directory to `client`
- Add environment variable: `VITE_API_URL` = your Render backend URL

### 4. Google OAuth
- Add your Render backend URL + `/auth/google/callback` as an authorized redirect URI in Google Cloud Console
