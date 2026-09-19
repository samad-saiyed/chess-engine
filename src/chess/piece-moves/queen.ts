import { getSlidingMoves } from '../moves'
import { Board, SquareCoordinate } from '../types'

export function getQueenMoves(
  board: Board,
  from: SquareCoordinate,
): SquareCoordinate[] {
  const piece = board[from.row][from.col]

  if (!piece || piece.type !== 'q') {
    return []
  }

  const offsets = [
    // Rook moves
    { rowOffset: -1, colOffset: 0 },
    { rowOffset: 1, colOffset: 0 },
    { rowOffset: 0, colOffset: -1 },
    { rowOffset: 0, colOffset: 1 },
    // Bishop moves
    { rowOffset: -1, colOffset: 1 },
    { rowOffset: -1, colOffset: -1 },
    { rowOffset: 1, colOffset: 1 },
    { rowOffset: 1, colOffset: -1 },
  ]

  return getSlidingMoves({ board, from, offsets })
}
