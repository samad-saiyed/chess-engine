'use client'

import { getMaterialSummary } from '@/chess/material'
import { getLegalMoves } from '@/chess/moves'
import type { Color, SquareCoordinate } from '@/chess/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useChessStore } from '@/store/useChessStore'
import { capitalize } from 'lodash'
import { useEffect, useMemo, useState } from 'react'
import { BoardAnnotations, type ArrowAnnotation } from './BoardAnnotations'
import { ChessSquare } from './ChessSquare'
import { GameOverDialog } from './GameOverDialog'
import { PlayerBar } from './PlayerBar'
import { PromotionPicker } from './PromotionPicker'

export function ChessBoard() {
  const board = useChessStore((state) => state.board)
  const turn = useChessStore((state) => state.turn)
  const status = useChessStore((state) => state.status)
  const gameMode = useChessStore((state) => state.gameMode)
  const playerColor = useChessStore((state) => state.playerColor)
  const difficulty = useChessStore((state) => state.difficulty)
  const selectedSquare = useChessStore((state) => state.selectedSquare)
  const setSelectedSquare = useChessStore((state) => state.setSelectedSquare)
  const lastMove = useChessStore((state) => state.lastMove)
  const pendingPromotion = useChessStore((state) => state.pendingPromotion)
  const handleSquareClick = useChessStore((state) => state.handleSquareClick)
  const cancelPromotion = useChessStore((state) => state.cancelPromotion)
  const castlingRights = useChessStore((state) => state.castlingRights)
  const enPassantTarget = useChessStore((state) => state.enPassantTarget)
  const isFlipped = useChessStore((state) => state.isFlipped)
  const isBotThinking = useChessStore((state) => state.isBotThinking)

  // Clock state
  const isClockActive = useChessStore((state) => state.isClockActive)
  const tickClock = useChessStore((state) => state.tickClock)
  const whiteTimeMs = useChessStore((state) => state.whiteTimeMs)
  const blackTimeMs = useChessStore((state) => state.blackTimeMs)

  // Multiplayer player profiles
  const playerName = useChessStore((state) => state.playerName)
  const opponentName = useChessStore((state) => state.opponentName)

  // Clock ticking interval loop
  useEffect(() => {
    if (!isClockActive) return

    const interval = setInterval(() => {
      tickClock(100)
    }, 100)

    return () => clearInterval(interval)
  }, [isClockActive, tickClock])

  // Arrow drawing and right-click annotation state
  const [arrows, setArrows] = useState<ArrowAnnotation[]>([])
  const [highlights, setHighlights] = useState<SquareCoordinate[]>([])
  const [rightClickStart, setRightClickStart] =
    useState<SquareCoordinate | null>(null)

  const validMoves = useMemo(() => {
    if (!selectedSquare) {
      return []
    }

    return getLegalMoves(board, selectedSquare, castlingRights, enPassantTarget)
  }, [board, selectedSquare, castlingRights, enPassantTarget])

  function isValidMove(row: number, col: number) {
    return validMoves.some((move) => move.row === row && move.col === col)
  }

  // Material and captures calculation
  const materialSummary = useMemo(() => getMaterialSummary(board), [board])

  // Top and bottom player information
  const topColor: Color = isFlipped ? 'white' : 'black'
  const bottomColor: Color = isFlipped ? 'black' : 'white'

  let topName: string = capitalize(topColor)
  let bottomName: string = capitalize(bottomColor)

  if (gameMode === 'bot') {
    topName =
      topColor !== playerColor ? `Computer (${capitalize(difficulty)})` : 'You'
    bottomName =
      bottomColor === playerColor
        ? `You (${capitalize(playerColor)})`
        : `Computer (${capitalize(difficulty)})`
  } else if (gameMode === 'friends') {
    topName = topColor === playerColor ? playerName : opponentName
    bottomName = bottomColor === playerColor ? playerName : opponentName
  }

  // Row and col indexing depending on orientation
  const rowIndices = isFlipped
    ? [7, 6, 5, 4, 3, 2, 1, 0]
    : [0, 1, 2, 3, 4, 5, 6, 7]
  const colIndices = isFlipped
    ? [7, 6, 5, 4, 3, 2, 1, 0]
    : [0, 1, 2, 3, 4, 5, 6, 7]

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1']

  const bottomRowIndex = rowIndices[7]
  const leftColIndex = colIndices[0]

  // Right-click annotation handlers
  const handleSquareMouseDown = (
    e: React.MouseEvent,
    row: number,
    col: number,
  ) => {
    if (e.button === 0) {
      // Left click clears arrows
      if (arrows.length > 0 || highlights.length > 0) {
        setArrows([])
        setHighlights([])
      }
    } else if (e.button === 2) {
      // Right click start
      setRightClickStart({ row, col })
    }
  }

  const handleSquareMouseUp = (
    e: React.MouseEvent,
    row: number,
    col: number,
  ) => {
    if (e.button === 2 && rightClickStart) {
      if (rightClickStart.row === row && rightClickStart.col === col) {
        // Toggle highlight
        setHighlights((prev) => {
          const exists = prev.some((sq) => sq.row === row && sq.col === col)
          return exists
            ? prev.filter((sq) => !(sq.row === row && sq.col === col))
            : [...prev, { row, col }]
        })
      } else {
        // Toggle arrow
        setArrows((prev) => {
          const exists = prev.some(
            (a) =>
              a.from.row === rightClickStart.row &&
              a.from.col === rightClickStart.col &&
              a.to.row === row &&
              a.to.col === col,
          )
          return exists
            ? prev.filter(
                (a) =>
                  !(
                    a.from.row === rightClickStart.row &&
                    a.from.col === rightClickStart.col &&
                    a.to.row === row &&
                    a.to.col === col
                  ),
              )
            : [...prev, { from: rightClickStart, to: { row, col } }]
        })
      }
      setRightClickStart(null)
    }
  }

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className='flex w-full max-w-160 flex-col gap-2 select-none'>
      {/* Top Player Bar */}
      <PlayerBar
        name={topName}
        color={topColor}
        capturedPieces={materialSummary[topColor].capturedPieces}
        materialAdvantage={materialSummary[topColor].materialAdvantage}
        isActive={turn === topColor}
        isThinking={
          gameMode === 'bot' && topColor !== playerColor && isBotThinking
        }
        timeMs={topColor === 'white' ? whiteTimeMs : blackTimeMs}
      />

      {/* Chessboard with SVG Overlay */}
      <div className='relative w-full overflow-hidden rounded-lg border border-white/10 shadow-2xl'>
        {/* SVG Arrow Annotations Layer */}
        <BoardAnnotations
          arrows={arrows}
          highlights={highlights}
          isFlipped={isFlipped}
        />

        <div
          className={`grid grid-cols-8 transition-all duration-300 ${
            isBotThinking
              ? 'cursor-wait opacity-95 ring-2 ring-teal-500/40'
              : ''
          }`}>
          {rowIndices.map((rowIndex) =>
            colIndices.map((colIndex) => {
              const piece = board[rowIndex][colIndex]
              const isLight = (rowIndex + colIndex) % 2 === 0
              const isSelected =
                selectedSquare?.row === rowIndex &&
                selectedSquare?.col === colIndex

              const isLastMove =
                lastMove !== null &&
                ((lastMove.from.row === rowIndex &&
                  lastMove.from.col === colIndex) ||
                  (lastMove.to.row === rowIndex &&
                    lastMove.to.col === colIndex))

              const isInCheck =
                piece?.type === 'k' &&
                piece.color === turn &&
                (status === 'check' || status === 'checkmate')

              const canDrag = Boolean(
                piece &&
                piece.color === turn &&
                (gameMode === 'local' ||
                  (turn === playerColor && !isBotThinking)),
              )

              const rankLabel =
                colIndex === leftColIndex ? ranks[rowIndex] : undefined
              const fileLabel =
                rowIndex === bottomRowIndex ? files[colIndex] : undefined

              return (
                <ChessSquare
                  key={`${rowIndex}-${colIndex}`}
                  piece={piece}
                  isLight={isLight}
                  isSelected={isSelected}
                  isValidMove={isValidMove(rowIndex, colIndex)}
                  isLastMove={isLastMove}
                  isInCheck={isInCheck}
                  canDrag={canDrag}
                  rankLabel={rankLabel}
                  fileLabel={fileLabel}
                  onClick={() => {
                    setArrows([])
                    setHighlights([])
                    handleSquareClick(rowIndex, colIndex)
                  }}
                  onMouseDown={(e) =>
                    handleSquareMouseDown(e, rowIndex, colIndex)
                  }
                  onMouseUp={(e) => handleSquareMouseUp(e, rowIndex, colIndex)}
                  onDragStart={() => {
                    setArrows([])
                    setHighlights([])
                    setSelectedSquare({ row: rowIndex, col: colIndex })
                  }}
                  onDrop={() => {
                    if (
                      selectedSquare &&
                      (selectedSquare.row !== rowIndex ||
                        selectedSquare.col !== colIndex)
                    ) {
                      setArrows([])
                      setHighlights([])
                      handleSquareClick(rowIndex, colIndex)
                    }
                  }}
                />
              )
            }),
          )}
        </div>
      </div>

      {/* Bottom Player Bar */}
      <PlayerBar
        name={bottomName}
        color={bottomColor}
        capturedPieces={materialSummary[bottomColor].capturedPieces}
        materialAdvantage={materialSummary[bottomColor].materialAdvantage}
        isActive={turn === bottomColor}
        isThinking={
          gameMode === 'bot' && bottomColor !== playerColor && isBotThinking
        }
        timeMs={bottomColor === 'white' ? whiteTimeMs : blackTimeMs}
      />

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

      <GameOverDialog />
    </div>
  )
}
