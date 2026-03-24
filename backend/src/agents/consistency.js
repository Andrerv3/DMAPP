// backend/src/agents/consistency.js
// ConsistencyAgent — validates AI output against world state
// Role: detect and flag broken immersion, invalid output, rule violations
// Input: aiResponse, currentState
// Output: { valid: boolean, issues: string[], corrected: object }
// Constraints: no AI call, no DB, pure validation logic

const MODERN_ANACHRONISMS_BY_SYSTEM = {
  dnd5e: /\b(smartphone|internet|computer|AI|robot|nuclear|electricity|gun)\b/i,
  pathfinder: /\b(smartphone|internet|computer|AI|robot|nuclear|electricity)\b/i,
  scifi: /\b(magic spell|wizard|dungeon|tavern)\b/i,
  horror: null,
  cyberpunk: /\b(magic spell|wizard|dungeon|druid)\b/i,
  free: null,
}

const FOURTH_WALL_PATTERNS = /\b(as an AI|I cannot|I'm sorry|language model|ChatGPT|Gemini|Claude|OpenAI)\b/i

export const ConsistencyAgent = {
  /**
   * @param {object} aiResponse
   * @param {object} state
   * @returns {{ valid: boolean, issues: string[], response: object }}
   */
  validate(aiResponse, state) {
    const issues = []
    let response = { ...aiResponse }

    // 1. Options count
    if (!Array.isArray(response.options) || response.options.length !== 3) {
      issues.push('options_count')
      response.options = padOptions(response.options ?? [])
    }

    // 2. Narration length (word count)
    const wordCount = (response.narration ?? '').split(/\s+/).length
    if (wordCount > 250) {
      issues.push('narration_too_long')
      response.narration = truncateToWords(response.narration, 200)
    }

    // 3. 4th wall breaks
    if (FOURTH_WALL_PATTERNS.test(response.narration) || FOURTH_WALL_PATTERNS.test(response.event)) {
      issues.push('fourth_wall_break')
      response.narration = response.narration.replace(FOURTH_WALL_PATTERNS, '...')
    }

    // 4. Anachronisms
    const anachronismPattern = MODERN_ANACHRONISMS_BY_SYSTEM[state.game_system]
    if (anachronismPattern && anachronismPattern.test(response.narration)) {
      issues.push('anachronism')
      // Flag but don't auto-correct — caller decides if retry needed
    }

    // 5. state_delta validity
    if (response.state_delta && typeof response.state_delta !== 'object') {
      issues.push('invalid_state_delta')
      response.state_delta = {}
    }

    // 6. Empty narration
    if (!response.narration?.trim()) {
      issues.push('empty_narration')
      response.narration = 'The world stirs around you, waiting...'
    }

    const hardFail = issues.includes('fourth_wall_break') || issues.includes('empty_narration')

    return {
      valid: issues.length === 0,
      hardFail,
      issues,
      response,
    }
  },
}

function padOptions(options) {
  const defaults = ['Look around carefully', 'Move forward', 'Wait and observe']
  const result = [...options].slice(0, 3)
  while (result.length < 3) result.push(defaults[result.length])
  return result
}

function truncateToWords(text, maxWords) {
  return text.split(/\s+/).slice(0, maxWords).join(' ') + '...'
}
