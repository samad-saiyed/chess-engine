import type { Piece } from '@/chess/types'
import Image from 'next/image'

type ChessPieceProps = {
  piece: Piece
}

export function ChessPiece({ piece }: ChessPieceProps) {
  return (
    <Image
      width={55}
      height={55}
      src={`/pieces/${piece.color.toLowerCase().at(0)}${piece.type.toUpperCase()}.svg`}
      alt={`${piece.color} ${piece.type}`}
      loading='eager'
      className='pointer-events-none h-[90%] max-h-20 w-[90%] max-w-20 object-contain select-none'
    />
  )
}
