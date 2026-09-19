import { Move } from './types'

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

function squareToNotation(row: number, col: number): string {
  return `${FILES[col]}${8 - row}`
}

export function getMoveNotation(move: Move): string {
  const { piece, from, to, capturedPiece, type, promotionPiece } = move

  // Castling
  if (type === 'castle') {
    if (to.col > from.col) {
      return 'O-O'
    }

    return 'O-O-O'
  }

  const destination = squareToNotation(to.row, to.col)
  const isCapture = capturedPiece !== null

  // Pawn
  if (piece.type === 'p') {
    let notation = ''

    if (isCapture) {
      notation += FILES[from.col]
      notation += 'x'
    }

    notation += destination

    if (type === 'promotion' && promotionPiece) {
      notation += `=${promotionPiece.toUpperCase()}`
    }

    return notation
  }

  // Pieces
  const pieceSymbols: Record<string, string> = {
    k: 'K',
    q: 'Q',
    r: 'R',
    b: 'B',
    n: 'N',
  }

  let notation = pieceSymbols[piece.type]

  if (isCapture) {
    notation += 'x'
  }

  notation += destination

  return notation
}
