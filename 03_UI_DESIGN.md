# UI Design Specification
## Vide — Video Calling PWA

---

## Design Direction

**Aesthetic:** Dark, focused, cinematic. The UI recedes so the people fill the screen.

Think: Signal × Arc Browser × a high-end video monitoring suite. Not corporate. Not playful. **Confident and minimal.**

- Dark backgrounds, never pure black — use deep navy-charcoal
- Video tiles are the hero — UI chrome is secondary
- Controls appear when needed, disappear when not
- Micro-animations everywhere but never distracting
- Single accent color: electric blue-white (`#7EB8FF` → used sparingly for active states)

---

## Design Tokens

```css
/* colors */
--bg-base:        #0d0e12;   /* main background */
--bg-surface:     #15171d;   /* tiles, panels */
--bg-elevated:    #1e2028;   /* modals, dropdowns */
--bg-hover:       #252830;   /* hover states */

--text-primary:   #f0f0f2;   /* main text */
--text-secondary: #8b8d96;   /* labels, secondary */
--text-tertiary:  #4e5060;   /* placeholders, hints */

--accent:         #7eb8ff;   /* primary interactive (active state, focus ring) */
--accent-dim:     #3d6ea8;   /* accent at lower intensity */
--danger:         #ff5f5f;   /* mute on, camera off, end call */
--success:        #4caf7d;   /* speaking indicator, connected */
--warning:        #f0a732;   /* poor connection, PIN required */

--border-subtle:  rgba(255,255,255,0.06);
--border-default: rgba(255,255,255,0.12);
--border-strong:  rgba(255,255,255,0.22);

/* spacing */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 24px;
--space-6: 32px;
--space-8: 48px;

/* radius */
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 16px;
--radius-xl: 24px;
--radius-full: 9999px;

/* typography */
--font-sans: 'Inter Variable', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* motion */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
--duration-fast: 120ms;
--duration-base: 220ms;
--duration-slow: 380ms;
```

**Font:** Use `Inter Variable` from Google Fonts. It's reliable, legible at small sizes on video overlays.

---

## Screen Layouts

### Home / Landing Page

```
┌────────────────────────────────────┐
│  ·  vide           [Sign in? No.]  │  ← minimal top bar
│                                    │
│                                    │
│         Video calls.               │  ← headline, large
│         No installs.               │
│                                    │
│   ┌──────────────────────────┐     │
│   │  New Call                │     │  ← primary CTA, full width
│   └──────────────────────────┘     │
│                                    │
│   ┌──────────────────┐  [Join →]   │  ← join by code input
│   │  Enter room code │            │
│   └──────────────────┘            │
│                                    │
│   Recent calls:                    │  ← only if localStorage has history
│   · Daily standup    2h ago        │
│   · Alice & Bob      Yesterday     │
└────────────────────────────────────┘
```

**Behaviour:**
- "New Call" generates a room ID and navigates to `/[roomId]`
- Background: subtle animated gradient (dark navy mesh, very slow, 30s loop)
- Above-the-fold on all phone sizes with no scroll needed

---

### Waiting Room (Pre-call)

```
┌────────────────────────────────────┐
│  ← Back                            │
│                                    │
│  ┌──────────────────────────────┐  │
│  │                              │  │
│  │   [Your camera preview]      │  │  ← 16:9, rounded corners, mirrored
│  │                              │  │
│  │  ● ○  Cam  |  Mic           │  │  ← overlay controls inside preview
│  └──────────────────────────────┘  │
│                                    │
│  Your name                         │
│  ┌──────────────────────────────┐  │
│  │  Alex                        │  │  ← pre-filled from localStorage
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │     Join Call                │  │  ← accent button
│  └──────────────────────────────┘  │
│                                    │
│  Room: vide.app/x7k2p9mq1n  [copy] │
└────────────────────────────────────┘
```

---

### Call Screen — Grid Layout (4 participants)

```
┌────────────────────────────────────┐
│ [time]  vide  [participants:4] [⋮] │  ← top bar (auto-hides)
├──────────────┬─────────────────────┤
│              │                     │
│   Alice      │   Bob               │
│   (video)    │   (video)           │
│              │                     │
├──────────────┼─────────────────────┤
│              │                     │
│   Carol      │   You    ← self     │
│   (video)    │   (mirrored)        │
│              │                     │
└───────┬──────┴──────┬──────────────┘
        │  CONTROLS   │
  [🎤] [📷] [🖥] [💬] [👥] [⋯]  [✕ End]
```

