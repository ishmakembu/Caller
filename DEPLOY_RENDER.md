# Deployment Guide - Vide on Render

## Architecture

```
Internet
    │
    └── vide-xxx.onrender.com (Render)
           Next.js + Socket.io WebSocket server
```

Single service for both frontend and WebSocket signaling.

---

## Deploy to Render

### Option 1: Via Dashboard
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Set:
   - Name: `vide`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`
   - Plan: Free
5. Add Environment Variables (see below)

### Option 2: Via CLI
```bash
curl -fsSL https://raw.githubusercontent.com/render-oss/cli/refs/heads/main/bin/install.sh | sh
export PATH=$PATH:$HOME/.local/bin
render login
render deploy vide \
  --repo https://github.com/YOUR_GITHUB/vide.git \
  --branch main \
  --buildCommand "npm install && npm run build" \
  --startCommand "npm run start" \
  --plan free
```

---

## Environment Variables

In Render dashboard → Service → Environment:

```
NEXT_PUBLIC_SIGNALING_URL = (leave empty - uses same host)
NEXT_PUBLIC_STUN_URL = stun:stun.l.google.com:19302
```

Optional TURN for better connectivity:
```
NEXT_PUBLIC_TURN_URL = turn:your-turn-server.com:3478
NEXT_PUBLIC_TURN_USERNAME = username
NEXT_PUBLIC_TURN_CREDENTIAL = password
```

---

## How It Works

1. **server.js** - Custom server that runs Next.js + Socket.io on same port
2. **Socket.io** - Handles WebRTC signaling (offer/answer/ICE candidates)
3. **WebRTC** - Browser-to-browser video via STUN/TURN servers

---

## Testing

1. Open your Render URL
2. Enter name → Click "Call"
3. Copy the call code
4. Open `/join/CODE` in another browser/device
5. Both should see video

---

## Notes

- WebSocket works on Render's free tier
- First deploy takes 2-3 minutes
- Free tier sleeps after 15 min inactivity (takes ~30s to wake up)