export interface TimeControl {
  id: string
  label: string
  category: 'Bullet' | 'Blitz' | 'Rapid' | 'Classical' | 'Unlimited'
  initialSeconds: number
  incrementSeconds: number
}

export const TIME_CONTROLS: TimeControl[] = [
  {
    id: 'none',
    label: 'Unlimited',
    category: 'Unlimited',
    initialSeconds: 0,
    incrementSeconds: 0,
  },
  {
    id: '1+0',
    label: '1 min',
    category: 'Bullet',
    initialSeconds: 60,
    incrementSeconds: 0,
  },
  {
    id: '3+0',
    label: '3 min',
    category: 'Blitz',
    initialSeconds: 180,
    incrementSeconds: 0,
  },
  {
    id: '3+2',
    label: '3 | 2',
    category: 'Blitz',
    initialSeconds: 180,
    incrementSeconds: 2,
  },
  {
    id: '5+0',
    label: '5 min',
    category: 'Blitz',
    initialSeconds: 300,
    incrementSeconds: 0,
  },
  {
    id: '10+0',
    label: '10 min',
    category: 'Rapid',
    initialSeconds: 600,
    incrementSeconds: 0,
  },
  {
    id: '15+10',
    label: '15 | 10',
    category: 'Classical',
    initialSeconds: 900,
    incrementSeconds: 10,
  },
]

export function formatTime(ms: number): string {
  if (ms <= 0) return '00:00'

  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  // Show tenths of a second when under 10 seconds for high-intensity bullet/blitz
  if (totalSeconds < 10) {
    const tenths = Math.floor((ms % 1000) / 100)
    return `00:0${seconds}.${tenths}`
  }

  const mm = minutes.toString().padStart(2, '0')
  const ss = seconds.toString().padStart(2, '0')
  return `${mm}:${ss}`
}
