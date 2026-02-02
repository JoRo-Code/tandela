# Railway Deployment Guide

This document covers deploying Tandela to Railway.

## Prerequisites

- Railway CLI installed (`brew install railway`)
- Railway account and project created
- Google Cloud OAuth credentials

## Initial Setup

### 1. Link your project

```bash
railway login
railway link
```

### 2. Add a Postgres database

In the Railway dashboard, click **+ New** → **Database** → **PostgreSQL**

### 3. Configure environment variables

Set these variables in Railway (via CLI or dashboard):

```bash
# Database (references the Postgres service)
railway variables --set "DATABASE_URL=\${{Postgres.DATABASE_URL}}"

# NextAuth
railway variables --set "AUTH_SECRET=$(openssl rand -base64 32)"
railway variables --set "AUTH_TRUST_HOST=true"
railway variables --set "AUTH_URL=https://your-app.up.railway.app"

# Google OAuth
railway variables --set "GOOGLE_CLIENT_ID=your-client-id"
railway variables --set "GOOGLE_CLIENT_SECRET=your-client-secret"
```

Or copy from your local `.env.local`:

```bash
source .env.local
railway variables --set "GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID"
railway variables --set "GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET"
```

### 4. Configure Google OAuth

In [Google Cloud Console](https://console.cloud.google.com/apis/credentials):

1. Edit your OAuth 2.0 Client
2. Add to **Authorized redirect URIs**:
   ```
   https://your-app.up.railway.app/api/auth/callback/google
   ```

## Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Postgres connection string | `${{Postgres.DATABASE_URL}}` |
| `AUTH_SECRET` | Random 32+ byte string for session encryption | `openssl rand -base64 32` |
| `AUTH_TRUST_HOST` | Trust the incoming host header | `true` |
| `AUTH_URL` | Canonical URL for auth callbacks | `https://your-app.up.railway.app` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | From Google Cloud Console |

## Deployment

Railway auto-deploys on git push to the linked branch. Manual deploy:

```bash
railway up
```

## Useful Commands

```bash
# Check project status
railway status

# View environment variables
railway variables

# Open dashboard
railway open

# Get public domain
railway domain

# View logs
railway logs

# View build logs
railway logs --build
```

## Troubleshooting

### `DATABASE_URL environment variable is not set`

The database URL must be available at build time. Set it via:

```bash
railway variables --set "DATABASE_URL=\${{Postgres.DATABASE_URL}}"
```

Note: Variables set in the "repo" block in railway.json may not be picked up. Set them on the service directly.

### `UntrustedHost` error

NextAuth doesn't trust the production host. Fix:

```bash
railway variables --set "AUTH_TRUST_HOST=true"
railway variables --set "AUTH_URL=https://your-app.up.railway.app"
```

### `MissingSecret` error

NextAuth requires a secret in production:

```bash
railway variables --set "AUTH_SECRET=$(openssl rand -base64 32)"
```

### `invalid_client` (401) from Google

1. Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in Railway
2. Verify the production callback URL is added in Google Cloud Console:
   ```
   https://your-app.up.railway.app/api/auth/callback/google
   ```

### Node.js version mismatch

If Railway uses an old Node version, add a `.node-version` file:

```
20
```

Or add to `package.json`:

```json
{
  "engines": {
    "node": ">=20.9.0"
  }
}
```
