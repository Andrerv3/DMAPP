// backend/src/agents/rulesEngine.js
// RulesEngineAgent — pure logic, NEVER calls AI
// Role: resolve player actions into state deltas
// Input: playerAction (string), currentState (object)
// Output: delta (partial state), resolvedAction (enriched action description)
// Constraints: deterministic, no side effects, no DB, no AI

export const RulesEngine = {
  /**
   * Apply game rules to player action.
   * @param {string} playerAction - The player's action
   * @param {object} state - Current game state
   * @param {object} activeCharacter - The active character (for party system)
   * @returns {{ delta: object, resolvedAction: string, diceResult?: object }}
   */
  apply(playerAction, state, activeCharacter = null) {
    const action = playerAction.toLowerCase()
    
    // Use active character from party, or fallback to single player
    const character = activeCharacter || state.player

    // Check if character is unconscious
    if (character?.status === 'unconscious') {
      return { 
        delta: {}, 
        resolvedAction: action + ' (unconscious)',
        diceResult: { type: 'error', message: 'Character is unconscious and cannot act' }
      }
    }

    if (isAttackAction(action)) return resolveAttack(action, state, character)
    if (isHealAction(action)) return resolveHeal(action, state, character)
    if (isFleeAction(action)) return resolveFlee(action, state, character)
    if (isCastAction(action)) return resolveSpell(action, state, character)
    if (isDeathSaveAction(action)) return resolveDeathSave(action, state, character)
    if (isStabilizeAction(action)) return resolveStabilize(action, state, character)

    // Default: no mechanical change, pass action through
    return { delta: {}, resolvedAction: playerAction }
  },

  /**
   * Roll dice with specified sides and count.
   */
  rollDice(sides = 20, count = 1) {
    let total = 0
    const rolls = []
    for (let i = 0; i < count; i++) {
      const r = Math.floor(Math.random() * sides) + 1
      rolls.push(r)
      total += r
    }
    return { total, rolls, sides, count }
  },

  /**
   * Calculate initiative order for party based on DEX.
   */
  calculateTurnOrder(party) {
    if (!party || party.length === 0) return []
    
    return party
      .map(char => ({
        ...char,
        initiative: RulesEngine.rollDice(20).total + (char.stats?.DEX ? Math.floor((char.stats.DEX - 10) / 2) : 0)
      }))
      .sort((a, b) => b.initiative - a.initiative)
  },

  /**
   * Apply damage to a character and handle death.
   */
  applyDamage(character, damage) {
    const currentHp = character.hp || 0
    const newHp = currentHp - damage
    
    if (newHp <= 0) {
      return {
        hp: 0,
        status: 'unconscious',
        deathSaves: { successes: 0, failures: 0 }
      }
    }
    
    return { hp: newHp, status: 'active' }
  },
}

// --- Resolvers ---

function resolveAttack(action, state, character) {
  const enemies = state.enemies ?? []
  if (enemies.length === 0) return { delta: {}, resolvedAction: action }

  const attackRoll = RulesEngine.rollDice(20)
  const damageRoll = RulesEngine.rollDice(8)
  const hit = attackRoll.total >= 10

  if (!hit) {
    return {
      delta: {},
      resolvedAction: action,
      diceResult: { type: 'attack', hit: false, roll: attackRoll.total },
    }
  }

  const updatedEnemies = [...enemies]
  updatedEnemies[0] = {
    ...updatedEnemies[0],
    hp: (updatedEnemies[0].hp ?? 20) - damageRoll.total,
  }

  const delta = {
    enemies: updatedEnemies.filter((e) => (e.hp ?? 0) > 0),
    mode: updatedEnemies[0].hp <= 0 && updatedEnemies.length === 1 ? 'exploration' : 'combat',
  }

  return {
    delta,
    resolvedAction: action,
    diceResult: { type: 'attack', hit: true, roll: attackRoll.total, damage: damageRoll.total },
  }
}

function resolveHeal(action, state, character) {
  const healAmount = RulesEngine.rollDice(8, 1).total + 2
  const currentHp = character?.hp ?? state.player?.hp ?? 0
  const maxHp = character?.max_hp ?? state.player?.max_hp ?? 100
  const newHp = Math.min(currentHp + healAmount, maxHp)
  
  // Update the specific character in party or the single player
  const delta = updateCharacterHP(state, character?.id, newHp)
  
  return {
    delta,
    resolvedAction: action,
    diceResult: { type: 'heal', amount: healAmount },
  }
}

