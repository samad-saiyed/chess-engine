'use client'

import React, { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

interface QRCodeDisplayProps {
  value: string
  size?: number
  className?: string
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 240,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!canvasRef.current || !value) return

    QRCode.toCanvas(
      canvasRef.current,
      value,
      {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'L', // Low redundancy = larger, clearer square modules that scan instantly
      },
      (error) => {
        if (error) {
          console.error('Failed to generate QR code', error)
        }
      },
    )
  }, [value, size])

  return (
    <div
      className={`inline-flex flex-col items-center justify-center rounded-2xl bg-white p-3.5 shadow-2xl shadow-black/40 ${className}`}>
      <canvas
        ref={canvasRef}
        className='rounded-lg [image-rendering:pixelated]'
      />
    </div>
  )
}
