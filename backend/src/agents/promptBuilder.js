// backend/src/agents/promptBuilder.js
// PromptBuilderAgent — assembles prompt from state parts
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

// Cache templates in memory
const templateCache = {}
function loadTemplate(name) {
  if (templateCache[name]) return templateCache[name]
  try {
    templateCache[name] = readFileSync(join(PROMPT_DIR, `templates/${name}.txt`), 'utf8')
  } catch {
    templateCache[name] = readFileSync(join(PROMPT_DIR, 'templates/free.txt'), 'utf8')
  }
  return templateCache[name]
}

const BASE_SYSTEM = readFileSync(join(PROMPT_DIR, 'system.base.txt'), 'utf8')

// Cache RPG context data
let rpgContextCache = null
function getRPGContext(gameSystem) {
  if (!rpgContextCache && gameSystem === 'dnd5e') {
    rpgContextCache = RPGDataService.getAIContext(gameSystem)
  }
  return rpgContextCache
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
  
  // If party exists, show party info
  const party = state.party
  let partyInfo = ''
  if (party && party.length > 0) {
    const partyMembers = party.map(c => `${c.name || 'Unnamed'}(HP:${c.hp ?? '?'}/${c.max_hp ?? '?'}, status:${c.status || 'active'})`).join(', ')
    partyInfo = `PARTY: [${partyMembers}]`
  }
  
  // Turn order info
  const turnOrderInfo = state.turnOrder?.length 
    ? `TURN ORDER: ${state.turnOrder.map((c, i) => `${i + 1}.${c.name}(init:${c.initiative})`).join(', ')}`
    : ''
  
  const enemies = state.enemies?.length ? `Enemies: ${state.enemies.map((e) => `${e.name}(hp:${e.hp})`).join(', ')}` : ''
  
  // Full character stats
  const statsStr = p.stats 
    ? Object.entries(p.stats).map(([k, v]) => `${k}:${v}`).join(', ')
    : ''
  
  // Character class details
  const classDetails = [
    `CHARACTER: ${p.name ?? 'Hero'} | Race: ${p.race ?? 'Unknown'} | Class: ${p.class ?? ''} Lv${p.level ?? 1}`,
    `HP: ${p.hp ?? 0}/${p.max_hp ?? 20} | Mana: ${p.mana ?? 0} | Status: ${p.status || 'active'}`,
    `Stats: ${statsStr}`,
    p.skills?.length ? `Skills: ${p.skills.join(', ')}` : '',
    p.background ? `Background: ${p.background}` : '',
    p.inventory?.length ? `Inventory: ${p.inventory.join(', ')}` : '',
  ].filter(Boolean)
  
  return [
    partyInfo,
    turnOrderInfo,
    ...classDetails,
    enemies,
  ].filter(Boolean).join('\n')
}

function buildHistory(state) {
  const summary = state.history_summary ? `HISTORY SUMMARY: ${state.history_summary}` : ''
  const recent = (state.recent_turns ?? [])
    .slice(-RECENT_TURNS_WINDOW)
    .map((t) => `[T${t.turn}] ${t.action} → ${t.event}`)
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
