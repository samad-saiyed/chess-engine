import { isAttackedByKing } from './attacked/king'
import { isAttackedByKnight } from './attacked/knight'
import { isAttackedByPawn } from './attacked/pawn'
import { getBishopMoves } from './piece-moves/bishop'
import { getCastlingMoves } from './piece-moves/castle'
import { getEnPassantMoves } from './piece-moves/en-passant'
import { getKingMoves } from './piece-moves/king'
import { getKnightMoves } from './piece-moves/knight'
import { getPawnMoves } from './piece-moves/pawn'
import { getQueenMoves } from './piece-moves/queen'
import { getRookMoves } from './piece-moves/rook'
import type {
  Board,
  CastlingRights,
  Color,
  GameStatus,
  Move,
  PieceType,
  SquareCoordinate,
} from './types'

export function isInsideBoard(row: number, col: number): boolean {
  return row >= 0 && row < 8 && col >= 0 && col < 8
}

export function getSlidingMoves({
  board,
  from,
  offsets,
}: {
  board: Board
  from: SquareCoordinate
  offsets: { rowOffset: number; colOffset: number }[]
}): SquareCoordinate[] {
  const moves: SquareCoordinate[] = []
  const piece = board[from.row][from.col]

  if (!piece) return []

  for (const offset of offsets) {
    let currentRow = from.row + offset.rowOffset
    let currentCol = from.col + offset.colOffset

    while (isInsideBoard(currentCol, currentRow)) {
      const targetPiece = board[currentRow][currentCol]

      if (!targetPiece) {
        moves.push({
          row: currentRow,
          col: currentCol,
        })
      } else if (targetPiece.color !== piece.color) {
        moves.push({
          row: currentRow,
          col: currentCol,
        })
        break
      } else {
        break
      }

      currentRow += offset.rowOffset
      currentCol += offset.colOffset
    }
  }

  return moves
}

export function getPieceMoves(
  board: Board,
  from: SquareCoordinate,
): SquareCoordinate[] {
  const piece = board[from.row][from.col]

  if (!piece) {
    return []
  }

  switch (piece.type) {
    case 'p':
      return getPawnMoves(board, from)
    case 'n':
      return getKnightMoves(board, from)
    case 'b':
      return getBishopMoves(board, from)
    case 'r':
      return getRookMoves(board, from)
    case 'q':
      return getQueenMoves(board, from)
    case 'k':
      return getKingMoves(board, from)
    default:
      return []
  }
}

export function makeMove(
  board: Board,
  from: SquareCoordinate,
  to: SquareCoordinate,
): Board {
  const nextBoard = board.map((row) => [...row])

  nextBoard[to.row][to.col] = nextBoard[from.row][from.col]
  nextBoard[from.row][from.col] = null

  return nextBoard
}

export function findKing(
  board: Board,
  color: Color,
): SquareCoordinate | undefined {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]

      if (piece?.color === color && piece?.type === 'k') {
        return { row, col }
      }
    }
  }

  return undefined
}

export function isAttackedBySlidingPiece(
  board: Board,
  square: SquareCoordinate,
  byColor: Color,
  offsets: { rowOffset: number; colOffset: number }[],
  pieceTypes: readonly PieceType[],
): boolean {
  for (const offset of offsets) {
    let currentRow = square.row + offset.rowOffset
    let currentCol = square.col + offset.colOffset

    while (isInsideBoard(currentRow, currentCol)) {
      const targetPiece = board[currentRow][currentCol]

      if (targetPiece) {
        if (
          targetPiece.color === byColor &&
          pieceTypes.includes(targetPiece.type)
        ) {
          return true
        }
        break
      }

      currentRow += offset.rowOffset
      currentCol += offset.colOffset
    }
  }

  return false
}

export function isSquareAttacked(
  board: Board,
  square: SquareCoordinate,
  byColor: Color,
): boolean {
  const diagonalOffsets = [
    { rowOffset: -1, colOffset: -1 },
    { rowOffset: -1, colOffset: 1 },
    { rowOffset: 1, colOffset: -1 },
    { rowOffset: 1, colOffset: 1 },
  ]

  const straightOffsets = [
    { rowOffset: -1, colOffset: 0 },
    { rowOffset: 1, colOffset: 0 },
    { rowOffset: 0, colOffset: -1 },
    { rowOffset: 0, colOffset: 1 },
  ]

  return (
    isAttackedByKnight(board, square, byColor) ||
    isAttackedByPawn(board, square, byColor) ||
    isAttackedByKing(board, square, byColor) ||
    isAttackedBySlidingPiece(board, square, byColor, diagonalOffsets, [
      'b',
      'q',
    ]) ||
    isAttackedBySlidingPiece(board, square, byColor, straightOffsets, [
      'r',
      'q',
    ])
  )
}

