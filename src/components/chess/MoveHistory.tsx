'use client'

import { getMoveNotation } from '@/chess/notation'
import { useChessStore } from '@/store/useChessStore'

export function MoveHistory() {
  const moveHistory = useChessStore((state) => state.moveHistory)

  const moves = []

  for (let i = 0; i < moveHistory.length; i += 2) {
    moves.push({
      number: i / 2 + 1,
      white: moveHistory[i],
      black: moveHistory[i + 1],
    })
  }

  return (
    <div className='flex h-full max-h-120 flex-col overflow-hidden rounded-lg'>
      <div className='border-b px-4 py-3'>
        <h2 className='text-sm font-semibold'>Move History</h2>
      </div>

      <div className='flex-1 overflow-y-auto'>
        {moves.length === 0 ? (
          <p className='text-muted-foreground px-4 py-6 text-center text-sm'>
            No moves yet
          </p>
        ) : (
          <div className='divide-y'>
            {moves.map((move) => (
              <div
                key={move.number}
                className='grid grid-cols-[40px_1fr_1fr] px-4 py-2 text-sm'>
                <span className='text-muted-foreground'>{move.number}.</span>

                <span>{getMoveNotation(move.white)}</span>

                <span>{move.black ? getMoveNotation(move.black) : ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
