import {
  getEnPassantTarget,
  getLegalMoves,
  isCheckmate,
  isKingInCheck,
  isPromotionMove,
  isStalemate,
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
  Move,
  PieceType,
  SquareCoordinate,
} from '@/chess/types'
import { evaluateBoard, PIECE_VALUES } from './evaluation'
import type { EngineDifficulty, EngineMoveResult } from './types'

const CHECKMATE_SCORE = 100000

export interface MoveExecutionResult {
  nextBoard: Board
  nextCastlingRights: CastlingRights
  nextEnPassantTarget: SquareCoordinate | null
  move: Move
}

/**
 * Generates all legal moves with complete Move metadata for the specified color.
 */
export function getAllLegalMoves(
  board: Board,
  color: Color,
  castlingRights: CastlingRights,
  enPassantTarget: SquareCoordinate | null,
): Move[] {
  const allMoves: Move[] = []

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (!piece || piece.color !== color) continue

      const from: SquareCoordinate = { row, col }
      const destinations = getLegalMoves(
        board,
        from,
        castlingRights,
        enPassantTarget,
      )

      const castlingMoves =
        piece.type === 'k' ? getCastlingMoves(board, from, castlingRights) : []

      const enPassantMoves =
        piece.type === 'p'
          ? getEnPassantMoves(board, from, enPassantTarget)
          : []

      for (const to of destinations) {
        const isCastle = castlingMoves.some(
          (m) => m.row === to.row && m.col === to.col,
        )
        const isEP = enPassantMoves.some(
          (m) => m.row === to.row && m.col === to.col,
        )
        const isPromo = isPromotionMove(board, from, to)

        if (isPromo) {
          // Add standard queen promotion (and optionally knight for tactics)
          const promotionPieces: PieceType[] = ['q', 'n']
          for (const promo of promotionPieces) {
            allMoves.push({
              from,
              to,
              piece,
              capturedPiece: board[to.row][to.col],
              type: 'promotion',
              promotionPiece: promo,
            })
          }
        } else if (isCastle) {
          allMoves.push({
            from,
            to,
            piece,
            capturedPiece: null,
            type: 'castle',
          })
        } else if (isEP) {
          allMoves.push({
            from,
            to,
            piece,
            capturedPiece: board[from.row][to.col],
            type: 'en-passant',
          })
        } else {
          allMoves.push({
            from,
            to,
            piece,
            capturedPiece: board[to.row][to.col],
            type: 'normal',
          })
        }
      }
    }
  }

  return allMoves
}

/**
 * Applies a move and returns the next board, castling rights, and en passant target.
 */
export function executeMoveOnBoard(
  board: Board,
  move: Move,
  castlingRights: CastlingRights,
): MoveExecutionResult {
  let nextBoard: Board

  if (move.type === 'castle') {
    nextBoard = makeCastlingMove(board, move.from, move.to)
  } else if (move.type === 'en-passant') {
    nextBoard = makeEnPassantMove(board, move.from, move.to)
  } else if (move.type === 'promotion') {
    nextBoard = makePromotionMove(
      board,
      move.from,
      move.to,
      move.promotionPiece || 'q',
    )
  } else {
    nextBoard = makeMove(board, move.from, move.to)
  }

  const nextCastlingRights = updateCastlingRights(castlingRights, move)
  const nextEnPassantTarget = getEnPassantTarget(board, move.from, move.to)

  return {
    nextBoard,
    nextCastlingRights,
    nextEnPassantTarget,
    move,
  }
}

/**
 * Orders moves by tactical priority: MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
 * and promotions first to maximize alpha-beta branch cutoffs.
 */
function scoreMoveForOrdering(move: Move): number {
  let score = 0
  if (move.capturedPiece) {
    const victimVal = PIECE_VALUES[move.capturedPiece.type]
    const attackerVal = PIECE_VALUES[move.piece.type]
    score += victimVal * 10 - attackerVal
  }
  if (move.type === 'promotion') {
    score += 800
  }
  if (move.type === 'castle') {
    score += 50
  }
  return score
}

function orderMoves(moves: Move[]): Move[] {
  return [...moves].sort(
    (a, b) => scoreMoveForOrdering(b) - scoreMoveForOrdering(a),
  )
}

/**
 * Quiescence search on captures to prevent horizon effect blunders.
 */
function quiescence(
  board: Board,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  castlingRights: CastlingRights,
  enPassantTarget: SquareCoordinate | null,
  qDepth: number = 0,
): number {
  const standPat = evaluateBoard(board)

  if (qDepth >= 4) {
    return standPat
  }

  if (isMaximizing) {
    if (standPat >= beta) return beta
    if (standPat > alpha) alpha = standPat

    const moves = getAllLegalMoves(
      board,
      'white',
      castlingRights,
      enPassantTarget,
    ).filter((m) => m.capturedPiece !== null)

    const ordered = orderMoves(moves)
    for (const move of ordered) {
      const { nextBoard, nextCastlingRights, nextEnPassantTarget } =
        executeMoveOnBoard(board, move, castlingRights)
      const score = quiescence(
        nextBoard,
        alpha,
        beta,
        false,
        nextCastlingRights,
        nextEnPassantTarget,
        qDepth + 1,
      )
      if (score >= beta) return beta
      if (score > alpha) alpha = score
    }
    return alpha
  } else {
    if (standPat <= alpha) return alpha
    if (standPat < beta) beta = standPat

    const moves = getAllLegalMoves(
      board,
      'black',
      castlingRights,
      enPassantTarget,
    ).filter((m) => m.capturedPiece !== null)

    const ordered = orderMoves(moves)
    for (const move of ordered) {
      const { nextBoard, nextCastlingRights, nextEnPassantTarget } =
        executeMoveOnBoard(board, move, castlingRights)
      const score = quiescence(
        nextBoard,
        alpha,
        beta,
        true,
        nextCastlingRights,
        nextEnPassantTarget,
        qDepth + 1,
      )
      if (score <= alpha) return alpha
      if (score < beta) beta = score
    }
    return beta
  }
}

