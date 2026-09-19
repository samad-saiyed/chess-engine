# ChessEngine — Development Plan

## Phase 1 — Chess Board Foundation

**Goal:** Get an actual chess board on screen with pieces and a clean internal representation.

### Tasks

- [ ] Create the chess board component
- [ ] Render an 8×8 grid
- [ ] Establish board coordinates (`a1` → `h8`)
- [ ] Create the initial chess position
- [ ] Create reusable chess piece components
- [ ] Render all six piece types
- [ ] Support white/black pieces
- [ ] Create the core `Board` / `Piece` / `GameState` types
- [ ] Keep board state independent from the UI components
- [ ] Add basic square selection state

### Implementation direction

For the board itself, **don't use `<canvas>` initially**.

I'd recommend normal React elements:

```text
ChessBoard
  └── ChessSquare × 64
        └── ChessPiece
```

Something like:

```tsx
<div className="board">
  {squares.map(square => (
    <ChessSquare
      key={square.id}
      ...
    />
  ))}
</div>
```

CSS Grid is perfectly capable of rendering an 8×8 board.

### Why not Canvas?

Canvas sounds attractive for a chess board, but it makes several things more annoying:

- Piece interaction
- Dragging
- Accessibility
- Highlighting
- Responsive sizing
- React state integration
- Piece animations
- Debugging

There is no performance reason to use Canvas for 64 squares.

**Use DOM + CSS Grid.**

We can always reconsider Canvas if we later want fancy board rendering, but I wouldn't introduce that complexity.

---

# Phase 2 — Piece Movement

**Goal:** Turn the static board into an actual chess game.

### Tasks

- [ ] Implement pawn movement
- [ ] Implement knight movement
- [ ] Implement bishop movement
- [ ] Implement rook movement
- [ ] Implement queen movement
- [ ] Implement king movement
- [ ] Implement captures
- [ ] Prevent moving through pieces
- [ ] Prevent capturing own pieces
- [ ] Highlight legal moves
- [ ] Move pieces by click/tap
- [ ] Add drag-and-drop movement later if desired
- [ ] Track current player turn

At this point:

```text
Click piece
   ↓
Calculate legal moves
   ↓
Highlight squares
   ↓
Select destination
   ↓
Update position
   ↓
Switch turn
```

Don't worry about check/checkmate yet.

---

# Phase 3 — Complete Chess Rules

**Goal:** Make the chess implementation actually correct.

### Tasks

- [ ] Implement king safety
- [ ] Detect check
- [ ] Prevent moves that leave own king in check
- [ ] Implement checkmate
- [ ] Implement stalemate
- [ ] Implement castling
- [ ] Implement en passant
- [ ] Implement promotion
- [ ] Add promotion selection
- [ ] Implement insufficient-material draw
- [ ] Implement fifty-move rule
- [ ] Implement threefold repetition
- [ ] Track complete move history
- [ ] Implement undo

### Important architecture rule

At this point, create a clear distinction between:

```text
generatePseudoLegalMoves()
```

and

```text
generateLegalMoves()
```

Conceptually:

```text
Pseudo-legal moves
       ↓
Apply move
       ↓
Does own king remain safe?
       ↓
    ┌───────┐
    │       │
   YES      NO
    │       │
    ↓       ↓
 Legal    Reject
```

This becomes extremely important later because **the engine will use the same chess rules**.

---

# Phase 4 — Local Two-Player Game

**Goal:** Have a complete human-vs-human chess game on one device.

This is technically small, but I'd make it a separate checkpoint before touching the engine.

### Tasks

- [ ] Player 1 controls White
- [ ] Player 2 controls Black
- [ ] Enforce turns
- [ ] Show check
- [ ] Show checkmate
- [ ] Show draw/game-over state
- [ ] Restart game
- [ ] Undo move

### Milestone

At the end of Phase 4:

> **We have a complete playable chess game without an AI.**

This is an important checkpoint. From here onward, we're building things _on top of a working chess implementation_.

---

# Phase 5 — Chess Engine Core

**Goal:** Make the computer capable of choosing moves.

Start very simple.

### Tasks

- [ ] Create independent engine module
- [ ] Create position evaluation function
- [ ] Add basic material evaluation
- [ ] Implement minimax
- [ ] Implement alpha-beta pruning
- [ ] Return best move
- [ ] Ensure engine can only produce legal moves

Initial evaluation:

```text
Pawn    = 100
Knight  = 320
Bishop  = 330
Rook    = 500
Queen   = 900
King    = 20000
```

Don't immediately build the sophisticated evaluation system from the spec.

First get:

```text
Position
   ↓
Legal moves
   ↓
Search
   ↓
Evaluation
   ↓
Best move
```

working end-to-end.

---

# Phase 6 — Make the Engine Good

**Goal:** Move from "it plays chess" to "this thing is actually difficult to beat."

### Tasks

- [ ] Improve move ordering
- [ ] Add piece-square tables
- [ ] Add mobility evaluation
- [ ] Add center-control evaluation
- [ ] Add king-safety evaluation
- [ ] Add pawn-structure evaluation
- [ ] Add passed-pawn evaluation
- [ ] Add tactical evaluation
- [ ] Add quiescence search
- [ ] Add transposition table

The progression should roughly be:

```text
Material
   ↓
Material + position
   ↓
Better move ordering
   ↓
Alpha-beta optimization
   ↓
Quiescence
   ↓
Transposition table
   ↓
Stronger evaluation
```

Don't prematurely optimize before we have a measurable problem.

---

# Phase 7 — Engine Difficulty

