import type { Color, Move } from '@/chess/types'

export type PeerConnectionState =
  | 'idle'
  | 'creating-offer'
  | 'waiting-for-answer'
  | 'creating-answer'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'failed'

export type PeerRole = 'host' | 'joiner'

export interface PlayerProfile {
  name: string
}

export type PeerMessage =
  | {
      type: 'HANDSHAKE'
      payload: {
        name: string
        hostColor: Color
        timeControlId?: string
      }
    }
  | {
      type: 'MOVE'
      payload: {
        move: Move
      }
    }
  | {
      type: 'DRAW_OFFER'
    }
  | {
      type: 'DRAW_ACCEPT'
    }
  | {
      type: 'DRAW_DECLINE'
    }
  | {
      type: 'RESIGN'
    }
  | {
      type: 'REMATCH_REQUEST'
    }
  | {
      type: 'REMATCH_ACCEPT'
    }
  | {
      type: 'PING'
    }
  | {
      type: 'PONG'
    }
