# Chat Prompt Templates
## How to talk to your AI coder, task by task

Use these templates to get precise, high-quality output from your AI coder for each task in the build. Each template pre-loads the right context so the AI doesn't make assumptions.

---

## Template: Build a New Component

```
Build the `[ComponentName]` component for the Vide video calling app.

**Location:** `apps/web/components/[folder]/[ComponentName].tsx`

**What it does:**
[1-3 sentence description]

**Props:**
```typescript
interface [ComponentName]Props {
  // list props here
}
```

**Behaviour:**
- [bullet list of what it does]
- [edge cases to handle]

**Design spec (from 03_UI_DESIGN.md):**
- Background: `var(--bg-surface)` (#15171d)
- Border: `0.5px solid var(--border-subtle)` (rgba(255,255,255,0.06))
- Border radius: `var(--radius-lg)` (16px)
- Text primary: `var(--text-primary)` (#f0f0f2)
- Accent: `var(--accent)` (#7eb8ff) for active/focus states
- Danger: `var(--danger)` (#ff5f5f) for muted/off states
- [add any component-specific tokens from the design doc]

**Animation:**
- [e.g. "Tile enter: opacity 0→1, scale 0.92→1, 280ms, ease-out"]
- Respect `prefers-reduced-motion`

**Mobile requirements:**
- Minimum touch target: 44×44px for all interactive elements
- [any mobile-specific behaviour]

**iOS Safari notes:**
- [any iOS-specific gotchas for this component]

**Do not:**
- Use CSS modules or styled-components (Tailwind only)
- Use `any` TypeScript types
- Use fonts other than what's in the design spec
```

---

## Template: Build a Hook

```
Build the `[useHookName]` hook for the Vide video calling app.

**Location:** `apps/web/hooks/[useHookName].ts`

**Purpose:**
[What this hook abstracts / manages]

**Returns:**
```typescript
// Describe the return shape
{
  // values
  // action functions
}
```

**Implementation notes:**
- [key WebRTC/socket/browser API to use]
- [cleanup requirements — what must be cleaned up on unmount]
- [any async considerations]

**Edge cases to handle:**
- [e.g. "permission denied"]
- [e.g. "stream already exists, don't re-acquire"]
- [e.g. "iOS Safari: autoplay restrictions"]

**Related docs:**
- See `04_WEBRTC_GUIDE.md §[relevant section]` for implementation reference
- See `01_ARCHITECTURE.md §[relevant section]` for the data shapes used

**Do not:**
- Use `any` TypeScript types
- Forget cleanup in the `useEffect` return function
```

---

## Template: Add a Socket.io Event

```
Add a new Socket.io event pair to the Vide signaling system.

**Event name:** `[event:name]`

**Direction:** Client → Server → Broadcast to room (or: Client → Server → Specific client)

**Client emits:**
```typescript
socket.emit('[event:name]', {
  // payload shape
})
```

**Server handles in `apps/signaling/src/rooms.ts`:**
- Validate: [what to check]
- Action: [what to do]
- Emit to: [who receives — specific client, all in room, all except sender]

**Client receives:**
```typescript
socket.on('[event:name]', (payload) => {
  // update Zustand store or local state
})
```

**Add cleanup** in the client's `useEffect` return:
```typescript
socket.off('[event:name]')
```

**Reference:** Socket event naming convention = `noun:verb` as in `01_ARCHITECTURE.md §Socket.io Event Reference`
```

---

## Template: Debug a WebRTC Issue

```
I have a WebRTC bug in the Vide app. Help me debug it.

**Symptom:**
[What the user sees — e.g. "Remote video tile is black", "Audio cuts out on iOS"]

**What I've already checked:**
- [ ] `srcObject` is being set correctly
- [ ] `autoPlay playsInline muted` are on the `<video>` element
- [ ] Local stream tracks are added before `createOffer`
- [ ] ICE candidates are being exchanged (check browser console for ICE errors)
- [ ] TURN server credentials are set in env variables

**Relevant code:**
```typescript
// paste the hook / component code here
```

**Console errors (if any):**
[paste errors]

**Browser/device where it fails:**
[e.g. "Safari iOS 17 on iPhone 14"]

**Reference:** Check `04_WEBRTC_GUIDE.md §Common Bugs` for known fixes.
```

