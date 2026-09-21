import { findBestMove } from './search'
import type {
  EngineMoveResult,
  EngineSearchRequest,
  WorkerInboundMessage,
  WorkerOutboundMessage,
} from './types'

let workerInstance: Worker | null = null
let currentRejectCallback: ((reason?: unknown) => void) | null = null

function getWorker(): Worker | null {
  if (typeof window === 'undefined') return null

  if (!workerInstance && typeof Worker !== 'undefined') {
    try {
      workerInstance = new Worker(new URL('./worker.ts', import.meta.url), {
        type: 'module',
      })
    } catch (e) {
      console.warn('Web Worker initialization failed, using fallback:', e)
      workerInstance = null
    }
  }

  return workerInstance
}

export function requestBestMove(
  request: EngineSearchRequest,
): Promise<EngineMoveResult> {
  return new Promise((resolve, reject) => {
    // Cancel previous pending search
    if (currentRejectCallback) {
      currentRejectCallback(new Error('Search superseded by new request'))
      currentRejectCallback = null
    }

    const worker = getWorker()

    // Fallback if Web Worker is not supported in the environment
    if (!worker) {
      try {
        const result = findBestMove(
          request.board,
          request.turn,
          request.castlingRights,
          request.enPassantTarget,
          request.difficulty,
        )
        resolve(result)
      } catch (err) {
        reject(err)
      }
      return
    }

    currentRejectCallback = reject

    const handleMessage = (event: MessageEvent<WorkerOutboundMessage>) => {
      const message = event.data

      if (message.type === 'BEST_MOVE_FOUND') {
        worker.removeEventListener('message', handleMessage)
        currentRejectCallback = null
        resolve(message.payload)
      } else if (message.type === 'ERROR') {
        worker.removeEventListener('message', handleMessage)
        currentRejectCallback = null
        reject(new Error(message.error))
      } else if (message.type === 'SEARCH_CANCELLED') {
        worker.removeEventListener('message', handleMessage)
        currentRejectCallback = null
        reject(new Error('Search cancelled'))
      }
    }

    worker.addEventListener('message', handleMessage)

    const inboundMessage: WorkerInboundMessage = {
      type: 'SEARCH_BEST_MOVE',
      payload: request,
    }

    worker.postMessage(inboundMessage)
  })
}

export function terminateEngineWorker(): void {
  if (workerInstance) {
    workerInstance.terminate()
    workerInstance = null
  }
  if (currentRejectCallback) {
    currentRejectCallback(new Error('Engine worker terminated'))
    currentRejectCallback = null
  }
}