**Self-view note:** On mobile (< 640px), self-view is the floating draggable tile (not in the grid). On desktop/tablet, it can be in the grid or floating — user preference.

---

### Call Screen — Spotlight Layout

```
┌────────────────────────────────────┐
│ [time]  vide  [⊞] [sidebar]  [⋮] │
├────────────────────────────────────┤
│                                    │
│                                    │
│         Alice (pinned)             │  ← 75% of screen
│         (large video)              │
│                                    │
│                                    │
├──────┬──────┬──────┬───────────────┤
│ Bob  │Carol │ You  │               │  ← 25% height strip
│      │      │      │               │
└──────┴──────┴──────┴───────────────┘
  [🎤] [📷] [🖥] [💬] [👥] [⋯] [✕]
```

---

### Mobile Portrait (Call Screen)

```
┌───────────────────┐
│       Bob         │  ← remote, full width
│    (video)        │
│                   │
│                   │
│                   │
│              ┌──┐ │  ← self-view, floating corner tile
│              │You│ │     draggable, ~22% width
│              └──┘ │
│                   │
│ [🎤][📷][🖥][💬][✕] │  ← controls, always accessible
└───────────────────┘
```

---

## Component Design

### VideoTile

```
┌────────────────────────────────────┐
│                                    │
│      [video stream or avatar]      │
│                                    │
│  ┌──────────────────┐  ┌────────┐  │
│  │ 👤 Alice Cooper  │  │  🔇   │  │  ← name badge  │  mute icon
│  └──────────────────┘  └────────┘  │
└────────────────────────────────────┘
     ↑ speaking ring (--success border, animated pulse)
```

**Tile states:**
- **Normal:** dark bg, video playing, name badge bottom-left
- **Speaking:** `box-shadow: 0 0 0 2px var(--success)` with subtle pulse animation
- **Muted:** microphone-off icon badge bottom-right
- **Camera off:** dark bg, centered initials avatar (circular, colored by name hash)
- **Poor connection:** faint `--warning` border, quality dot badge top-right
- **Pinned:** pin icon badge top-left, `--accent` outline
- **Screen sharing:** "sharing" badge top-left, wide-format view

**Avatar when camera is off:**
- Circle, diameter = 25% of tile height (minimum 40px)
- Background color: deterministic from display name hash (use one of 8 muted colors)
- Initials: first letter of first + last name, or first two letters if single name
- Font: `--font-sans`, medium weight, white

---

### CallControls Bar

```css
/* The bar */
.controls-bar {
  position: fixed;
  bottom: 0;
  width: 100%;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  background: linear-gradient(to top, rgba(13,14,18,0.95) 60%, transparent);
  backdrop-filter: blur(12px);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}
```

**Icon Button — Default State:**
- Size: 44×44px (touch-friendly minimum)
- Background: `var(--bg-elevated)` 
- Border: 0.5px `var(--border-subtle)`
- Border-radius: `var(--radius-full)` (circle)
- Icon: 20px, `var(--text-secondary)`
- Hover: `var(--bg-hover)`, icon → `var(--text-primary)`
- Transition: `background var(--duration-fast) var(--ease-out)`

**Icon Button — Active/On State:**
- Background: `var(--bg-hover)`
- Icon: `var(--text-primary)`

**Icon Button — Danger/Off State (mic muted, camera off):**
- Background: `rgba(255, 95, 95, 0.15)`
- Border: 0.5px `rgba(255, 95, 95, 0.3)`
- Icon: `var(--danger)`

**End Call Button:**
- Width: 64px, height: 44px (wider than icon buttons)
- Background: `var(--danger)`
- Icon: phone-down, white
- Hover: slightly brighter red
- On press: scale(0.95)

**Badge (unread chat / participant count):**
- Absolute position, top-right of button
- Size: 16px circle
- Background: `var(--accent)`
- Font: 10px, white, bold
- Numbers > 9 show as "9+"

---

### Side Panel (Chat / Participants)

**Desktop:**
- Slides in from the right, width: 320px
- Pushes the video grid (grid shrinks to fill remaining space)
- Has a close button (×) top-right

**Mobile:**
- Bottom sheet, slides up from bottom
- Height: 65% of viewport
- Drag handle at top
- Dismissible by swipe down or backdrop tap

```css
.panel {
  background: var(--bg-surface);
  border-left: 0.5px solid var(--border-subtle);  /* desktop */
  /* mobile: border-radius top only, border-top */
}
```

---

### Chat Panel Messages