**Goal:** Turn one engine into multiple playable difficulty levels.

### Tasks

- [ ] Add engine configuration
- [ ] Define Beginner
- [ ] Define Easy
- [ ] Define Medium
- [ ] Define Hard
- [ ] Define Expert
- [ ] Tune search depth/time per level
- [ ] Add controlled randomness to weaker levels
- [ ] Test difficulty progression

Something conceptually like:

```ts
type EngineDifficulty = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert'
```

The exact implementation should come after we see how strong the basic engine actually is.

---

# Phase 8 — Engine Web Worker

**Goal:** Make engine calculations non-blocking.

### Tasks

- [ ] Move engine execution into Web Worker
- [ ] Define worker message protocol
- [ ] Send position → worker
- [ ] Worker calculates best move
- [ ] Worker → UI returns move
- [ ] Handle thinking state
- [ ] Allow game UI to remain responsive
- [ ] Handle cancellation/new position

Architecture:

```text
React
  │
  │ Position
  ▼
Web Worker
  │
  ├── Search
  ├── Evaluation
  └── Transposition
  │
  │ Best Move
  ▼
React
```

At this point:

> **We have the complete single-player chess experience.**

---

# Phase 9 — Play Against Computer

**Goal:** Connect the finished engine to the actual game.

### Tasks

- [ ] Add `/play`
- [ ] Select difficulty
- [ ] Human plays White
- [ ] Engine plays Black
- [ ] Engine automatically responds after human move
- [ ] Disable interaction while engine is thinking
- [ ] Handle game-over states
- [ ] Restart game
- [ ] Switch difficulty

Potential URL:

```text
/play
```

Potential future query:

```text
/play?difficulty=hard
```

I prefer the first version to keep difficulty in game state rather than making the URL unnecessarily important.

---

# Phase 10 — Multiplayer Architecture

**Do this only after everything above is solid.**

**Goal:** Establish a browser-to-browser connection.

### Tasks

- [ ] Create `/friends`
- [ ] Create WebRTC abstraction
- [ ] Create offer generation
- [ ] Create answer generation
- [ ] Create manual signaling UI
- [ ] Establish DataChannel
- [ ] Detect connection state
- [ ] Handle connection failure

Initial experience can literally be:

```text
Create Game

Your Offer
[........................]

[Copy]

────────────

Opponent's Answer
[........................]

[Connect]
```

No backend.

---

# Phase 11 — Multiplayer Chess

**Goal:** Make the existing chess game work over WebRTC.

### Tasks

- [ ] Assign player colors
- [ ] Send moves through DataChannel
- [ ] Receive moves
- [ ] Validate received moves
- [ ] Apply remote moves
- [ ] Prevent moving during opponent's turn
- [ ] Synchronize game completion
- [ ] Handle opponent disconnect
- [ ] Handle invalid messages
- [ ] Restart/leave game

The important architecture is:

```text
                 Chess Rules
                /           \
               /             \
        Local Input       Remote Input
             │                 │
             └──────┬──────────┘
                    ↓
             Validate Move
                    ↓
             Update Position
```

**WebRTC should transport chess moves, not contain chess logic.**

---

# Suggested Routes

I'd keep routing extremely simple.

```text
/
├── /play
│     └── Play against computer
│
├── /local
│     └── Two players on same device
│
└── /friends
      └── Play with friend via WebRTC
```

### `/`

Simple landing page eventually:

```text
ChessEngine

[ Play ]

[ Play Locally ]

[ Play With Friend ]
```

### `/play`

Computer game.

```text
/play
/play?difficulty=medium
```

### `/local`

Local two-player game.

```text
/local
```

### `/friends`

P2P multiplayer.

```text
/friends
```

Potentially later:

```text
/friends/create
/friends/join
```

But **don't create these routes yet**. A single `/friends` page is enough initially.

---

# Final Task Roadmap

If we strip everything down to the actual work, this is the project:

```text
PHASE 1
Chess Board
├── Board
├── Squares
├── Pieces
└── Initial Position

        ↓

PHASE 2
Movement
├── Piece movement
├── Captures
├── Legal moves
├── Highlights
└── Turns

        ↓

PHASE 3
Chess Rules
├── Check
├── Checkmate
├── Stalemate
├── Castling
├── En passant
├── Promotion
└── Draws

        ↓

PHASE 4
Local Game
├── Human vs Human
├── Move history
├── Undo
└── Game controls

        ↓

PHASE 5
Engine
├── Evaluation
├── Minimax
└── Alpha-beta

        ↓

PHASE 6
Engine Strength
├── Move ordering
├── Position evaluation
├── Quiescence
└── Transposition table

        ↓

PHASE 7
Difficulty
├── Beginner
├── Easy
├── Medium
├── Hard
└── Expert

        ↓

PHASE 8
Web Worker
└── Non-blocking engine

        ↓

PHASE 9
/play
└── Human vs Computer

        ↓

PHASE 10
WebRTC
├── Connection
├── Signaling
└── DataChannel

        ↓

PHASE 11
/friends
├── Multiplayer moves
├── Validation
├── Colors
└── Disconnect handling
```

### One change I'd make from the original spec

I would **not start with the engine immediately after movement**.

Get through **Phase 4 first**.

That gives us a completely functional chess implementation before the engine exists. Then the engine becomes another consumer of the chess logic rather than us debugging **React + chess rules + AI search simultaneously**.

And for the board: **React + CSS Grid, not Canvas**. The board is only 64 squares; DOM rendering is more than sufficient and will make interaction significantly easier.
