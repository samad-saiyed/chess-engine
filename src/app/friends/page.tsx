'use client'

import { ChessBoard } from '@/components/chess/ChessBoard'
import { FriendsGameControls } from '@/components/chess/FriendsGameControls'
import { DarkAuroraBackground } from '@/components/ui/dark-aurora-background'
import { TIME_CONTROLS } from '@/chess/timer'
import type { Color } from '@/chess/types'
import { roomSignaling } from '@/multiplayer/roomSignaling'
import { webrtcManager } from '@/multiplayer/webrtc'
import { useChessStore } from '@/store/useChessStore'
import { gooeyToast } from 'goey-toast'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef } from 'react'

import { sessionMemory } from '@/multiplayer/sessionMemory'

function FriendsAutoJoinHandler() {
  const searchParams = useSearchParams()
  const initMultiplayerSession = useChessStore(
    (state) => state.initMultiplayerSession,
  )
  const restoreMultiplayerSession = useChessStore(
    (state) => state.restoreMultiplayerSession,
  )
  const playerName = useChessStore((state) => state.playerName)
  const setGameMode = useChessStore((state) => state.setGameMode)

  const hasProcessedRef = useRef(false)

  useEffect(() => {
    setGameMode('friends')
  }, [setGameMode])

  useEffect(() => {
    if (hasProcessedRef.current) return
    hasProcessedRef.current = true

    const roomId = searchParams.get('room')
    const joinData = searchParams.get('join')

    // 1. Accidental Browser Refresh Recovery
    if (!roomId && !joinData) {
      const activeSession = sessionMemory.getSession()
      if (activeSession && activeSession.roomId) {
        restoreMultiplayerSession(activeSession)
        gooeyToast.info('Game Restored', {
          description: `Reconnecting to match with ${activeSession.opponentName}...`,
        })

        const reconnectSession = async () => {
          try {
            if (activeSession.peerRole === 'host') {
              const newOffer = await webrtcManager.createOffer()
              await roomSignaling.postOffer(
                activeSession.roomId,
                newOffer,
                activeSession.playerColor,
                activeSession.timeControl?.id,
                playerName,
                true,
              )

              roomSignaling.initBroadcast(activeSession.roomId, async (msg) => {
                if (msg.type === 'ANSWER') {
                  await webrtcManager.applyAnswer(msg.payload)
                }
              })

              roomSignaling.startPollingAnswer(
                activeSession.roomId,
                async (ans) => {
                  await webrtcManager.applyAnswer(ans)
                },
              )

              const unsub = webrtcManager.onStateChange((st) => {
                if (st === 'connected') {
                  roomSignaling.stopPolling()
                  webrtcManager.sendMessage({
                    type: 'RECONNECT',
                    payload: { playerName },
                  })
                  unsub()
                }
              })
            } else {
              // Joiner polls for host's reconnected offer
              roomSignaling.startPollingOffer(
                activeSession.roomId,
                async (data) => {
                  if (data.offer) {
                    const answer = await webrtcManager.acceptOffer(data.offer)
                    await roomSignaling.postAnswer(activeSession.roomId, answer)
                  }
                },
              )

              const unsub = webrtcManager.onStateChange((st) => {
                if (st === 'connected') {
                  roomSignaling.stopPolling()
                  webrtcManager.sendMessage({
                    type: 'RECONNECT',
                    payload: { playerName },
                  })
                  unsub()
                }
              })
            }
          } catch (err) {
            console.warn('Auto-reconnect error:', err)
          }
        }

        reconnectSession()
        return
      }
      return
    }

    // 2. Joining room via URL params
    const connectToHost = async () => {
      try {
        let offerToAccept = joinData || ''
        let hostColor: Color = (searchParams.get('color') as Color) || 'white'
        let tcParam = searchParams.get('tc')
        let opponentHostName = searchParams.get('host')
          ? decodeURIComponent(searchParams.get('host')!)
          : 'Host'

        if (roomId) {
          const roomData = await roomSignaling.fetchRoomOffer(roomId)
          if (!roomData || !roomData.offer) {
            throw new Error('Room not found or expired')
          }
          offerToAccept = roomData.offer
          if (
            roomData.hostColor === 'black' ||
            roomData.hostColor === 'white'
          ) {
            hostColor = roomData.hostColor as Color
          }
          tcParam = roomData.timeControlId || tcParam
          if (roomData.hostName) opponentHostName = roomData.hostName
        }

        const myColor: Color = hostColor === 'white' ? 'black' : 'white'
        const tc = TIME_CONTROLS.find((t) => t.id === tcParam) || null

        gooeyToast.info('Connecting...', {
          description: `Joining match hosted by ${opponentHostName}`,
        })

        const answer = await webrtcManager.acceptOffer(offerToAccept)
        if (roomId) {
          await roomSignaling.postAnswer(roomId, answer)
        }

        const unsub = webrtcManager.onStateChange((st) => {
          if (st === 'connected') {
            webrtcManager.sendMessage({
              type: 'JOIN_HELLO',
              payload: {
                joinerName: playerName,
              },
            })
            initMultiplayerSession(
              'joiner',
              myColor,
              opponentHostName,
              tc,
              roomId || undefined,
            )
            gooeyToast.success('Connected to Host!', {
              description: `Game started against ${opponentHostName}`,
            })
            unsub()
          }
        })
      } catch (err) {
        console.error('Failed to auto-join room:', err)
        gooeyToast.error('Connection Failed', {
          description: 'The room link may have expired or is invalid.',
        })
      }
    }

    connectToHost()
  }, [
    searchParams,
    playerName,
    initMultiplayerSession,
    restoreMultiplayerSession,
  ])

  return null
}

export default function FriendsPage() {
  return (
    <DarkAuroraBackground>
      <Suspense fallback={null}>
        <FriendsAutoJoinHandler />
      </Suspense>

      <div className='mx-auto flex min-h-screen max-w-7xl items-center justify-center gap-7 px-0 py-2 max-lg:flex-col sm:p-8 lg:gap-12'>
        <div className='flex w-full flex-1 items-center justify-center'>
          <ChessBoard />
        </div>

        <div className='flex w-full max-w-md flex-1 items-center justify-center px-3 sm:px-0'>
          <FriendsGameControls />
        </div>
      </div>
    </DarkAuroraBackground>
  )
}
