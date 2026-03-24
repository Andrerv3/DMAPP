// backend/src/agents/memoryCompressor.js
// MemoryCompressorAgent — async, non-blocking history compression
// Role: compress recent_turns into history_summary every N turns
// Input: sessionId
// Output: void (writes to DB via GameStateAgent)
// Constraints: runs async after response sent, single AI call, fail silently

import { callAI } from '../config/ai.js'
import { GameStateAgent } from './gameState.js'
import { PromptBuilder } from './promptBuilder.js'

export const MemoryCompressor = {
  /**
   * Fire-and-forget. Call after sending response to client.
   * @param {string} sessionId
   */
  runAsync(sessionId) {
    // Non-blocking — do not await
    compress(sessionId).catch((err) =>
      console.warn(`[MemoryCompressor] Failed for session ${sessionId}:`, err.message)
    )
  },
}

async function compress(sessionId) {
  const state = GameStateAgent.load(sessionId)
  if (!state) return

  const turns = state.recent_turns ?? []
  if (turns.length < 5) return // Not enough to compress

  const { systemPrompt, userPrompt } = PromptBuilder.buildCompressionPrompt(turns)
  const summary = await callAI(systemPrompt, userPrompt, 0.3)

  if (!summary?.trim()) return

  // Append new summary to existing
  const combined = [state.history_summary, summary.trim()].filter(Boolean).join(' ')
  GameStateAgent.updateSummary(sessionId, combined)

  console.log(`[MemoryCompressor] Compressed ${turns.length} turns for session ${sessionId}`)
}
