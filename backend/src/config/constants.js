// backend/src/config/constants.js

export const GAME_SYSTEMS = {
  dnd5e: { label: 'D&D 5e', template: 'dnd5e' },
  pathfinder: { label: 'Pathfinder 2e', template: 'pathfinder' },
  scifi: { label: 'Sci-Fi', template: 'scifi' },
  horror: { label: 'Horror', template: 'horror' },
  cyberpunk: { label: 'Cyberpunk', template: 'cyberpunk' },
  free: { label: 'Free Form', template: 'free' },
}

export const GAME_MODES = ['exploration', 'combat', 'dialogue']

// temperature by game system
export const AI_TEMPERATURE = {
  dnd5e: 0.8,
  pathfinder: 0.75,
  scifi: 0.65,
  horror: 0.9,
  cyberpunk: 0.85,
  free: 0.8,
}

// tone slider 0-100 maps to DM style string injected in prompt
export const TONE_DESCRIPTORS = [
  { max: 20, label: 'heroic and optimistic' },
  { max: 40, label: 'classic epic fantasy' },
  { max: 60, label: 'gritty and realistic' },
  { max: 80, label: 'dark and atmospheric' },
  { max: 100, label: 'brutal and nihilistic' },
]

export const getToneDescriptor = (tone) =>
  TONE_DESCRIPTORS.find((t) => tone <= t.max)?.label ?? 'dark and atmospheric'

export const MAX_NARRATION_WORDS = 200
export const RECENT_TURNS_WINDOW = 5
export const COMPRESS_EVERY_N_TURNS = 10
export const MAX_OPTIONS = 3
export const AI_RETRY_LIMIT = 1
