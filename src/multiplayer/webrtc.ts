import { decodeSessionDescription, encodeSessionDescription } from './signaling'
import type { PeerConnectionState, PeerMessage } from './types'

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
}

export class WebRTCManager {
  private peer: RTCPeerConnection | null = null
  private dataChannel: RTCDataChannel | null = null
  private messageHandlers: ((msg: PeerMessage) => void)[] = []
  private stateChangeHandlers: ((state: PeerConnectionState) => void)[] = []
  private connectionState: PeerConnectionState = 'idle'

  private setState(state: PeerConnectionState) {
    this.connectionState = state
    this.stateChangeHandlers.forEach((handler) => handler(state))
  }

  public getState(): PeerConnectionState {
    return this.connectionState
  }

  public onMessage(handler: (msg: PeerMessage) => void): () => void {
    this.messageHandlers.push(handler)
    return () => {
      this.messageHandlers = this.messageHandlers.filter((h) => h !== handler)
    }
  }

  public onStateChange(
    handler: (state: PeerConnectionState) => void,
  ): () => void {
    this.stateChangeHandlers.push(handler)
    return () => {
      this.stateChangeHandlers = this.stateChangeHandlers.filter(
        (h) => h !== handler,
      )
    }
  }

  private setupDataChannel(channel: RTCDataChannel) {
    this.dataChannel = channel

    channel.onopen = () => {
      this.setState('connected')
    }

    channel.onclose = () => {
      this.setState('disconnected')
    }

    channel.onerror = (err) => {
      console.error('WebRTC DataChannel error:', err)
      this.setState('failed')
    }

    channel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as PeerMessage
        this.messageHandlers.forEach((handler) => handler(message))
      } catch (err) {
        console.error('Failed to parse peer message:', err)
      }
    }
  }

  private waitForIceGathering(peer: RTCPeerConnection): Promise<void> {
    return new Promise((resolve) => {
      if (peer.iceGatheringState === 'complete') {
        resolve()
        return
      }

      const checkState = () => {
        if (peer.iceGatheringState === 'complete') {
          peer.removeEventListener('icegatheringstatechange', checkState)
          resolve()
        }
      }

      peer.addEventListener('icegatheringstatechange', checkState)

      // Timeout fallback after 2.5s if STUN is slow
      setTimeout(() => {
        peer.removeEventListener('icegatheringstatechange', checkState)
        resolve()
      }, 2500)
    })
  }

  public async createOffer(): Promise<string> {
    this.close()
    this.setState('creating-offer')

    const peer = new RTCPeerConnection(ICE_SERVERS)
    this.peer = peer

    peer.onconnectionstatechange = () => {
      if (
        peer.connectionState === 'disconnected' ||
        peer.connectionState === 'failed'
      ) {
        this.setState('disconnected')
      }
    }

    const dataChannel = peer.createDataChannel('chess-game', {
      ordered: true,
    })
    this.setupDataChannel(dataChannel)

    const offer = await peer.createOffer()
    await peer.setLocalDescription(offer)

    await this.waitForIceGathering(peer)

    this.setState('waiting-for-answer')
    return await encodeSessionDescription(peer.localDescription || offer)
  }

  public async acceptOffer(encodedOffer: string): Promise<string> {
    this.close()
    this.setState('creating-answer')

    const offer = await decodeSessionDescription(encodedOffer)
    if (!offer) {
      this.setState('failed')
      throw new Error('Invalid or corrupted offer payload')
    }

    const peer = new RTCPeerConnection(ICE_SERVERS)
    this.peer = peer

    peer.onconnectionstatechange = () => {
      if (
        peer.connectionState === 'disconnected' ||
        peer.connectionState === 'failed'
      ) {
        this.setState('disconnected')
      }
    }

    peer.ondatachannel = (event) => {
      this.setupDataChannel(event.channel)
    }

    await peer.setRemoteDescription(new RTCSessionDescription(offer))
    const answer = await peer.createAnswer()
    await peer.setLocalDescription(answer)

    await this.waitForIceGathering(peer)

    this.setState('connecting')
    return await encodeSessionDescription(peer.localDescription || answer)
  }

  public async applyAnswer(encodedAnswer: string): Promise<void> {
    if (!this.peer) {
      throw new Error('No active peer connection to apply answer to')
    }

    const answer = await decodeSessionDescription(encodedAnswer)
    if (!answer) {
      this.setState('failed')
      throw new Error('Invalid or corrupted answer payload')
    }

    this.setState('connecting')
    await this.peer.setRemoteDescription(new RTCSessionDescription(answer))
  }

  public sendMessage(msg: PeerMessage): boolean {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      return false
    }

    try {
      this.dataChannel.send(JSON.stringify(msg))
      return true
    } catch (err) {
      console.error('Failed to send peer message:', err)
      return false
    }
  }

  public close(): void {
    if (this.dataChannel) {
      this.dataChannel.close()
      this.dataChannel = null
    }
    if (this.peer) {
      this.peer.close()
      this.peer = null
    }
    this.setState('idle')
  }
}

// Global singleton WebRTC manager
export const webrtcManager = new WebRTCManager()
