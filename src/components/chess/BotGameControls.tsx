'use client'

import { MoveHistory } from '@/components/chess/MoveHistory'
import { Button } from '@/components/ui/button'
import { DIFFICULTY_TIERS } from '@/engine/difficulty'
import type { EngineDifficulty } from '@/engine/types'
import { useChessStore } from '@/store/useChessStore'
import type { Color } from '@/chess/types'
import { TIME_CONTROLS, type TimeControl } from '@/chess/timer'
import {
  ArrowLeft,
  Award,
  Bot,
  Clock,
  Flag,
  Frown,
  RotateCcw,
  Shuffle,
  Swords,
  Trophy,
  User,
} from 'lucide-react'
import { capitalize } from 'lodash'
import Link from 'next/link'
import { useState } from 'react'

export function BotGameControls() {
  const isMatchStarted = useChessStore((state) => state.isMatchStarted)
  const playerColor = useChessStore((state) => state.playerColor)
  const difficulty = useChessStore((state) => state.difficulty)
  const isBotThinking = useChessStore((state) => state.isBotThinking)
  const turn = useChessStore((state) => state.turn)
  const status = useChessStore((state) => state.status)
  const gameResult = useChessStore((state) => state.gameResult)
  const moveHistory = useChessStore((state) => state.moveHistory)
  const startBotGame = useChessStore((state) => state.startBotGame)
  const resignGame = useChessStore((state) => state.resignGame)
  const toggleFlip = useChessStore((state) => state.toggleFlip)
  const exitToSetup = useChessStore((state) => state.exitToSetup)

  const [selectedDifficulty, setSelectedDifficulty] =
    useState<EngineDifficulty>(difficulty || 'medium')
  const [selectedColor, setSelectedColor] = useState<Color | 'random'>('white')
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControl>(
    TIME_CONTROLS[0], // Unlimited by default
  )

  const handleStartGame = () => {
    startBotGame(
      selectedColor,
      selectedDifficulty,
      selectedTimeControl.initialSeconds > 0 ? selectedTimeControl : null,
    )
  }

  const isPlayerTurn = turn === playerColor
  const activeDifficultyTier =
    DIFFICULTY_TIERS[difficulty] || DIFFICULTY_TIERS.medium

  const isGameOver =
    status === 'checkmate' || status === 'stalemate' || gameResult !== null
  const isPlayerWinner = gameResult?.winner === playerColor
  const isComputerWinner =
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
              title='Back to Setup'>
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
              Play vs Computer
            </h2>
            <p className='text-xs text-white/50'>
              In-house engine with 3 difficulty levels
            </p>
          </div>
        </div>

        {isMatchStarted && (
          <span className='rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80'>
            {activeDifficultyTier.name}
          </span>
        )}
      </div>

      {!isMatchStarted ? (
        /* Pre-game Setup Screen */
        <div className='space-y-6'>
          {/* Difficulty Selection */}
          <div>
            <label className='mb-2.5 block text-xs font-semibold tracking-wider text-white/60 uppercase'>
              Difficulty
            </label>
            <div className='grid grid-cols-3 gap-2.5'>
              {(Object.keys(DIFFICULTY_TIERS) as EngineDifficulty[]).map(
                (tierKey) => {
                  const tier = DIFFICULTY_TIERS[tierKey]
                  const isSelected = selectedDifficulty === tierKey

                  return (
                    <button
                      key={tierKey}
                      type='button'
                      onClick={() => setSelectedDifficulty(tierKey)}
                      className={`flex flex-col items-center justify-center rounded-xl border p-3.5 text-center transition-all ${
                        isSelected
                          ? 'border-teal-500 bg-teal-500/15 font-semibold text-white shadow-sm'
                          : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10'
                      }`}>
                      <span className='text-sm'>{tier.name}</span>
                      <span className='mt-1 text-[11px] text-white/40'>
                        {tierKey === 'easy'
                          ? 'Casual'
                          : tierKey === 'medium'
                            ? 'Standard'
                            : 'Expert'}
                      </span>
                    </button>
                  )
                },
              )}
            </div>
            <p className='mt-2.5 text-xs leading-relaxed text-white/50'>
              {DIFFICULTY_TIERS[selectedDifficulty].description}
            </p>
          </div>

          {/* Time Control Selection */}
          <div>
            <label className='mb-2.5 flex items-center justify-between text-xs font-semibold tracking-wider text-white/60 uppercase'>
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

          {/* Piece Color Selection */}
          <div>
            <label className='mb-2.5 block text-xs font-semibold tracking-wider text-white/60 uppercase'>
              Choose Your Side
            </label>
            <div className='grid grid-cols-3 gap-2.5'>
              <button
                type='button'
                onClick={() => setSelectedColor('white')}
                className={`flex flex-col items-center justify-center rounded-xl border py-3.5 transition-all ${
                  selectedColor === 'white'
                    ? 'border-teal-500 bg-teal-500/15 font-semibold text-white'
                    : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                }`}>
                <div className='mb-1 flex h-6 w-6 items-center justify-center rounded-full bg-white font-serif font-bold text-black shadow-sm'>
                  ♔
                </div>
                <span className='text-xs'>White (1st)</span>
              </button>

              <button
                type='button'
                onClick={() => setSelectedColor('random')}
                className={`flex flex-col items-center justify-center rounded-xl border py-3.5 transition-all ${
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
                className={`flex flex-col items-center justify-center rounded-xl border py-3.5 transition-all ${
                  selectedColor === 'black'
                    ? 'border-teal-500 bg-teal-500/15 font-semibold text-white'
                    : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                }`}>
                <div className='mb-1 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-neutral-900 font-serif font-bold text-white shadow-sm'>
                  ♚
                </div>
                <span className='text-xs'>Black (2nd)</span>
              </button>
            </div>
          </div>

          {/* Start Game Action */}
          <Button
            onClick={handleStartGame}
            variant='default'
            className='h-12 w-full rounded-xl text-base font-semibold shadow-lg'>
            <Swords className='mr-2 h-4 w-4' />
            Start Match
          </Button>
        </div>
      ) : (
        /* Active In-Game Screen */
        <div className='space-y-5'>
          {/* Game Status & Winner Banner */}
          <div
            className={`rounded-xl border p-4 transition-all ${
              isGameOver
                ? isPlayerWinner
                  ? 'border-teal-500/50 bg-teal-500/20 text-teal-100 shadow-[0_0_20px_rgba(20,184,166,0.2)]'
                  : isComputerWinner
                    ? 'border-rose-500/50 bg-rose-500/20 text-rose-100'
                    : 'border-amber-500/40 bg-amber-500/15 text-amber-100'
                : status === 'check'
                  ? 'border-rose-500/40 bg-rose-500/10 text-rose-200'
                  : isBotThinking
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
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
                        : isComputerWinner
                          ? 'bg-rose-500/30 text-rose-200'
                          : 'bg-amber-500/30 text-amber-200'
                      : isPlayerTurn
                        ? 'bg-teal-500/20 text-teal-300'
                        : 'bg-white/10 text-white/70'
                  }`}>
                  {isGameOver ? (
                    isPlayerWinner ? (
                      <Trophy className='h-5 w-5 text-teal-300' />
                    ) : isComputerWinner ? (
                      <Frown className='h-5 w-5 text-rose-300' />
                    ) : (
                      <Award className='h-5 w-5 text-amber-300' />
                    )
                  ) : isPlayerTurn ? (
                    <User className='h-4 w-4' />
                  ) : (
                    <Bot className='h-4 w-4' />
                  )}
                </div>
                <div>
                  <div className='text-sm font-bold'>
                    {isGameOver
                      ? isPlayerWinner
                        ? 'Victory!'
                        : isComputerWinner
                          ? 'Defeat'
                          : 'Match Drawn'
                      : status === 'check'
                        ? 'Check!'
                        : isBotThinking
                          ? 'Computer is thinking...'
                          : isPlayerTurn
                            ? 'Your Turn'
                            : "Computer's Turn"}
                  </div>
                  <div className='mt-0.5 text-xs leading-tight opacity-80'>
                    {isGameOver
                      ? isPlayerWinner
                        ? isResignation
                          ? 'Opponent resigned the match.'
                          : isTimeout
                            ? 'Opponent ran out of time!'
                            : 'You won by checkmate!'
                        : isComputerWinner
                          ? isResignation
                            ? 'You resigned the game.'
                            : isTimeout
                              ? 'You ran out of time.'
                              : 'Computer won by checkmate.'
                          : 'Stalemate — No legal moves remaining.'
                      : isPlayerTurn
                        ? moveHistory.length === 0
                          ? `You play as ${capitalize(playerColor)}. Move a piece to begin.`
                          : `Your move as ${capitalize(playerColor)}`
                        : 'Waiting for computer to respond'}
                  </div>
                </div>
              </div>

              {!isGameOver && isBotThinking && (
                <div className='flex animate-pulse items-center gap-1.5 text-xs text-amber-300'>
                  <span className='h-2 w-2 animate-ping rounded-full bg-amber-400' />
                  <span>Calculating</span>
                </div>
              )}
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
              <Button
                onClick={handleStartGame}
                variant='default'
                className='h-11 rounded-xl text-sm font-semibold shadow-md'>
                <RotateCcw className='mr-1.5 h-4 w-4' />
                New Match
              </Button>
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
                Resign Game
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
