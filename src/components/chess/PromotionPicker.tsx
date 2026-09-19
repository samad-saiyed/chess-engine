'use client'

import type { PieceType } from '@/chess/types'
import { useChessStore } from '@/store/useChessStore'
import { ChessPiece } from './ChessPiece'

const PROMOTION_PIECES: { type: PieceType; label: string }[] = [
  { type: 'q', label: 'Queen' },
  { type: 'r', label: 'Rook' },
  { type: 'b', label: 'Bishop' },
  { type: 'n', label: 'Knight' },
]

export function PromotionPicker() {
  const turn = useChessStore((state) => state.turn)
  const completePromotion = useChessStore((state) => state.completePromotion)

  return (
    <div className='w-full'>
      <div className='grid w-full grid-cols-2 gap-3 sm:grid-cols-4'>
        {PROMOTION_PIECES.map(({ type, label }) => (
          <button
            key={type}
            type='button'
            onClick={() => completePromotion(type)}
            title={`Promote to ${label}`}
            className='group border-border bg-muted/40 flex w-full min-w-0 flex-col items-center justify-center gap-2 rounded-xl border p-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/60 hover:bg-emerald-500/10 hover:shadow-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none sm:p-3'>
            <div className='flex aspect-square w-full max-w-20 items-center justify-center rounded-lg bg-white p-2 shadow-sm transition-transform duration-200 group-hover:scale-105'>
              <ChessPiece
                piece={{
                  type,
                  color: turn,
                }}
              />
            </div>

            <span className='text-foreground text-sm font-semibold'>
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
