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

function FriendsAutoJoinHandler() {
  const searchParams = useSearchParams()
  const initMultiplayerSession = useChessStore(
    (state) => state.initMultiplayerSession,
  )
  const playerName = useChessStore((state) => state.playerName)
  const setGameMode = useChessStore((state) => state.setGameMode)

  const hasProcessedRef = useRef(false)

  useEffect(() => {
    setGameMode('friends')
  }, [setGameMode])

  useEffect(() => {
    const roomId = searchParams.get('room')
    const joinData = searchParams.get('join')

    if ((!roomId && !joinData) || hasProcessedRef.current) return
    hasProcessedRef.current = true

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
            initMultiplayerSession('joiner', myColor, opponentHostName, tc)
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
  }, [searchParams, playerName, initMultiplayerSession])

  return null
}

export default function FriendsPage() {
  return (
    <DarkAuroraBackground>
      <Suspense fallback={null}>
        <FriendsAutoJoinHandler />
      </Suspense>

      <div className='mx-auto flex min-h-screen max-w-7xl items-center justify-center p-4 max-lg:flex-col sm:p-8 lg:gap-12'>
        <div className='flex flex-1 items-center justify-center'>
          <ChessBoard />
        </div>

        <div className='flex w-full max-w-md flex-1 items-center justify-center'>
          <FriendsGameControls />
        </div>
      </div>
    </DarkAuroraBackground>
  )
}