export function isKingInCheck(board: Board, color: Color): boolean {
  const kingPosition = findKing(board, color)
  if (!kingPosition) {
    // gooeyToast.error('King not found', {
    //   description:
    //     'There was an error encountered. We could not locate your king!',
    //   preset: 'smooth',
    // })
    return false
  }

  const opponentColor = color === 'white' ? 'black' : 'white'

  return isSquareAttacked(board, kingPosition, opponentColor)
}

export function getLegalMoves(
  board: Board,
  from: SquareCoordinate,
  castlingRights: CastlingRights,
  enPassantTarget: SquareCoordinate | null,
): SquareCoordinate[] {
  const piece = board[from.row][from.col]

  if (!piece) {
    return []
  }

  const pseudoLegalMoves = getPieceMoves(board, from)

  let legalMoves = pseudoLegalMoves.filter((to) => {
    const nextBoard = makeMove(board, from, to)

    return !isKingInCheck(nextBoard, piece.color)
  })

  // Add castling moves for king
  if (piece.type === 'k') {
    const castlingMoves = getCastlingMoves(board, from, castlingRights)

    legalMoves = [...legalMoves, ...castlingMoves]
  }

  // Add en passant moves for pawn
  if (piece.type === 'p') {
    const enPassantMoves = getEnPassantMoves(board, from, enPassantTarget)

    const legalEnPassantMoves = enPassantMoves.filter((to) => {
      const nextBoard = makeEnPassantMove(board, from, to)

      return !isKingInCheck(nextBoard, piece.color)
    })

    legalMoves = [...legalMoves, ...legalEnPassantMoves]
  }

  return legalMoves
}

export function hasAnyLegalMoves(
  board: Board,
  color: Color,
  castlingRights: CastlingRights,
  enPassantTarget: SquareCoordinate | null,
): boolean {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]

      if (piece?.color === color) {
        const legalMoves = getLegalMoves(
          board,
          { row, col },
          castlingRights,
          enPassantTarget,
        )

        if (legalMoves.length > 0) {
          return true
        }
      }
    }
  }
  return false
}

export function isCheckmate(
  board: Board,
  color: Color,
  castlingRights: CastlingRights,
  enPassantTarget: SquareCoordinate | null,
): boolean {
  return (
    isKingInCheck(board, color) &&
    !hasAnyLegalMoves(board, color, castlingRights, enPassantTarget)
  )
}

export function isStalemate(
  board: Board,
  color: Color,
  castlingRights: CastlingRights,
  enPassantTarget: SquareCoordinate | null,
): boolean {
  return (
    !isKingInCheck(board, color) &&
    !hasAnyLegalMoves(board, color, castlingRights, enPassantTarget)
  )
}

export function getGameStatus(
  board: Board,
  color: Color,
  castlingRights: CastlingRights,
  enPassantTarget: SquareCoordinate | null,
): GameStatus {
  if (isCheckmate(board, color, castlingRights, enPassantTarget)) {
    return 'checkmate'
  }

  if (isStalemate(board, color, castlingRights, enPassantTarget)) {
    return 'stalemate'
  }

  if (isKingInCheck(board, color)) {
    return 'check'
  }

  return 'playing'
}