/**
 * Minimax search with Alpha-Beta pruning.
 */
function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  castlingRights: CastlingRights,
  enPassantTarget: SquareCoordinate | null,
  nodeCounter: { count: number },
  useQuiescence: boolean,
): number {
  nodeCounter.count++

  const currentColor: Color = isMaximizing ? 'white' : 'black'

  if (isCheckmate(board, currentColor, castlingRights, enPassantTarget)) {
    return isMaximizing ? -CHECKMATE_SCORE - depth : CHECKMATE_SCORE + depth
  }

  if (isStalemate(board, currentColor, castlingRights, enPassantTarget)) {
    return 0
  }

  if (depth <= 0) {
    if (useQuiescence) {
      return quiescence(
        board,
        alpha,
        beta,
        isMaximizing,
        castlingRights,
        enPassantTarget,
      )
    }
    return evaluateBoard(board)
  }

  const legalMoves = getAllLegalMoves(
    board,
    currentColor,
    castlingRights,
    enPassantTarget,
  )

  if (legalMoves.length === 0) {
    return isKingInCheck(board, currentColor)
      ? isMaximizing
        ? -CHECKMATE_SCORE
        : CHECKMATE_SCORE
      : 0
  }

  const orderedMoves = orderMoves(legalMoves)

  if (isMaximizing) {
    let maxEval = -Infinity
    for (const move of orderedMoves) {
      const { nextBoard, nextCastlingRights, nextEnPassantTarget } =
        executeMoveOnBoard(board, move, castlingRights)
      const evaluation = minimax(
        nextBoard,
        depth - 1,
        alpha,
        beta,
        false,
        nextCastlingRights,
        nextEnPassantTarget,
        nodeCounter,
        useQuiescence,
      )
      maxEval = Math.max(maxEval, evaluation)
      alpha = Math.max(alpha, evaluation)
      if (beta <= alpha) {
        break // Beta cutoff
      }
    }
    return maxEval
  } else {
    let minEval = Infinity
    for (const move of orderedMoves) {
      const { nextBoard, nextCastlingRights, nextEnPassantTarget } =
        executeMoveOnBoard(board, move, castlingRights)
      const evaluation = minimax(
        nextBoard,
        depth - 1,
        alpha,
        beta,
        true,
        nextCastlingRights,
        nextEnPassantTarget,
        nodeCounter,
        useQuiescence,
      )
      minEval = Math.min(minEval, evaluation)
      beta = Math.min(beta, evaluation)
      if (beta <= alpha) {
        break // Alpha cutoff
      }
    }
    return minEval
  }
}

/**
 * Searches for the best move given the current board state and difficulty.
 */
export function findBestMove(
  board: Board,
  turn: Color,
  castlingRights: CastlingRights,
  enPassantTarget: SquareCoordinate | null,
  difficulty: EngineDifficulty = 'medium',
): EngineMoveResult {
  const nodeCounter = { count: 0 }
  const isMaximizing = turn === 'white'

  // Difficulty configurations
  let depth = 3
  let useQuiescence = true
  let randomnessProbability = 0

  if (difficulty === 'easy') {
    depth = 1
    useQuiescence = false
    randomnessProbability = 0.35
  } else if (difficulty === 'medium') {
    depth = 3
    useQuiescence = false
    randomnessProbability = 0.05
  } else if (difficulty === 'hard') {
    depth = 4
    useQuiescence = true
    randomnessProbability = 0
  }

  const legalMoves = getAllLegalMoves(
    board,
    turn,
    castlingRights,
    enPassantTarget,
  )

  if (legalMoves.length === 0) {
    return {
      move: null,
      evaluation: evaluateBoard(board),
      depth,
      nodes: 0,
    }
  }

  const scoredMoves: { move: Move; score: number }[] = []
  let bestScore = isMaximizing ? -Infinity : Infinity
  let alpha = -Infinity
  let beta = Infinity

  const orderedMoves = orderMoves(legalMoves)

  for (const move of orderedMoves) {
    const { nextBoard, nextCastlingRights, nextEnPassantTarget } =
      executeMoveOnBoard(board, move, castlingRights)

    const score = minimax(
      nextBoard,
      depth - 1,
      alpha,
      beta,
      !isMaximizing,
      nextCastlingRights,
      nextEnPassantTarget,
      nodeCounter,
      useQuiescence,
    )

    scoredMoves.push({ move, score })

    if (isMaximizing) {
      if (score > bestScore) {
        bestScore = score
      }
      alpha = Math.max(alpha, score)
    } else {
      if (score < bestScore) {
        bestScore = score
      }
      beta = Math.min(beta, score)
    }
  }

  // Sort candidate moves
  scoredMoves.sort((a, b) =>
    isMaximizing ? b.score - a.score : a.score - b.score,
  )

  // Apply difficulty variance if needed (e.g. casual play randomly picks top 2-3 moves)
  let chosenMove = scoredMoves[0].move

  if (
    randomnessProbability > 0 &&
    Math.random() < randomnessProbability &&
    scoredMoves.length > 1
  ) {
    const candidatePool = scoredMoves.slice(0, Math.min(3, scoredMoves.length))
    const randomIndex = Math.floor(Math.random() * candidatePool.length)
    chosenMove = candidatePool[randomIndex].move
  }

  return {
    move: chosenMove,
    evaluation: bestScore,
    depth,
    nodes: nodeCounter.count,
  }
}
