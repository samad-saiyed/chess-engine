<div align="center">
  <img src="public/logo/main.png" alt="ChessEngine Logo" width="140" style="border-radius: 20px;" />

# ChessEngine

**A modern, high-performance, serverless Chess platform built with Next.js, TypeScript & WebRTC.**

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/State-Zustand-764ABC?style=for-the-badge)](https://github.com/pmndrs/zustand)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

  <br />

[Features](#-key-features) • [Tech Stack](#%EF%B8%8F-tech-stack) • [Getting Started](#-getting-started) • [Architecture](#%EF%B8%8F-system-architecture) • [Roadmap](#%EF%B8%8F-roadmap--milestones)
</div>

<br />

---

## 🌟 Overview

**ChessEngine** is an open-source, client-side chess application designed to run entirely in the browser without relying on external chess engines or backend server APIs.

Featuring a custom-built rule validation engine, a multi-level Minimax AI engine with Alpha-Beta pruning offloaded to Web Workers, and direct peer-to-peer WebRTC gaming, ChessEngine delivers a zero-latency, zero-cost chess experience.

---

## ✨ Key Features

- **♟️ Custom In-House Chess Engine**: Full implementation of standard chess logic from scratch, including castling, en passant, pawn promotion, check, checkmate, stalemate, and draw conditions.
- **🧠 Computer Opponent (AI)**: Multi-difficulty engine powered by Minimax, Alpha-Beta Pruning, Transposition Tables, and Quiescence Search.
- **⚡ Non-Blocking Performance**: Engine search logic executes inside a dedicated **Web Worker**, ensuring 60fps UI responsiveness during deep position evaluation.
- **🤝 Serverless Peer-to-Peer Multiplayer**: Play with friends via **WebRTC DataChannels** directly between browsers—no central server required.
- **👥 Local 2-Player Mode**: Play head-to-head on the same device with move highlights and state tracking.
- **🌌 Sleek Dark Aurora UI**: Responsive, mobile-friendly design featuring a dark aurora aesthetic built with Tailwind CSS v4 and DOM + CSS Grid rendering.
- **↩️ History & Undo**: Interactive move logs with state reconstruction and undo capability.

---

## 🛠️ Tech Stack

| Layer                     | Technology                                                                |
| :------------------------ | :------------------------------------------------------------------------ |
| **Framework**             | [Next.js 16](https://nextjs.org/) (App Router, React 19)                  |
| **Language**              | [TypeScript 5](https://www.typescriptlang.org/) (Strict Type Safety)      |
| **State Management**      | [Zustand 5](https://github.com/pmndrs/zustand)                            |
| **Styling**               | [Tailwind CSS v4](https://tailwindcss.com/) & Vanilla CSS                 |
| **UI Primitives & Icons** | [Lucide React](https://lucide.dev/), [Goey Toast](https://github.com/...) |
| **Networking**            | Serverless [WebRTC](https://webrtc.org/) DataChannels                     |
| **Code Quality**          | ESLint 9 & Prettier                                                       |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have Node.js and npm installed:

- **Node.js**: `>= 18.0.0`
- **npm**: `>= 9.0.0`

### Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/chess-engine.git
   cd chess-engine
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

4. **Open in your browser**
   Navigate to [http://localhost:3000](http://localhost:3000).

---

## 📜 Available Scripts

In the project root, you can run:

| Script           | Command                | Description                               |
| :--------------- | :--------------------- | :---------------------------------------- |
| **dev**          | `npm run dev`          | Starts the Next.js development server     |
| **build**        | `npm run build`        | Compiles the production build             |
| **start**        | `npm run start`        | Runs the compiled production server       |
| **lint**         | `npm run lint`         | Runs ESLint analysis                      |
| **format**       | `npm run format`       | Formats codebase with Prettier            |
| **format:check** | `npm run format:check` | Checks formatting without writing changes |

---

## 🏗️ System Architecture

```text
                                  ┌───────────────────────────────┐
                                  │      React 19 UI Layer        │
                                  │  (Next.js App / Zustand Store) │
                                  └───────────────┬───────────────┘
                                                  │
                        ┌─────────────────────────┼─────────────────────────┐
                        ▼                         ▼                         ▼
            ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
            │    Local 2P Game      │ │   Web Worker Engine   │ │     WebRTC Channel    │
            │ (Client State Machine)│ │(Minimax / Alpha-Beta) │ │  (Browser-to-Browser) │
            └───────────────────────┘ └───────────────────────┘ └───────────────────────┘
```

### Directory Structure

```text
chess-engine/
├── public/
│   └── logo/
│       └── main.png            # Official ChessEngine Logo
├── src/
│   ├── app/                    # Next.js App Router (Layouts & Pages)
│   ├── chess/                  # Core Chess Logic
│   │   ├── attacked/           # Square attack detection (king, knight, pawn)
│   │   ├── piece-moves/        # Move generators (pawn, knight, bishop, rook, queen, king, castle)
│   │   ├── board.ts            # Board state representation & initialization
│   │   ├── moves.ts            # Legal move calculation & validation
│   │   └── types.ts            # Core TypeScript interfaces
│   ├── components/             # React UI Components
│   │   ├── chess/              # ChessBoard, ChessSquare, ChessPiece
│   │   └── ui/                 # Dark Aurora background & shared components
│   ├── store/                  # Zustand store (useChessStore.ts)
│   └── lib/                    # Utility functions (cn styling helper)
├── SPEC.md                     # Technical Specifications
└── ROADMAP.md                  # Development Plan & Milestones
```

---

## 🗺️ Roadmap & Milestones

- [x] **Milestone 1 — Board Foundation**: 8×8 Grid with DOM + CSS Grid, piece representation & coordinates (`a1` → `h8`).
- [x] **Milestone 2 — Piece Movement**: Movement & captures for all pieces, move validation, check & checkmate detection.
- [ ] **Milestone 3 — Special Rules & History**: En passant, castling rights, promotion, draw conditions, move history & undo.
- [ ] **Milestone 4 — Chess Engine Core**: Material & positional evaluation, Minimax search, Alpha-Beta pruning.
- [ ] **Milestone 5 — Web Worker Integration**: Offload engine search logic to Web Worker thread for non-blocking UI.
- [ ] **Milestone 6 — WebRTC P2P Multiplayer**: Direct browser-to-browser connection for online play without servers.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
