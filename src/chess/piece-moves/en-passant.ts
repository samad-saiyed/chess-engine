import { Board, SquareCoordinate } from '../types'

export function getEnPassantMoves(
  board: Board,
  from: SquareCoordinate,
  enPassantTarget: SquareCoordinate | null,
): SquareCoordinate[] {
  const piece = board[from.row][from.col]

  if (!piece || piece.type !== 'p' || !enPassantTarget) {
    return []
  }

  const direction = piece.color === 'white' ? -1 : 1

  const rowDifference = enPassantTarget.row - from.row
  const colDifference = Math.abs(enPassantTarget.col - from.col)

  const isValidTarget = rowDifference === direction && colDifference === 1

  if (!isValidTarget) {
    return []
  }

  const capturedPawn = board[from.row][enPassantTarget.col]

  if (capturedPawn?.type !== 'p' || capturedPawn.color === piece.color) {
    return []
  }

  return [enPassantTarget]
}
