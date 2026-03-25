// backend/src/agents/promptBuilder.js
// PromptBuilderAgent — assembles prompt from state parts (OPTIMIZED)
// Role: build system + user prompt from session state
// Input: state object, playerAction, diceResult
// Output: { systemPrompt, userPrompt }
// Constraints: no AI call, no DB, pure string assembly, token-minimal

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { getToneDescriptor, RECENT_TURNS_WINDOW } from '../config/constants.js'
import { RPGDataService } from '../data/rpgData.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROMPT_DIR = join(__dirname, '../../../ai-engine/prompts')

const TEMPLATE_CACHE = new Map()
const RPG_CONTEXT_CACHE = new Map()

function loadTemplate(name) {
  if (TEMPLATE_CACHE.has(name)) return TEMPLATE_CACHE.get(name)
  try {
    const template = readFileSync(join(PROMPT_DIR, `templates/${name}.txt`), 'utf8')
    TEMPLATE_CACHE.set(name, template)
    return template
  } catch {
    const fallback = readFileSync(join(PROMPT_DIR, 'templates/free.txt'), 'utf8')
    TEMPLATE_CACHE.set(name, fallback)
    return fallback
  }
}

const BASE_SYSTEM = readFileSync(join(PROMPT_DIR, 'system.base.txt'), 'utf8')

function getRPGContext(gameSystem) {
  if (gameSystem !== 'dnd5e') return null
  if (RPG_CONTEXT_CACHE.has('dnd5e')) return RPG_CONTEXT_CACHE.get('dnd5e')
  const context = RPGDataService.getAIContext(gameSystem)
  RPG_CONTEXT_CACHE.set('dnd5e', context)
  return context
}

export const PromptBuilder = {
  /**
   * @param {object} state - full game state
   * @param {string} playerAction - raw player input
   * @param {object|null} diceResult - result from RulesEngine
   * @param {object|null} activeCharacter - the character taking this turn (for party)
   * @returns {{ systemPrompt: string, userPrompt: string }}
   */
  build(state, playerAction, diceResult = null, activeCharacter = null) {
    const template = loadTemplate(state.game_system ?? 'free')
    const toneDesc = getToneDescriptor(state.tone ?? 65)

    // Use active character for context, fallback to single player
    const character = activeCharacter || state.player

    // Get RPG context data for D&D 5e
    const rpgContext = getRPGContext(state.game_system)

    const systemPrompt = [
      BASE_SYSTEM,
      `SYSTEM: ${template}`,
      `TONE: ${toneDesc}`,
      `MODE: ${state.mode ?? 'exploration'}`,
      buildWorldContext(state),
      buildCharacterContext(state, character),
      rpgContext ? buildRPGContext(rpgContext, character) : null,
    ].filter(Boolean).join('\n\n')

    const userPrompt = [
      buildHistory(state),
      buildCurrentState(state, character),
      diceResult ? buildDiceContext(diceResult) : null,
      buildInstruction(playerAction),
    ].filter(Boolean).join('\n\n')

    return { systemPrompt, userPrompt }
  },

  buildCompressionPrompt(turns) {
    return {
      systemPrompt: 'You are a concise story summarizer. Output only the summary, no preamble.',
      userPrompt: `Summarize these RPG events in exactly 3 sentences. Focus on: key decisions, consequences, world changes.\n\n${turns.map((t) => `Turn ${t.turn}: ${t.action} → ${t.event}`).join('\n')}`,
    }
  },
}

// --- Section builders ---

function buildWorldContext(state) {
  const w = state.world ?? {}
  return `WORLD: ${w.name ?? 'Unknown'} | Setting: ${w.setting ?? 'fantasy'} | Location: ${w.current_location ?? 'unknown'}`
}

