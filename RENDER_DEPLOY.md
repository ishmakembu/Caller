# Deploy Vide to Render

## Option 1: Deploy via GitHub (Recommended)

### 1. Push your code to GitHub
```bash
cd /mnt/c/Users/Khesh/Downloads/fileks
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/vide.git
git push -u origin main
```

### 2. Deploy to Render
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub account
4. Select your `vide` repo
5. Configure:
   - **Name**: vide
   - **Branch**: main
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Plan**: Free

### 3. Environment Variables
Add in Render dashboard:
```
NEXT_PUBLIC_SIGNALING_URL = wss://vide.onrender.com
NEXT_PUBLIC_STUN_URL = stun:stun.l.google.com:19302
```

---

## Option 2: Deploy Web Only (Simpler)

Just deploy the web app without signaling:

### Update root package.json
```json
{
  "scripts": {
    "build": "cd apps/web && npm install && npm run build",
    "start": "cd apps/web && npm run start"
  }
}
```

### Deploy command
```bash
render deploy vide \
  --repo YOUR_GITHUB_REPO \
  --branch main \
  --buildCommand "npm install && npm run build" \
  --startCommand "npm run start"
```

---

## Testing

After deploy:
1. Open your Render URL (e.g., https://vide.onrender.com)
2. Enter name → Click "Call"
3. Share code with partner
4. Partner opens: https://vide.onrender.com/join/CODE
5. Test video call