export function updateCastlingRights(
  castlingRights: CastlingRights,
  move: Move,
): CastlingRights {
  const { from, to, piece } = move
  const nextCastlingRights = { ...castlingRights }

  // If the king moves, remove all castling rights for that color
  if (piece.type === 'k') {
    if (piece.color === 'white') {
      nextCastlingRights.whiteKingSide = false
      nextCastlingRights.whiteQueenSide = false
    } else {
      nextCastlingRights.blackKingSide = false
      nextCastlingRights.blackQueenSide = false
    }
  }

  // If a rook moves, remove the corresponding castling right
  if (piece.type === 'r') {
    if (piece.color === 'white') {
      if (from.row === 7 && from.col === 0) {
        nextCastlingRights.whiteQueenSide = false
      } else if (from.row === 7 && from.col === 7) {
        nextCastlingRights.whiteKingSide = false
      }
    } else {
      if (from.row === 0 && from.col === 0) {
        nextCastlingRights.blackQueenSide = false
      } else if (from.row === 0 && from.col === 7) {
        nextCastlingRights.blackKingSide = false
      }
    }
  }

  // If a rook is captured, remove the corresponding castling right
  if (move.capturedPiece?.type === 'r') {
    if (move.capturedPiece.color === 'white') {
      if (to.row === 7 && to.col === 0) {
        nextCastlingRights.whiteQueenSide = false
      } else if (to.row === 7 && to.col === 7) {
        nextCastlingRights.whiteKingSide = false
      }
    } else {
      if (to.row === 0 && to.col === 0) {
        nextCastlingRights.blackQueenSide = false
      } else if (to.row === 0 && to.col === 7) {
        nextCastlingRights.blackKingSide = false
      }
    }
  }

  return nextCastlingRights
}

export function makeCastlingMove(
  board: Board,
  from: SquareCoordinate,
  to: SquareCoordinate,
): Board {
  const nextBoard = board.map((row) => [...row])

  //White
  if (from.row === 7 && from.col === 4) {
    // Kingside
    if (to.col === 6) {
      // King Moves
      nextBoard[7][6] = nextBoard[7][4]
      nextBoard[7][4] = null

      // Rook Moves
      nextBoard[7][5] = nextBoard[7][7]
      nextBoard[7][7] = null
    }

    // Queenside
    if (to.col === 2) {
      // King Moves
      nextBoard[7][2] = nextBoard[7][4]
      nextBoard[7][4] = null

      // Rook Moves
      nextBoard[7][3] = nextBoard[7][0]
      nextBoard[7][0] = null
    }
  }

  //Black
  if (from.row === 0 && from.col === 4) {
    // Kingside
    if (to.col === 6) {
      // King Moves
      nextBoard[0][6] = nextBoard[0][4]
      nextBoard[0][4] = null

      // Rook Moves
      nextBoard[0][5] = nextBoard[0][7]
      nextBoard[0][7] = null
    }

    // Queenside
    if (to.col === 2) {
      // King Moves
      nextBoard[0][2] = nextBoard[0][4]
      nextBoard[0][4] = null

      // Rook Moves
      nextBoard[0][3] = nextBoard[0][0]
      nextBoard[0][0] = null
    }
  }

  return nextBoard
}

export function isPromotionMove(
  board: Board,
  from: SquareCoordinate,
  to: SquareCoordinate,
): boolean {
  const piece = board[from.row][from.col]

  if (!piece || piece.type !== 'p') {
    return false
  }
  if (piece.color === 'white') {
    return to.row === 0
  }

  return to.row === 7
}

export function makePromotionMove(
  board: Board,
  from: SquareCoordinate,
  to: SquareCoordinate,
  promotionPiece: PieceType,
): Board {
  const nextBoard = board.map((row) => [...row])

  const piece = nextBoard[from.row][from.col]

  if (!piece) {
    return board
  }

  nextBoard[to.row][to.col] = { ...piece, type: promotionPiece }
  nextBoard[from.row][from.col] = null

  return nextBoard
}

export function getEnPassantTarget(
  board: Board,
  from: SquareCoordinate,
  to: SquareCoordinate,
): SquareCoordinate | null {
  const piece = board[from.row][from.col]

  if (!piece || piece.type !== 'p') {
    return null
  }

  const rowDifference = Math.abs(to.row - from.row)

  if (rowDifference !== 2) {
    return null
  }

  return {
    row: (from.row + to.row) / 2,
    col: from.col,
  }
}

export function makeEnPassantMove(
  board: Board,
  from: SquareCoordinate,
  to: SquareCoordinate,
): Board {
  const nextBoard = board.map((row) => [...row])

  const piece = nextBoard[from.row][from.col]

  if (!piece) {
    return board
  }

  // Move the pawn
  nextBoard[to.row][to.col] = piece
  nextBoard[from.row][from.col] = null

  // Remove the captured pawn
  nextBoard[from.row][to.col] = null

  return nextBoard
}