function resolveFlee(action, state, character) {
  const roll = RulesEngine.rollDice(20)
  const success = roll.total >= 8
  return {
    delta: success ? { mode: 'exploration', enemies: [] } : {},
    resolvedAction: action,
    diceResult: { type: 'flee', success, roll: roll.total },
  }
}

function resolveSpell(action, state, character) {
  const currentMana = character?.mana ?? state.player?.mana ?? 0
  if (currentMana <= 0) {
    return { delta: {}, resolvedAction: action + ' (no mana)', diceResult: { type: 'spell', failed: true } }
  }
  const spellDamage = RulesEngine.rollDice(6, 2).total
  const updatedEnemies = (state.enemies ?? []).map((e, i) =>
    i === 0 ? { ...e, hp: (e.hp ?? 20) - spellDamage } : e
  ).filter((e) => (e.hp ?? 0) > 0)

  // Deduct mana from character
  const newMana = currentMana - 1
  const delta = {
    ...updateCharacterMana(state, character?.id, newMana),
    enemies: updatedEnemies,
    mode: updatedEnemies.length === 0 ? 'exploration' : state.mode,
  }

  return {
    delta,
    resolvedAction: action,
    diceResult: { type: 'spell', damage: spellDamage },
  }
}

function resolveDeathSave(action, state, character) {
  const roll = RulesEngine.rollDice(20).total
  const isSuccess = roll >= 10
  
  const deathSaves = character?.deathSaves || { successes: 0, failures: 0 }
  
  if (isSuccess) {
    deathSaves.successes += 1
  } else {
    deathSaves.failures += 1
  }
  
  let result = 'pending'
  let newStatus = 'unconscious'
  
  if (deathSaves.successes >= 3) {
    result = 'stable'
    newStatus = 'stable'
  } else if (deathSaves.failures >= 3) {
    result = 'fail'
    newStatus = 'dead'
  }
  
  const delta = updateCharacterDeathSaves(state, character?.id, deathSaves, newStatus)
  
  return {
    delta,
    resolvedAction: action,
    diceResult: { type: 'deathSave', roll, success: isSuccess, result, deathSaves },
  }
}

function resolveStabilize(action, state, character) {
  // Stabilize the character (heal to 1 HP)
  const delta = updateCharacterHP(state, character?.id, 1)
  delta.party = delta.party?.map(c => 
    c.id === character?.id ? { ...c, status: 'stable', deathSaves: { successes: 0, failures: 0 } } : c
  ) || delta.party
  
  return {
    delta,
    resolvedAction: action,
    diceResult: { type: 'stabilize', success: true },
  }
}

// --- Helper Functions ---

function updateCharacterHP(state, characterId, newHp, status = 'active') {
  if (state.party && characterId) {
    const party = state.party.map(c => 
      c.id === characterId ? { ...c, hp: newHp, status } : c
    )
    return { party }
  }
  return { player: { ...state.player, hp: newHp, status } }
}

function updateCharacterMana(state, characterId, newMana) {
  if (state.party && characterId) {
    const party = state.party.map(c => 
      c.id === characterId ? { ...c, mana: newMana } : c
    )
    return { party }
  }
  return { player: { ...state.player, mana: newMana } }
}

function updateCharacterDeathSaves(state, characterId, deathSaves, status) {
  if (state.party && characterId) {
    const party = state.party.map(c => 
      c.id === characterId ? { ...c, deathSaves, status } : c
    )
    return { party }
  }
  return { player: { ...state.player, deathSaves, status } }
}

// --- Action Classifiers ---
const isAttackAction = (a) => /atac|golpe|attack|hit|strike|hiere|corta/.test(a)
const isHealAction = (a) => /cura|poción|heal|potion|resto|recover/.test(a)
const isFleeAction = (a) => /huye|huir|flee|run|escape|retira/.test(a)
const isCastAction = (a) => /lanza|hechizo|cast|spell|magic|conjura/.test(a)
const isDeathSaveAction = (a) => /death save|muerte|salvation|save/i.test(a)
const isStabilizeAction = (a) => /stabili|estabil|help.*unconscious|revive/i.test(a)
