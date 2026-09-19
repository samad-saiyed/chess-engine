import { createInitialBoard } from '@/chess/board'
import {
  getGameStatus,
  getLegalMoves,
  isPromotionMove,
  makeCastlingMove,
  makeMove,
  makePromotionMove,
} from '@/chess/moves'
import { getCastlingMoves } from '@/chess/piece-moves/castle'
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

  // Actions
  setSelectedSquare: (square: SquareCoordinate | null) => void
  handleSquareClick: (row: number, col: number) => void
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

  setSelectedSquare: (square) => set({ selectedSquare: square }),

  resetGame: () =>
    set({
      board: createInitialBoard(),
      turn: 'white',
      status: 'playing',
      selectedSquare: null,
      moveHistory: [],
      castlingRights: {
        whiteKingSide: true,
        whiteQueenSide: true,
        blackKingSide: true,
        blackQueenSide: true,
      },
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
    const validMoves = getLegalMoves(board, selectedSquare, castlingRights)
    const canMove = validMoves.some(
      (move) => move.row === row && move.col === col,
    )

    const isPromotion = isPromotionMove(board, selectedSquare, { row, col })

    const castlingMoves = getCastlingMoves(
      board,
      selectedSquare,
      castlingRights,
    )

    const isCastlingMove = castlingMoves.some(
      (move) => move.row === row && move.col === col,
    )

    if (!canMove) {
      set({ selectedSquare: null })
      return
    }

    const piece = board[selectedSquare.row][selectedSquare.col]

    if (!piece) {
      return
    }

    const capturedPiece = board[row][col]

    let nextBoard: Board
    let moveType: MoveType = 'normal'
    let promotionPiece: PieceType | undefined

    if (isPromotion) {
      promotionPiece = 'q' // temporary
      moveType = 'promotion'

      nextBoard = makePromotionMove(
        board,
        selectedSquare,
        { row, col },
        promotionPiece,
      )
    } else if (isCastlingMove) {
      moveType = 'castle'

      nextBoard = makeCastlingMove(board, selectedSquare, { row, col })
    } else {
      nextBoard = makeMove(board, selectedSquare, { row, col })
    }

    const move: Move = {
      from: selectedSquare,
      to: { row, col },
      piece,
      capturedPiece,
      type: moveType,
      promotionPiece,
    }

    const nextTurn = turn === 'white' ? 'black' : 'white'
    const nextStatus = getGameStatus(nextBoard, nextTurn, castlingRights)

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
      selectedSquare: null,
    })
  },
}))
