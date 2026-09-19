'use client'

import { getLegalMoves } from '@/chess/moves'
import { useChessStore } from '@/store/useChessStore'
import { useMemo } from 'react'
import { ChessSquare } from './ChessSquare'

export function ChessBoard() {
  const board = useChessStore((state) => state.board)
  const selectedSquare = useChessStore((state) => state.selectedSquare)
  const handleSquareClick = useChessStore((state) => state.handleSquareClick)
  const castlingRights = useChessStore((state) => state.castlingRights)

  const validMoves = useMemo(() => {
    if (!selectedSquare) {
      return []
    }

    return getLegalMoves(board, selectedSquare, castlingRights)
  }, [board, selectedSquare, castlingRights])

  function isValidMove(row: number, col: number) {
    return validMoves.some((move) => move.row === row && move.col === col)
  }

  return (
    <div className='w-full max-w-160'>
      <div className='grid grid-cols-8 overflow-hidden rounded-lg shadow-xl'>
        {board.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const isLight = (rowIndex + colIndex) % 2 === 0

            const isSelected =
              selectedSquare?.row === rowIndex &&
              selectedSquare?.col === colIndex

            return (
              <ChessSquare
                key={`${rowIndex}-${colIndex}`}
                piece={piece}
                isLight={isLight}
                isSelected={isSelected}
                isValidMove={isValidMove(rowIndex, colIndex)}
                onClick={() => handleSquareClick(rowIndex, colIndex)}
              />
            )
          }),
        )}
      </div>
    </div>
  )
}
