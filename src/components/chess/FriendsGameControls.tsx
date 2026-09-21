'use client'

import { TIME_CONTROLS, type TimeControl } from '@/chess/timer'
import type { Color } from '@/chess/types'
import { MoveHistory } from '@/components/chess/MoveHistory'
import { ShareInviteModal } from '@/components/multiplayer/ShareInviteModal'
import { Button } from '@/components/ui/button'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import type { PeerMessage } from '@/multiplayer/types'
import { webrtcManager } from '@/multiplayer/webrtc'
import { useChessStore } from '@/store/useChessStore'
import { gooeyToast } from 'goey-toast'
import { capitalize } from 'lodash'
import {
  ArrowLeft,
  Award,
  Clock,
  Flag,
  Frown,
  Handshake,
  Radio,
  RotateCcw,
  Shuffle,
  Swords,
  Trophy,
  User,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export function FriendsGameControls() {
  const isMatchStarted = useChessStore((state) => state.isMatchStarted)
  const playerName = useChessStore((state) => state.playerName)
  const opponentName = useChessStore((state) => state.opponentName)
  const playerColor = useChessStore((state) => state.playerColor)
  const turn = useChessStore((state) => state.turn)
  const status = useChessStore((state) => state.status)
  const gameResult = useChessStore((state) => state.gameResult)
  const isDrawOffered = useChessStore((state) => state.isDrawOfferedByOpponent)
  const isRematchRequested = useChessStore((state) => state.isRematchRequested)
  const peerConnectionState = useChessStore(
    (state) => state.peerConnectionState,
  )

  const setPlayerName = useChessStore((state) => state.setPlayerName)
  const setPeerConnectionState = useChessStore(
    (state) => state.setPeerConnectionState,
  )
  const initMultiplayerSession = useChessStore(
    (state) => state.initMultiplayerSession,
  )
  const receiveRemoteMove = useChessStore((state) => state.receiveRemoteMove)
  const offerDraw = useChessStore((state) => state.offerDraw)
  const acceptDraw = useChessStore((state) => state.acceptDraw)
  const declineDraw = useChessStore((state) => state.declineDraw)
  const resignGame = useChessStore((state) => state.resignGame)
  const requestRematch = useChessStore((state) => state.requestRematch)
  const acceptRematch = useChessStore((state) => state.acceptRematch)
  const toggleFlip = useChessStore((state) => state.toggleFlip)
  const exitToSetup = useChessStore((state) => state.exitToSetup)

  // Local state for setup
  const [tab, setTab] = useState<'host' | 'join'>('host')
  const [selectedColor, setSelectedColor] = useState<Color | 'random'>('white')
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControl>(
    TIME_CONTROLS[0],
  )
  const [manualCodeInput, setManualCodeInput] = useState('')
  const [isGeneratingOffer, setIsGeneratingOffer] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [inviteUrl, setInviteUrl] = useState('')
  const [offerCode, setOfferCode] = useState('')

  // Track WebRTC messages & connection state
  useEffect(() => {
    const unsubState = webrtcManager.onStateChange((state) => {
      setPeerConnectionState(state)
      if (state === 'connected') {
        setShareModalOpen(false)
      }
    })

    const unsubMsg = webrtcManager.onMessage((msg: PeerMessage) => {
      if (msg.type === 'HANDSHAKE') {
        const { name, hostColor, timeControlId } = msg.payload
        const myColor: Color = hostColor === 'white' ? 'black' : 'white'
        const tc = TIME_CONTROLS.find((t) => t.id === timeControlId) || null
        initMultiplayerSession('joiner', myColor, name, tc)
        gooeyToast.success('Connected!', {
          description: `Playing against ${name}`,
        })
      } else if (msg.type === 'MOVE') {
        receiveRemoteMove(msg.payload.move)
      } else if (msg.type === 'DRAW_OFFER') {
        useChessStore.setState({ isDrawOfferedByOpponent: true })
        gooeyToast.info('Draw Offered', {
          description: `${opponentName} has offered a draw.`,
        })
      } else if (msg.type === 'DRAW_ACCEPT') {
        acceptDraw()
      } else if (msg.type === 'DRAW_DECLINE') {
        gooeyToast.info('Draw Declined', {
          description: `${opponentName} declined the draw offer.`,
        })
      } else if (msg.type === 'RESIGN') {
        const winner: Color = playerColor
        useChessStore.setState({
          status: 'checkmate',
          isClockActive: false,
          gameResult: { winner, reason: 'resignation' },
        })
        gooeyToast.success('Opponent Resigned', {
          description: `${opponentName} resigned the game.`,
        })
      } else if (msg.type === 'REMATCH_REQUEST') {
        useChessStore.setState({ isRematchRequested: true })
        gooeyToast.info('Rematch Request', {
          description: `${opponentName} wants a rematch!`,
        })
      } else if (msg.type === 'REMATCH_ACCEPT') {
        const nextColor: Color = playerColor === 'white' ? 'black' : 'white'
        initMultiplayerSession('host', nextColor, opponentName)
        gooeyToast.success('Rematch Started!', {
          description: 'Colors have been swapped.',
        })
      }
    })

    return () => {
      unsubState()
      unsubMsg()
    }
  }, [
    setPeerConnectionState,
    initMultiplayerSession,
    receiveRemoteMove,
    acceptDraw,
    opponentName,
    playerColor,
  ])

  // Host creates game offer
  const handleHostGame = async () => {
    try {
      setIsGeneratingOffer(true)
      const encodedOffer = await webrtcManager.createOffer()
      setOfferCode(encodedOffer)

      let assignedColor: Color
      if (selectedColor === 'random') {
        assignedColor = Math.random() < 0.5 ? 'white' : 'black'
      } else {
        assignedColor = selectedColor
      }

      // Construct direct invite URL
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const url = `${origin}/friends?join=${encodedOffer}&color=${assignedColor}&tc=${selectedTimeControl.id}&host=${encodeURIComponent(playerName)}`
      setInviteUrl(url)
      setShareModalOpen(true)

      // Listen for peer connection open to send handshake
      const unsub = webrtcManager.onStateChange((st) => {
        if (st === 'connected') {
          webrtcManager.sendMessage({
            type: 'HANDSHAKE',
            payload: {
              name: playerName,
              hostColor: assignedColor,
              timeControlId: selectedTimeControl.id,
            },
          })
          initMultiplayerSession(
            'host',
            assignedColor,
            'Opponent',
            selectedTimeControl.initialSeconds > 0 ? selectedTimeControl : null,
          )
          unsub()
        }
      })
    } catch (err) {
      console.error('Failed to create game host offer:', err)
      gooeyToast.error('Host Error', {
        description: 'Failed to create room invite.',
      })
    } finally {
      setIsGeneratingOffer(false)
    }
  }

  // Joiner accepts offer
  const handleJoinGame = async () => {
    if (!manualCodeInput.trim()) return

    try {
      setIsConnecting(true)
      let offerStr = manualCodeInput.trim()

      // If user pasted full URL, extract join param
      if (offerStr.includes('join=')) {
        const parsed = new URL(offerStr)
        offerStr = parsed.searchParams.get('join') || ''
      }

      // Listen for open state to send handshake
      const unsub = webrtcManager.onStateChange((st) => {
        if (st === 'connected') {
          webrtcManager.sendMessage({
            type: 'HANDSHAKE',
            payload: {
              name: playerName,
              hostColor: 'white', // Placeholder, updated on incoming host handshake
            },
          })
          unsub()
        }
      })

      // If needed, copy answer or alert user
      gooeyToast.success('Connected to host!', {
        description: 'Starting peer match...',
      })
    } catch (err) {
      console.error('Failed to join game:', err)
      gooeyToast.error('Join Error', {
        description: 'Could not connect with the provided link/code.',
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const isPlayerTurn = turn === playerColor
  const isGameOver =
    status === 'checkmate' || status === 'stalemate' || gameResult !== null
  const isPlayerWinner = gameResult?.winner === playerColor
  const isOpponentWinner =
    gameResult?.winner &&
    gameResult.winner !== playerColor &&
    gameResult.winner !== 'draw'
  const isResignation = gameResult?.reason === 'resignation'
  const isTimeout = gameResult?.reason === 'timeout'

  return (
    <div className='h-max w-full rounded-2xl border border-white/10 bg-[#16171a] p-6 text-white shadow-2xl'>
      {/* Header */}
      <div className='mb-6 flex items-center justify-between border-b border-white/10 pb-4'>
        <div className='flex items-center gap-3'>
          {isMatchStarted ? (
            <button
              type='button'
              onClick={exitToSetup}
              className='flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white'
              title='Leave Match'>
              <ArrowLeft className='h-4 w-4' />
            </button>
          ) : (
            <Link
              href='/'
              className='flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white'
              title='Back to Home'>
              <ArrowLeft className='h-4 w-4' />
            </Link>
          )}
          <div>
            <h2 className='text-lg font-bold tracking-tight text-white'>
              Play with Friends
            </h2>
            <p className='text-xs text-white/50'>
              Serverless P2P WebRTC multiplayer
            </p>
          </div>
        </div>

        {/* Connection status badge */}
        <div className='flex items-center gap-2'>
          <span
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
              peerConnectionState === 'connected'
                ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-400'
                : peerConnectionState === 'connecting' ||
                    peerConnectionState === 'creating-offer' ||
                    peerConnectionState === 'waiting-for-answer'
                  ? 'border-amber-500/30 bg-amber-950/40 text-amber-300'
                  : 'border-white/10 bg-white/5 text-white/50'
            }`}>
            {peerConnectionState === 'connected' ? (
              <>
                <Wifi className='h-3 w-3' />
                <span>Live</span>
              </>
            ) : (
              <>
                <WifiOff className='h-3 w-3' />
                <span>
                  {peerConnectionState === 'waiting-for-answer'
                    ? 'Waiting'
                    : 'Offline'}
                </span>
              </>
            )}
          </span>
        </div>
      </div>

      {!isMatchStarted ? (
        /* Lobby Screen */
        <div className='space-y-6'>
          {/* Profile Name & Avatar Customization */}
          <div className='flex items-center gap-3.5 rounded-xl border border-white/10 bg-white/5 p-3.5'>
            <div className='relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-black/40 shadow-inner'>
              <PlayerAvatar name={playerName} size={44} />
            </div>
            <div className='flex-1'>
              <label className='mb-1 block text-[11px] font-semibold tracking-wider text-white/50 uppercase'>
                Your Player Name
              </label>
              <input
                type='text'
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.slice(0, 16))}
                className='w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-sm font-semibold text-white transition-colors focus:border-teal-500 focus:outline-none'
                placeholder='Enter your name'
                maxLength={16}
              />
            </div>
          </div>

          {/* Lobby Mode Tabs: Host or Join */}
          <div className='flex gap-2 rounded-xl border border-white/5 bg-black/40 p-1'>
            <button
              onClick={() => setTab('host')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all ${
                tab === 'host'
                  ? 'border border-white/10 bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}>
              <Radio className='h-3.5 w-3.5' />
              Host Game
            </button>
            <button
              onClick={() => setTab('join')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all ${
                tab === 'join'
                  ? 'border border-white/10 bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}>
              <Users className='h-3.5 w-3.5' />
              Join Game
            </button>
          </div>

          {tab === 'host' ? (
            /* Host Setup Tab */
            <div className='space-y-5'>
              {/* Time Control Selection */}
              <div>
                <label className='mb-2 flex items-center justify-between text-xs font-semibold tracking-wider text-white/60 uppercase'>
                  <span>Time Control</span>
                  <Clock className='h-3.5 w-3.5 opacity-60' />
                </label>
                <div className='grid grid-cols-3 gap-2'>
                  {TIME_CONTROLS.map((tc) => {
                    const isSelected = selectedTimeControl.id === tc.id
                    return (
                      <button
                        key={tc.id}
                        type='button'
                        onClick={() => setSelectedTimeControl(tc)}
                        className={`flex flex-col items-center justify-center rounded-xl border py-2.5 text-center transition-all ${
                          isSelected
                            ? 'border-teal-500 bg-teal-500/15 font-semibold text-white'
                            : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                        }`}>
                        <span className='text-xs font-medium'>{tc.label}</span>
                        <span className='text-[10px] text-white/40'>
                          {tc.category}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Side Selection */}
              <div>
                <label className='mb-2.5 block text-xs font-semibold tracking-wider text-white/60 uppercase'>
                  Your Color
                </label>
                <div className='grid grid-cols-3 gap-2.5'>
                  <button
                    type='button'
                    onClick={() => setSelectedColor('white')}
                    className={`flex flex-col items-center justify-center rounded-xl border py-3 transition-all ${
                      selectedColor === 'white'
                        ? 'border-teal-500 bg-teal-500/15 font-semibold text-white'
                        : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                    }`}>
                    <div className='mb-1 flex h-6 w-6 items-center justify-center rounded-full bg-white font-serif font-bold text-black shadow-sm'>
                      ♔
                    </div>
                    <span className='text-xs'>White</span>
                  </button>

                  <button
                    type='button'
                    onClick={() => setSelectedColor('random')}
                    className={`flex flex-col items-center justify-center rounded-xl border py-3 transition-all ${
                      selectedColor === 'random'
                        ? 'border-teal-500 bg-teal-500/15 font-semibold text-white'
                        : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                    }`}>
                    <div className='mb-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white'>
                      <Shuffle className='h-3.5 w-3.5' />
                    </div>
                    <span className='text-xs'>Random</span>
                  </button>

                  <button
                    type='button'
                    onClick={() => setSelectedColor('black')}
                    className={`flex flex-col items-center justify-center rounded-xl border py-3 transition-all ${
                      selectedColor === 'black'
                        ? 'border-teal-500 bg-teal-500/15 font-semibold text-white'
                        : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                    }`}>
                    <div className='mb-1 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-neutral-900 font-serif font-bold text-white shadow-sm'>
                      ♚
                    </div>
                    <span className='text-xs'>Black</span>
                  </button>
                </div>
              </div>

              {/* Host Action */}
              <Button
                onClick={handleHostGame}
                disabled={isGeneratingOffer}
                variant='default'
                className='h-12 w-full rounded-xl text-base font-semibold shadow-lg'>
                <Radio className='mr-2 h-4 w-4 animate-pulse' />
                {isGeneratingOffer ? 'Creating Room...' : 'Create Invite Link'}
              </Button>
            </div>
          ) : (
            /* Join Tab */
            <div className='space-y-4'>
              <div>
                <label className='mb-2 block text-xs font-semibold tracking-wider text-white/60 uppercase'>
                  Invite Link or Room Code
                </label>
                <textarea
                  rows={4}
                  value={manualCodeInput}
                  onChange={(e) => setManualCodeInput(e.target.value)}
                  placeholder='Paste the invite link or session code from your friend...'
                  className='w-full resize-none rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-xs text-white transition-colors focus:border-teal-500 focus:outline-none'
                />
              </div>

              <Button
                onClick={handleJoinGame}
                disabled={isConnecting || !manualCodeInput.trim()}
                variant='default'
                className='h-12 w-full rounded-xl text-base font-semibold shadow-lg'>
                <Swords className='mr-2 h-4 w-4' />
                {isConnecting ? 'Connecting...' : 'Join & Start Match'}
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Active In-Game Screen */
        <div className='space-y-5'>
          {/* Draw offer banner from opponent */}
          {isDrawOffered && !isGameOver && (
            <div className='animate-in fade-in rounded-xl border border-amber-500/40 bg-amber-950/40 p-3 text-amber-200 duration-200'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Handshake className='h-4 w-4 text-amber-400' />
                  <span className='text-xs font-semibold'>
                    {opponentName} offered a draw
                  </span>
                </div>
                <div className='flex gap-2'>
                  <button
                    onClick={acceptDraw}
                    className='rounded-lg bg-teal-500 px-2.5 py-1 text-xs font-bold text-black transition-all hover:bg-teal-400'>
                    Accept
                  </button>
                  <button
                    onClick={declineDraw}
                    className='rounded-lg bg-white/10 px-2.5 py-1 text-xs font-medium text-white transition-all hover:bg-white/20'>
                    Decline
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Rematch requested banner */}
          {isRematchRequested && isGameOver && (
            <div className='animate-in fade-in rounded-xl border border-teal-500/40 bg-teal-950/40 p-3 text-teal-200 duration-200'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <RotateCcw className='h-4 w-4 animate-spin text-teal-400' />
                  <span className='text-xs font-semibold'>
                    {opponentName} requested a rematch!
                  </span>
                </div>
                <button
                  onClick={acceptRematch}
                  className='rounded-lg bg-teal-500 px-3 py-1 text-xs font-bold text-black transition-all hover:bg-teal-400'>
                  Accept Rematch
                </button>
              </div>
            </div>
          )}

          {/* Game Status & Winner Banner */}
          <div
            className={`rounded-xl border p-4 transition-all ${
              isGameOver
                ? isPlayerWinner
                  ? 'border-teal-500/50 bg-teal-500/20 text-teal-100 shadow-[0_0_20px_rgba(20,184,166,0.2)]'
                  : isOpponentWinner
                    ? 'border-rose-500/50 bg-rose-500/20 text-rose-100'
                    : 'border-amber-500/40 bg-amber-500/15 text-amber-100'
                : status === 'check'
                  ? 'border-rose-500/40 bg-rose-500/10 text-rose-200'
                  : isPlayerTurn
                    ? 'border-teal-500/40 bg-teal-500/10 text-teal-100'
                    : 'border-white/10 bg-white/5 text-white/80'
            }`}>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    isGameOver
                      ? isPlayerWinner
                        ? 'bg-teal-500/30 text-teal-200'
                        : isOpponentWinner
                          ? 'bg-rose-500/30 text-rose-200'
                          : 'bg-amber-500/30 text-amber-200'
                      : isPlayerTurn
                        ? 'bg-teal-500/20 text-teal-300'
                        : 'bg-white/10 text-white/70'
                  }`}>
                  {isGameOver ? (
                    isPlayerWinner ? (
                      <Trophy className='h-5 w-5 text-teal-300' />
                    ) : isOpponentWinner ? (
                      <Frown className='h-5 w-5 text-rose-300' />
                    ) : (
                      <Award className='h-5 w-5 text-amber-300' />
                    )
                  ) : (
                    <User className='h-4 w-4' />
                  )}
                </div>
                <div>
                  <div className='text-sm font-bold'>
                    {isGameOver
                      ? isPlayerWinner
                        ? 'Victory!'
                        : isOpponentWinner
                          ? 'Defeat'
                          : 'Match Drawn'
                      : status === 'check'
                        ? 'Check!'
                        : isPlayerTurn
                          ? 'Your Turn'
                          : `${opponentName}'s Turn`}
                  </div>
                  <div className='mt-0.5 text-xs leading-tight opacity-80'>
                    {isGameOver
                      ? isPlayerWinner
                        ? isResignation
                          ? `${opponentName} resigned the match.`
                          : isTimeout
                            ? `${opponentName} ran out of time!`
                            : 'You won by checkmate!'
                        : isOpponentWinner
                          ? isResignation
                            ? 'You resigned the game.'
                            : isTimeout
                              ? 'You ran out of time.'
                              : `${opponentName} won by checkmate.`
                          : 'Draw — Stalemate reached.'
                      : isPlayerTurn
                        ? `Make your move as ${capitalize(playerColor)}`
                        : `Waiting for ${opponentName} to move...`}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Move History */}
          <div>
            <h3 className='mb-2 text-xs font-semibold tracking-wider text-white/50 uppercase'>
              Move History
            </h3>
            <MoveHistory />
          </div>

          {/* Action Buttons */}
          <div className='flex flex-col gap-2.5 pt-2'>
            <div className='grid grid-cols-2 gap-2.5'>
              {isGameOver ? (
                <Button
                  onClick={requestRematch}
                  variant='default'
                  className='h-11 rounded-xl text-sm font-semibold shadow-md'>
                  <RotateCcw className='mr-1.5 h-4 w-4' />
                  Rematch
                </Button>
              ) : (
                <Button
                  onClick={offerDraw}
                  variant='secondary'
                  className='h-11 rounded-xl border border-white/10 text-sm font-medium'>
                  <Handshake className='mr-1.5 h-4 w-4' />
                  Offer Draw
                </Button>
              )}

              <Button
                onClick={toggleFlip}
                variant='secondary'
                className='h-11 rounded-xl border border-white/10 text-sm font-medium'>
                Flip Board
              </Button>
            </div>

            {!isGameOver && (
              <Button
                onClick={resignGame}
                variant='outline'
                className='h-10 rounded-xl border-white/10 text-xs font-medium text-white/60 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-300'>
                <Flag className='mr-1.5 h-3.5 w-3.5' />
                Resign Match
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Share Invite Link Modal */}
      <ShareInviteModal
        isOpen={shareModalOpen}
        inviteUrl={inviteUrl}
        offerCode={offerCode}
        onClose={() => {
          setShareModalOpen(false)
          exitToSetup()
        }}
      />
    </div>
  )
}
