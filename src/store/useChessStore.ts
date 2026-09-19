import { createInitialBoard } from '@/chess/board'
import {
  getEnPassantTarget,
  getGameStatus,
  getLegalMoves,
  isPromotionMove,
  makeCastlingMove,
  makeEnPassantMove,
  makeMove,
  makePromotionMove,
  updateCastlingRights,
} from '@/chess/moves'
import { getCastlingMoves } from '@/chess/piece-moves/castle'
import { getEnPassantMoves } from '@/chess/piece-moves/en-passant'
import type {
  Board,
  CastlingRights,
  Color,
  GameStatus,
  Move,
  MoveType,
  PieceType,
  SquareCoordinate,
} from '@/chess/types'
import { gooeyToast } from 'goey-toast'
import { capitalize } from 'lodash'
import { create } from 'zustand'

interface ChessStore {
  board: Board
  turn: Color
  status: GameStatus
  moveHistory: Move[]
  selectedSquare: SquareCoordinate | null
  castlingRights: CastlingRights
  pendingPromotion: {
    from: SquareCoordinate
    to: SquareCoordinate
  } | null
  enPassantTarget: SquareCoordinate | null

  // Actions
  setSelectedSquare: (square: SquareCoordinate | null) => void
  handleSquareClick: (row: number, col: number) => void
  completePromotion: (promotionPiece: PieceType) => void
  cancelPromotion: () => void
  resetGame: () => void
}

