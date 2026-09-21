import type {
  CastlingRights,
  Color,
  GameStatus,
  Move,
  SquareCoordinate,
} from '@/chess/types'
import type { TimeControl } from '@/chess/timer'
import type { PeerRole } from './types'

const SESSION_STORAGE_KEY = 'chess_active_multiplayer_session'

export interface StoredGameSession {
  roomId: string
  peerRole: PeerRole
  playerColor: Color
  playerName: string
  opponentName: string
  moveHistory: Move[]
  timeControl: TimeControl | null
  whiteTimeMs: number
  blackTimeMs: number
  turn: Color
  status: GameStatus
  lastMove: { from: SquareCoordinate; to: SquareCoordinate } | null
  castlingRights: CastlingRights
  enPassantTarget: SquareCoordinate | null
  gameResult: {
    winner: Color | 'draw' | null
    reason: 'checkmate' | 'stalemate' | 'resignation' | 'timeout'
  } | null
  updatedAt: number
}

// In-memory fast cache
let inMemorySession: StoredGameSession | null = null

export const sessionMemory = {
  saveSession(session: Omit<StoredGameSession, 'updatedAt'>) {
    const fullSession: StoredGameSession = {
      ...session,
      updatedAt: Date.now(),
    }
    inMemorySession = fullSession

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(fullSession))
      } catch (err) {
        console.warn('Failed to save game session to sessionStorage:', err)
      }
    }
  },

  getSession(): StoredGameSession | null {
    if (inMemorySession) {
      // Check if expired (> 2 hours old)
      if (Date.now() - inMemorySession.updatedAt < 2 * 60 * 60 * 1000) {
        return inMemorySession
      }
    }

    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem(SESSION_STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as StoredGameSession
          if (Date.now() - parsed.updatedAt < 2 * 60 * 60 * 1000) {
            inMemorySession = parsed
            return parsed
          }
        }
      } catch (err) {
        console.warn('Failed to read game session from sessionStorage:', err)
      }
    }

    return null
  },

  clearSession() {
    inMemorySession = null
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(SESSION_STORAGE_KEY)
      } catch (err) {
        console.warn('Failed to clear game session from sessionStorage:', err)
      }
    }
  },
}
