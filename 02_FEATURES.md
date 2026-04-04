# Features Specification
## Vide — Video Calling PWA

Each feature is described with: what it does, how to implement it, and edge cases to handle.

---

## Phase 1: Core Call

---

### 1.1 Landing Page

**What it does:** Entry point. User can create a new room or join an existing one via URL or room code.

**Implementation:**
- Generate a random room ID with `nanoid(10)` on "New Call" click
- Navigate to `/[roomId]` immediately — room is created lazily on first join
- "Join by code" input accepts a room ID or full URL (parse the ID from URL if pasted)
- Show recent rooms from `localStorage` (last 5, with display names and timestamps)

**Edge cases:**
- Empty room ID input → show inline error
- Room ID from URL that doesn't exist → server creates it on first join
- Paste a full URL → extract just the ID

---

### 1.2 Waiting Room (Pre-call Lobby)

**What it does:** Before joining, user sees their own camera preview, can set their display name, and toggle camera/mic.

**Implementation:**
- `useLocalMedia` hook acquires `getUserMedia` here, not on the call screen
- Preview their own video stream in a mirrored `<video>` element
- Display name stored in `localStorage` and pre-filled on return visits
- "Join Call" button emits `room:join` to signaling server

**Edge cases:**
- Camera/mic permission denied → show a friendly "Allow camera access" state with instructions per browser
- No camera → allow audio-only join (show avatar instead of video)
- Room requires PIN → show PIN input field in waiting room

---

### 1.3 Video Grid

**What it does:** Shows all participants as video tiles in a responsive grid.

**Implementation:**

Grid layouts by participant count:
```
1 peer  → self full screen, remote centered (or 2-tile side by side)
2 peers → 2 equal tiles, side by side (landscape) or stacked (portrait)
3 peers → 1 large + 2 small below, OR equal 3-column
4 peers → 2×2 grid
5 peers → 3 top + 2 bottom
6 peers → 3×2 grid
7+ peers → scrollable grid, 3-wide
```

- Each tile is `VideoTile` component
- Tiles use CSS Grid with `auto-fit` and `minmax`
- On mobile portrait: stack tiles vertically, maximum 2 columns
- Tiles resize dynamically when participants join/leave (animate with CSS transition)

