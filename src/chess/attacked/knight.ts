import { isInsideBoard } from '../moves'
import type { Board, Color, SquareCoordinate } from '../types'

export function isAttackedByKnight(
  board: Board,
  square: SquareCoordinate,
  byColor: Color,
): boolean {
  const knightOffsets = [
    { rowOffset: -2, colOffset: -1 },
    { rowOffset: -2, colOffset: 1 },
    { rowOffset: -1, colOffset: -2 },
    { rowOffset: -1, colOffset: 2 },
    { rowOffset: 1, colOffset: -2 },
    { rowOffset: 1, colOffset: 2 },
    { rowOffset: 2, colOffset: -1 },
    { rowOffset: 2, colOffset: 1 },
  ]

  for (const offset of knightOffsets) {
    const targetRow = square.row + offset.rowOffset
    const targetCol = square.col + offset.colOffset

    if (!isInsideBoard(targetRow, targetCol)) {
      continue
    }

    const targetPiece = board[targetRow][targetCol]

    if (targetPiece?.type === 'n' && targetPiece.color === byColor) {
      return true
    }
  }

  return false
}
