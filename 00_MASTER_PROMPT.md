# VIDE — Video Calling Web App
## Master Project Prompt for AI Coder

---

## What You Are Building

**Vide** is a browser-native video calling Progressive Web App (PWA) that rivals WhatsApp Video, FaceTime, and Google Meet in features — but requires zero installation. Users open a URL, share the link, and call. It works on desktop, iPhone, and Android out of the box.

This is a personal project. The priority is: **working fast, clean code, great UX, and zero friction for the end user.**

---

## Core Philosophy

1. **No installs.** The app must work entirely in the browser. No App Store. No Play Store. PWA add-to-home-screen is the only "install" path.
2. **Link = room.** Every call has a unique URL. Share the URL, join the call. No accounts required to join.
3. **Mobile-first.** Design and test for iPhone Safari and Android Chrome first. Desktop is secondary.
4. **Feels premium.** Interactions should feel as polished as native apps — smooth animations, instant feedback, dark UI.

---

## Tech Stack (Non-Negotiable)

| Layer | Choice | Reason |
|---|---|---|
| Framework | **Next.js 14 (App Router)** | SSR, PWA, file-based routing |
| Language | **TypeScript** | Type safety throughout |
| Styling | **Tailwind CSS** | Utility-first, fast iteration |
| Real-time signaling | **Socket.io** (Node.js server) | Room management, peer discovery |
| Media engine | **WebRTC native** (mesh, ≤6 peers) | No media server cost for personal use |
| Media engine (scale) | **LiveKit SDK** (optional upgrade path) | Drop-in if >6 peers needed |
| State management | **Zustand** | Lightweight, no boilerplate |
| PWA | **next-pwa** plugin | Service worker, offline shell, add to home screen |
| Hosting (frontend) | **Vercel** | Zero-config Next.js deployment |
| Hosting (signaling) | **Railway** or **Fly.io** | Always-on Node.js, free tier available |
| STUN/TURN | **Metered.ca** free tier | NAT traversal for mobile networks |

---

## Repository Structure

```
/
├── apps/
│   ├── web/                  # Next.js PWA (this is the main app)
│   │   ├── app/
│   │   │   ├── page.tsx              # Landing / home page
│   │   │   ├── [roomId]/
│   │   │   │   └── page.tsx          # Call room page
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── call/
│   │   │   │   ├── VideoGrid.tsx         # Responsive tile grid
│   │   │   │   ├── VideoTile.tsx         # Single participant tile
│   │   │   │   ├── CallControls.tsx      # Bottom action bar
│   │   │   │   ├── LayoutSwitcher.tsx    # Grid / spotlight toggle
│   │   │   │   ├── PiPWindow.tsx         # Picture-in-Picture
│   │   │   │   ├── ParticipantPanel.tsx  # Side drawer: participant list
│   │   │   │   ├── ChatPanel.tsx         # Side drawer: in-call chat
│   │   │   │   ├── ScreenShareView.tsx   # Screen share display
│   │   │   │   └── WaitingRoom.tsx       # Pre-call lobby
│   │   │   ├── ui/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── IconButton.tsx
│   │   │   │   ├── Tooltip.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   └── Modal.tsx
│   │   │   └── home/
│   │   │       ├── HeroSection.tsx
│   │   │       └── JoinForm.tsx
│   │   ├── hooks/
│   │   │   ├── useWebRTC.ts           # Core WebRTC logic
│   │   │   ├── useLocalMedia.ts       # Camera/mic management
│   │   │   ├── useRoom.ts             # Room state via Socket.io
│   │   │   ├── useScreenShare.ts      # Screen capture
│   │   │   ├── usePiP.ts              # Picture-in-Picture API
│   │   │   └── useDevices.ts          # Enumerate media devices
│   │   ├── store/
│   │   │   ├── callStore.ts           # Zustand: call state
│   │   │   └── uiStore.ts             # Zustand: panel visibility, layout
│   │   ├── lib/
│   │   │   ├── socket.ts              # Socket.io client singleton
│   │   │   ├── webrtc.ts              # RTCPeerConnection helpers
│   │   │   ├── roomId.ts              # Generate / validate room IDs
│   │   │   └── stunConfig.ts          # ICE server config
│   │   └── public/
│   │       ├── manifest.json
│   │       └── icons/
│   └── signaling/                # Node.js Socket.io server
│       ├── src/
│       │   ├── index.ts
│       │   ├── rooms.ts              # Room registry (in-memory)
│       │   └── events.ts             # Socket event handlers
│       └── package.json
├── docs/                       # This documentation
│   ├── 00_MASTER_PROMPT.md     ← You are here
│   ├── 01_ARCHITECTURE.md
│   ├── 02_FEATURES.md
│   ├── 03_UI_DESIGN.md
│   ├── 04_WEBRTC_GUIDE.md
│   └── 05_DEPLOYMENT.md
└── package.json                # Monorepo root (pnpm workspaces)
```