export const useChessStore = create<ChessStore>((set, get) => ({
  board: createInitialBoard(),
  turn: 'white',
  status: 'playing',
  moveHistory: [],
  selectedSquare: null,
  castlingRights: {
    whiteKingSide: true,
    whiteQueenSide: true,
    blackKingSide: true,
    blackQueenSide: true,
  },
  pendingPromotion: null,
  enPassantTarget: null,

  setSelectedSquare: (square) => set({ selectedSquare: square }),

  cancelPromotion: () => set({ pendingPromotion: null }),

  resetGame: () =>
    set({
      board: createInitialBoard(),
      turn: 'white',
      status: 'playing',
      selectedSquare: null,
      pendingPromotion: null,
      moveHistory: [],
      castlingRights: {
        whiteKingSide: true,
        whiteQueenSide: true,
        blackKingSide: true,
        blackQueenSide: true,
      },
      enPassantTarget: null,
    }),

  handleSquareClick: (row, col) => {
    const {
      board,
      turn,
      status,
      selectedSquare,
      moveHistory,
      resetGame,
      castlingRights,
      enPassantTarget,
    } = get()

    if (status === 'checkmate' || status === 'stalemate') {
      return
    }

    const clickedPiece = board[row][col]

    // Nothing selected yet
    if (!selectedSquare) {
      if (!clickedPiece || clickedPiece.color !== turn) {
        return
      }

      set({ selectedSquare: { row, col } })
      return
    }

    // Clicking the same square deselects it
    if (selectedSquare.row === row && selectedSquare.col === col) {
      set({ selectedSquare: null })
      return
    }

    // Clicking another piece of the same color selects it
    if (clickedPiece?.color === turn) {
      set({ selectedSquare: { row, col } })
      return
    }

    // Check whether the clicked square is a valid destination
    const validMoves = getLegalMoves(
      board,
      selectedSquare,
      castlingRights,
      enPassantTarget,
    )
    const canMove = validMoves.some(
      (move) => move.row === row && move.col === col,
    )

    if (!canMove) {
      set({ selectedSquare: null })
      return
    }

    const isPromotion = isPromotionMove(board, selectedSquare, { row, col })

    if (isPromotion) {
      set({
        pendingPromotion: {
          from: selectedSquare,
          to: { row, col },
        },
        selectedSquare: null,
      })
      return
    }

    const castlingMoves = getCastlingMoves(
      board,
      selectedSquare,
      castlingRights,
    )

    const isCastlingMove = castlingMoves.some(
      (move) => move.row === row && move.col === col,
    )

    const piece = board[selectedSquare.row][selectedSquare.col]

    if (!piece) {
      return
    }

    const enPassantMoves =
      piece.type === 'p'
        ? getEnPassantMoves(board, selectedSquare, enPassantTarget)
        : []

    const isEnPassant = enPassantMoves.some(
      (move) => move.row === row && move.col === col,
    )

    const capturedPiece = isEnPassant
      ? board[selectedSquare.row][col]
      : board[row][col]

    let nextBoard: Board
    let moveType: MoveType = 'normal'

    if (isCastlingMove) {
      moveType = 'castle'
      nextBoard = makeCastlingMove(board, selectedSquare, { row, col })
    } else if (isEnPassant) {
      moveType = 'en-passant'
      nextBoard = makeEnPassantMove(board, selectedSquare, { row, col })
    } else {
      nextBoard = makeMove(board, selectedSquare, { row, col })
    }

    const move: Move = {
      from: selectedSquare,
      to: { row, col },
      piece,
      capturedPiece,
      type: moveType,
    }

    const nextCastlingRights = updateCastlingRights(castlingRights, move)
    const nextTurn = turn === 'white' ? 'black' : 'white'
    const nextStatus = getGameStatus(
      nextBoard,
      nextTurn,
      nextCastlingRights,
      enPassantTarget,
    )

    if (nextStatus === 'checkmate') {
      gooeyToast.success('Checkmate', {
        description: `${capitalize(turn)} wins!`,
        action: {
          label: 'Restart?',
          onClick: () => {
            gooeyToast.dismiss()
            resetGame()
          },
        },
        showTimestamp: false,
      })
    }

    if (nextStatus === 'stalemate') {
      gooeyToast.success('Stalemate!', {
        description: 'Your match resulted in a DRAW!',
        action: {
          label: 'Restart?',
          onClick: () => {
            gooeyToast.dismiss()
            resetGame()
          },
        },
        showTimestamp: false,
      })
    }

    const nextEnPassantTarget = getEnPassantTarget(board, selectedSquare, {
      row,
      col,
    })

    set({
      board: nextBoard,
      turn: nextTurn,
      status: nextStatus,
      moveHistory: [...moveHistory, move],
      castlingRights: nextCastlingRights,
      selectedSquare: null,
      enPassantTarget: nextEnPassantTarget,
    })
  },

  completePromotion: (promotionPiece: PieceType) => {
    const {
      board,
      turn,
      pendingPromotion,
      moveHistory,
      resetGame,
      castlingRights,
      enPassantTarget,
    } = get()

    if (!pendingPromotion) {
      return
    }

    const { from, to } = pendingPromotion
    const piece = board[from.row][from.col]
    if (!piece) {
      return
    }

    const capturedPiece = board[to.row][to.col]
    const nextBoard = makePromotionMove(board, from, to, promotionPiece)

    const move: Move = {
      from,
      to,
      piece,
      capturedPiece,
      type: 'promotion',
      promotionPiece,
    }

    const nextCastlingRights = updateCastlingRights(castlingRights, move)
    const nextTurn = turn === 'white' ? 'black' : 'white'
    const nextStatus = getGameStatus(
      nextBoard,
      nextTurn,
      nextCastlingRights,
      enPassantTarget,
    )

    if (nextStatus === 'checkmate') {
      gooeyToast.success('Checkmate', {
        description: `${capitalize(turn)} wins!`,
        action: {
          label: 'Restart?',
          onClick: () => {
            gooeyToast.dismiss()
            resetGame()
          },
        },
        showTimestamp: false,
      })
    }

    if (nextStatus === 'stalemate') {
      gooeyToast.success('Stalemate!', {
        description: 'Your match resulted in a DRAW!',
        action: {
          label: 'Restart?',
          onClick: () => {
            gooeyToast.dismiss()
            resetGame()
          },
        },
        showTimestamp: false,
      })
    }

    set({
      board: nextBoard,
      turn: nextTurn,
      status: nextStatus,
      moveHistory: [...moveHistory, move],
      castlingRights: nextCastlingRights,
      selectedSquare: null,
      pendingPromotion: null,
      enPassantTarget: null,
    })
  },
}))
