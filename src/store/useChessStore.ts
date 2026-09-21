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
import { requestBestMove } from '@/engine/engineWorkerClient'
import type { EngineDifficulty } from '@/engine/types'
import { getStoredPlayerName, savePlayerName } from '@/lib/profile'
import { playMoveSound, playSound } from '@/lib/sounds'
import type { PeerConnectionState, PeerRole } from '@/multiplayer/types'
import { webrtcManager } from '@/multiplayer/webrtc'
import { gooeyToast } from 'goey-toast'
import { create } from 'zustand'
import {
  sessionMemory,
  type StoredGameSession,
} from '@/multiplayer/sessionMemory'
import type { TimeControl } from '@/chess/timer'

export function reconstructBoardFromHistory(moveHistory: Move[]): {
  board: Board
  turn: Color
  castlingRights: CastlingRights
  enPassantTarget: SquareCoordinate | null
  lastMove: { from: SquareCoordinate; to: SquareCoordinate } | null
} {
  let board = createInitialBoard()
  let turn: Color = 'white'
  let castlingRights: CastlingRights = {
    whiteKingSide: true,
    whiteQueenSide: true,
    blackKingSide: true,
    blackQueenSide: true,
  }
  let enPassantTarget: SquareCoordinate | null = null
  let lastMove: { from: SquareCoordinate; to: SquareCoordinate } | null = null

  for (const move of moveHistory) {
    const { from, to, type, promotionPiece } = move
    if (type === 'castle') {
      board = makeCastlingMove(board, from, to)
    } else if (type === 'en-passant') {
      board = makeEnPassantMove(board, from, to)
    } else if (type === 'promotion') {
      board = makePromotionMove(board, from, to, promotionPiece || 'q')
    } else {
      board = makeMove(board, from, to)
    }

    castlingRights = updateCastlingRights(castlingRights, move)
    enPassantTarget = getEnPassantTarget(board, from, to)
    turn = turn === 'white' ? 'black' : 'white'
    lastMove = { from, to }
  }

  return { board, turn, castlingRights, enPassantTarget, lastMove }
}

export type GameMode = 'local' | 'bot' | 'friends'

export interface GameResult {
  winner: Color | 'draw' | null
  reason: 'checkmate' | 'stalemate' | 'resignation' | 'timeout'
}

interface ChessStore {
  board: Board
  turn: Color
  status: GameStatus
  moveHistory: Move[]
  selectedSquare: SquareCoordinate | null
  lastMove: { from: SquareCoordinate; to: SquareCoordinate } | null
  castlingRights: CastlingRights
  pendingPromotion: {
    from: SquareCoordinate
    to: SquareCoordinate
  } | null
  enPassantTarget: SquareCoordinate | null

  // Time & Clock state
  timeControl: TimeControl | null
  whiteTimeMs: number
  blackTimeMs: number
  isClockActive: boolean

  // Bot & multiplayer game settings
  gameMode: GameMode
  playerColor: Color
  difficulty: EngineDifficulty
  isFlipped: boolean
  isBotThinking: boolean
  isMatchStarted: boolean
  lastBotEvaluation: number | null
  gameResult: GameResult | null

  // Multiplayer Peer state
  activeRoomId: string | null
  playerName: string
  opponentName: string
  peerRole: PeerRole | null
  peerConnectionState: PeerConnectionState
  isDrawOfferedByOpponent: boolean
  isRematchRequested: boolean

  // Actions
  setSelectedSquare: (square: SquareCoordinate | null) => void
  handleSquareClick: (row: number, col: number) => void
  completePromotion: (promotionPiece: PieceType) => void
  cancelPromotion: () => void
  resetGame: () => void
  resignGame: () => void
  exitToSetup: () => void
  dismissGameResult: () => void
  setGameMode: (mode: GameMode) => void
  setPlayerColor: (color: Color) => void
  setDifficulty: (difficulty: EngineDifficulty) => void
  setTimeControl: (timeControl: TimeControl | null) => void
  tickClock: (deltaMs: number) => void
  setIsFlipped: (flipped: boolean) => void
  toggleFlip: () => void
  startBotGame: (
    colorChoice: Color | 'random',
    difficulty: EngineDifficulty,
    timeControl?: TimeControl | null,
  ) => void
  triggerBotMove: () => Promise<void>