```
┌──────────────────────────────┐
│ Chat                    [×]  │  ← header
├──────────────────────────────┤
│                              │
│  Alice     10:32 am          │  ← other participant
│  Hey, can you hear me?       │
│                              │
│                 You  10:33   │  ← self, right-aligned
│           Yes! Loud and clear│
│                              │
│  Bob       10:33 am          │
│  Great! Let's start.         │
│                              │
└──────────────────────────────┘
│  ┌────────────────────────┐  │
│  │  Type a message...     │  │  ← input, fixed at bottom
│  └────────────────────────┘  │
```

Message bubbles:
- Other: left-aligned, no bubble — just text with name + time above
- Self: right-aligned, subtle `var(--bg-elevated)` bubble

---

### Waiting Room — Permission Denied State

```
┌────────────────────────────────────┐
│                                    │
│    🎥 ← icon (large, 48px)         │
│                                    │
│   Camera access needed             │  ← heading
│                                    │
│   To join the call, allow Vide     │
│   to use your camera and mic.      │
│                                    │
│   In Chrome:                       │
│   Settings → Privacy → Camera       │
│   → Allow vide.app                 │
│                                    │
│   ┌──────────────────────────────┐ │
│   │  Try Again                   │ │  ← calls getUserMedia again
│   └──────────────────────────────┘ │
│                                    │
│   Or join without camera  →        │  ← text link, audio only
└────────────────────────────────────┘
```

---

## Motion Design

### Tile enter/leave animation
```css
@keyframes tile-enter {
  from { opacity: 0; transform: scale(0.92); }
  to   { opacity: 1; transform: scale(1); }
}
/* duration: 280ms, ease: var(--ease-out) */
```

### Speaking ring pulse
```css
@keyframes speaking-pulse {
  0%, 100% { box-shadow: 0 0 0 2px var(--success); }
  50%       { box-shadow: 0 0 0 4px var(--success); }
}
/* duration: 800ms, ease: ease-in-out, iterations: infinite */
```

### Controls bar auto-hide
- Fade out after 3s of no mouse movement or touch (on mobile only)
- `opacity: 0; pointer-events: none` transition over 300ms
- Instantly visible on any mouse move / touch

### Panel slide-in (desktop)
```css
.panel-enter { transform: translateX(100%); }
.panel-enter-active { transform: translateX(0); transition: transform 280ms var(--ease-out); }
```

### Emoji reaction float
```css
@keyframes reaction-float {
  0%   { opacity: 1; transform: translateY(0) scale(1); }
  80%  { opacity: 1; transform: translateY(-80px) scale(1.2); }
  100% { opacity: 0; transform: translateY(-100px) scale(0.8); }
}
/* duration: 2s, ease: ease-out */
```

**Respect `prefers-reduced-motion`:** All animations wrapped in:
```css
@media (prefers-reduced-motion: no-preference) {
  /* animation rules here */
}
```

---

## Iconography

Use **Lucide React** (`lucide-react`) for all icons. Consistent 20px size, 1.5px stroke weight.

| Action | Icon |
|---|---|
| Mic on | `Mic` |
| Mic muted | `MicOff` |
| Camera on | `Video` |
| Camera off | `VideoOff` |
| Screen share | `Monitor` |
| Screen share active | `MonitorOff` |
| Chat | `MessageSquare` |
| Participants | `Users` |
| End call | `PhoneOff` |
| More options | `MoreHorizontal` |
| Layout grid | `LayoutGrid` |
| Spotlight | `Maximize2` |
| Pin | `Pin` |
| Copy link | `Link` |
| Settings / devices | `Settings` |
| Record | `Circle` (red fill when recording) |
| Close | `X` |
| Back | `ChevronLeft` |

---

## Responsive Behaviour Summary

| Screen | Layout | Controls | Self-view | Panels |
|---|---|---|---|---|
| ≥1280px (desktop) | Grid or Sidebar | Persistent | Floating OR in grid | Persistent sidebar |
| 768–1279px (tablet) | Grid or Spotlight | Persistent | Floating | Overlay |
| <768px (mobile) | Grid or Spotlight | Auto-hide, tap to show | Floating, draggable | Bottom sheet |
| <400px (small phone) | Stacked single-column | Auto-hide | Tiny floating tile | Bottom sheet |

---

## Dark / Light Mode

The app is **dark-mode only** for v1. Rationale: video calling UI universally uses dark themes because:
1. Dark UI reduces screen light hitting the user's face on camera
2. Videos pop more against dark backgrounds
3. Easier to implement correctly without a light/dark toggle

Add a light mode only if explicitly requested as a feature.
