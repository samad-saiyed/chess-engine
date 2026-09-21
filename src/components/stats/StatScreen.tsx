'use client'

import { MoveHistory } from '@/components/chess/MoveHistory'
import { Button } from '@/components/ui/button'
import { useChessStore } from '@/store/useChessStore'
import { Award, Bot, RotateCcw, Trophy, Users } from 'lucide-react'
import { capitalize } from 'lodash'
import Link from 'next/link'

export const StatScreen = () => {
  const resetGame = useChessStore((state) => state.resetGame)
  const isGameStarted = useChessStore((state) => !!state.moveHistory?.length)
  const turn = useChessStore((state) => state.turn)
  const status = useChessStore((state) => state.status)
  const gameResult = useChessStore((state) => state.gameResult)

  const isGameOver =
    status === 'checkmate' || status === 'stalemate' || gameResult !== null
  const winner =
    gameResult?.winner ||
    (status === 'checkmate' ? (turn === 'white' ? 'black' : 'white') : null)
  const isDraw = status === 'stalemate' || gameResult?.winner === 'draw'

  return (
    <div className='h-max w-full rounded-2xl border border-white/10 bg-[#16171a] p-6 text-white shadow-2xl'>
      {/* Header */}
      <div className='mb-6 flex items-center justify-between border-b border-white/10 pb-4'>
        <div>
          <h2 className='text-lg font-bold tracking-tight text-white'>
            {isGameStarted ? 'Pass & Play' : 'Play Chess'}
          </h2>
          <p className='text-xs text-white/50'>
            {isGameStarted
              ? 'Local 2-player game on this device'
              : 'Choose a game mode to get started'}
          </p>
        </div>

        {isGameStarted && (
          <div className='flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium'>
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                turn === 'white' ? 'bg-white' : 'bg-neutral-500'
              }`}
            />
            <span className='capitalize'>
              {isGameOver
                ? 'Game Over'
                : status === 'playing'
                  ? `${turn}'s Turn`
                  : status}
            </span>
          </div>
        )}
      </div>

      {isGameStarted ? (
        /* In-Progress Local Game */
        <div className='space-y-5'>
          {/* Winner / Status Card */}
          {isGameOver && (
            <div
              className={`flex items-center gap-3 rounded-xl border p-4 ${
                !isDraw
                  ? 'border-teal-500/50 bg-teal-500/20 text-teal-100 shadow-[0_0_20px_rgba(20,184,166,0.15)]'
                  : 'border-amber-500/40 bg-amber-500/15 text-amber-100'
              }`}>
              <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-white/15'>
                {!isDraw ? (
                  <Trophy className='h-5 w-5 text-teal-300' />
                ) : (
                  <Award className='h-5 w-5 text-amber-300' />
                )}
              </div>
              <div>
                <div className='text-sm font-bold'>
                  {!isDraw
                    ? `${capitalize(winner || '')} Wins!`
                    : 'Match Drawn'}
                </div>
                <div className='text-xs opacity-80'>
                  {!isDraw ? 'Won by checkmate' : 'Stalemate — No legal moves'}
                </div>
              </div>
            </div>
          )}

          <div>
            <h3 className='mb-2 text-xs font-semibold tracking-wider text-white/50 uppercase'>
              Move History
            </h3>
            <MoveHistory />
          </div>

          <Button
            onClick={resetGame}
            variant='default'
            className='h-11 w-full rounded-xl text-sm font-semibold shadow-md'>
            <RotateCcw className='mr-2 h-4 w-4' />
            Restart Board
          </Button>
        </div>
      ) : (
        /* Game Mode Selection Hub */
        <div className='flex flex-col gap-3.5'>
          <Link href='/play' className='w-full'>
            <div className='group flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-teal-500/50 hover:bg-white/10'>
              <div className='flex items-center gap-3.5'>
                <div className='flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/20 text-teal-300'>
                  <Bot className='h-5 w-5' />
                </div>
                <div>
                  <div className='text-sm font-bold text-white transition-colors group-hover:text-teal-200'>
                    Play vs Computer
                  </div>
                  <div className='text-xs text-white/50'>
                    Casual, Intermediate, or Master difficulty
                  </div>
                </div>
              </div>
            </div>
          </Link>

          <Link href='/friends' className='w-full'>
            <div className='group flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-white/20 hover:bg-white/10'>
              <div className='flex items-center gap-3.5'>
                <div className='flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white/80'>
                  <Users className='h-5 w-5' />
                </div>
                <div>
                  <div className='text-sm font-bold text-white transition-colors'>
                    Play with a Friend
                  </div>
                  <div className='text-xs text-white/50'>
                    Direct peer-to-peer match via link or QR
                  </div>
                </div>
              </div>
            </div>
          </Link>

          <div className='pt-2'>
            <p className='text-center text-xs text-white/40'>
              Or make a move on the board to play locally
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
