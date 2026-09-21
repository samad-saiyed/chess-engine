const PROFILE_NAME_KEY = 'chess_engine_player_name'

export function getStoredPlayerName(): string {
  if (typeof window === 'undefined') return 'Player'

  try {
    const stored = localStorage.getItem(PROFILE_NAME_KEY)
    if (stored && stored.trim()) {
      return stored.trim()
    }

    // Generate friendly default username
    const randomId = Math.floor(100 + Math.random() * 900)
    const defaultName = `Player_${randomId}`
    localStorage.setItem(PROFILE_NAME_KEY, defaultName)
    return defaultName
  } catch (err) {
    console.warn('Failed to read player name from localStorage:', err)
    return 'Player'
  }
}

export function savePlayerName(name: string): void {
  if (typeof window === 'undefined') return

  try {
    const trimmed = name.trim() || 'Player'
    localStorage.setItem(PROFILE_NAME_KEY, trimmed)
  } catch (err) {
    console.warn('Failed to save player name to localStorage:', err)
  }
}
