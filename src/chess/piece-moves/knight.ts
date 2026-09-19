import { isInsideBoard } from '../moves'
import { Board, SquareCoordinate } from '../types'

export function getKnightMoves(
  board: Board,
  from: SquareCoordinate,
): SquareCoordinate[] {
  const piece = board[from.row][from.col]

  if (!piece || piece.type !== 'n') {
    return []
  }

  const moves: SquareCoordinate[] = []

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