function buildCharacterContext(state, activeCharacter = null) {
  const p = activeCharacter || state.player || {}
  
  const party = state.party
  const partyInfo = (party?.length > 0) 
    ? `PARTY: [${party.map(c => `${c.name || '?'}(${c.hp ?? '?'}/${c.max_hp ?? '?'})`).join(', ')}]`
    : ''
  
  const turnOrderInfo = state.turnOrder?.length 
    ? `ORDER: ${state.turnOrder.map((c, i) => `${i + 1}.${c.name}`).join(', ')}`
    : ''
  
  const enemies = state.enemies?.length 
    ? `ENEMIES: ${state.enemies.map(e => `${e.name}(hp:${e.hp})`).join(', ')}`
    : ''
  
  const statsStr = p.stats 
    ? Object.entries(p.stats).map(([k, v]) => `${k}:${v}`).join(', ')
    : ''
  
  const classDetails = [
    `CHAR: ${p.name ?? 'Hero'} | ${p.race ?? '?'} | ${p.class ?? '?'} Lv${p.level ?? 1}`,
    `HP: ${p.hp ?? 0}/${p.max_hp ?? 20} | Mana: ${p.mana ?? 0} | ${p.status || 'active'}`,
    statsStr,
    p.skills?.length ? `Skills: ${p.skills.join(', ')}` : '',
    p.background ? `Bg: ${p.background}` : '',
    p.inventory?.length ? `Inv: ${p.inventory.join(', ')}` : '',
  ].filter(Boolean)
  
  return [partyInfo, turnOrderInfo, ...classDetails, enemies].filter(Boolean).join('\n')
}

function buildHistory(state) {
  const summary = state.history_summary 
    ? `HISTORY: ${state.history_summary.slice(0, 500)}` 
    : ''
  const recent = (state.recent_turns ?? [])
    .slice(-RECENT_TURNS_WINDOW)
    .map((t) => `T${t.turn}: ${t.action} → ${t.event}`)
    .join('\n')
  return [summary, recent ? `RECENT:\n${recent}` : ''].filter(Boolean).join('\n')
}

function buildCurrentState(state, activeCharacter = null) {
  const p = activeCharacter || state.player || {}
  const currentTurn = state.currentTurnIndex !== undefined 
    ? `Round ${state.round || 1}, Turn ${(state.currentTurnIndex || 0) + 1}/${state.party?.length || 1}`
    : `Turn ${state.turn || 1}`
  return `CURRENT STATE: ${currentTurn} | mode=${state.mode} | active=${p.name || 'Hero'} | npcs=${state.npcs?.length ?? 0}`
}

function buildDiceContext(diceResult) {
  const { type, roll, hit, damage, amount, success, failed, result, deathSaves } = diceResult
  if (type === 'attack') return `DICE: Attack roll ${roll} → ${hit ? `HIT for ${damage} damage` : 'MISS'}`
  if (type === 'heal') return `DICE: Heal roll → restored ${amount} HP`
  if (type === 'flee') return `DICE: Flee roll ${roll} → ${success ? 'SUCCESS' : 'FAIL'}`
  if (type === 'spell') return failed ? 'DICE: Spell failed (no mana)' : `DICE: Spell deals ${damage} damage`
  if (type === 'deathSave') {
    const savesInfo = deathSaves ? ` (${deathSaves.successes} success, ${deathSaves.failures} fail)` : ''
    return `DICE: Death Save ${roll} → ${success ? 'SUCCESS' : 'FAIL'}${savesInfo}`
  }
  if (type === 'stabilize') return `DICE: Character stabilized at 1 HP`
  return ''
}

function buildInstruction(playerAction) {
  return `PLAYER ACTION: "${playerAction}"

Respond ONLY in valid JSON:
{
  "narration": "string, max 200 words, immersive, no 4th wall",
  "event": "string, one sentence summary",
  "options": ["option1", "option2", "option3"],
  "state_delta": {}
}

Rules: 3 options exactly. No modern language. No AI references. Do not end the story.`
}

// --- RPG Context Builder ---

function buildRPGContext(rpgContext, character) {
  if (!rpgContext) return null

  // Get available spells for character class
  const charClass = character?.class?.toLowerCase()
  const availableSpells = charClass && rpgContext.spellSummary?.[charClass]
    ? rpgContext.spellSummary[charClass]
    : []

  const classInfo = rpgContext.classes?.find(c => 
    c.name?.toLowerCase() === charClass
  )

  const classDetails = classInfo
    ? `CLASS: ${classInfo.name} (Hit Die: d${classInfo.hitDie}, Primary: ${classInfo.primaryAbility}, Saves: ${classInfo.savingThrows?.join(', ')})`
    : ''

  const spellsInfo = availableSpells.length > 0
    ? `AVAILABLE SPELLS: ${availableSpells.map(s => `${s.name}(Lv${s.level}, ${s.school})`).join(', ')}`
    : ''

  const gameDataInfo = `GAME DATA: ${rpgContext.totalSpells} spells, ${rpgContext.totalMonsters} monsters, ${rpgContext.totalItems} items in database`

  return [
    '--- GAME MECHANICS ---',
    classDetails,
    spellsInfo,
    gameDataInfo
  ].filter(Boolean).join('\n')
}
