// backend/src/agents/consistency.js
// ConsistencyAgent — validates AI output (OPTIMIZED)
// Role: detect broken immersion, invalid output, rule violations

const ANACHRONISM_PATTERNS = {
  dnd5e: /smartphone|internet|computer|AI|robot|nuclear|electricity|gun/i,
  pathfinder: /smartphone|internet|computer|AI|robot|nuclear|electricity/i,
  scifi: /magic spell|wizard|dungeon|tavern/i,
  cyberpunk: /magic spell|wizard|dungeon|druid/i,
}

const FOURTH_WALL = /\b(as an AI|I cannot|I'm sorry|language model|ChatGPT|Gemini|Claude|OpenAI)\b/i

export const ConsistencyAgent = {
  validate(aiResponse, state) {
    const issues = []
    const response = { ...aiResponse }

    if (!response.narration?.trim()) {
      response.narration = 'The world stirs around you, waiting...'
      return { valid: false, hardFail: true, issues: ['empty_narration'], response }
    }

    if (!Array.isArray(response.options) || response.options.length !== 3) {
      issues.push('options_count')
      response.options = padOptions(response.options ?? [])
    }

    const wordCount = response.narration.split(/\s+/).length
    if (wordCount > 250) {
      response.narration = response.narration.split(/\s+/).slice(0, 200).join(' ') + '...'
    }

    if (FOURTH_WALL.test(response.narration) || FOURTH_WALL.test(response.event)) {
      response.narration = response.narration.replace(FOURTH_WALL, '...')
      issues.push('fourth_wall_break')
    }

    const anachronismPattern = ANACHRONISM_PATTERNS[state.game_system]
    if (anachronismPattern && anachronismPattern.test(response.narration)) {
      issues.push('anachronism')
    }

    if (response.state_delta && typeof response.state_delta !== 'object') {
      response.state_delta = {}
    }

    const hardFail = issues.includes('fourth_wall_break')

    return { valid: issues.length === 0, hardFail, issues, response }
  },
}

function padOptions(options) {
  const defaults = ['Look around', 'Move forward', 'Wait']
  const result = [...options].slice(0, 3)
  while (result.length < 3) result.push(defaults[result.length])
  return result
}