**VideoTile component:**
- `<video>` element with `autoplay muted playsInline` (all three required for iOS)
- Participant name badge (bottom-left)
- Muted indicator icon (bottom-right, visible when they're muted)
- Camera-off state: show avatar with initials on dark background
- Speaking indicator: animated border ring (use AudioContext for volume detection)
- Long-press (mobile) or right-click (desktop) → context menu: "Pin to spotlight", "Remove" (host only)

---

### 1.4 Self-View Tile

**What it does:** Shows the user their own video, always visible but unobtrusive.

**Implementation:**
- Floating tile, fixed position, defaults to bottom-right corner
- Draggable to any corner (snap to nearest corner on drag end)
- Mirrored horizontally (CSS `transform: scaleX(-1)`)
- Smaller than remote tiles (approximately 1/5 the screen height)
- "Hide self-view" button appears on hover/tap
- When camera is off, shows initials avatar

**Edge cases:**
- On tiny screens (iPhone SE), make it even smaller (20% of viewport height max)
- Doesn't overlap call controls bar at the bottom
- Dragging is disabled during screen share (snap to fixed corner)

---

### 1.5 Call Controls Bar

**What it does:** The primary action bar at the bottom of the call screen.

**Buttons (left to right on desktop, icon + label on mobile):**

| Button | States | Action |
|---|---|---|
| Mic | Active / Muted | Toggle microphone. Shows red indicator when muted. |
| Camera | Active / Off | Toggle camera. Shows red indicator when off. |
| Screen Share | Inactive / Sharing | Start/stop screen capture |
| Chat | Normal / Unread badge | Open/close chat panel |
| Participants | Normal / count badge | Open/close participant list |
| More (⋯) | — | Overflow menu: device settings, effects, record |
| End Call | — | Leave room, return to home |

**Implementation:**
- Fixed at bottom of viewport, above safe area (handle iPhone notch)
- Semi-transparent dark background with backdrop blur
- On mobile, auto-hide after 3 seconds of inactivity; tap screen to reveal
- Keyboard shortcuts on desktop: `M` = mute, `V` = camera, `S` = screen share, `C` = chat

---

### 1.6 Invite Link

**What it does:** Lets the host share the room URL with others.

**Implementation:**
- "Copy Link" button in participant panel and waiting room
- Uses `navigator.clipboard.writeText(window.location.href)`
- Show toast "Link copied!" for 2 seconds
- Fallback: select + copy if clipboard API unavailable (rare)
- Optional: QR code modal for the room URL (use `qrcode` npm package)

---

## Phase 2: Group Call

---

### 2.1 Mesh WebRTC for Multiple Peers

**What it does:** Each peer connects directly to every other peer.

**Implementation:**
- On `room:new_peer` event: create a new `RTCPeerConnection`, add local tracks, create offer
- On `room:peers` (list of existing peers on join): create connections to all existing peers
- Store connections in `callStore.connections` map keyed by `socketId`
- On `room:peer_left`: close and delete that peer's `RTCPeerConnection`, remove from grid

**Scaling note:**
- 2 peers = 1 connection each
- 4 peers = 3 connections each
- 6 peers = 5 connections each — practical limit for mesh
- Beyond 6: suggest switching to LiveKit (document this as a `TODO` comment in code)

---

### 2.2 Layout Switcher

**What it does:** Lets user switch between view modes.

**Modes:**

1. **Grid** (default) — equal-size tiles, auto-layout by count
2. **Spotlight** — one large tile (pinned or active speaker), small tiles in a row below
3. **Sidebar** — active speaker fills screen, others in scrollable sidebar column (desktop only)

**Implementation:**
- `uiStore.layout` drives which layout component renders
- Layout switcher button in top-right of call screen (icon buttons, no labels)
- Persist layout preference in `localStorage`
- On mobile, only offer Grid and Spotlight (Sidebar is desktop-only)

---

### 2.3 Pin / Spotlight a Participant

**What it does:** Lock a specific participant as the main focus.

**Implementation:**
- Tap a tile → show overlay with "Pin" button (or long-press on mobile)
- Pinned peer shown large in Spotlight layout regardless of who is speaking
- Unpin by tapping the tile again or tapping "Unpin" overlay
- Visual indicator on pinned tile (pin icon badge)
- Only one peer can be pinned at a time

---

### 2.4 Active Speaker Detection

**What it does:** Automatically highlight or bring forward whoever is talking.

**Implementation:**
- Use `RTCPeerConnection.getStats()` polled every 500ms for audio level
- Alternatively: use the Web Audio API `AnalyserNode` on remote streams
- `activeSpeakerId` in `uiStore` updates to the loudest speaker
- In Grid layout: subtle glowing border ring on active speaker's tile
- In Spotlight layout (when no pin): active speaker auto-becomes the main tile
- Add 1.5s debounce to prevent rapid switching

---

## Phase 3: Features

---

### 3.1 In-Call Chat

**What it does:** Text chat visible to all participants during a call.

**Implementation:**
- Slide-in panel from the right (desktop) or bottom sheet (mobile)
- Messages relayed via Socket.io (not data channels)
- Message structure: `{ id, from: socketId, displayName, text, timestamp }`
- Unread badge on Chat button when panel is closed and new messages arrive
- Timestamps shown as relative time ("just now", "2 min ago")
- Auto-scroll to latest message
- Press Enter to send; Shift+Enter for newline

**Edge cases:**
- Panel open state persists for the session
- Messages are not persisted — lost on refresh (by design, no backend storage)
- Max message length: 500 characters (enforce client + server side)

---

### 3.2 Screen Sharing

**What it does:** Share your screen, a window, or a browser tab.

**Implementation:**
```typescript
// hooks/useScreenShare.ts
const stream = await navigator.mediaDevices.getDisplayMedia({
  video: { frameRate: 30, displaySurface: 'monitor' },
  audio: true // "Share audio" checkbox in browser dialog
})
```

- Replace video track in all existing `RTCPeerConnection`s with screen track
- Broadcast `peer:screen_share { sharing: true }` to room
- When sharing: remote viewers see a `ScreenShareView` component (full-width, no aspect-ratio crop)
- When sharing: sharer's self-view shows their camera (not their own screen)
- On stop (user clicks browser's native "Stop sharing"): listen to `stream.getVideoTracks()[0].onended` → auto-switch back to camera

**iOS:** `getDisplayMedia` is not available on iPhone Safari. Hide the button on iOS and show "Screen sharing is not available on iOS" tooltip.

---

### 3.3 Picture-in-Picture (PiP)

**What it does:** Float a small call window while the user navigates to other apps/tabs.

**Implementation:**
- Use the [Document Picture-in-Picture API](https://developer.chrome.com/docs/web-platform/document-picture-in-picture/) for full PiP window (Chrome 116+)
- Fallback: use `video.requestPictureInPicture()` on the remote video element for video-only PiP
- PiP window shows: active speaker video, mute/end call buttons
- Detect support: `'documentPictureInPicture' in window`
- PiP button in call controls bar, only shown when API is supported

---

### 3.4 Device Selector

**What it does:** Let users choose their camera, microphone, and speaker.

**Implementation:**
```typescript
// hooks/useDevices.ts
const devices = await navigator.mediaDevices.enumerateDevices()
// Returns: audioinput, videoinput, audiooutput
```

- Modal triggered from "More" menu (⋯)
- Show dropdowns for each device type
- On change: call `stream.getAudioTracks()[0].applyConstraints({ deviceId })` or get new stream
- Speaker selection: use `audioElement.setSinkId(deviceId)` — not available on iOS (hide it)
- Remember last selected devices in `localStorage`

---

### 3.5 Room PIN Protection

**What it does:** Protect a room so only people with the PIN can join.

**Implementation:**
- Host sets PIN in waiting room before joining ("Secure this call" toggle + 4-6 digit input)
- PIN is sent as part of `room:join` event
- Server validates PIN and emits `room:error { code: 'WRONG_PIN' }` on failure
- PIN is stored as SHA-256 hash on the server (never plaintext)
- Clients without the correct PIN see a "Incorrect PIN" error in waiting room

---

## Phase 4: Polish

---

### 4.1 Virtual Background / Blur

**What it does:** Replace or blur the user's background.

**Implementation:**
- Use `@mediapipe/selfie_segmentation` (MediaPipe via CDN)
- Or use `@tensorflow-models/body-segmentation` (heavier but accurate)
- Process video frames on a `<canvas>`, output canvas stream via `captureStream()`
- Options: Blur (light/heavy), Solid color, Custom image upload
- Performance-heavy — test on mid-range phones. Add "Low performance" warning.
- Gate behind a "Effects" button in the More menu.

---

### 4.2 Connection Quality Indicator

**What it does:** Show each participant's network quality.

**Implementation:**
- Poll `RTCPeerConnection.getStats()` every 2 seconds
- Extract: `packetsLost`, `jitter`, `roundTripTime`
- Map to 3 states: Good (green), Fair (yellow), Poor (red)
- Show as colored dot on each video tile
- Show own connection quality in the controls bar

---

### 4.3 Local Recording

**What it does:** Record the call locally to the user's device.

**Implementation:**
```typescript
// Capture composited stream (all tiles) from a canvas, or just local stream
const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm;codecs=vp9' })
recorder.ondataavailable = (e) => chunks.push(e.data)
recorder.onstop = () => {
  const blob = new Blob(chunks, { type: 'video/webm' })
  const url = URL.createObjectURL(blob)
  // Trigger download
}
```

- Recording button in "More" menu (⋯)
- Red recording indicator badge visible to all in the room (broadcast via Socket.io)
- On stop: auto-download as `vide-recording-[timestamp].webm`
- Note: this records only the local user's view

---

### 4.4 Reactions

**What it does:** Quick emoji reactions visible to all participants.

**Reactions available:** 👍 ❤️ 😂 😮 👏 🎉

**Implementation:**
- Row of reaction buttons in a popover above the controls bar
- Click sends `{ emoji, from: displayName }` via Socket.io
- Floating emoji animation: emoji floats up from the sender's tile and fades out
- Also show text like "Alice 👍" in a toast for 3 seconds
- Raise Hand: special persistent reaction; shows hand icon badge on tile until dismissed

---

## Cross-Cutting Concerns

### Permissions UX

When camera/mic are denied:
- Never show a generic browser error
- Show a friendly screen explaining exactly how to grant permissions for their browser
- Detect browser: Chrome, Safari, Firefox — show browser-specific instructions
- Link to browser settings deep-link where possible

### Responsive Breakpoints

| Breakpoint | Behaviour |
|---|---|
| `< 640px` (mobile) | Single column tiles, bottom sheet panels, auto-hide controls |
| `640–1024px` (tablet) | 2-column grid, side panel overlays |
| `> 1024px` (desktop) | Full grid, persistent side panels, keyboard shortcuts |

### Accessibility

- All icon buttons must have `aria-label`
- Video tiles have `aria-label="[Name]'s video"` 
- Muted state announced via `aria-live` region
- Focus management: when panels open/close, focus moves to the first interactive element
- Respect `prefers-reduced-motion` — disable tile transition animations

### Performance

- Video tiles use `will-change: transform` only while animating
- Use `React.memo` on `VideoTile` to prevent unnecessary re-renders
- Debounce active speaker detection (500ms)
- Lazy load heavy features (virtual bg, recording) with dynamic `import()`
