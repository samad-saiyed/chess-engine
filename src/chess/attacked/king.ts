import { isInsideBoard } from '../moves'
import { Board, Color, SquareCoordinate } from '../types'

export function isAttackedByKing(
  board: Board,
  square: SquareCoordinate,
  byColor: Color,
) {
  const offsets = [
    { rowOffset: -1, colOffset: 1 },
    { rowOffset: -1, colOffset: -1 },
    { rowOffset: 1, colOffset: 1 },
    { rowOffset: 1, colOffset: -1 },
    { rowOffset: -1, colOffset: 0 },
    { rowOffset: 1, colOffset: 0 },
    { rowOffset: 0, colOffset: -1 },
    { rowOffset: 0, colOffset: 1 },
  ]

  for (const offset of offsets) {
    const targetRow = square.row + offset.rowOffset
    const targetCol = square.col + offset.colOffset

    if (!isInsideBoard(targetRow, targetCol)) {
      continue
    }

    const targetPiece = board[targetRow][targetCol]

    if (targetPiece?.type === 'k' && targetPiece.color === byColor) {
      return true
    }
  }

  return false
}
