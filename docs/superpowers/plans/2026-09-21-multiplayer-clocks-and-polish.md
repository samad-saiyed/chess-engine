# Multiplayer (P2P WebRTC), Clocks & UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement serverless peer-to-peer multiplayer (`/friends`), integrated chess clocks with time controls (Bullet, Blitz, Rapid, Custom), and refine board arrow graphics to professional chess.com standards.

**Architecture:** WebRTC DataChannels with self-contained SDP compression for zero-cost P2P multiplayer; Zustand-driven millisecond-accurate timer loop for chess clocks; responsive SVG vector rendering with rounded bevels and sleek arrowheads for board annotations.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Zustand, WebRTC (`RTCPeerConnection`, `RTCDataChannel`), `@blobatar/react`, Lucide React, Tailwind CSS 4.

**Spec:** [`SPEC.md`](file:///d:/PROJECTS/chess-engine/SPEC.md), [`ROADMAP.md`](file:///d:/PROJECTS/chess-engine/ROADMAP.md)

## Global Constraints
- Preserve the Dark Aurora color scheme (`oklch(0.145 0 0)` background, `oklch(0.52 0.105 172.5)` teal accents, `bg-stone-200` / `bg-emerald-800` board squares).
- Zero external server dependencies (purely client-side serverless P2P).
- Strictly maintain identical board (`max-w-160`) and sidebar (`max-w-md`) geometry across `/`, `/play`, and `/friends`.
- Strictly no AI-generated buzzwords ("Powered by AI", "AI engine", etc.).

## Review Focus
1. Handling WebRTC connection drop or reconnection failure gracefully without crashing the UI.
2. Clock time sync: preventing race conditions or double-decrement when turns switch.
3. URL query parameter parsing for auto-join links (`/friends?join=...` and `/friends?answer=...`) on first render without SSR mismatch.
4. Correct timeout/flag detection when a player runs out of time (claiming win on time).
5. Mobile / responsive viewports keeping both player bars, clock, and board cleanly visible.

---

### Task 1: Lightweight QR Code Generator Component

**Files:**
- Create: `src/components/multiplayer/QRCodeDisplay.tsx`
- Modify: `src/multiplayer/types.ts`

**Interfaces:**
- Consumes: URL string for room invite
- Produces: `<QRCodeDisplay value={url} size={200} />`

- [ ] **Step 1: Create `src/components/multiplayer/QRCodeDisplay.tsx`**
Implement an SVG-based clean QR matrix generator or canvas renderer with dark aurora styling and copy button.

- [ ] **Step 2: Verify QR Code display renders properly without external dependencies**
Verify that SVG render creates valid scannable patterns.

---

### Task 2: Share Invite Dialog & Modal

**Files:**
- Create: `src/components/multiplayer/ShareInviteModal.tsx`

**Interfaces:**
- Consumes: `sessionCode`, `inviteUrl`, `isHost`, `connectionStatus`, `onCancel`
- Produces: Modal with 1-click URL copy, QR code toggle, fallback code, and pulsing "Waiting for opponent..." radar animation.

- [ ] **Step 1: Create `src/components/multiplayer/ShareInviteModal.tsx`**
Implement the modal with clean glassmorphic design, instant clipboard feedback via toast, and auto-dismiss when peer connects.

---

### Task 3: Friends Game Controls & Lobby UI (`FriendsGameControls.tsx`)

**Files:**
- Create: `src/components/chess/FriendsGameControls.tsx`
- Modify: `src/store/useChessStore.ts`

**Interfaces:**
- Consumes: Zustand store multiplayer state (`connectionStatus`, `remotePlayer`, `myColor`, `offerDraw`, `resignGame`, `requestRematch`)
- Produces: Lobby view (Create Game, Join Game, Profile Name customization with `@blobatar/react`, Time Control selection) and Active Match view (Opponent bar, Ping/Connection badge, Action buttons, Draw banner, Rematch banner).

- [ ] **Step 1: Implement Lobby and In-Game panels in `FriendsGameControls.tsx`**
- [ ] **Step 2: Wire up draw offers, rematch requests, and resign confirmations with toasts**

---

### Task 4: Play with Friends Page (`/friends`)

**Files:**
- Create: `src/app/friends/page.tsx`
- Modify: `src/components/stats/StatScreen.tsx` (ensure link routes directly to `/friends`)

**Interfaces:**
- Consumes: URL search params (`?join=...`, `?answer=...`)
- Produces: Full Play with Friends page matching `/play` layout proportions.

- [ ] **Step 1: Create `src/app/friends/page.tsx`**
Handle client-side auto-joining when a user opens an invite URL.

- [ ] **Step 2: Test P2P handshake between two browser contexts**

---

### Task 5: Chess Clocks & Time Controls Engine

**Files:**
- Create: `src/chess/timer.ts`
- Modify: `src/store/useChessStore.ts`
- Modify: `src/components/chess/PlayerBar.tsx`

**Interfaces:**
- Time Controls: `None (unlimited)`, `1 min (Bullet)`, `3 min (Blitz)`, `5 min (Blitz)`, `10 min (Rapid)`, `15+10 (Classical)`
- Produces: Real-time countdown timer in `PlayerBar.tsx`, active turn highlight, low-time warning sound (< 10s), and flag-fall timeout detection.

- [ ] **Step 1: Add clock state & timer interval management to `useChessStore.ts`**
- [ ] **Step 2: Integrate timer display into `PlayerBar.tsx` with smooth formatting (`mm:ss.s`)**
- [ ] **Step 3: Add time control picker to both `BotGameControls.tsx` and `FriendsGameControls.tsx`**

---

### Task 6: Board Annotation & Arrow Graphics Polish

**Files:**
- Modify: `src/components/chess/BoardAnnotations.tsx`

**Interfaces:**
- Consumes: `arrows: Array<{ from: Square; to: Square }>`
- Produces: Modern SVG arrows with rounded shaft edges, tapered tips, translucent glow, and smooth Knight L-shape routing matching chess.com.

- [ ] **Step 1: Refactor SVG arrow paths with sleek geometric heads, markers, and semi-transparency**
- [ ] **Step 2: Test multi-arrow rendering, right-click clear, and Knight corner curves**

---

### Task 7: Full Verification & Build Check

- [ ] **Step 1: Run `npm run build` to verify Next.js 16 + React 19 + TypeScript build**
- [ ] **Step 2: Verify responsive layouts, P2P sync, timers, and sound effects across `/`, `/play`, and `/friends`**
