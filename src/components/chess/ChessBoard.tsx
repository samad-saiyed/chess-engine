'use client'

import { getLegalMoves } from '@/chess/moves'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { useChessStore } from '@/store/useChessStore'
import { useMemo } from 'react'
import { ChessSquare } from './ChessSquare'
import { PromotionPicker } from './PromotionPicker'

export function ChessBoard() {
  const board = useChessStore((state) => state.board)
  const selectedSquare = useChessStore((state) => state.selectedSquare)
  const pendingPromotion = useChessStore((state) => state.pendingPromotion)
  const handleSquareClick = useChessStore((state) => state.handleSquareClick)
  const cancelPromotion = useChessStore((state) => state.cancelPromotion)
  const castlingRights = useChessStore((state) => state.castlingRights)
  const enPassantTarget = useChessStore((state) => state.enPassantTarget)

  console.log('pendingPromotion:', pendingPromotion)

  const validMoves = useMemo(() => {
    if (!selectedSquare) {
      return []
    }

    return getLegalMoves(board, selectedSquare, castlingRights, enPassantTarget)
  }, [board, selectedSquare, castlingRights, enPassantTarget])

  function isValidMove(row: number, col: number) {
    return validMoves.some((move) => move.row === row && move.col === col)
  }

  return (
    <div className='w-full max-w-160'>
      <div className='grid grid-cols-8 rounded-lg shadow-2xl'>
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

      <Dialog
        open={pendingPromotion !== null}
        onOpenChange={(open) => {
          if (!open) {
            cancelPromotion()
          }
        }}>
        <DialogContent
          showCloseButton={false}
          className='w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-2xl p-5 sm:p-6'>
          <DialogHeader className='mb-4'>
            <DialogTitle className='text-center text-xl font-semibold'>
              Choose Promotion
            </DialogTitle>
          </DialogHeader>

          <PromotionPicker />
        </DialogContent>
      </Dialog>
    </div>
  )
}
