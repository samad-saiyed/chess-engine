import type {
  Board,
  CastlingRights,
  Color,
  Move,
  SquareCoordinate,
} from '@/chess/types'

export type EngineDifficulty = 'easy' | 'medium' | 'hard'

export interface EngineMoveResult {
  move: Move | null
  evaluation: number
  depth: number
  nodes: number
}

export interface EngineSearchRequest {
  board: Board
  turn: Color
  castlingRights: CastlingRights
  enPassantTarget: SquareCoordinate | null
  difficulty: EngineDifficulty
}

export type WorkerInboundMessage =
  | { type: 'SEARCH_BEST_MOVE'; payload: EngineSearchRequest }
  | { type: 'CANCEL_SEARCH' }

export type WorkerOutboundMessage =
  | { type: 'BEST_MOVE_FOUND'; payload: EngineMoveResult }
  | { type: 'SEARCH_CANCELLED' }
  | { type: 'ERROR'; error: string }
