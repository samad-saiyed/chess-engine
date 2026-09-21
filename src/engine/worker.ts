import { findBestMove } from './search'
import type { WorkerInboundMessage, WorkerOutboundMessage } from './types'

// Web Worker context
self.onmessage = (event: MessageEvent<WorkerInboundMessage>) => {
  const message = event.data

  if (message.type === 'CANCEL_SEARCH') {
    const response: WorkerOutboundMessage = { type: 'SEARCH_CANCELLED' }
    self.postMessage(response)
    return
  }

  if (message.type === 'SEARCH_BEST_MOVE') {
    try {
      const { board, turn, castlingRights, enPassantTarget, difficulty } =
        message.payload

      const result = findBestMove(
        board,
        turn,
        castlingRights,
        enPassantTarget,
        difficulty,
      )

      const response: WorkerOutboundMessage = {
        type: 'BEST_MOVE_FOUND',
        payload: result,
      }
      self.postMessage(response)
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown engine search error'
      const response: WorkerOutboundMessage = {
        type: 'ERROR',
        error: errorMessage,
      }
      self.postMessage(response)
    }
  }
}
