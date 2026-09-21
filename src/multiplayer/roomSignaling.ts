/**
 * Room signaling helper that uses both BroadcastChannel (for instant same-device tabs)
 * and the Next.js API /api/signaling (for across-device/mobile-to-desktop signaling).
 */

export interface RoomSignalMessage {
  type: 'OFFER' | 'ANSWER'
  room: string
  payload: string
  hostColor?: string
  timeControlId?: string
  hostName?: string
}

export class RoomSignaling {
  private broadcastChannel: BroadcastChannel | null = null
  private pollInterval: NodeJS.Timeout | number | null = null

  public initBroadcast(
    room: string,
    onMessage: (msg: RoomSignalMessage) => void,
  ) {
    this.close()
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel(`chess-room-${room}`)
        this.broadcastChannel.onmessage = (event) => {
          if (event.data) {
            onMessage(event.data as RoomSignalMessage)
          }
        }
      }
    } catch (err) {
      console.warn('BroadcastChannel not supported:', err)
    }
  }

  public async postOffer(
    room: string,
    offer: string,
    hostColor: string,
    timeControlId?: string,
    hostName?: string,
  ): Promise<void> {
    const msg: RoomSignalMessage = {
      type: 'OFFER',
      room,
      payload: offer,
      hostColor,
      timeControlId,
      hostName,
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(msg)
    }

    try {
      await fetch('/api/signaling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room,
          offer,
          hostColor,
          timeControlId,
          hostName,
        }),
      })
    } catch (err) {
      console.warn('Failed to post offer to /api/signaling:', err)
    }
  }

  public async postAnswer(room: string, answer: string): Promise<void> {
    const msg: RoomSignalMessage = {
      type: 'ANSWER',
      room,
      payload: answer,
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(msg)
    }

    try {
      await fetch('/api/signaling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room,
          answer,
        }),
      })
    } catch (err) {
      console.warn('Failed to post answer to /api/signaling:', err)
    }
  }

  public startPollingAnswer(room: string, onAnswer: (answer: string) => void) {
    if (this.pollInterval) clearInterval(this.pollInterval)

    this.pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/signaling?room=${room}`)
        if (res.ok) {
          const data = await res.json()
          if (data.answer) {
            onAnswer(data.answer)
            this.stopPolling()
          }
        }
      } catch (err) {
        console.log('🚀 --------------------------------------------------🚀')
        console.log('🚀 ~ RoomSignaling ~ startPollingAnswer ~ err:', err)
        console.log('🚀 --------------------------------------------------🚀')
      }
    }, 1000)
  }

  public async fetchRoomOffer(room: string): Promise<{
    offer: string
    hostColor?: string
    timeControlId?: string
    hostName?: string
  } | null> {
    try {
      const res = await fetch(`/api/signaling?room=${room}`)
      if (res.ok) {
        const data = await res.json()
        if (data.offer) {
          return data
        }
      }
    } catch (err) {
      console.warn('Failed to fetch offer from /api/signaling:', err)
    }
    return null
  }

  public stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
  }

  public close() {
    this.stopPolling()
    if (this.broadcastChannel) {
      this.broadcastChannel.close()
      this.broadcastChannel = null
    }
  }
}

export const roomSignaling = new RoomSignaling()
