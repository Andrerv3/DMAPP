// backend/src/agents/orchestrator.js
// OrchestratorAgent — turn pipeline controller
// Coordinates all agents. This is the only file API routes call.

import { GameStateAgent } from './gameState.js'
import { RulesEngine } from './rulesEngine.js'
import { PromptBuilder } from './promptBuilder.js'
import { NarrativeAgent } from './narrative.js'
import { ConsistencyAgent } from './consistency.js'
import { MemoryCompressor } from './memoryCompressor.js'
import { AI_TEMPERATURE, COMPRESS_EVERY_N_TURNS } from '../config/constants.js'

export const Orchestrator = {
  /**
   * Create a new session with initial world/character config.
   * @param {string} sessionId
   * @param {object} config - { game_system, tone, world, character }
   * @returns {{ state: object, intro: object }}
   */
  async createSession(sessionId, config) {
    const state = GameStateAgent.create(sessionId, config)

    // Calculate turn order based on party DEX
    const turnOrder = RulesEngine.calculateTurnOrder(state.party || [state.player])
    
    // Set initial turn state
    state.turnOrder = turnOrder
    state.currentTurnIndex = 0
    state.round = 1
    state.activeCharacterId = turnOrder[0]?.id || state.activeCharacterId

    // Generate intro narration
    const prompt = PromptBuilder.build(state, 'BEGIN', null, state.party?.[0] || state.player)
    const temperature = AI_TEMPERATURE[config.game_system] ?? 0.8
    const aiResponse = await NarrativeAgent.call(prompt, temperature)

    const { response } = ConsistencyAgent.validate(aiResponse, state)
    const savedState = GameStateAgent.save(sessionId, { ...state, _last_action: 'BEGIN' }, response, {})

    return { state: savedState, intro: response }
  },

  /**
   * Process a player turn through the full pipeline.
   * @param {string} sessionId
   * @param {string} playerAction
   * @param {string|null} characterId - ID of the active character (for party system)
   * @returns {{ state: object, response: object, diceResult: object|null }}
   */
  async processTurn(sessionId, playerAction, characterId = null) {
    // 1. Load state
    const state = GameStateAgent.load(sessionId)
    if (!state) throw new Error(`Session not found: ${sessionId}`)

    // Get the active character for this turn
    const activeCharId = characterId || state.activeCharacterId
    const activeCharacter = state.party?.find(c => c.id === activeCharId) || state.player

    // 2. Apply game rules (pure JS, no AI)
    const { delta, resolvedAction, diceResult } = RulesEngine.apply(playerAction, state, activeCharacter)

    // 3. Update working state
    let workingState = { 
      ...state, 
      ...delta, 
      _last_action: resolvedAction,
      _activeCharacter: activeCharacter 
    }

    // 4. Handle turn advancement for party
    workingState = advanceTurn(workingState)

    // 5. Build prompt
    const prompt = PromptBuilder.build(workingState, resolvedAction, diceResult ?? null, activeCharacter)
    const temperature = AI_TEMPERATURE[state.game_system] ?? 0.8

    // 6. AI call
    const aiResponse = await NarrativeAgent.call(prompt, temperature)

    // 7. Validate
    const { valid, hardFail, issues, response } = ConsistencyAgent.validate(aiResponse, workingState)
    if (!valid) console.warn(`[Orchestrator] Consistency issues (turn ${state.turn + 1}):`, issues)

    // 8. Persist
    const savedState = GameStateAgent.save(sessionId, workingState, response, delta)

    // 9. Async memory compression (non-blocking)
    if (savedState.turn % COMPRESS_EVERY_N_TURNS === 0 && savedState.turn > 0) {
      MemoryCompressor.runAsync(sessionId)
    }

    return { state: savedState, response, diceResult: diceResult ?? null }
  },

  /**
   * Process an initiative roll for combat start.
   */
  async rollInitiative(sessionId) {
    const state = GameStateAgent.load(sessionId)
    if (!state) throw new Error(`Session not found: ${sessionId}`)

    // Recalculate turn order with new initiative rolls
    const turnOrder = RulesEngine.calculateTurnOrder(state.party || [state.player])

    const delta = {
      turnOrder,
      currentTurnIndex: 0,
      round: 1,
      activeCharacterId: turnOrder[0]?.id,
      mode: 'combat'
    }

    const workingState = { ...state, ...delta }

    // Save updated turn order
    GameStateAgent.save(sessionId, workingState, {}, {})

    return { 
      state: workingState, 
      turnOrder 
    }
  },

  /**
   * Get current session state + recent turns.
   */
  getSession(sessionId) {
    const state = GameStateAgent.load(sessionId)
    if (!state) return null
    const turns = GameStateAgent.getTurns(sessionId, 10)
    return { state, turns }
  },
}

/**
 * Advance to the next character's turn.
 */
function advanceTurn(state) {
  const party = state.party || [state.player]
  const currentIndex = state.currentTurnIndex || 0
  const nextIndex = currentIndex + 1
  const round = state.round || 1

  // Check if we need to start a new round
  if (nextIndex >= party.length) {
    // New round - recalculate initiative (optional: could keep same order)
    return {
      ...state,
      currentTurnIndex: 0,
      round: round + 1,
      activeCharacterId: party[0]?.id,
      turn: (state.turn || 0) + 1
    }
  }

  // Next character in same round
  return {
    ...state,
    currentTurnIndex: nextIndex,
    activeCharacterId: party[nextIndex]?.id,
    turn: (state.turn || 0) + 1
  }
}
