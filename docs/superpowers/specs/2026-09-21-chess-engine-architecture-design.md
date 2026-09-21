# ChessEngine Architecture & Phased Design

**Date:** 2026-09-21  
**Status:** Approved by User  
**Target:** Client-Side Next.js 16 + React 19 + TypeScript + WebRTC + Web Workers

---

## 1. Overview & Vision

ChessEngine is a client-side, zero-backend chess application. It provides:
1. **Local Two-Player Gameplay (`/`):** Full 8x8 chess board with move history and navigation hubs.
2. **AI Bot Opponent (`/play`):** Custom Minimax + Alpha-Beta pruning engine offloaded to a Web Worker with 3 difficulty levels and color selection.
3. **Peer-to-Peer Multiplayer (`/friends`):** Zero-cost browser-to-browser WebRTC DataChannel connection with QR Code & Link sharing.
4. **Time Controls:** Optional timers (3m, 5m, 10m, 30m) with countdown clocks.

---

## 2. Design System & Aesthetics

- **Theme & Colors:** Preserve existing **Dark Aurora** theme:
  - Background: `oklch(0.145 0 0)`
  - Foreground: `oklch(0.985 0 0)`
  - Primary (Teal): `oklch(0.52 0.105 172.5)`
  - Secondary: `oklch(0.25 0.04 172.5)`
  - Muted: `oklch(0.22 0.03 172.5)`
  - Card & Popover: `oklch(0.205 0 0)`
- **Layout & Feel:** Spacious, rounded corners (`rounded-xl` / `rounded-2xl`), generous padding (`p-6` / `p-8`), clear typographic hierarchy with larger legible fonts, mobile responsiveness with touch-friendly square hitboxes and stackable sidebars.

---

## 3. Subsystem Architecture

### 3.1 Chess Engine Core (`src/engine/`)

The chess engine is modular and completely separated from React:
- **`evaluation.ts`**:
  - Material weights: Pawn = 100, Knight = 320, Bishop = 330, Rook = 500, Queen = 900, King = 20000.
  - Positional Piece-Square Tables (PST) for opening/middlegame bonuses (center pawns, active knights/bishops, king safety).
- **`search.ts`**:
  - Minimax algorithm with Alpha-Beta pruning.
  - Move ordering: Captures (MVV-LVA: Most Valuable Victim - Least Valuable Attacker) and checks ordered first to maximize pruning cutoffs.
  - Quiescence search on capture moves at leaf nodes to mitigate the horizon effect.
- **`difficulty.ts`**:
  - **Easy (Casual):** Search depth 1-2 with 30% chance to pick from top 3 candidate moves.
  - **Medium (Intermediate):** Search depth 3 with standard evaluation.
  - **Hard (Master):** Search depth 4 (or 5 within time limits) + PST evaluation + quiescence search.
- **`worker.ts` & `engineWorkerClient.ts`**:
  - Web Worker running in a background thread to prevent UI lockup.
  - Typed message protocol:
    - Inbound: `{ type: 'SEARCH_BEST_MOVE', payload: { board, turn, castlingRights, enPassantTarget, difficulty } }`
    - Outbound: `{ type: 'BEST_MOVE_FOUND', payload: { move: Move, evaluation: number, depth: number } }`

---

### 3.2 Single Player vs Bot (`src/app/play/page.tsx`)

- **Pre-game Setup Modal / Sidebar:**
  - Color Picker: **White**, **Black**, or **Random**.
  - Difficulty Selector: **Easy**, **Medium**, **Hard**.
  - "Start Game" action.
- **Gameplay Flow:**
  - If human is Black, board flips orientation (row/col perspective reversed) and the Web Worker immediately evaluates and triggers White's opening move.
  - Human makes move -> State updates -> Worker is invoked with thinking state indicator -> Bot moves -> Check / Checkmate / Stalemate evaluation.
  - Controls: Resign, New Game, Switch Difficulty, Move History log.

---

### 3.3 Peer-to-Peer Multiplayer (`src/app/friends/page.tsx`)

- **WebRTC DataChannel (`src/multiplayer/`):**
  - Uses `RTCPeerConnection` with standard Google STUN servers (`stun:stun.l.google.com:19302`).
  - Completely serverless signaling:
    1. **Room Host:** Creates offer -> Generates invite payload (base64 compressed SDP or URL hash) -> Displays QR Code & "Copy Invite Link".
    2. **Joiner:** Opens invite link / scans QR -> Imports offer -> Generates answer -> Host applies answer -> DataChannel opens.
- **Profile & Game Setup:**
  - Simple profile: Player Name (persisted in `localStorage`).
  - Host chooses piece color (White / Black / Random).
  - Clean message format:
    ```ts
    type PeerMessage = 
      | { type: 'HANDSHAKE'; name: string; hostColor: Color }
      | { type: 'MOVE'; move: Move }
      | { type: 'RESIGN' }
      | { type: 'OFFER_DRAW' }
      | { type: 'ACCEPT_DRAW' }
      | { type: 'REMATCH_REQUEST' }
    ```
  - Incoming moves pass through local `getLegalMoves()` validation to guarantee tamper resistance.

---

### 3.4 Clocks & Time Controls (`src/components/chess/ChessClock.tsx`)

- Time control options: `None`, `3 min`, `5 min`, `10 min`, `30 min`.
- Active timer ticks only during the active player's turn.
- If a player's clock reaches 00:00: Game ends with status `'timeout'`, awarding victory to the opponent.

---

## 4. Phased Implementation Roadmap

1. **Phase 1:** Chess Engine Core (Evaluation, Minimax, Alpha-Beta, Move Ordering, Web Worker).
2. **Phase 2:** Play vs Bot (`/play` route, pre-game configuration, board orientation flipping, thinking indicators, integration).
3. **Phase 3:** P2P WebRTC Multiplayer (`/friends` route, connection manager, QR/URL signaling, move sync).
4. **Phase 4:** Timers & Final Polish (Chess Clock component, timeout rules, mobile UI fine-tuning).
