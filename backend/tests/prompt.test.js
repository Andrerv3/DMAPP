// backend/tests/prompt.test.js
// Run: npm test

import { PromptBuilder } from '../src/agents/promptBuilder.js'
import { ConsistencyAgent } from '../src/agents/consistency.js'
import { RulesEngine } from '../src/agents/rulesEngine.js'

const MOCK_STATE = {
  game_system: 'dnd5e',
  tone: 65,
  mode: 'exploration',
  world: { name: 'Arathos', setting: 'dark fantasy', current_location: 'ruined temple' },
  player: { name: 'Lyra', class: 'Wizard', level: 5, hp: 28, max_hp: 32, mana: 6, inventory: ['grimoire', 'wand'] },
  enemies: [],
  npcs: [],
  flags: {},
  turn: 3,
  history_summary: 'Lyra entered the ruins and found a locked door.',
  recent_turns: [
    { turn: 1, action: 'Enter the ruins', event: 'Lyra stepped inside the crumbling temple.' },
    { turn: 2, action: 'Examine the door', event: 'Lyra found runes etched into the sealed door.' },
  ],
}

describe('PromptBuilder', () => {
  test('builds valid system and user prompts', () => {
    const { systemPrompt, userPrompt } = PromptBuilder.build(MOCK_STATE, 'Cast detect magic', null)
    expect(systemPrompt).toContain('Dungeon Master')
    expect(systemPrompt).toContain('D&D 5th Edition')
    expect(userPrompt).toContain('Cast detect magic')
    expect(userPrompt).toContain('JSON')
  })

  test('includes history summary in user prompt', () => {
    const { userPrompt } = PromptBuilder.build(MOCK_STATE, 'Look around', null)
    expect(userPrompt).toContain('Lyra entered the ruins')
  })

  test('includes dice result when provided', () => {
    const { userPrompt } = PromptBuilder.build(MOCK_STATE, 'Attack', { type: 'attack', hit: true, roll: 15, damage: 8 })
    expect(userPrompt).toContain('HIT for 8 damage')
  })
})

describe('ConsistencyAgent', () => {
  test('passes valid response', () => {
    const response = {
      narration: 'The chamber echoes with your footsteps.',
      event: 'Lyra entered the inner sanctum.',
      options: ['Examine the altar', 'Search for traps', 'Move to the far door'],
      state_delta: {},
    }
    const { valid, issues } = ConsistencyAgent.validate(response, MOCK_STATE)
    expect(valid).toBe(true)
    expect(issues).toHaveLength(0)
  })

  test('detects fourth wall break', () => {
    const response = {
      narration: 'As an AI, I cannot fully describe this scene.',
      event: 'Something happened.',
      options: ['a', 'b', 'c'],
      state_delta: {},
    }
    const { valid, issues } = ConsistencyAgent.validate(response, MOCK_STATE)
    expect(valid).toBe(false)
    expect(issues).toContain('fourth_wall_break')
  })

  test('pads missing options to 3', () => {
    const response = {
      narration: 'The room is dark.',
      event: 'Nothing happened.',
      options: ['Look around'],
      state_delta: {},
    }
    const { response: fixed } = ConsistencyAgent.validate(response, MOCK_STATE)
    expect(fixed.options).toHaveLength(3)
  })
})

describe('RulesEngine', () => {
  test('pass-through for non-mechanical action', () => {
    const { delta, resolvedAction } = RulesEngine.apply('Look around the room', MOCK_STATE)
    expect(Object.keys(delta)).toHaveLength(0)
    expect(resolvedAction).toBe('Look around the room')
  })

  test('applies attack when enemies present', () => {
    const stateWithEnemy = { ...MOCK_STATE, mode: 'combat', enemies: [{ name: 'Goblin', hp: 15 }] }
    const { delta, diceResult } = RulesEngine.apply('Attack the goblin', stateWithEnemy)
    expect(diceResult.type).toBe('attack')
    expect(diceResult.roll).toBeGreaterThanOrEqual(1)
  })

  test('no attack delta when no enemies', () => {
    const { delta } = RulesEngine.apply('Attack', MOCK_STATE)
    expect(Object.keys(delta)).toHaveLength(0)
  })
})
