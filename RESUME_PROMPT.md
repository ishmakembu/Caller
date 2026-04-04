# Resume Prompt
## Use this at the start of every new AI coding session

---

Paste this entire prompt at the start of a new conversation with your AI coder to restore full context instantly.

---

```
I'm building **Vide** — a browser-native video calling PWA (no app store, no installs).
It works on desktop, iPhone, and Android via a shared URL.

## Tech Stack
- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Socket.io signaling server (Node.js, deployed on Railway/Fly.io)
- WebRTC mesh P2P for media (no media server)
- Zustand for state, next-pwa for PWA
- Deployed: Vercel (frontend) + Railway or Fly.io (signaling)

## Project Docs (read these to understand the full spec):
- `00_MASTER_PROMPT.md` — full project overview, file structure, phases, constraints
- `01_ARCHITECTURE.md` — signaling flow, Socket.io events, state shapes, iOS gotchas
- `02_FEATURES.md` — every feature with implementation details and edge cases
- `03_UI_DESIGN.md` — design tokens, component specs, responsive behaviour, animations
- `04_WEBRTC_GUIDE.md` — step-by-step WebRTC code: getUserMedia, peer connection, ICE
- `05_DEPLOYMENT.md` — Vercel + Railway/Fly.io setup, PWA install, launch checklist

## Current Status
[FILL THIS IN each session — e.g. "Phase 1 is done. Starting Phase 2: group call mesh."]

## What I Need Right Now
[FILL THIS IN — e.g. "Build the VideoGrid component that handles 1–6 tiles with the grid layouts described in 02_FEATURES.md and the design tokens from 03_UI_DESIGN.md."]

## Constraints (always apply)
1. TypeScript only — no `any` unless annotated with `// TODO: type this`
2. Tailwind only — no CSS modules, no styled-components
3. All icon buttons must be 44×44px minimum (touch target)
4. Test mentally for iOS Safari: autoplay, permissions, no getDisplayMedia
5. Follow the UI design tokens from 03_UI_DESIGN.md exactly (colors, spacing, radius)
6. WebRTC: mesh only, no media server, max 6 peers before suggesting LiveKit upgrade
7. Socket events must match exactly the names in 01_ARCHITECTURE.md
```

---

## Tips for Getting the Best Results

**Be specific about what you want built.** Instead of:
> "Build the call screen"

Say:
> "Build the `VideoGrid` component. It should:
> - Accept an array of `PeerState` objects and a `localStream`
> - Render 1–6 video tiles using the grid layouts described in `02_FEATURES.md §1.3`
> - Each tile uses the `VideoTile` component
> - Self-view is a floating draggable tile, not in the grid
> - Use the design tokens from `03_UI_DESIGN.md` for colors and spacing
> - Animate tile enter/leave with the `tile-enter` keyframe in the design doc"

**Reference the doc sections.** The AI coder can't read the files itself — quote the relevant spec:
> "Implement mute toggle. When muted, the IconButton should use the danger state from `03_UI_DESIGN.md §CallControls Bar`: `background: rgba(255,95,95,0.15)`, border `rgba(255,95,95,0.3)`, icon color `var(--danger)`."

**Confirm Phase before asking.** Always tell the AI what phase you're in so it doesn't over-build or under-build.

**When something breaks:**
> "The VideoTile shows black for remote peers. Here's the component code: [paste]. According to `04_WEBRTC_GUIDE.md §Common Bugs`, this is likely because `srcObject` isn't being set. Here's the relevant hook code: [paste]. Fix it."
