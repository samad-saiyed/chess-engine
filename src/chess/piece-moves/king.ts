import { isInsideBoard } from '../moves'
import type { Board, SquareCoordinate } from '../types'

export function getKingMoves(
  board: Board,
  from: SquareCoordinate,
): SquareCoordinate[] {
  const piece = board[from.row][from.col]

  if (!piece || piece.type !== 'k') {
    return []
  }

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

  const moves: SquareCoordinate[] = []

  for (const offset of offsets) {
    const targetRow = from.row + offset.rowOffset
    const targetCol = from.col + offset.colOffset

    if (!isInsideBoard(targetRow, targetCol)) {
      continue
    }

    const targetPiece = board[targetRow][targetCol]

    if (!targetPiece || targetPiece.color !== piece.color) {
      moves.push({
        row: targetRow,
        col: targetCol,
      })
    }
  }

  return moves
}
