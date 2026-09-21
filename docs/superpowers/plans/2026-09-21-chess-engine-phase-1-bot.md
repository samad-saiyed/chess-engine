# Chess Engine Core & Bot Gameplay (Phase 1 & 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or native execution) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a robust, client-side Chess AI engine using Minimax with Alpha-Beta pruning, evaluation heuristics (Piece-Square Tables & Material), and Web Worker integration, then connect it to a dedicated `/play` vs Bot experience with color selection, 3 difficulty tiers, and Dark Aurora UI aesthetics.

**Architecture:** A standalone TypeScript engine module (`src/engine/`) executing Minimax search with Alpha-Beta pruning in a dedicated Web Worker (`src/engine/worker.ts`). The React UI communicates via an asynchronous client (`src/engine/engineWorkerClient.ts`). The `/play` page allows players to configure color (White/Black/Random), select difficulty (Easy/Medium/Hard), flip board perspective when playing as Black, and experience non-blocking 60fps bot turns.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Web Workers, Zustand 5, Tailwind CSS v4, Lucide React, Goey Toast.

**Spec:** [`docs/superpowers/specs/2026-09-21-chess-engine-architecture-design.md`](file:///d:/PROJECTS/chess-engine/docs/superpowers/specs/2026-09-21-chess-engine-architecture-design.md)

## Global Constraints
- Do not alter the base Dark Aurora color palette tokens (`oklch(0.145 0 0)` background, `oklch(0.52 0.105 172.5)` primary teal).
- Engine calculations must run in a Web Worker to prevent main-thread UI lag.
- All engine-suggested moves must be legally validated against chess rules before applying.
- Keep layout spacious, rounded, responsive, and mobile-friendly with touch-sized targets.

## Review Focus
1. Engine attempting an illegal move (e.g. into check, or through pieces) -> Must strictly evaluate `getLegalMoves` and only play strictly legal moves.
2. Bot playing as White when user selects Black -> Bot must calculate and execute opening move automatically without user input.
3. Stalemate or checkmate by the bot -> Game state must update cleanly, triggering toast notification and game-over modal/restart options.
4. User clicks board during Bot's thinking turn -> Board input must be disabled with visual "thinking" indicator.
5. Worker termination or unmount -> Active worker calculations must cancel gracefully when game resets or user leaves the page.

---

### Task 1: Engine Evaluation & Piece-Square Tables

**Files:**
- Create: `src/engine/evaluation.ts`
- Create: `src/engine/types.ts`

**Interfaces:**
- Produces: `evaluateBoard(board: Board, forColor: Color): number`
- Produces: `PIECE_VALUES: Record<PieceType, number>`

- [ ] **Step 1: Define Engine Types & Constants**
  Create `src/engine/types.ts` with `EngineDifficulty`, `EngineMoveResult`, and `WorkerMessage` payloads.
- [ ] **Step 2: Implement Piece-Square Tables & Material Evaluation**
  Implement `evaluateBoard` in `src/engine/evaluation.ts` factoring in standard piece values (Pawn=100, Knight=320, Bishop=330, Rook=500, Queen=900, King=20000) and position tables (center control for pawns/knights, king safety, open files for rooks).
- [ ] **Step 3: Verification**
  Verify evaluation returns symmetry on initial board (`evaluateBoard(initialBoard, 'white') === 0`).

---

### Task 2: Minimax Search with Alpha-Beta Pruning & Move Ordering

**Files:**
- Create: `src/engine/search.ts`
- Create: `src/engine/difficulty.ts`

**Interfaces:**
- Consumes: `evaluateBoard`, `getLegalMoves`, `makeMove`, `getGameStatus`
- Produces: `findBestMove(board: Board, turn: Color, castlingRights: CastlingRights, enPassantTarget: SquareCoordinate | null, difficulty: EngineDifficulty): EngineMoveResult`

- [ ] **Step 1: Implement Move Ordering & Quiescence Search**
  Order capture moves and checks before quiet moves in `src/engine/search.ts`. Implement shallow quiescence search on captures to eliminate horizon blunders.
- [ ] **Step 2: Implement Minimax with Alpha-Beta Pruning**
  Implement recursive minimax search with alpha-beta window cutoffs and depth limits.
- [ ] **Step 3: Implement Difficulty Configurator**
  In `src/engine/difficulty.ts`, configure:
  - `easy`: Depth 1-2 + 30% top-3 candidate randomization.
  - `medium`: Depth 3 + positional evaluation.
  - `hard`: Depth 4 + quiescence search.

---

### Task 3: Web Worker Thread & Client Wrapper

**Files:**
- Create: `src/engine/worker.ts`
- Create: `src/engine/engineWorkerClient.ts`

**Interfaces:**
- Produces: `requestBestMove(payload: EngineSearchRequest): Promise<EngineMoveResult>`
- Produces: `terminateEngineWorker(): void`

- [ ] **Step 1: Implement Web Worker Handler**
  In `src/engine/worker.ts`, listen for `SEARCH_BEST_MOVE` messages, invoke `findBestMove`, and post back `BEST_MOVE_FOUND`.
- [ ] **Step 2: Implement Engine Worker Client Wrapper**
  In `src/engine/engineWorkerClient.ts`, manage the Worker lifecycle (instantiation, asynchronous promise resolution, request cancellation).

---

### Task 4: Store Support for Bot Game Mode & Board Flipping

**Files:**
- Modify: `src/store/useChessStore.ts`
- Modify: `src/chess/types.ts`
- Modify: `src/components/chess/ChessBoard.tsx`

**Interfaces:**
- Produces: `isFlipped: boolean`, `gameMode: 'local' | 'bot' | 'friends'`, `isBotThinking: boolean`, `playerColor: Color`
- Produces: `setGameMode`, `setPlayerColor`, `triggerBotMove`

- [ ] **Step 1: Extend Chess Store for Bot & Orientation State**
  Add `gameMode`, `playerColor`, `isBotThinking`, `difficulty`, `setGameMode`, `setPlayerColor`, `setDifficulty`, and `triggerBotMove` to `useChessStore.ts`.
- [ ] **Step 2: Update ChessBoard Rendering for Orientation Flipping**
  Update `ChessBoard.tsx` to reverse row and column rendering when `isFlipped` is true so Black perspective is natural and interactive.
- [ ] **Step 3: Prevent Clicks During Bot Thinking**
  Disable square clicks when `isBotThinking` is true or when it is not the human player's turn in bot mode.

---

### Task 5: Build Play vs Bot Page (`/play`) & Sidebar Controls

**Files:**
- Create: `src/app/play/page.tsx`
- Create: `src/components/chess/BotGameControls.tsx`
- Modify: `src/components/stats/StatScreen.tsx` (linking Home to `/play` and `/friends`)

**Interfaces:**
- Renders: Pre-game configuration modal/sidebar (Color: White/Black/Random, Difficulty: Easy/Medium/Hard).
- Renders: In-game status, bot thinking spinner, resign, and restart buttons.

- [ ] **Step 1: Update Home StatScreen with Navigation Links**
  Update `src/components/stats/StatScreen.tsx` so "Play with a bot" routes to `/play` and "Play with a friend" routes to `/friends`.
- [ ] **Step 2: Create BotGameControls Component**
  Build `src/components/chess/BotGameControls.tsx` with spacious Dark Aurora buttons, difficulty selector, color toggle, and thinking badge.
- [ ] **Step 3: Create `/play` Page**
  Build `src/app/play/page.tsx` with responsive layout, DarkAuroraBackground, board on left/center, BotGameControls on right/sidebar.
- [ ] **Step 4: Auto-Trigger Bot if Human Selects Black**
  Verify that selecting Black immediately triggers the engine Web Worker to calculate and play White's opening move.

---

### Task 6: End-to-End Verification of Bot Gameplay

**Files:**
- Test across browser interface & dev server.

- [ ] **Step 1: Test Easy, Medium, and Hard Bot matches as White**
- [ ] **Step 2: Test Bot match as Black with board flipped**
- [ ] **Step 3: Test Checkmate, Stalemate, and Resignation flows**
- [ ] **Step 4: Check mobile responsiveness and smooth animations**
