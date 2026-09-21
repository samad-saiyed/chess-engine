import type { Piece } from '@/chess/types'
import { ChessPiece } from './ChessPiece'

type ChessSquareProps = {
  piece: Piece | null
  isLight: boolean
  isSelected: boolean
  isValidMove: boolean
  isLastMove?: boolean
  isInCheck?: boolean
  canDrag?: boolean
  rankLabel?: string
  fileLabel?: string
  onClick: () => void
  onMouseDown?: (e: React.MouseEvent) => void
  onMouseUp?: (e: React.MouseEvent) => void
  onDragStart?: () => void
  onDrop?: () => void
}

export function ChessSquare({
  piece,
  isLight,
  isSelected,
  isValidMove,
  isLastMove,
  isInCheck,
  canDrag,
  rankLabel,
  fileLabel,
  onClick,
  onMouseDown,
  onMouseUp,
  onDragStart,
  onDrop,
}: ChessSquareProps) {
  const baseBg = isLight ? 'bg-stone-200' : 'bg-emerald-800'

  return (
    <div
      role='button'
      tabIndex={0}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
      }}
      onDrop={(e) => {
        e.preventDefault()
        onDrop?.()
      }}
      className={`relative flex aspect-square items-center justify-center transition-all select-none focus:outline-none ${baseBg} ${
        isValidMove ? 'cursor-pointer' : 'cursor-default'
      } ${isSelected ? 'z-10 ring-4 ring-yellow-400 ring-inset' : ''} ${
        isInCheck
          ? 'z-10 animate-pulse bg-rose-500/40 ring-4 ring-rose-500 ring-inset'
          : ''
      } ${
        isLastMove && !isSelected && !isInCheck
          ? 'after:absolute after:inset-0 after:bg-yellow-400/15'
          : ''
      }`}>
      {/* Rank coordinate label (top-left) */}
      {rankLabel && (
        <span
          className={`pointer-events-none absolute top-0.5 left-1 text-[10px] leading-none font-bold select-none ${
            isLight ? 'text-emerald-800' : 'text-stone-200'
          }`}>
          {rankLabel}
        </span>
      )}

      {/* File coordinate label (bottom-right) */}
      {fileLabel && (
        <span
          className={`pointer-events-none absolute right-1 bottom-0.5 text-[10px] leading-none font-bold select-none ${
            isLight ? 'text-emerald-800' : 'text-stone-200'
          }`}>
          {fileLabel}
        </span>
      )}

      {/* Legal destination move dot for empty squares */}
      {isValidMove && !piece && (
        <span className='pointer-events-none z-10 h-3.5 w-3.5 rounded-full bg-black/25' />
      )}

      {/* Legal capture target indicator for enemy pieces */}
      {isValidMove && piece && (
        <span className='pointer-events-none absolute inset-0 z-10 ring-4 ring-rose-500/70 ring-inset' />
      )}

      {/* Draggable Piece */}
      {piece && (
        <div
          draggable={canDrag}
          onDragStart={(e) => {
            if (!canDrag) {
              e.preventDefault()
              return
            }
            e.dataTransfer.setData('text/plain', 'chess-piece')
            e.dataTransfer.effectAllowed = 'move'
            onDragStart?.()
          }}
          className={`relative z-10 flex h-[90%] max-h-20 w-[90%] max-w-20 items-center justify-center ${
            canDrag
              ? 'cursor-grab transition-transform hover:scale-105 active:cursor-grabbing'
              : 'cursor-default'
          }`}>
          <ChessPiece piece={piece} />
        </div>
      )}
    </div>
  )
}
