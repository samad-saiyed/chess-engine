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
      className='pointer-events-none h-[80%] max-h-15 w-[80%] max-w-15 object-contain select-none'
    />
  )
}
