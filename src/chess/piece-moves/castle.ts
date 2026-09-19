import { isSquareAttacked } from '../moves'
import { Board, CastlingRights, SquareCoordinate } from '../types'

export function getCastlingMoves(
  board: Board,
  from: SquareCoordinate,
  castlingRights: CastlingRights,
): SquareCoordinate[] {
  const piece = board[from.row][from.col]

  if (!piece || piece.type !== 'k') {
    return []
  }

  const moves: SquareCoordinate[] = []

  // White
  if (piece.color === 'white') {
    // White kingside castling
    if (castlingRights.whiteKingSide) {
      const kingRow = 7
      const kingCol = 4

      const rook = board[7][7]

      const isKingOnStartingSquare =
        from.row === kingRow && from.col === kingCol

      const isRookValid = rook?.type === 'r' && rook.color === 'white'

      const isPathClear = board[7][5] === null && board[7][6] === null

      const isKingPathSafe =
        !isSquareAttacked(board, { row: 7, col: 4 }, 'black') &&
        !isSquareAttacked(board, { row: 7, col: 5 }, 'black') &&
        !isSquareAttacked(board, { row: 7, col: 6 }, 'black')

      if (
        isKingOnStartingSquare &&
        isRookValid &&
        isPathClear &&
        isKingPathSafe
      ) {
        moves.push({ row: 7, col: 6 })
      }
    }

    // White Queenside castling
    if (castlingRights.whiteQueenSide) {
      const kingRow = 7
      const kingCol = 4

      const rook = board[7][0]

      const isKingOnStartingSquare =
        from.row === kingRow && from.col === kingCol

      const isRookValid = rook?.type === 'r' && rook.color === 'white'

      const isPathClear =
        board[7][3] === null && board[7][2] === null && board[7][1] === null

      const isKingPathSafe =
        !isSquareAttacked(board, { row: 7, col: 4 }, 'black') &&
        !isSquareAttacked(board, { row: 7, col: 3 }, 'black') &&
        !isSquareAttacked(board, { row: 7, col: 2 }, 'black')

      if (
        isKingOnStartingSquare &&
        isRookValid &&
        isPathClear &&
        isKingPathSafe
      ) {
        moves.push({ row: 7, col: 2 })
      }
    }
  }

  // Black
  if (piece.color === 'black') {
    // Black kingside castling
    if (castlingRights.blackKingSide) {
      const kingRow = 0
      const kingCol = 4

      const rook = board[0][7]

      const isKingOnStartingSquare =
        from.row === kingRow && from.col === kingCol

      const isRookValid = rook?.type === 'r' && rook.color === 'black'

      const isPathClear = board[0][5] === null && board[0][6] === null

      const isKingPathSafe =
        !isSquareAttacked(board, { row: 0, col: 4 }, 'white') &&
        !isSquareAttacked(board, { row: 0, col: 5 }, 'white') &&
        !isSquareAttacked(board, { row: 0, col: 6 }, 'white')

      if (
        isKingOnStartingSquare &&
        isRookValid &&
        isPathClear &&
        isKingPathSafe
      ) {
        moves.push({ row: 0, col: 6 })
      }
    }

    // Black Queenside castling
    if (castlingRights.blackQueenSide) {
      const kingRow = 0
      const kingCol = 4

      const rook = board[0][0]

      const isKingOnStartingSquare =
        from.row === kingRow && from.col === kingCol

      const isRookValid = rook?.type === 'r' && rook.color === 'black'

      const isPathClear =
        board[0][3] === null && board[0][2] === null && board[0][1] === null

      const isKingPathSafe =
        !isSquareAttacked(board, { row: 0, col: 4 }, 'white') &&
        !isSquareAttacked(board, { row: 0, col: 3 }, 'white') &&
        !isSquareAttacked(board, { row: 0, col: 2 }, 'white')

      if (
        isKingOnStartingSquare &&
        isRookValid &&
        isPathClear &&
        isKingPathSafe
      ) {
        moves.push({ row: 0, col: 2 })
      }
    }
  }

  return moves
}
