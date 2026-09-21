import type { EngineDifficulty } from './types'

export interface DifficultyTierInfo {
  id: EngineDifficulty
  name: string
  description: string
  depth: number
  badgeColor: string
}

export const DIFFICULTY_TIERS: Record<EngineDifficulty, DifficultyTierInfo> = {
  easy: {
    id: 'easy',
    name: 'Casual',
    description: 'Quick, friendly matches with occasional tactical blunders.',
    depth: 1,
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  medium: {
    id: 'medium',
    name: 'Intermediate',
    description:
      'Solid tactical play, captures open pieces, and protects the king.',
    depth: 3,
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  },
  hard: {
    id: 'hard',
    name: 'Master',
    description:
      'Deep positional evaluation, piece-square optimization, and aggressive tactical calculation.',
    depth: 4,
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  },
}
