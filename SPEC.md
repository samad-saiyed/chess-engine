# ChessEngine

A client-side chess application built with Next.js and TypeScript. The application will support local chess games against a custom-built chess engine and, as the final milestone, peer-to-peer games with friends without requiring a backend.

## Goals

- Build a functional chess application entirely on the client.
- Implement the chess rules ourselves rather than relying on a chess engine.
- Build a simple but strong enough chess engine to provide multiple difficulty levels.
- Support local games against the computer.
- Support two-player games on the same device.
- Eventually support peer-to-peer games between two browsers using WebRTC.
- Keep the application free to operate, with Vercel as the only deployment requirement.
- Keep the initial UI clean and minimal. Visual polish is a later phase.

## Non-Goals

The project is intentionally not trying to compete with Stockfish.

We do not need:

- Accounts or authentication
- Backend APIs
- Database
- Game persistence
- Leaderboards
- User profiles
- Online matchmaking
- Chat
- Spectator mode
- Cloud game history
- Advanced chess analysis
- Stockfish-level strength

---

# 1. Chess Board

Build the fundamental chess board and game-state representation.

## Board

- 8×8 chess board.
- 64 squares.
- Coordinate system: `a1` → `h8`.
- White and black sides.
- Initial standard chess position.
- Board orientation can eventually be flipped.
- Board must work on desktop and mobile.

## Pieces

Support all six chess pieces:

- King
- Queen
- Rook
- Bishop
- Knight
- Pawn

Pieces should initially be represented using a simple reusable piece system. The visual appearance can be replaced during the design/polish phase.

## Position Representation

Use a clear internal representation rather than tying chess logic directly to React components.

Example concept:

```ts
type Color = 'white' | 'black'

type PieceType = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'

type Piece = {
  type: PieceType
  color: Color
}

type Square = Piece | null

type Board = Square[][]
```

The exact representation can change if a more efficient approach becomes useful for the engine.

## Game State

The game state should contain everything required to reconstruct a legal chess position:

- Board
- Current turn
- Move history
- Castling rights
- En passant target
- Halfmove clock if required
- Move number
- Game status

Possible statuses:

```text
playing
check
checkmate
stalemate
draw
```

---

# 2. Movable / Legal Pieces

Once the board works, implement the complete chess rules.

## Basic Movement

Implement legal movement for:

- Pawn
- Knight
- Bishop
- Rook
- Queen
- King

The engine should understand:

- Empty-square movement
- Captures
- Blocking pieces
- Board boundaries
- Same-color pieces
- Opposing pieces

## Special Rules

Implement:

### Pawn

- One-square movement
- Two-square initial movement
- Diagonal captures
- Promotion

Promotion should initially support:

- Queen
- Rook
- Bishop
- Knight

### Castling

Support:

- Kingside castling
- Queenside castling

Validate all required conditions.

### En Passant

Support legal en-passant captures.

### King Safety

A move is not legal if it leaves the player's own king in check.

This is an important distinction:

```text
Pseudo-legal move
        ↓
Does move leave own king in check?
        ↓
Yes → reject
No  → legal
```

## Check

Detect when a king is attacked.

The UI should eventually communicate:

```text
CHECK
```

but the first implementation only needs correct game-state detection.

## Checkmate

Detect:

```text
King is in check
+
No legal moves
```

## Stalemate

Detect:

```text
King is NOT in check
+
No legal moves
```

## Draw Conditions

Implement the common automatic draw conditions required for normal gameplay:

- Stalemate
- Threefold repetition
- Fifty-move rule
- Insufficient material

These can be implemented after the fundamental check/checkmate logic is working.

## Move History

Store moves in a structured form.

Example:

```ts
type Move = {
  from: SquareCoordinate
  to: SquareCoordinate
  piece: Piece
  captured?: Piece
  promotion?: PieceType
  isCastle?: boolean
  isEnPassant?: boolean
}
```

The exact model can evolve.

