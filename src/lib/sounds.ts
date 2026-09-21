// Sound manager for chess gameplay audio cues

type SoundType =
  | 'move-self'
  | 'move-opponent'
  | 'capture'
  | 'move-check'
  | 'castle'
  | 'promote'
  | 'game-start'
  | 'game-end'
  | 'illegal'
  | 'tenseconds'

const SOUND_FILES: Record<SoundType, string> = {
  'move-self': '/sounds/move-self.mp3',
  'move-opponent': '/sounds/move-opponent.mp3',
  capture: '/sounds/capture.mp3',
  'move-check': '/sounds/move-check.mp3',
  castle: '/sounds/castle.mp3',
  promote: '/sounds/promote.mp3',
  'game-start': '/sounds/game-start.mp3',
  'game-end': '/sounds/game-end.webm',
  illegal: '/sounds/illegal.mp3',
  tenseconds: '/sounds/tenseconds.mp3',
}

// Audio cache to reuse Audio elements
const audioCache: Partial<Record<SoundType, HTMLAudioElement>> = {}
const lastPlayedTimes: Partial<Record<SoundType, number>> = {}

export function playSound(type: SoundType): void {
  if (typeof window === 'undefined') return

  // Prevent multiple duplicate audio calls firing within a short window
  const now = Date.now()
  if (lastPlayedTimes[type] && now - lastPlayedTimes[type]! < 500) {
    return
  }
  lastPlayedTimes[type] = now

  try {
    let audio = audioCache[type]
    if (!audio) {
      audio = new Audio(SOUND_FILES[type])
      audio.preload = 'auto'
      audio.loop = false
      audioCache[type] = audio
    }

    // Reset timestamp to allow replay
    audio.currentTime = 0
    audio.play().catch((err) => {
      console.debug(`Audio play prevented for ${type}:`, err)
    })
  } catch (err) {
    console.debug(`Sound playback error for ${type}:`, err)
  }
}

export function playMoveSound({
  isCapture,
  isCheck,
  isCastle,
  isPromotion,
  isGameEnd,
  isSelf,
}: {
  isCapture?: boolean
  isCheck?: boolean
  isCastle?: boolean
  isPromotion?: boolean
  isGameEnd?: boolean
  isSelf?: boolean
}): void {
  if (isGameEnd) {
    playSound('game-end')
    return
  }
  if (isCheck) {
    playSound('move-check')
    return
  }
  if (isCapture) {
    playSound('capture')
    return
  }
  if (isCastle) {
    playSound('castle')
    return
  }
  if (isPromotion) {
    playSound('promote')
    return
  }
  if (isSelf) {
    playSound('move-self')
  } else {
    playSound('move-opponent')
  }
}
