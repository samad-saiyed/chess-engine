'use client'

import type { Color, PieceType } from '@/chess/types'
import { formatTime } from '@/chess/timer'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { useChessStore } from '@/store/useChessStore'
import Image from 'next/image'

interface PlayerBarProps {
  name: string
  color: Color
  capturedPieces: PieceType[]
  materialAdvantage: number
  isActive: boolean
  isThinking?: boolean
  timeMs?: number | null
}

export function PlayerBar({
  name,
  color,
  capturedPieces,
  materialAdvantage,
  isActive,
  isThinking,
  timeMs,
}: PlayerBarProps) {
  const timeControl = useChessStore((state) => state.timeControl)

  // Captured pieces are the OPPONENT's pieces that this player took
  const capturedColor: Color = color === 'white' ? 'black' : 'white'

  // Sort captured pieces: pawns -> knights -> bishops -> rooks -> queens
  const pieceOrder: PieceType[] = ['p', 'n', 'b', 'r', 'q']
  const sortedCaptures = [...capturedPieces].sort(
    (a, b) => pieceOrder.indexOf(a) - pieceOrder.indexOf(b),
  )

  const hasClock =
    typeof timeMs === 'number' &&
    timeMs >= 0 &&
    Boolean(timeControl && timeControl.initialSeconds > 0)
  const isLowTime = hasClock && timeMs < 20000

  return (
    <div
      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 transition-all ${
        isActive
          ? 'border border-teal-500/30 bg-white/8 shadow-sm'
          : 'border border-transparent bg-transparent opacity-85'
      }`}>
      {/* Left: Avatar & Name */}
      <div className='flex items-center gap-3'>
        <div className='relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-white/5 shadow-inner'>
          <PlayerAvatar name={name} size={36} />
        </div>

        <div className='flex items-center gap-2'>
          <span className='text-sm font-semibold text-white'>{name}</span>
          {isActive && (
            <span
              className='h-2 w-2 animate-pulse rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)]'
              title='Active turn'
            />
          )}
          {isThinking && (
            <span className='animate-pulse text-[11px] font-medium text-amber-300'>
              Thinking...
            </span>
          )}
        </div>
      </div>

      {/* Right: Captured Pieces, Material Score & Clock */}
      <div className='flex items-center gap-3'>
        {sortedCaptures.length > 0 && (
          <div className='flex items-center -space-x-1.5 overflow-hidden'>
            {sortedCaptures.map((type, idx) => (
              <div
                key={`${type}-${idx}`}
                className='relative h-5 w-5 drop-shadow-xs transition-transform hover:z-10 hover:scale-125'>
                <Image
                  src={`/pieces/${capturedColor.at(0)}${type.toUpperCase()}.svg`}
                  alt={`${capturedColor} ${type}`}
                  width={20}
                  height={20}
                  className='h-full w-full object-contain'
                />
              </div>
            ))}
          </div>
        )}

        {materialAdvantage > 0 && (
          <span className='rounded-md border border-white/10 bg-white/10 px-1.5 py-0.5 text-xs font-bold text-white/90 shadow-xs'>
            +{materialAdvantage}
          </span>
        )}

        {/* Digital Chess Clock Display */}
        {hasClock && (
          <div
            className={`flex items-center justify-center rounded-lg px-2.5 py-1 font-mono text-sm font-bold tracking-wider shadow-sm transition-colors ${
              isLowTime
                ? 'animate-pulse border border-rose-500/40 bg-rose-950/60 text-rose-300'
                : isActive
                  ? 'border border-teal-500/40 bg-teal-950/60 text-teal-200'
                  : 'border border-white/10 bg-black/40 text-neutral-300'
            }`}>
            {formatTime(timeMs)}
          </div>
        )}
      </div>
    </div>
  )
}
