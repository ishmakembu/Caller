# Deployment Guide
## Vide — Video Calling PWA

---

## Architecture Overview

```
Internet
    │
    ├── vide.app (Vercel)
    │       Next.js PWA — served globally via CDN
    │
    └── signal.vide.app (Railway or Fly.io)
            Node.js Socket.io signaling server
            Always-on, WebSocket-capable host required
```

**Why two services?** Vercel is serverless — it cannot maintain persistent WebSocket connections. The signaling server needs persistent connections, so it runs on Railway or Fly.io.

---

## 1. Frontend Deployment (Vercel)

### Setup

```bash
# Install Vercel CLI
pnpm add -g vercel

# From the repo root
cd apps/web
vercel
```

### next.config.js (with PWA)

```javascript
// apps/web/next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Required for WebRTC headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Permissions-Policy', value: 'camera=*, microphone=*, display-capture=*' },
          // Required for cross-origin isolation (needed for some browser APIs)
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ]
  },
}

module.exports = withPWA(nextConfig)
```

### Environment variables on Vercel

In the Vercel dashboard → Project → Settings → Environment Variables:

```
NEXT_PUBLIC_SIGNALING_URL = https://signal.vide.app
NEXT_PUBLIC_STUN_URL = stun:stun.metered.ca:80
NEXT_PUBLIC_TURN_URL = turn:standard.relay.metered.ca:80
NEXT_PUBLIC_TURN_USERNAME = <from Metered.ca dashboard>
NEXT_PUBLIC_TURN_CREDENTIAL = <from Metered.ca dashboard>
```

---

## 2. Signaling Server Deployment (Railway)

Railway is the easiest for a personal project — free tier available, always-on, supports WebSockets.

### Dockerfile

```dockerfile
# apps/signaling/Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 4000
CMD ["node", "dist/index.js"]
```

### Deploy to Railway

1. Go to [railway.app](https://railway.app), create a new project
2. Connect your GitHub repo
3. Set the root directory to `apps/signaling`
4. Railway auto-detects the Dockerfile
5. Set environment variables:
   ```
   PORT = 4000
   CLIENT_ORIGIN = https://vide.app
   ```
6. Railway provides a URL like `https://vide-signaling.up.railway.app`
7. Set that as your `NEXT_PUBLIC_SIGNALING_URL` on Vercel

### Alternative: Fly.io

```toml
# apps/signaling/fly.toml
app = "vide-signaling"
primary_region = "jnb"  # Johannesburg — closest to Nairobi

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "4000"

[[services]]
  internal_port = 4000
  protocol = "tcp"

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [[services.ports]]
    port = 80
    handlers = ["http"]
```

```bash
fly launch
fly secrets set CLIENT_ORIGIN=https://vide.app
fly deploy
```

**Fly.io has a region in Johannesburg (`jnb`)** — lowest latency from Nairobi (~50ms vs ~200ms to US regions). Use it.

---

## 3. STUN/TURN Server (Metered.ca)

1. Sign up at [metered.ca](https://www.metered.ca)
2. Create an application
3. Copy the STUN URL, TURN URL, username, and credential
4. Paste into environment variables
5. Free tier: 500MB bandwidth / month — fine for personal use

---

## 4. Custom Domain

On Vercel:
1. Project → Settings → Domains
2. Add `vide.app` (or your domain)
3. Update DNS at your registrar: CNAME → `cname.vercel-dns.com`

For signaling:
1. Add `signal.vide.app` as a custom domain in Railway/Fly dashboard
2. Update DNS: CNAME → Railway/Fly provided hostname
3. Update `NEXT_PUBLIC_SIGNALING_URL` on Vercel to `https://signal.vide.app`

---

## 5. PWA Installation on Devices

### iPhone (Safari)
1. Open `vide.app` in Safari
2. Tap the Share button (box with arrow)
3. Tap "Add to Home Screen"
4. Tap "Add"
5. App launches from home screen in standalone mode (no browser chrome)

### Android (Chrome)
1. Open `vide.app` in Chrome
2. Tap the three-dot menu
3. Tap "Add to Home Screen" (or Chrome may show an automatic install banner)
4. Tap "Install"

### Desktop (Chrome/Edge)
- Address bar will show an install icon (⊕)
- Click it to install as a desktop app

---

## 6. CI/CD (Optional but Recommended)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install
      - run: pnpm --filter web build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: apps/web

  deploy-signaling:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --app vide-signaling
        working-directory: apps/signaling
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

---

## 7. Monitoring (Minimal, Free)

- **Vercel Analytics** — free, built-in, shows real user performance
- **Railway/Fly Logs** — check signaling server logs if calls fail
- **Sentry (free tier)** — add `@sentry/nextjs` for error tracking in production

---

## 8. Launch Checklist

Before sharing with anyone:

- [ ] `pnpm tsc --noEmit` passes with no errors
- [ ] Camera/mic works on your iPhone (real device, not simulator)
- [ ] Two-way call tested on mobile data (not WiFi) — confirms TURN works
- [ ] PWA "Add to Home Screen" tested on iPhone and Android
- [ ] Invite link opens correctly and joins existing room
- [ ] `manifest.json` icons are present (192px and 512px)
- [ ] HTTPS is enforced (required for WebRTC)
- [ ] Environment variables are set on Vercel (not just `.env.local`)
- [ ] Signaling server is running and reachable from your domain
