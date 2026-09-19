import { getSlidingMoves } from '../moves'
import { Board, SquareCoordinate } from '../types'

export function getBishopMoves(
  board: Board,
  from: SquareCoordinate,
): SquareCoordinate[] {
  const piece = board[from.row][from.col]

  if (!piece || piece.type !== 'b') {
    return []
  }

  const offsets = [
    { rowOffset: -1, colOffset: 1 },
    { rowOffset: -1, colOffset: -1 },
    { rowOffset: 1, colOffset: 1 },
    { rowOffset: 1, colOffset: -1 },
  ]

  return getSlidingMoves({ board, from, offsets })
}