Move history should eventually allow:

- Undo
- Displaying previous moves
- Reconstructing a position
- Detecting repetition

---

# 3. Chess Engine

Build our own chess engine entirely in TypeScript.

The engine runs locally in the browser.

## Engine Architecture

```text
Position
   ↓
Generate Legal Moves
   ↓
Search
   ↓
Evaluate Positions
   ↓
Best Move
```

The initial engine should use:

- Minimax
- Alpha-beta pruning
- Move ordering
- Position evaluation
- Quiescence search
- Transposition table

## Evaluation

Start with material evaluation.

Approximate values:

```text
Pawn      100
Knight    320
Bishop    330
Rook      500
Queen     900
King      20000
```

Then improve evaluation with:

- Piece-square tables
- Mobility
- Center control
- King safety
- Pawn structure
- Passed pawns
- Bishop pair
- Development
- Tactical threats

The evaluation system should remain modular so individual evaluation terms can be added or tuned independently.

## Search

Initial implementation:

```text
Minimax
    ↓
Alpha-Beta pruning
```

Then add:

```text
Move ordering
    ↓
Quiescence search
    ↓
Transposition table
```

The engine should prioritize tactical moves such as:

- Captures
- Checks
- Promotions
- Threats

## Web Worker

The chess engine should run inside a Web Worker rather than the main React thread.

Architecture:

```text
React UI
   │
   │ position
   ▼
Chess Worker
   │
   ├── Move generation
   ├── Search
   ├── Evaluation
   └── Best move
   │
   ▼
React UI
```

This prevents engine calculations from freezing the interface.

## Difficulty Levels

Provide several levels.

Initial concept:

```text
Beginner
Easy
Medium
Hard
Expert
```

Difficulty can be controlled through:

- Search depth
- Search time
- Candidate move selection
- Evaluation strength
- Controlled randomness

Example:

```text
Beginner
→ shallow search + randomness

Easy
→ shallow search

Medium
→ moderate search

Hard
→ deeper search

Expert
→ deepest available search + strongest evaluation
```

The exact depths should be determined through testing rather than fixed prematurely.

## Engine API

Keep the engine independent from React.

Conceptually:

```ts
engine.getBestMove(position, options)
```

The UI should not know how the engine calculates its move.

This separation will make the engine easier to test and improve.

---

# 4. Play With Friends — FINAL MILESTONE

This should be implemented only after the board, chess rules, and engine are stable.

The goal is peer-to-peer multiplayer without our own backend.

## Technology

Use:

```text
WebRTC DataChannel
```

for browser-to-browser communication.

The chess moves themselves should travel directly between the two players.

```text
Player A
   │
   │ WebRTC DataChannel
   │
Player B
```

## Signaling

The initial version should avoid building a backend.

Use manual signaling:

```text
Player A
→ Generate connection offer
→ Share connection data

Player B
→ Paste offer
→ Generate answer
→ Share answer

Player A
→ Paste answer
→ Connected
```

A later UI can make this more convenient with a QR code or encoded connection string.

No account system or server-based matchmaking is required.

## Multiplayer State

Do not synchronize the entire board after every move.

Synchronize moves:

```text
e2e4
e7e5
Ng1f3
...
```

Each browser maintains its own chess state.

When a remote move arrives:

```text
Receive move
      ↓
Validate against current position
      ↓
Apply move
      ↓
Update board
```

Invalid remote moves must be rejected.

## Player Roles

A multiplayer game should establish:

```text
Player A = White
Player B = Black
```

Only the appropriate player can make a move.

## Connection States

The UI should eventually communicate:

```text
Waiting for opponent
Connecting
Connected
Opponent's turn
Your turn
Opponent disconnected
Game finished
```

## Multiplayer Security

The client should never blindly trust incoming moves.

Every received move must pass through the same legal-move validation used for local moves.

The peer should not be able to send arbitrary board states.

## Disconnect Handling

Handle:

