'use client'

import type { SquareCoordinate } from '@/chess/types'

export interface ArrowAnnotation {
  from: SquareCoordinate
  to: SquareCoordinate
}

interface BoardAnnotationsProps {
  arrows: ArrowAnnotation[]
  highlights: SquareCoordinate[]
  isFlipped: boolean
}

// 800x800 coordinate space where each square is 100x100
const SQUARE_SIZE = 100
const ARROW_WIDTH = 16
const ARROW_COLOR = '#f59e0b'
const ARROW_OPACITY = 0.85

export function BoardAnnotations({
  arrows,
  highlights,
  isFlipped,
}: BoardAnnotationsProps) {
  function getSquareCenter(square: SquareCoordinate): { x: number; y: number } {
    const displayCol = isFlipped ? 7 - square.col : square.col
    const displayRow = isFlipped ? 7 - square.row : square.row

    return {
      x: displayCol * SQUARE_SIZE + SQUARE_SIZE / 2,
      y: displayRow * SQUARE_SIZE + SQUARE_SIZE / 2,
    }
  }

  function renderStraightArrow(
    start: { x: number; y: number },
    end: { x: number; y: number },
    key: string,
  ) {
    const dx = end.x - start.x
    const dy = end.y - start.y
    const dist = Math.hypot(dx, dy)

    if (dist < 10) return null

    const ux = dx / dist
    const uy = dy / dist

    // Shorten end slightly so marker aligns neatly inside square center
    const targetX = end.x - ux * 22
    const targetY = end.y - uy * 22

    const pathD = `M ${start.x} ${start.y} L ${targetX} ${targetY}`

    return (
      <path
        key={key}
        d={pathD}
        fill='none'
        stroke={ARROW_COLOR}
        strokeWidth={ARROW_WIDTH}
        strokeLinecap='round'
        strokeOpacity={ARROW_OPACITY}
        markerEnd='url(#chess-arrowhead)'
        className='drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]'
      />
    )
  }

  function renderKnightArrow(
    start: { x: number; y: number },
    corner: { x: number; y: number },
    end: { x: number; y: number },
    key: string,
  ) {
    const dx2 = end.x - corner.x
    const dy2 = end.y - corner.y
    const dist2 = Math.hypot(dx2, dy2)
    const ux2 = dx2 / dist2
    const uy2 = dy2 / dist2

    const targetX = end.x - ux2 * 22
    const targetY = end.y - uy2 * 22

    const pathD = `M ${start.x} ${start.y} L ${corner.x} ${corner.y} L ${targetX} ${targetY}`

    return (
      <path
        key={key}
        d={pathD}
        fill='none'
        stroke={ARROW_COLOR}
        strokeWidth={ARROW_WIDTH}
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeOpacity={ARROW_OPACITY}
        markerEnd='url(#chess-arrowhead)'
        className='drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]'
      />
    )
  }

  return (
    <svg
      viewBox='0 0 800 800'
      className='pointer-events-none absolute inset-0 z-20 h-full w-full'>
      <defs>
        <marker
          id='chess-arrowhead'
          viewBox='0 0 10 10'
          refX='5'
          refY='5'
          markerWidth='4.5'
          markerHeight='4.5'
          orient='auto'>
          <path
            d='M 0 1.2 L 9 5 L 0 8.8 L 2.2 5 Z'
            fill={ARROW_COLOR}
            fillOpacity={ARROW_OPACITY}
          />
        </marker>
      </defs>

      {/* Square highlights (clean circular disc with soft amber glow) */}
      {highlights.map((sq, idx) => {
        const center = getSquareCenter(sq)
        const radius = SQUARE_SIZE * 0.44

        return (
          <circle
            key={`highlight-${idx}`}
            cx={center.x}
            cy={center.y}
            r={radius}
            fill='#f59e0b'
            fillOpacity='0.42'
            className='transition-all'
          />
        )
      })}

      {/* Modern Sleek Chess Arrows */}
      {arrows.map((arrow, idx) => {
        const start = getSquareCenter(arrow.from)
        const end = getSquareCenter(arrow.to)

        const dRow = arrow.to.row - arrow.from.row
        const dCol = arrow.to.col - arrow.from.col
        const isKnightMove =
          (Math.abs(dRow) === 2 && Math.abs(dCol) === 1) ||
          (Math.abs(dRow) === 1 && Math.abs(dCol) === 2)

        if (isKnightMove) {
          const cornerSquare =
            Math.abs(dRow) === 2
              ? { row: arrow.to.row, col: arrow.from.col }
              : { row: arrow.from.row, col: arrow.to.col }

          const corner = getSquareCenter(cornerSquare)
          return renderKnightArrow(start, corner, end, `arrow-${idx}`)
        }

        return renderStraightArrow(start, end, `arrow-${idx}`)
      })}
    </svg>
  )
}
