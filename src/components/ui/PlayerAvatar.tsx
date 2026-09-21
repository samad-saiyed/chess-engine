'use client'

import { useIsMounted } from '@/hooks/useIsMounted'
import { Blobatar } from '@blobatar/react'

interface PlayerAvatarProps {
  name: string
  size?: number
  className?: string
}

export function PlayerAvatar({
  name,
  size = 36,
  className = '',
}: PlayerAvatarProps) {
  const mounted = useIsMounted()

  if (!mounted) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl bg-white/5 ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }

  return <Blobatar name={name || 'Player'} size={size} />
}
