// backend/src/agents/orchestrator.js
// OrchestratorAgent — turn pipeline controller (OPTIMIZED)
// Coordinates all agents. This is the only file API routes call.

import { GameStateAgent } from './gameState.js'
import { RulesEngine } from './rulesEngine.js'
import { PromptBuilder } from './promptBuilder.js'
import { NarrativeAgent } from './narrative.js'
import { ConsistencyAgent } from './consistency.js'
import { MemoryCompressor } from './memoryCompressor.js'
import { AI_TEMPERATURE, COMPRESS_EVERY_N_TURNS } from '../config/constants.js'

export const Orchestrator = {
  async createSession(sessionId, config) {
    const state = GameStateAgent.create(sessionId, config)

    const turnOrder = RulesEngine.calculateTurnOrder(state.party || [state.player])
    state.turnOrder = turnOrder
    state.currentTurnIndex = 0
    state.round = 1
    state.activeCharacterId = turnOrder[0]?.id || state.activeCharacterId

    const prompt = PromptBuilder.build(state, 'BEGIN', null, state.party?.[0] || state.player)
    const temperature = AI_TEMPERATURE[config.game_system] ?? 0.8
    const aiResponse = await NarrativeAgent.call(prompt, temperature)

    const { response } = ConsistencyAgent.validate(aiResponse, state)
    const savedState = GameStateAgent.save(sessionId, { ...state, _last_action: 'BEGIN' }, response, {})

    return { state: savedState, intro: response }
  },

  async processTurn(sessionId, playerAction, characterId = null) {
    const state = GameStateAgent.load(sessionId)
    if (!state) throw new Error(`Session not found: ${sessionId}`)

    const activeCharId = characterId || state.activeCharacterId
    const activeCharacter = state.party?.find(c => c.id === activeCharId) || state.player

    const { delta, resolvedAction, diceResult } = RulesEngine.apply(playerAction, state, activeCharacter)

    const workingState = Object.assign(state, delta, { _last_action: resolvedAction, _activeCharacter: activeCharacter })
    const advancedState = advanceTurn(workingState)

    const prompt = PromptBuilder.build(advancedState, resolvedAction, diceResult ?? null, activeCharacter)
    const temperature = AI_TEMPERATURE[state.game_system] ?? 0.8

    const aiResponse = await NarrativeAgent.call(prompt, temperature)

    const { valid, hardFail, issues, response } = ConsistencyAgent.validate(aiResponse, advancedState)
    if (!valid) console.warn(`[Orchestrator] Consistency issues (turn ${state.turn + 1}):`, issues)

    const savedState = GameStateAgent.save(sessionId, advancedState, response, delta)

    if (savedState.turn % COMPRESS_EVERY_N_TURNS === 0 && savedState.turn > 0) {
      MemoryCompressor.runAsync(sessionId)
    }

    return { state: savedState, response, diceResult: diceResult ?? null }
  },

  async rollInitiative(sessionId) {
    const state = GameStateAgent.load(sessionId)
    if (!state) throw new Error(`Session not found: ${sessionId}`)

    const turnOrder = RulesEngine.calculateTurnOrder(state.party || [state.player])

    state.turnOrder = turnOrder
    state.currentTurnIndex = 0
    state.round = 1
    state.activeCharacterId = turnOrder[0]?.id
    state.mode = 'combat'

    GameStateAgent.save(sessionId, state, {}, {})

    return { state, turnOrder }
  },

  getSession(sessionId) {
    const state = GameStateAgent.load(sessionId)
    if (!state) return null
    const turns = GameStateAgent.getTurns(sessionId, 10)
    return { state, turns }
  },
}

function advanceTurn(state) {
  const party = state.party || [state.player]
  const currentIndex = state.currentTurnIndex || 0
  const nextIndex = currentIndex + 1
  const round = state.round || 1

  if (nextIndex >= party.length) {
    state.currentTurnIndex = 0
    state.round = round + 1
    state.activeCharacterId = party[0]?.id
    state.turn = (state.turn || 0) + 1
    return state
  }

  state.currentTurnIndex = nextIndex
  state.activeCharacterId = party[nextIndex]?.id
  state.turn = (state.turn || 0) + 1
  return state
}