  // Multiplayer Actions
  setActiveRoomId: (roomId: string | null) => void
  setPlayerName: (name: string) => void
  setPeerConnectionState: (state: PeerConnectionState) => void
  initMultiplayerSession: (
    role: PeerRole,
    myColor: Color,
    opponentName: string,
    timeControl?: TimeControl | null,
    roomId?: string,
  ) => void
  restoreMultiplayerSession: (session: StoredGameSession) => void
  syncRemoteState: (
    remoteMoveHistory: Move[],
    remoteWhiteMs: number,
    remoteBlackMs: number,
  ) => void
  receiveRemoteMove: (move: Move) => void
  offerDraw: () => void
  acceptDraw: () => void
  declineDraw: () => void
  requestRematch: () => void
  acceptRematch: () => void
}

function saveFriendsSession(state: ChessStore) {
  if (state.gameMode !== 'friends' || !state.activeRoomId || !state.peerRole) {
    return
  }
  sessionMemory.saveSession({
    roomId: state.activeRoomId,
    peerRole: state.peerRole,
    playerColor: state.playerColor,
    playerName: state.playerName,
    opponentName: state.opponentName,
    moveHistory: state.moveHistory,
    timeControl: state.timeControl,
    whiteTimeMs: state.whiteTimeMs,
    blackTimeMs: state.blackTimeMs,
    turn: state.turn,
    status: state.status,
    lastMove: state.lastMove,
    castlingRights: state.castlingRights,
    enPassantTarget: state.enPassantTarget,
    gameResult: state.gameResult,
  })
}

