import type { Board, PieceType } from './types'

export const PIECE_MATERIAL_POINTS: Record<PieceType, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
}

const STARTING_PIECES: Record<PieceType, number> = {
  p: 8,
  n: 2,
  b: 2,
  r: 2,
  q: 1,
  k: 1,
}

export interface PlayerMaterialSummary {
  capturedPieces: PieceType[]
  materialAdvantage: number // positive if this player is ahead in material
}

export function getMaterialSummary(board: Board): {
  white: PlayerMaterialSummary
  black: PlayerMaterialSummary
} {
  const whiteOnBoard: Record<PieceType, number> = {
    p: 0,
    n: 0,
    b: 0,
    r: 0,
    q: 0,
    k: 0,
  }
  const blackOnBoard: Record<PieceType, number> = {
    p: 0,
    n: 0,
    b: 0,
    r: 0,
    q: 0,
    k: 0,
  }

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (!piece) continue
      if (piece.color === 'white') {
        whiteOnBoard[piece.type]++
      } else {
        blackOnBoard[piece.type]++
      }
    }
  }

  const pieceOrder: PieceType[] = ['p', 'n', 'b', 'r', 'q']

  // Pieces captured BY White (taken from Black)
  const whiteCaptured: PieceType[] = []
  let whiteCapturedScore = 0
  for (const type of pieceOrder) {
    const missing = Math.max(0, STARTING_PIECES[type] - blackOnBoard[type])
    for (let i = 0; i < missing; i++) {
      whiteCaptured.push(type)
      whiteCapturedScore += PIECE_MATERIAL_POINTS[type]
    }
  }

  // Pieces captured BY Black (taken from White)
  const blackCaptured: PieceType[] = []
  let blackCapturedScore = 0
  for (const type of pieceOrder) {
    const missing = Math.max(0, STARTING_PIECES[type] - whiteOnBoard[type])
    for (let i = 0; i < missing; i++) {
      blackCaptured.push(type)
      blackCapturedScore += PIECE_MATERIAL_POINTS[type]
    }
  }

  const scoreDiff = whiteCapturedScore - blackCapturedScore

  return {
    white: {
      capturedPieces: whiteCaptured,
      materialAdvantage: scoreDiff > 0 ? scoreDiff : 0,
    },
    black: {
      capturedPieces: blackCaptured,
      materialAdvantage: scoreDiff < 0 ? Math.abs(scoreDiff) : 0,
    },
  }
}
