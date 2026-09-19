import { isInsideBoard } from '../moves'
import { Board, Color, SquareCoordinate } from '../types'

export function isAttackedByPawn(
  board: Board,
  square: SquareCoordinate,
  byColor: Color,
) {
  const pawnRow = square.row + (byColor === 'white' ? 1 : -1)

  if (!isInsideBoard(pawnRow, square.col - 1)) {
    return false
  }

  const pawnColLeft = square.col - 1
  const pawnColRight = square.col + 1

  if (isInsideBoard(pawnRow, pawnColLeft)) {
    const target = board[pawnRow][pawnColLeft]

    if (target?.type === 'p' && target.color === byColor) {
      return true
    }
  }

  if (isInsideBoard(pawnRow, pawnColRight)) {
    const target = board[pawnRow][pawnColRight]

    if (target?.type === 'p' && target.color === byColor) {
      return true
    }
  }

  return false
}
