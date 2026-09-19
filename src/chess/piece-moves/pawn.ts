import { isInsideBoard } from '../moves'
import { Board, SquareCoordinate } from '../types'

export function getPawnMoves(
  board: Board,
  from: SquareCoordinate,
): SquareCoordinate[] {
  const piece = board[from.row][from.col]

  if (!piece || piece.type !== 'p') {
    return []
  }

  const moves: SquareCoordinate[] = []

  const direction = piece.color === 'white' ? -1 : 1
  const startingRow = piece.color === 'white' ? 6 : 1

  // One square forward
  const oneStepRow = from.row + direction

  if (
    isInsideBoard(oneStepRow, from.col) &&
    board[oneStepRow][from.col] === null
  ) {
    moves.push({
      row: oneStepRow,
      col: from.col,
    })

    // Two squares forward from starting position
    const twoStepRow = from.row + direction * 2

    if (
      from.row === startingRow &&
      isInsideBoard(twoStepRow, from.col) &&
      board[twoStepRow][from.col] === null
    ) {
      moves.push({
        row: twoStepRow,
        col: from.col,
      })
    }
  }

  // Diagonal captures
  for (const colOffset of [-1, 1]) {
    const captureRow = from.row + direction
    const captureCol = from.col + colOffset

    if (!isInsideBoard(captureRow, captureCol)) {
      continue
    }

    const targetPiece = board[captureRow][captureCol]

    if (targetPiece && targetPiece.color !== piece.color) {
      moves.push({
        row: captureRow,
        col: captureCol,
      })
    }
  }

  return moves
}