---

## Development Phases

### Phase 1 — Core Call (Build First)
- [ ] Landing page with "Create room" and "Join room" input
- [ ] Room page at `/[roomId]`
- [ ] WebRTC 1-on-1 video/audio
- [ ] Signaling server (Socket.io)
- [ ] Mute mic / toggle camera controls
- [ ] End call button
- [ ] Self-view tile (moveable, bottom-right)
- [ ] Copy invite link

### Phase 2 — Group Call
- [ ] 3–6 participant mesh WebRTC
- [ ] Responsive grid layout (auto-tile)
- [ ] Spotlight / pin a participant
- [ ] Active speaker detection
- [ ] Participant list panel

### Phase 3 — Features
- [ ] In-call text chat
- [ ] Screen sharing
- [ ] Picture-in-Picture (PiP)
- [ ] Device selector (camera/mic/speaker)
- [ ] Waiting room / lobby with pre-call preview
- [ ] Room password / PIN protection

### Phase 4 — Polish
- [ ] Virtual background / blur (MediaPipe or TensorFlow.js)
- [ ] Connection quality indicator
- [ ] Local recording (MediaRecorder API)
- [ ] Reactions / raise hand
- [ ] Low-data mode
- [ ] PWA installability + offline shell

---

## Key Constraints for AI Coder

1. **Always use TypeScript.** No `any` types unless absolutely necessary (annotate with `// TODO: type this`).
2. **Mobile Safari is the hardest target.** Test WebRTC, autoplay, and PWA behaviour for iOS 16+.
3. **No media server costs.** Use mesh WebRTC. Only suggest LiveKit if >6 peers are genuinely needed.
4. **Self-view never blocks other video tiles.** It floats, draggable, corner-anchored.
5. **All media permissions must be requested gracefully** — show a friendly permissions screen if denied.
6. **Socket.io signaling is stateless per restart.** The server holds room state in memory. On disconnect, clean up peers.
7. **STUN/TURN config lives in environment variables.** Never hardcode ICE server credentials.
8. **Tailwind only for styling.** No CSS modules. No styled-components.

---

## Environment Variables

```env
# apps/web/.env.local
NEXT_PUBLIC_SIGNALING_URL=http://localhost:4000
NEXT_PUBLIC_STUN_URL=stun:stun.metered.ca:80
NEXT_PUBLIC_TURN_URL=turn:standard.relay.metered.ca:80
NEXT_PUBLIC_TURN_USERNAME=your_username
NEXT_PUBLIC_TURN_CREDENTIAL=your_credential

# apps/signaling/.env
PORT=4000
CLIENT_ORIGIN=http://localhost:3000
```

---

## Naming Conventions

- **Components**: PascalCase (`VideoTile.tsx`)
- **Hooks**: camelCase prefixed with `use` (`useWebRTC.ts`)
- **Store slices**: camelCase suffixed with `Store` (`callStore.ts`)
- **Socket events**: `snake_case` strings (`"peer:joined"`, `"signal:offer"`)
- **CSS classes**: Tailwind utilities only; custom classes in `globals.css` sparingly

---

## Definition of Done (per feature)

A feature is done when:
1. It works on Chrome desktop
2. It works on Safari iOS 16+ (real device or BrowserStack)
3. It works on Chrome Android
4. TypeScript has no errors (`pnpm tsc --noEmit` passes)
5. The feature matches the UI spec in `03_UI_DESIGN.md`