export const useChessStore = create<ChessStore>((set, get) => ({
  board: createInitialBoard(),
  turn: 'white',
  status: 'playing',
  moveHistory: [],
  selectedSquare: null,
  lastMove: null,
  castlingRights: {
    whiteKingSide: true,
    whiteQueenSide: true,
    blackKingSide: true,
    blackQueenSide: true,
  },
  pendingPromotion: null,
  enPassantTarget: null,

  // Time & Clock state
  timeControl: null,
  whiteTimeMs: 0,
  blackTimeMs: 0,
  isClockActive: false,

  gameMode: 'local',
  playerColor: 'white',
  difficulty: 'medium',
  isFlipped: false,
  isBotThinking: false,
  isMatchStarted: false,
  lastBotEvaluation: null,
  gameResult: null,

  activeRoomId: null,
  playerName: getStoredPlayerName(),
  opponentName: 'Opponent',
  peerRole: null,
  peerConnectionState: 'idle',
  isDrawOfferedByOpponent: false,
  isRematchRequested: false,

  setSelectedSquare: (square) => set({ selectedSquare: square }),

  cancelPromotion: () => set({ pendingPromotion: null }),

  dismissGameResult: () => set({ gameResult: null }),

  setGameMode: (mode) => set({ gameMode: mode }),
  setPlayerColor: (color) =>
    set({ playerColor: color, isFlipped: color === 'black' }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setIsFlipped: (flipped) => set({ isFlipped: flipped }),
  toggleFlip: () => set((state) => ({ isFlipped: !state.isFlipped })),

  setTimeControl: (tc) => {
    const initialMs = tc ? tc.initialSeconds * 1000 : 0
    set({
      timeControl: tc,
      whiteTimeMs: initialMs,
      blackTimeMs: initialMs,
      isClockActive: false,
    })
  },

  tickClock: (deltaMs) => {
    const {
      isClockActive,
      status,
      turn,
      whiteTimeMs,
      blackTimeMs,
      timeControl,
    } = get()
    if (
      !isClockActive ||
      (status !== 'playing' && status !== 'check') ||
      !timeControl ||
      timeControl.initialSeconds <= 0
    ) {
      return
    }

    if (turn === 'white') {
      const nextTime = Math.max(0, whiteTimeMs - deltaMs)
      if (nextTime <= 0) {
        playSound('game-end')
        set({
          whiteTimeMs: 0,
          isClockActive: false,
          status: 'checkmate',
          gameResult: { winner: 'black', reason: 'timeout' },
        })
        return
      }
      set({ whiteTimeMs: nextTime })
    } else {
      const nextTime = Math.max(0, blackTimeMs - deltaMs)
      if (nextTime <= 0) {
        playSound('game-end')
        set({
          blackTimeMs: 0,
          isClockActive: false,
          status: 'checkmate',
          gameResult: { winner: 'white', reason: 'timeout' },
        })
        return
      }
      set({ blackTimeMs: nextTime })
    }
  },

  setActiveRoomId: (roomId) => set({ activeRoomId: roomId }),

  setPlayerName: (name) => {
    savePlayerName(name)
    set({ playerName: name })
  },

  setPeerConnectionState: (state) => set({ peerConnectionState: state }),

  exitToSetup: () => {
    sessionMemory.clearSession()
    webrtcManager.close()
    set({
      activeRoomId: null,
      board: createInitialBoard(),
      turn: 'white',
      status: 'playing',
      selectedSquare: null,
      lastMove: null,
      pendingPromotion: null,
      moveHistory: [],
      castlingRights: {
        whiteKingSide: true,
        whiteQueenSide: true,
        blackKingSide: true,
        blackQueenSide: true,
      },
      enPassantTarget: null,
      isBotThinking: false,
      lastBotEvaluation: null,
      isMatchStarted: false,
      gameResult: null,
      isFlipped: false,
      peerConnectionState: 'idle',
      isDrawOfferedByOpponent: false,
      isRematchRequested: false,
      isClockActive: false,
    })
  },

  resetGame: () => {
    const { playerColor, gameMode, timeControl } = get()
    playSound('game-start')
    const initialMs = timeControl ? timeControl.initialSeconds * 1000 : 0
    const hasActiveClock = Boolean(
      timeControl && timeControl.initialSeconds > 0,
    )
    set({
      board: createInitialBoard(),
      turn: 'white',
      status: 'playing',
      selectedSquare: null,
      lastMove: null,
      pendingPromotion: null,
      moveHistory: [],
      castlingRights: {
        whiteKingSide: true,
        whiteQueenSide: true,
        blackKingSide: true,
        blackQueenSide: true,
      },
      enPassantTarget: null,
      isBotThinking: false,
      lastBotEvaluation: null,
      isMatchStarted: gameMode === 'bot' || gameMode === 'friends',
      gameResult: null,
      isFlipped: gameMode === 'bot' ? playerColor === 'black' : false,
      isDrawOfferedByOpponent: false,
      isRematchRequested: false,
      whiteTimeMs: initialMs,
      blackTimeMs: initialMs,
      isClockActive: hasActiveClock,
    })

    // If bot plays White, trigger opening move
    if (gameMode === 'bot' && playerColor === 'black') {
      setTimeout(() => {
        get().triggerBotMove()
      }, 300)
    }
  },

  resignGame: () => {
    const { playerColor, gameMode, turn } = get()
    const winner: Color =
      gameMode === 'bot' || gameMode === 'friends'
        ? playerColor === 'white'
          ? 'black'
          : 'white'
        : turn === 'white'
          ? 'black'
          : 'white'

    playSound('game-end')

    if (gameMode === 'friends') {
      webrtcManager.sendMessage({ type: 'RESIGN' })
    }

    set({
      status: 'checkmate',
      isClockActive: false,
      gameResult: { winner, reason: 'resignation' },
    })
    saveFriendsSession(get())
  },

  startBotGame: (colorChoice, difficulty, tc = null) => {
    let assignedColor: Color
    if (colorChoice === 'random') {
      assignedColor = Math.random() < 0.5 ? 'white' : 'black'
    } else {
      assignedColor = colorChoice
    }

    const activeTC = tc !== undefined ? tc : get().timeControl
    const initialMs = activeTC ? activeTC.initialSeconds * 1000 : 0
    const hasActiveClock = Boolean(activeTC && activeTC.initialSeconds > 0)

    playSound('game-start')
    set({
      gameMode: 'bot',
      playerColor: assignedColor,
      difficulty,
      timeControl: activeTC,
      whiteTimeMs: initialMs,
      blackTimeMs: initialMs,
      isClockActive: hasActiveClock,
      isFlipped: assignedColor === 'black',
      board: createInitialBoard(),
      turn: 'white',
      status: 'playing',
      selectedSquare: null,
      lastMove: null,
      pendingPromotion: null,
      moveHistory: [],
      castlingRights: {
        whiteKingSide: true,
        whiteQueenSide: true,
        blackKingSide: true,
        blackQueenSide: true,
      },
      enPassantTarget: null,
      isBotThinking: false,
      isMatchStarted: true,
      lastBotEvaluation: null,
      gameResult: null,
    })

    if (assignedColor === 'black') {
      setTimeout(() => {
        get().triggerBotMove()
      }, 400)
    }
  },

  initMultiplayerSession: (role, myColor, opponentName, tc = null, roomId) => {
    playSound('game-start')
    const activeTC = tc !== undefined ? tc : get().timeControl
    const initialMs = activeTC ? activeTC.initialSeconds * 1000 : 0
    const hasActiveClock = Boolean(activeTC && activeTC.initialSeconds > 0)
    const activeRoom = roomId || get().activeRoomId

    set({
      gameMode: 'friends',
      activeRoomId: activeRoom,
      peerRole: role,
      playerColor: myColor,
      opponentName: opponentName || 'Friend',
      timeControl: activeTC,
      whiteTimeMs: initialMs,
      blackTimeMs: initialMs,
      isClockActive: hasActiveClock,
      isFlipped: myColor === 'black',
      board: createInitialBoard(),
      turn: 'white',
      status: 'playing',
      selectedSquare: null,
      lastMove: null,
      pendingPromotion: null,
      moveHistory: [],
      castlingRights: {
        whiteKingSide: true,
        whiteQueenSide: true,
        blackKingSide: true,
        blackQueenSide: true,
      },
      enPassantTarget: null,
      isMatchStarted: true,
      isBotThinking: false,
      gameResult: null,
      isDrawOfferedByOpponent: false,
      isRematchRequested: false,
    })

    saveFriendsSession(get())
  },

  restoreMultiplayerSession: (session: StoredGameSession) => {
    const { board, turn, castlingRights, enPassantTarget, lastMove } =
      reconstructBoardFromHistory(session.moveHistory)

    const status = getGameStatus(board, turn, castlingRights, enPassantTarget)

    const hasClock = Boolean(
      session.timeControl &&
      session.timeControl.initialSeconds > 0 &&
      status !== 'checkmate' &&
      status !== 'stalemate',
    )

    set({
      gameMode: 'friends',
      activeRoomId: session.roomId,
      peerRole: session.peerRole,
      playerColor: session.playerColor,
      playerName: session.playerName,
      opponentName: session.opponentName,
      timeControl: session.timeControl,
      whiteTimeMs: session.whiteTimeMs,
      blackTimeMs: session.blackTimeMs,
      isClockActive: hasClock,
      isFlipped: session.playerColor === 'black',
      board,
      turn,
      status,
      lastMove,
      castlingRights,
      enPassantTarget,
      moveHistory: session.moveHistory,
      pendingPromotion: null,
      isMatchStarted: true,
      gameResult: session.gameResult,
      isDrawOfferedByOpponent: false,
      isRematchRequested: false,
    })
  },

  syncRemoteState: (
    remoteMoveHistory: Move[],
    remoteWhiteMs: number,
    remoteBlackMs: number,
  ) => {
    const current = get()
    if (remoteMoveHistory.length > current.moveHistory.length) {
      const { board, turn, castlingRights, enPassantTarget, lastMove } =
        reconstructBoardFromHistory(remoteMoveHistory)

      const status = getGameStatus(board, turn, castlingRights, enPassantTarget)

      let resultState: GameResult | null = null
      if (status === 'checkmate') {
        resultState = {
          winner: turn === 'white' ? 'black' : 'white',
          reason: 'checkmate',
        }
      } else if (status === 'stalemate') {
        resultState = { winner: 'draw', reason: 'stalemate' }
      }

      const isClockActive =
        Boolean(
          current.timeControl && current.timeControl.initialSeconds > 0,
        ) &&
        status !== 'checkmate' &&
        status !== 'stalemate'

      set({
        board,
        turn,
        status,
        moveHistory: remoteMoveHistory,
        lastMove,
        castlingRights,
        enPassantTarget,
        selectedSquare: null,
        pendingPromotion: null,
        whiteTimeMs: remoteWhiteMs,
        blackTimeMs: remoteBlackMs,
        isClockActive,
        gameResult: resultState || current.gameResult,
      })

      saveFriendsSession(get())
    }
  },

  receiveRemoteMove: (move) => {
    const {
      board,
      turn,
      castlingRights,
      enPassantTarget,
      moveHistory,
      timeControl,
      whiteTimeMs,
      blackTimeMs,
    } = get()

    const { from, to, type, promotionPiece, piece } = move

    // Validate that the move is physically legal from the current board position
    const legalMoves = getLegalMoves(
      board,
      from,
      castlingRights,
      enPassantTarget,
    )
    const isLegal = legalMoves.some((m) => m.row === to.row && m.col === to.col)

    if (!isLegal) {
      console.warn('Received illegal remote move from peer:', move)
      return
    }

    let nextBoard: Board
    if (type === 'castle') {
      nextBoard = makeCastlingMove(board, from, to)
    } else if (type === 'en-passant') {
      nextBoard = makeEnPassantMove(board, from, to)
    } else if (type === 'promotion') {
      nextBoard = makePromotionMove(board, from, to, promotionPiece || 'q')
    } else {
      nextBoard = makeMove(board, from, to)
    }

    const executedMove: Move = {
      from,
      to,
      piece,
      capturedPiece: move.capturedPiece,
      type,
      promotionPiece,
    }

    const nextCastlingRights = updateCastlingRights(
      castlingRights,
      executedMove,
    )
    const nextTurn: Color = turn === 'white' ? 'black' : 'white'
    const nextStatus = getGameStatus(
      nextBoard,
      nextTurn,
      nextCastlingRights,
      enPassantTarget,
    )

    let resultState: GameResult | null = null
    if (nextStatus === 'checkmate') {
      resultState = { winner: turn, reason: 'checkmate' }
    } else if (nextStatus === 'stalemate') {
      resultState = { winner: 'draw', reason: 'stalemate' }
    }

    const nextEnPassantTarget = getEnPassantTarget(board, from, to)

    playMoveSound({
      isCapture: Boolean(move.capturedPiece),
      isCheck: nextStatus === 'check',
      isCastle: type === 'castle',
      isPromotion: type === 'promotion',
      isGameEnd: nextStatus === 'checkmate' || nextStatus === 'stalemate',
      isSelf: false,
    })

    let nextWhiteMs = whiteTimeMs
    let nextBlackMs = blackTimeMs
    const isClockActive =
      Boolean(timeControl && timeControl.initialSeconds > 0) &&
      nextStatus !== 'checkmate' &&
      nextStatus !== 'stalemate'

    if (timeControl && timeControl.incrementSeconds > 0) {
      if (turn === 'white') {
        nextWhiteMs += timeControl.incrementSeconds * 1000
      } else {
        nextBlackMs += timeControl.incrementSeconds * 1000
      }
    }

    set({
      board: nextBoard,
      turn: nextTurn,
      status: nextStatus,
      moveHistory: [...moveHistory, executedMove],
      lastMove: { from, to },
      castlingRights: nextCastlingRights,
      selectedSquare: null,
      enPassantTarget: nextEnPassantTarget,
      gameResult: resultState,
      whiteTimeMs: nextWhiteMs,
      blackTimeMs: nextBlackMs,
      isClockActive,
    })
    saveFriendsSession(get())
  },

  offerDraw: () => {
    webrtcManager.sendMessage({ type: 'DRAW_OFFER' })
    gooeyToast.info('Draw Offered', {
      description: 'Waiting for your opponent to respond.',
    })
  },

  acceptDraw: () => {
    webrtcManager.sendMessage({ type: 'DRAW_ACCEPT' })
    playSound('game-end')
    set({
      status: 'stalemate',
      gameResult: { winner: 'draw', reason: 'stalemate' },
      isDrawOfferedByOpponent: false,
    })
    saveFriendsSession(get())
  },

  declineDraw: () => {
    webrtcManager.sendMessage({ type: 'DRAW_DECLINE' })
    set({ isDrawOfferedByOpponent: false })
  },

  requestRematch: () => {
    webrtcManager.sendMessage({ type: 'REMATCH_REQUEST' })
    gooeyToast.info('Rematch Requested', {
      description: 'Waiting for opponent to accept rematch.',
    })
  },

  acceptRematch: () => {
    const { playerColor, opponentName, peerRole, timeControl } = get()
    webrtcManager.sendMessage({ type: 'REMATCH_ACCEPT' })
    // Swap colors on rematch
    const nextColor: Color = playerColor === 'white' ? 'black' : 'white'
    get().initMultiplayerSession(
      peerRole || 'host',
      nextColor,
      opponentName,
      timeControl,
    )
  },

  triggerBotMove: async () => {
    const {
      board,
      turn,
      status,
      castlingRights,
      enPassantTarget,
      difficulty,
      moveHistory,
      gameMode,
    } = get()

    if (
      status === 'checkmate' ||
      status === 'stalemate' ||
      gameMode !== 'bot'
    ) {
      return
    }

    set({ isBotThinking: true })

    try {
      const result = await requestBestMove({
        board,
        turn,
        castlingRights,
        enPassantTarget,
        difficulty,
      })

      const bestMove = result.move
      if (!bestMove) {
        set({ isBotThinking: false })
        return
      }

      const { from, to, type, promotionPiece, piece } = bestMove
      const isPromo = type === 'promotion'
      const isCastle = type === 'castle'
      const isEP = type === 'en-passant'

      let nextBoard: Board
      if (isCastle) {
        nextBoard = makeCastlingMove(board, from, to)
      } else if (isEP) {
        nextBoard = makeEnPassantMove(board, from, to)
      } else if (isPromo) {
        nextBoard = makePromotionMove(board, from, to, promotionPiece || 'q')
      } else {
        nextBoard = makeMove(board, from, to)
      }

      const executedMove: Move = {
        from,
        to,
        piece,
        capturedPiece: bestMove.capturedPiece,
        type,
        promotionPiece,
      }

      const nextCastlingRights = updateCastlingRights(
        castlingRights,
        executedMove,
      )
      const nextTurn: Color = turn === 'white' ? 'black' : 'white'
      const nextStatus = getGameStatus(
        nextBoard,
        nextTurn,
        nextCastlingRights,
        enPassantTarget,
      )

      let resultState: GameResult | null = null
      if (nextStatus === 'checkmate') {
        resultState = { winner: turn, reason: 'checkmate' }
      } else if (nextStatus === 'stalemate') {
        resultState = { winner: 'draw', reason: 'stalemate' }
      }

      const nextEnPassantTarget = getEnPassantTarget(board, from, to)

      playMoveSound({
        isCapture: Boolean(bestMove.capturedPiece),
        isCheck: nextStatus === 'check',
        isCastle,
        isPromotion: isPromo,
        isGameEnd: nextStatus === 'checkmate' || nextStatus === 'stalemate',
        isSelf: false,
      })

      set({
        board: nextBoard,
        turn: nextTurn,
        status: nextStatus,
        moveHistory: [...moveHistory, executedMove],
        lastMove: { from, to },
        castlingRights: nextCastlingRights,
        selectedSquare: null,
        enPassantTarget: nextEnPassantTarget,
        isBotThinking: false,
        lastBotEvaluation: result.evaluation,
        gameResult: resultState,
      })
    } catch (err) {
      console.error('Engine move error:', err)
      set({ isBotThinking: false })
    }
  },

  handleSquareClick: (row, col) => {
    const {
      board,
      turn,
      status,
      selectedSquare,
      moveHistory,
      castlingRights,
      enPassantTarget,
      gameMode,
      playerColor,
      isBotThinking,
      triggerBotMove,
    } = get()

    if (status === 'checkmate' || status === 'stalemate') {
      return
    }

    // In bot or multiplayer mode, prevent human from moving during opponent's turn or while thinking
    if (
      (gameMode === 'bot' || gameMode === 'friends') &&
      (isBotThinking || turn !== playerColor)
    ) {
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

    let resultState: GameResult | null = null
    if (nextStatus === 'checkmate') {
      resultState = { winner: turn, reason: 'checkmate' }
    } else if (nextStatus === 'stalemate') {
      resultState = { winner: 'draw', reason: 'stalemate' }
    }

    const nextEnPassantTarget = getEnPassantTarget(board, selectedSquare, {
      row,
      col,
    })

    playMoveSound({
      isCapture: Boolean(capturedPiece),
      isCheck: nextStatus === 'check',
      isCastle: isCastlingMove,
      isPromotion: false,
      isGameEnd: nextStatus === 'checkmate' || nextStatus === 'stalemate',
      isSelf: true,
    })

    // If multiplayer mode, send move to remote peer
    if (gameMode === 'friends') {
      webrtcManager.sendMessage({
        type: 'MOVE',
        payload: { move },
      })
    }

    set({
      board: nextBoard,
      turn: nextTurn,
      status: nextStatus,
      moveHistory: [...moveHistory, move],
      lastMove: { from: selectedSquare, to: { row, col } },
      castlingRights: nextCastlingRights,
      selectedSquare: null,
      isMatchStarted: true,
      enPassantTarget: nextEnPassantTarget,
      gameResult: resultState,
    })
    saveFriendsSession(get())

    // If game continues in bot mode, trigger bot turn
    if (
      gameMode === 'bot' &&
      (nextStatus === 'playing' || nextStatus === 'check') &&
      nextTurn !== playerColor
    ) {
      setTimeout(() => {
        triggerBotMove()
      }, 250)
    }
  },

  completePromotion: (promotionPiece: PieceType) => {
    const {
      board,
      turn,
      pendingPromotion,
      moveHistory,
      castlingRights,
      enPassantTarget,
      gameMode,
      playerColor,
      triggerBotMove,
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

    let resultState: GameResult | null = null
    if (nextStatus === 'checkmate') {
      resultState = { winner: turn, reason: 'checkmate' }
    } else if (nextStatus === 'stalemate') {
      resultState = { winner: 'draw', reason: 'stalemate' }
    }

    playMoveSound({
      isCapture: Boolean(capturedPiece),
      isCheck: nextStatus === 'check',
      isCastle: false,
      isPromotion: true,
      isGameEnd: nextStatus === 'checkmate' || nextStatus === 'stalemate',
      isSelf: true,
    })

    // If multiplayer mode, send promotion move to remote peer
    if (gameMode === 'friends') {
      webrtcManager.sendMessage({
        type: 'MOVE',
        payload: { move },
      })
    }

    set({
      board: nextBoard,
      turn: nextTurn,
      status: nextStatus,
      moveHistory: [...moveHistory, move],
      lastMove: { from, to },
      castlingRights: nextCastlingRights,
      selectedSquare: null,
      pendingPromotion: null,
      isMatchStarted: true,
      enPassantTarget: null,
      gameResult: resultState,
    })
    saveFriendsSession(get())

    if (
      gameMode === 'bot' &&
      (nextStatus === 'playing' || nextStatus === 'check') &&
      nextTurn !== playerColor
    ) {
      setTimeout(() => {
        triggerBotMove()
      }, 250)
    }
  },
}))
