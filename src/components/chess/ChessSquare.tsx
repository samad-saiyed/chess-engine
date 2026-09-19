import type { Piece } from '@/chess/types'
import { ChessPiece } from './ChessPiece'

type ChessSquareProps = {
  piece: Piece | null
  isLight: boolean
  isSelected: boolean
  isValidMove: boolean
  onClick: () => void
}

export function ChessSquare({
  piece,
  isLight,
  isSelected,
  isValidMove,
  onClick,
}: ChessSquareProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={`relative flex aspect-square items-center justify-center ${isLight ? 'bg-stone-200' : 'bg-emerald-800'} ${isSelected ? 'ring-4 ring-yellow-400 ring-inset' : ''} `}>
      {isValidMove && !piece && (
        <span className='absolute h-3 w-3 rounded-full bg-black/30' />
      )}

      {isValidMove && piece && (
        <span className='absolute inset-0 ring-4 ring-red-400/60 ring-inset' />
      )}

      {piece && <ChessPiece piece={piece} />}
    </button>
  )
}