- Opponent closes tab
- Connection drops
- Browser goes offline
- Invalid message
- Peer connection failure

The initial behavior can simply show:

```text
Opponent disconnected
```

and allow the user to leave/restart the game.

---

# Project Architecture

A possible final structure:

```text
src/
├── app/
│   ├── page.tsx
│   └── game/
│
├── components/
│   ├── ChessBoard/
│   ├── ChessPiece/
│   ├── MoveHistory/
│   └── GameStatus/
│
├── chess/
│   ├── board/
│   ├── pieces/
│   ├── moves/
│   ├── rules/
│   ├── game/
│   └── types/
│
├── engine/
│   ├── search/
│   ├── evaluation/
│   ├── move-ordering/
│   ├── transposition/
│   └── worker/
│
└── multiplayer/
    ├── webrtc/
    ├── signaling/
    └── protocol/
```

The exact folder structure should be finalized when implementation begins rather than over-engineered upfront.

---

# Development Order

The implementation order is intentionally strict.

## Milestone 1 — Board

```text
[ ] Project setup
[ ] Board representation
[ ] Render 8×8 board
[ ] Render pieces
[ ] Initial position
[ ] Board coordinates
[ ] Basic game state
```

## Milestone 2 — Chess Rules

```text
[ ] Pawn movement
[ ] Knight movement
[ ] Bishop movement
[ ] Rook movement
[ ] Queen movement
[ ] King movement
[ ] Captures
[ ] Move validation
[ ] Check detection
[ ] Checkmate
[ ] Stalemate
[ ] Castling
[ ] En passant
[ ] Promotion
[ ] Draw conditions
[ ] Move history
[ ] Undo
```

At this point:

> We have a complete local chess game, but no computer opponent yet.

## Milestone 3 — Engine

```text
[ ] Position evaluator
[ ] Material evaluation
[ ] Minimax
[ ] Alpha-beta pruning
[ ] Move ordering
[ ] Piece-square tables
[ ] Quiescence search
[ ] Transposition table
[ ] Web Worker
[ ] Difficulty levels
[ ] Play against computer
```

At this point:

> The application is a complete single-player chess game.

## Milestone 4 — Multiplayer

Do this last.

```text
[ ] WebRTC connection abstraction
[ ] Manual signaling
[ ] Connection establishment
[ ] DataChannel protocol
[ ] Send moves
[ ] Receive moves
[ ] Validate remote moves
[ ] Player color assignment
[ ] Connection state
[ ] Disconnect handling
[ ] Multiplayer game flow
```

At this point:

> The application supports both computer games and peer-to-peer games.

---

# Testing Strategy

Chess logic should be tested independently from the UI.

Important test categories:

- Every piece's legal movement
- Captures
- Blocking
- Check
- Checkmate
- Stalemate
- Castling
- En passant
- Promotion
- Draw conditions
- Move undo
- Position reconstruction
- Engine move legality
- Multiplayer move validation

The engine should never be allowed to make an illegal move.

---

# Final Product

The finished application should provide three core experiences:

```text
                    ChessEngine
                        │
          ┌─────────────┼─────────────┐
          │             │             │
          ▼             ▼             ▼
      Computer       Local 2P       Friend
        Game           Game        via P2P
          │                           │
          ▼                           ▼
    Local Engine                 WebRTC
```

The first priority is **correctness**.

The second priority is **engine strength**.

The third priority is **multiplayer reliability**.

The visual design and UI polish should be deliberately postponed until the underlying functionality is complete.

## Success Criteria

The project is considered functionally complete when:

1. A user can play a complete legal game of chess locally.
2. The application correctly handles all standard chess rules.
3. The computer can play legal moves and provide multiple difficulty levels.
4. Engine computation does not freeze the UI.
5. Two people can play against each other from separate browsers using a direct peer-to-peer connection.
6. No application backend or database is required.
7. The application can be deployed as a Next.js application on Vercel.
8. The core chess functionality works without external chess APIs.
