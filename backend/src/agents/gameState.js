// backend/src/agents/gameState.js
// GameStateAgent — ONLY agent that reads/writes DB
// Role: persist, load, update session state
// Input: sessionId, state object, delta
// Output: full state object
// Constraints: never calls AI, never modifies logic

import { getDB } from '../config/db.js'
import { RECENT_TURNS_WINDOW } from '../config/constants.js'

export const GameStateAgent = {
  /** Load full state for session. Returns null if not found. */
  load(sessionId) {
    const db = getDB()
    const row = db.prepare('SELECT state, turn, mode FROM game_state WHERE session_id = ?').get(sessionId)
    if (!row) return null
    return { ...JSON.parse(row.state), turn: row.turn, mode: row.mode }
  },

  /** Create initial state for new session */
  create(sessionId, config) {
    const db = getDB()
    const initial = buildInitialState(config)
    db.prepare(`
      INSERT INTO sessions (id, game_system, tone) VALUES (?, ?, ?)
    `).run(sessionId, config.game_system, config.tone ?? 65)
    db.prepare(`
      INSERT INTO game_state (session_id, state, turn, mode) VALUES (?, ?, 0, 'exploration')
    `).run(sessionId, JSON.stringify(initial))
    return initial
  },

  /** Apply delta and persist. Returns updated state. */
  save(sessionId, currentState, aiResponse, delta = {}) {
    const db = getDB()
    const newTurn = (currentState.turn ?? 0) + 1
    const updatedState = mergeState(currentState, delta, aiResponse, newTurn)

    db.prepare(`
      UPDATE game_state SET state = ?, turn = ?, mode = ?, updated_at = CURRENT_TIMESTAMP
      WHERE session_id = ?
    `).run(JSON.stringify(updatedState), newTurn, updatedState.mode, sessionId)

    db.prepare(`
      INSERT INTO turns (session_id, turn_number, player_action, ai_response, state_delta)
      VALUES (?, ?, ?, ?, ?)
    `).run(sessionId, newTurn, currentState._last_action, JSON.stringify(aiResponse), JSON.stringify(delta))

    return updatedState
  },

  /** Update only the history summary (after compression) */
  updateSummary(sessionId, summary) {
    const db = getDB()
    const row = db.prepare('SELECT state FROM game_state WHERE session_id = ?').get(sessionId)
    if (!row) return
    const state = JSON.parse(row.state)
    state.history_summary = summary
    state.recent_turns = state.recent_turns.slice(-RECENT_TURNS_WINDOW)
    db.prepare('UPDATE game_state SET state = ? WHERE session_id = ?')
      .run(JSON.stringify(state), sessionId)
  },

  getTurns(sessionId, limit = 20) {
    return getDB().prepare(`
      SELECT turn_number, player_action, ai_response FROM turns
      WHERE session_id = ? ORDER BY turn_number DESC LIMIT ?
    `).all(sessionId, limit)
  },
}

function buildInitialState(config) {
  // Support both legacy single character and new party system
  const party = config.party || []
  const activeCharacterId = config.activeCharacterId || party[0]?.id || null
  
  // For backward compatibility: create a single player from first party member
  const singlePlayer = party[0] || config.character || {}
  
  // Add initiative to each party member for turn order
  const partyWithInit = party.map((char, index) => ({
    ...char,
    initiative: char.initiative || (10 - index * 2) // Default initiative based on order
  }))
  
  return {
    game_system: config.game_system,
    tone: config.tone ?? 65,
    mode: 'exploration',
    world: config.world ?? { name: '', setting: '', current_location: 'start' },
    // New party system
    party: partyWithInit,
    activeCharacterId: activeCharacterId,
    // Turn order
    turnOrder: partyWithInit,
    currentTurnIndex: 0,
    round: 1,
    // Legacy single player (kept for backward compatibility)
    player: singlePlayer,
    npcs: [],
    enemies: [],
    flags: {},
    turn: 0,
    history_summary: '',
    recent_turns: [],
  }
}

function mergeState(current, delta, aiResponse, newTurn) {
  const updated = { ...current, ...delta, turn: newTurn }

  // Append turn to recent_turns
  updated.recent_turns = [
    ...(current.recent_turns ?? []),
    {
      turn: newTurn,
      action: current._last_action,
      narration: aiResponse.narration,
      event: aiResponse.event,
    },
  ]

  // Remove internal tracking key
  delete updated._last_action
  return updated
}
