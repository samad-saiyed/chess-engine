'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useChessStore } from '@/store/useChessStore'
import { capitalize } from 'lodash'
import {
  Award,
  Frown,
  LogOut,
  RotateCcw,
  Settings2,
  Trophy,
} from 'lucide-react'

export function GameOverDialog() {
  const gameResult = useChessStore((state) => state.gameResult)
  const gameMode = useChessStore((state) => state.gameMode)
  const playerColor = useChessStore((state) => state.playerColor)
  const opponentName = useChessStore((state) => state.opponentName)
  const isRematchRequested = useChessStore((state) => state.isRematchRequested)
  const resetGame = useChessStore((state) => state.resetGame)
  const exitToSetup = useChessStore((state) => state.exitToSetup)
  const dismissGameResult = useChessStore((state) => state.dismissGameResult)
  const requestRematch = useChessStore((state) => state.requestRematch)
  const acceptRematch = useChessStore((state) => state.acceptRematch)

  if (!gameResult) return null

  const { winner, reason } = gameResult

  let title = 'Game Finished'
  let subtitle = ''
  let isWin = false
  let isLoss = false

  if (gameMode === 'bot') {
    if (winner === 'draw') {
      title = 'Match Drawn'
      subtitle = 'The game resulted in a stalemate (no legal moves).'
    } else if (winner === playerColor) {
      title = 'Victory!'
      subtitle =
        reason === 'resignation'
          ? 'Opponent resigned.'
          : reason === 'timeout'
            ? 'Computer ran out of time!'
            : 'You won against the Computer by checkmate!'
      isWin = true
    } else {
      title = 'Defeat'
      subtitle =
        reason === 'resignation'
          ? 'You resigned the match.'
          : reason === 'timeout'
            ? 'You ran out of time.'
            : 'The Computer won by checkmate.'
      isLoss = true
    }
  } else if (gameMode === 'friends') {
    if (winner === 'draw') {
      title = 'Match Drawn'
      subtitle = 'The game resulted in a draw (stalemate or agreed draw).'
    } else if (winner === playerColor) {
      title = 'Victory!'
      subtitle =
        reason === 'resignation'
          ? `${opponentName} resigned the game.`
          : reason === 'timeout'
            ? `${opponentName} ran out of time!`
            : `You won by checkmate against ${opponentName}!`
      isWin = true
    } else {
      title = 'Defeat'
      subtitle =
        reason === 'resignation'
          ? 'You resigned the match.'
          : reason === 'timeout'
            ? 'You ran out of time.'
            : `${opponentName} won by checkmate.`
      isLoss = true
    }
  } else {
    // Local / 2P
    if (winner === 'draw') {
      title = 'Draw'
      subtitle = 'Stalemate — No legal moves remaining.'
    } else {
      title = `${capitalize(winner || '')} Wins!`
      subtitle =
        reason === 'resignation'
          ? 'Won by resignation.'
          : `Checkmate against ${winner === 'white' ? 'Black' : 'White'}.`
      isWin = true
    }
  }

  const handleFriendsRematch = () => {
    if (isRematchRequested) {
      acceptRematch()
    } else {
      requestRematch()
    }
    dismissGameResult()
  }

  const handlePlayAgain = () => {
    dismissGameResult()
    resetGame()
  }

  return (
    <Dialog
      open={gameResult !== null}
      onOpenChange={(open) => {
        if (!open) {
          dismissGameResult()
        }
      }}>
      <DialogContent
        showCloseButton={true}
        className='w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-2xl border border-white/15 bg-[#18191c] p-6 text-white shadow-2xl backdrop-blur-md'>
        <DialogHeader className='flex flex-col items-center text-center'>
          {/* Icon Badge */}
          <div
            className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border shadow-inner ${
              isWin
                ? 'border-teal-500/40 bg-teal-500/20 text-teal-300'
                : isLoss
                  ? 'border-rose-500/40 bg-rose-500/20 text-rose-300'
                  : 'border-white/20 bg-white/10 text-white'
            }`}>
            {isWin ? (
              <Trophy className='h-7 w-7' />
            ) : isLoss ? (
              <Frown className='h-7 w-7' />
            ) : (
              <Award className='h-7 w-7' />
            )}
          </div>

          <DialogTitle className='text-2xl font-bold tracking-tight'>
            {title}
          </DialogTitle>
          <p className='mt-1 max-w-65 text-xs leading-relaxed text-white/60'>
            {subtitle}
          </p>
        </DialogHeader>

        <div className='mt-6 flex flex-col gap-2.5'>
          {gameMode === 'friends' ? (
            <Button
              onClick={handleFriendsRematch}
              variant='default'
              className='h-12 w-full rounded-xl text-sm font-semibold shadow-md'>
              <RotateCcw className='mr-2 h-4 w-4' />
              {isRematchRequested ? 'Accept Rematch' : 'Request Rematch'}
            </Button>
          ) : (
            <Button
              onClick={handlePlayAgain}
              variant='default'
              className='h-12 w-full rounded-xl text-sm font-semibold shadow-md'>
              <RotateCcw className='mr-2 h-4 w-4' />
              Play Again
            </Button>
          )}

          {gameMode === 'bot' && (
            <Button
              onClick={() => {
                dismissGameResult()
                exitToSetup()
              }}
              variant='secondary'
              className='h-11 w-full rounded-xl border border-white/10 text-sm font-medium'>
              <Settings2 className='mr-2 h-4 w-4' />
              Change Setup
            </Button>
          )}

          {gameMode === 'friends' && (
            <Button
              onClick={() => {
                dismissGameResult()
                exitToSetup()
              }}
              variant='secondary'
              className='h-11 w-full rounded-xl border border-white/10 text-sm font-medium'>
              <LogOut className='mr-2 h-4 w-4' />
              Leave Room
            </Button>
          )}

          <Button
            onClick={dismissGameResult}
            variant='ghost'
            className='h-10 w-full rounded-xl text-xs font-medium text-white/50 hover:bg-white/5 hover:text-white'>
            Review Board
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
