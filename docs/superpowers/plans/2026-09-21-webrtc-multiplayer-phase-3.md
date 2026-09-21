# WebRTC Peer-to-Peer Multiplayer (Phase 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or native execution) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a zero-cost, serverless peer-to-peer multiplayer chess experience at `/friends` using WebRTC DataChannels, supporting simple profile naming, host color selection, 1-click shareable links & QR codes, and tamper-resistant move synchronization.

**Architecture:** A client-side WebRTC manager (`src/multiplayer/`) handling `RTCPeerConnection` and `RTCDataChannel` lifecycles using standard STUN servers (`stun:stun.l.google.com:19302`). Signaling is serverless via compressed base64 URL hashes and QR codes, plus a manual SDP fallback modal. The `/friends` page integrates with `useChessStore.ts` to enforce player turns, validate received moves against local rules, play audio cues, and handle rematches and disconnects.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, WebRTC DataChannels, `@blobatar/react`, Zustand 5, Lucide React, Goey Toast, Canvas QR Code generator.

**Spec:** [`docs/superpowers/specs/2026-09-21-chess-engine-architecture-design.md`](file:///d:/PROJECTS/chess-engine/docs/superpowers/specs/2026-09-21-chess-engine-architecture-design.md)

## Global Constraints
- **Zero Backend Cost:** No WebSocket servers, databases, or accounts. All signaling is performed client-side via URL hashes, QR codes, or manual copy/paste.
- **Tamper-Resistant Security:** The client never accepts arbitrary board states from a remote peer; every incoming move payload must pass through `getLegalMoves()` validation.
- **Design Consistency:** Match the existing Dark Aurora palette and identical board/sidebar layout dimensions as `/` and `/play`.

## Review Focus
1. **Remote Move Legality:** Reject any incoming move payload that is not in `getLegalMoves()` and notify the player.
2. **Color Inversion on Remote Peer:** If Host is White, Joiner must automatically be assigned Black and have `isFlipped = true`.
3. **Turn Enforcement:** Prevent the local user from moving pieces when it is the remote opponent's turn.
4. **Peer Disconnect Handling:** If the opponent closes their browser tab or connection drops, display an immediate "Opponent Disconnected" alert with leave/restart options.
5. **Rematch & Reset:** Rematch request must reset both boards synchronously and swap or preserve colors without tearing down the WebRTC DataChannel.

---

### Task 1: WebRTC Protocol & DataChannel Transport Layer

**Files:**
- Create: `src/multiplayer/types.ts`
- Create: `src/multiplayer/webrtc.ts`
- Create: `src/multiplayer/signaling.ts`

**Interfaces:**
- Produces: `WebRTCManager` class with `createOffer()`, `acceptOffer(offerStr)`, `applyAnswer(answerStr)`, `sendMessage(msg)`, `onMessage(handler)`, `onStateChange(handler)`.
- Produces: `PeerMessage` typed union (`HANDSHAKE`, `MOVE`, `DRAW_OFFER`, `DRAW_ACCEPT`, `RESIGN`, `REMATCH_REQUEST`, `REMATCH_ACCEPT`).

- [ ] **Step 1: Define Multiplayer Message Protocols & Types**
  In `src/multiplayer/types.ts`, define connection states (`idle`, `creating-offer`, `waiting-for-answer`, `connecting`, `connected`, `disconnected`), `PlayerProfile` (`name: string`), and `PeerMessage`.
- [ ] **Step 2: Implement Compressed URL Signaling Utilities**
  In `src/multiplayer/signaling.ts`, implement `compressSDP(sdp)` and `decompressSDP(string)` using browser LZ-String or Base64/gzip compression so offers and answers fit cleanly in URL parameters.
- [ ] **Step 3: Implement WebRTC Connection Manager**
  In `src/multiplayer/webrtc.ts`, create `WebRTCConnection` with `RTCPeerConnection`, `createDataChannel('chess-game')`, ICE candidate gathering completion promises, message dispatching, and heartbeat/disconnect listeners.

---

### Task 2: Player Profile & Multiplayer State in Chess Store

**Files:**
- Modify: `src/store/useChessStore.ts`
- Create: `src/lib/profile.ts`

**Interfaces:**
- Produces: `playerName: string`, `opponentName: string`, `connectionState: ConnectionState`
- Produces: `setPlayerName()`, `connectMultiplayer()`, `handleRemoteMove()`, `sendMultiplayerMove()`

- [ ] **Step 1: Implement Local Player Profile Storage**
  In `src/lib/profile.ts`, provide `getPlayerName(): string` and `setPlayerName(name: string): void` with `localStorage` persistence and fallback random username (e.g. `Player_742`).
- [ ] **Step 2: Extend Chess Store for Multiplayer Actions**
  In `useChessStore.ts`, add multiplayer actions:
  - `sendMultiplayerMove(move)`: broadcasts move over DataChannel.
  - `receiveMultiplayerMove(move)`: validates move against local board state, applies move, plays audio cue, and updates game status.
  - `handlePeerDisconnect()`: displays disconnect notification.

---

### Task 3: Share Modal & QR Code Component

**Files:**
- Create: `src/components/multiplayer/ShareInviteModal.tsx`
- Create: `src/components/multiplayer/QRCodeDisplay.tsx`

**Interfaces:**
- Renders: Shareable URL link with 1-click Copy button, QR Code canvas, and step-by-step connection status indicator.
- Renders: Manual SDP text exchange fallback tab.

- [ ] **Step 1: Create Lightweight SVG / Canvas QR Code Renderer**
  In `src/components/multiplayer/QRCodeDisplay.tsx`, render a clean QR code of the invite URL.
- [ ] **Step 2: Create ShareInviteModal Component**
  In `src/components/multiplayer/ShareInviteModal.tsx`, build a dialog with "Copy Invite Link", QR Code display, and real-time "Waiting for friend to connect..." pulsing status.

---

### Task 4: Friends Multiplayer Controls & Lobby Component

**Files:**
- Create: `src/components/chess/FriendsGameControls.tsx`

**Interfaces:**
- Renders:
  - **Pre-Game Lobby:** Profile Name input, "Create Game" (with color choice: White/Black/Random), "Join Game" (paste code/link).
  - **In-Game Session:** Opponent Name badge, Connection Status, Move History, Resign, Draw Offer, and Rematch buttons.

- [ ] **Step 1: Build Pre-Game Multiplayer Lobby UI**
  In `src/components/chess/FriendsGameControls.tsx`, create the host/join selection view matching the Dark Aurora styling.
- [ ] **Step 2: Build In-Game Multiplayer Session UI**
  Create live match controls with Draw Offer, Resignation, and Rematch buttons.

---

### Task 5: Build Play with Friends Page (`/friends`)

**Files:**
- Create: `src/app/friends/page.tsx`
- Modify: `src/components/stats/StatScreen.tsx` (ensure link routes to `/friends`)

**Interfaces:**
- Renders: Responsive layout matching `/` and `/play` with `DarkAuroraBackground`, `ChessBoard`, and `FriendsGameControls`.
- Automatically parses `?join=<encoded-offer>` URL parameters when opening an invite link to auto-connect.

- [ ] **Step 1: Create `/friends/page.tsx`**
  Implement the `/friends` page layout with SSR-safe client initialization and invite URL parameter detection.
- [ ] **Step 2: Auto-Join on Invite URL Open**
  When a user opens `/friends?join=...`, auto-prompt for player name and instantly exchange answer to establish DataChannel.

---

### Task 6: End-to-End Verification of Multiplayer

**Files:**
- Test across two separate browser windows/profiles.

- [ ] **Step 1: Test Room Creation & Link Sharing**
- [ ] **Step 2: Test Two-Way Move Synchronization, Captures, and Audio Cues**
- [ ] **Step 3: Test Checkmate, Draw Offer, and Resignation**
- [ ] **Step 4: Test Disconnect Detection**
