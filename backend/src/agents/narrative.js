// backend/src/agents/narrative.js
// NarrativeAgent — single AI call for narration + options
// Role: call AI with built prompt, return parsed response
// Input: { systemPrompt, userPrompt }, temperature
// Output: { narration, event, options, state_delta }
// Constraints: max 1 retry, returns fallback on double failure

import { callAI } from '../config/ai.js'
import { MAX_OPTIONS } from '../config/constants.js'

const FALLBACK_RESPONSE = {
  narration: 'A heavy silence falls over the chamber. The world holds its breath, waiting for your next move.',
  event: 'The scene remains tense and unresolved.',
  options: ['Look around carefully', 'Move forward cautiously', 'Wait and listen'],
  state_delta: {},
}

export const NarrativeAgent = {
  /**
   * @param {{ systemPrompt: string, userPrompt: string }} prompt
   * @param {number} temperature
   * @returns {Promise<{ narration: string, event: string, options: string[], state_delta: object }>}
   */
  async call(prompt, temperature = 0.8) {
    let raw = ''
    try {
      raw = await callAI(prompt.systemPrompt, prompt.userPrompt, temperature)
      return parseResponse(raw)
    } catch (err) {
      console.warn('[NarrativeAgent] First attempt failed:', err.message)

      // Retry once with explicit correction
      try {
        const retryPrompt = {
          ...prompt,
          userPrompt: prompt.userPrompt + '\n\nCRITICAL: Respond ONLY with valid JSON, nothing else.',
        }
        raw = await callAI(retryPrompt.systemPrompt, retryPrompt.userPrompt, temperature)
        return parseResponse(raw)
      } catch (retryErr) {
        console.error('[NarrativeAgent] Retry failed:', retryErr.message)
        return FALLBACK_RESPONSE
      }
    }
  },
}

function parseResponse(raw) {
  // Strip markdown code fences if present
  const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim()
  const parsed = JSON.parse(cleaned)

  // Validate required fields
  if (!parsed.narration || !parsed.event || !Array.isArray(parsed.options)) {
    throw new Error('Missing required fields in AI response')
  }

  // Enforce option count
  if (parsed.options.length !== MAX_OPTIONS) {
    parsed.options = parsed.options.slice(0, MAX_OPTIONS)
    while (parsed.options.length < MAX_OPTIONS) {
      parsed.options.push('Wait and observe')
    }
  }

  return {
    narration: parsed.narration,
    event: parsed.event,
    options: parsed.options,
    state_delta: parsed.state_delta ?? {},
  }
}