---

## Template: Implement a UI State / Layout

```
Implement the `[layout name]` layout for the Vide call screen.

**Layout spec (from 03_UI_DESIGN.md §[section]):**
[paste the relevant ASCII layout diagram from the design doc]

**Zustand state involved:**
- `uiStore.layout` = '[layout-name]'
- `uiStore.pinnedPeerId` — which peer is featured (null = active speaker)

**Grid CSS requirements:**
- [describe the CSS grid layout]
- Mobile (< 640px): [describe mobile variant]
- The large tile is [X]% of the container height

**VideoTile props in this layout:**
- Large tile: `size="large"` 
- Small strip tiles: `size="small"` (strip at bottom)
- All tiles still show name badge, mute indicator, speaking ring

**Switching to this layout:**
- User taps layout icon in top-right of call screen
- Animate tile resize with CSS transition (`width, height 220ms ease-out`)

**Do not:**
- Hard-code pixel values for tile sizes — use CSS grid fractions
- Remove the self-view floating tile (it stays regardless of layout)
```

---

## Template: Fix a Mobile Issue

```
Fix a mobile-specific issue in the Vide app.

**Device/browser:** [e.g. iPhone 14, Safari iOS 17]
**Issue:** [describe the problem]

**Mobile constraints to keep in mind:**
- Minimum touch target: 44×44px
- Safe area insets: use `env(safe-area-inset-bottom)` for controls bar padding
- iOS autoplay: video must be `muted` to autoplay; user gesture required to unmute
- iOS camera: `facingMode: 'user'` for front camera, `'environment'` for back
- iPhone PiP: `document.pictureInPictureEnabled` returns false on iPhone (true on iPad/desktop)
- iOS screen share: `navigator.mediaDevices.getDisplayMedia` is NOT available on iPhone Safari
- PWA: Use `standalone` display mode; test with "Add to Home Screen" not just browser

**Code to fix:**
```typescript
// paste relevant code
```
```

---

## Template: Add a New Page / Route

```
Add a new page to the Vide Next.js App Router.

**Route:** `/[route-path]`
**File:** `apps/web/app/[route-path]/page.tsx`

**Purpose:**
[What this page is for]

**Data needed:**
- [URL params, if any: `params.roomId` etc.]
- [Zustand stores accessed]
- [Socket.io events triggered on mount]

**Loading state:**
[What to show while data loads]

**Error state:**
[What to show if something goes wrong — e.g. invalid room ID]

**Design:**
- Background: `var(--bg-base)` (#0d0e12) — dark full-screen
- Follow the existing page structure from `app/[roomId]/page.tsx`
- Must be responsive — mobile first

**Navigation:**
- On success: navigate to [route]
- On error/back: navigate to [route]
```

---

## Quick Reference: Common Patterns

### Add a feature flag (dev only)
```typescript
const ENABLE_VIRTUAL_BG = process.env.NEXT_PUBLIC_ENABLE_VIRTUAL_BG === 'true'
```

### Dynamic import for heavy features
```typescript
const VirtualBackground = dynamic(() => import('@/components/call/VirtualBackground'), {
  ssr: false,
  loading: () => <Skeleton />,
})
```

### Detect iOS Safari
```typescript
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
const isIOSSafari = isIOS && isSafari
```

### Detect PWA standalone mode
```typescript
const isPWA = window.matchMedia('(display-mode: standalone)').matches
```

### Toast notification (use `react-hot-toast`)
```typescript
import toast from 'react-hot-toast'
toast.success('Link copied!')
toast.error('Could not connect')
```

### Copy to clipboard
```typescript
const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href)
    toast.success('Link copied!')
  } catch {
    // Fallback for older browsers
    const el = document.createElement('textarea')
    el.value = window.location.href
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    toast.success('Link copied!')
  }
}
```
