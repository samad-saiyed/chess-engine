import type { Board, Color, Piece, PieceType } from './types'

const backRank: PieceType[] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r']

function createPiece(type: PieceType, color: Color): Piece {
  return {
    type,
    color,
  }
}

export function createInitialBoard(): Board {
  const board: Board = Array.from({ length: 8 }, () =>
    Array<Piece | null>(8).fill(null),
  )

  // Black pieces
  board[0] = backRank.map((type) => createPiece(type, 'black'))
  board[1] = Array.from({ length: 8 }, () => createPiece('p', 'black'))

  // White pieces
  board[6] = Array.from({ length: 8 }, () => createPiece('p', 'white'))
  board[7] = backRank.map((type) => createPiece(type, 'white'))

  return board
}
