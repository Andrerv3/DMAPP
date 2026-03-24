// backend/src/data/rpgData.js
// RPG Data Service - Centralized access to D&D 5e SRD data
// Data source: dnd-data npm package

import { 
  spells, 
  monsters, 
  items, 
  backgrounds, 
  classes, 
  species 
} from 'dnd-data'

// In-memory cache for faster access
const cache = {
  spells: null,
  monsters: null,
  items: null,
  classes: null,
  species: null,
  backgrounds: null
}

// Initialize cache
function initializeCache() {
  if (!cache.spells) {
    cache.spells = spells
    cache.monsters = monsters
    cache.items = items
    cache.classes = classes
    cache.species = species
    cache.backgrounds = backgrounds
  }
}

export const RPGDataService = {
  // ============ CHARACTER DATA ============
  
  /**
   * Get all character classes with full details
   */
  getClasses() {
    initializeCache()
    return cache.classes.map(c => ({
      id: c.name?.toLowerCase().replace(/\s+/g, '-') || c.name,
      name: c.name,
      description: c.description,
      hitDie: c.hitDie || c.hit_die,
      primaryAbility: c.primaryAbility || c.primary_ability,
      savingThrows: c.savingThrows || c.saving_throws || [],
      skills: c.skills || [],
      skillProficiencies: c.skillProficiencies || c.skill_proficiencies || [],
      features: c.features || c.feature || [],
      spellAbility: c.spellAbility || c.spell_ability
    }))
  },

  /**
   * Get class by name
   */
  getClassByName(name) {
    initializeCache()
    return cache.classes.find(c => 
      c.name?.toLowerCase() === name.toLowerCase()
    )
  },

  /**
   * Get all races/species
   */
  getRaces() {
    initializeCache()
    return cache.species.map(r => ({
      id: r.name?.toLowerCase().replace(/\s+/g, '-') || r.name,
      name: r.name,
      description: r.description,
      abilityBonuses: r.abilityBonuses || r.ability_bonuses || [],
      traits: r.traits || [],
      subraces: r.subraces || r.sub_races || []
    }))
  },

  /**
   * Get race by name
   */
  getRaceByName(name) {
    initializeCache()
    return cache.species.find(r => 
      r.name?.toLowerCase() === name.toLowerCase()
    )
  },

  /**
   * Get all backgrounds
   */
  getBackgrounds() {
    initializeCache()
    return cache.backgrounds.map(b => ({
      id: b.name?.toLowerCase().replace(/\s+/g, '-') || b.name,
      name: b.name,
      description: b.description,
      skills: b.skills || [],
      traits: b.traits || b.feature || [],
      suggestedCharacteristics: b.suggestedCharacteristics || b.suggested_characteristics
    }))
  },

  // ============ SPELLS ============

  /**
   * Get all spells
   */
  getSpells() {
    initializeCache()
    return cache.spells.map(s => ({
      id: s.name?.toLowerCase().replace(/\s+/g, '-') || s.name,
      name: s.name,
      level: s.level || 0,
      school: s.school || s.spellSchool || '',
      castingTime: s.castingTime || s.casting_time || '',
      range: s.range || s.Range || '',
      components: s.components || s.Components || '',
      duration: s.duration || s.Duration || '',
      concentration: s.concentration || s.Concentration || false,
      ritual: s.ritual || s.Ritual || false,
      damage: s.damage || s.Damage || '',
      save: s.save || s.Save || '',
      description: s.description || s.text || '',
      higherLevel: s.higherLevel || s.higher_level || '',
      classes: s.classes || s.classes || []
    }))
  },

  /**
   * Get spells filtered by class
   */
  getSpellsByClass(className) {
    const allSpells = this.getSpells()
    return allSpells.filter(spell => 
      spell.classes?.some(c => 
        c.toLowerCase() === className.toLowerCase()
      )
    )
  },

  /**
   * Get spells filtered by level
   */
  getSpellsByLevel(level) {
    const allSpells = this.getSpells()
    return allSpells.filter(spell => spell.level === level)
  },

  /**
   * Search spells by name
   */
  searchSpells(query) {
    const allSpells = this.getSpells()
    const lowerQuery = query.toLowerCase()
    return allSpells.filter(spell => 
      spell.name?.toLowerCase().includes(lowerQuery) ||
      spell.description?.toLowerCase().includes(lowerQuery)
    )
  },

  /**
   * Get spell by exact name
   */
  getSpellByName(name) {
    initializeCache()
    return cache.spells.find(s => 
      s.name?.toLowerCase() === name.toLowerCase()
    )
  },

  // ============ MONSTERS ============

  /**
   * Get all monsters
   */
  getMonsters() {
    initializeCache()
    return cache.monsters.map(m => ({
      id: m.name?.toLowerCase().replace(/\s+/g, '-') || m.name,
      name: m.name,
      size: m.size,
      type: m.type,
      alignment: m.alignment,
      armorClass: m.armorClass || m.armor_class,
      armorType: m.armorType || m.armor_type,
      hitPoints: m.hitPoints || m.hit_points,
      hitDice: m.hitDice || m.hit_dice,
      speed: m.speed,
      stats: {
        STR: m.STR || m.strength,
        DEX: m.DEX || m.dexterity,
        CON: m.CON || m.constitution,
        INT: m.INT || m.intelligence,
        WIS: m.WIS || m.wisdom,
        CHA: m.CHA || m.charisma
      },
      savingThrows: m.savingThrows || m.saving_throws,
      skills: m.skills,
      damageResistances: m.damageResistances || m.damage_resistances,
      damageImmunities: m.damageImmunities || m.damage_immunities,
      conditionImmunities: m.conditionImmunities || m.condition_immunities,
      senses: m.senses,
      languages: m.languages,
      challengeRating: m.challengeRating || m.challenge_rating,
      xp: m.xp,
      abilities: m.abilities || m.specialAbilities || [],
      actions: m.actions || [],
      reactions: m.reactions || [],
      legendaryActions: m.legendaryActions || m.legendary_actions || [],
      description: m.description || m.flavor || ''
    }))
  },

  /**
   * Get monsters by challenge rating
   */
  getMonstersByCR(cr) {
    const allMonsters = this.getMonsters()
    return allMonsters.filter(m => m.challengeRating === cr)
  },

  /**
   * Get monsters by type
   */
  getMonstersByType(type) {
    const allMonsters = this.getMonsters()
    return allMonsters.filter(m => 
      m.type?.toLowerCase() === type.toLowerCase()
    )
  },

  /**
   * Search monsters by name
   */
  searchMonsters(query) {
    const allMonsters = this.getMonsters()
    const lowerQuery = query.toLowerCase()
    return allMonsters.filter(monster => 
      monster.name?.toLowerCase().includes(lowerQuery) ||
      monster.type?.toLowerCase().includes(lowerQuery)
    )
  },

  /**
   * Get monster by exact name
   */
  getMonsterByName(name) {
    initializeCache()
    return cache.monsters.find(m => 
      m.name?.toLowerCase() === name.toLowerCase()
    )
  },

  // ============ ITEMS ============

  /**
   * Get all items
   */
  getItems() {
    initializeCache()
    return cache.items.map(i => ({
      id: i.name?.toLowerCase().replace(/\s+/g, '-') || i.name,
      name: i.name,
      description: i.description || i.desc,
      type: i.type || i.category,
      rarity: i.rarity || i.Rarity,
      requiresAttunement: i.requiresAttunement || i.requires_attunement,
      attunement: i.attunement,
      weight: i.weight,
      value: i.value,
      armorClass: i.armorClass || i.armor_class,
      damage: i.damage,
      properties: i.properties || i.property,
      range: i.range
    }))
  },

  /**
   * Get items by category
   */
  getItemsByCategory(category) {
    const allItems = this.getItems()
    return allItems.filter(item => 
      item.type?.toLowerCase() === category.toLowerCase()
    )
  },

  /**
   * Search items by name
   */
  searchItems(query) {
    const allItems = this.getItems()
    const lowerQuery = query.toLowerCase()
    return allItems.filter(item => 
      item.name?.toLowerCase().includes(lowerQuery) ||
      item.description?.toLowerCase().includes(lowerQuery)
    )
  },

  // ============ SEARCH ============

  /**
   * Global search across all data
   */
  search(query) {
    const lowerQuery = query.toLowerCase()
    
    return {
      spells: this.searchSpells(query).slice(0, 10),
      monsters: this.searchMonsters(query).slice(0, 10),
      items: this.searchItems(query).slice(0, 10)
    }
  },

  // ============ STATS ============

  /**
   * Get data statistics
   */
  getStats() {
    initializeCache()
    return {
      spells: cache.spells.length,
      monsters: cache.monsters.length,
      items: cache.items.length,
      classes: cache.classes.length,
      races: cache.species.length,
      backgrounds: cache.backgrounds.length
    }
  },

  // ============ AI CONTEXT ============

  /**
   * Get context data for AI prompts
   */
  getAIContext(gameSystem = 'dnd5e') {
    if (gameSystem !== 'dnd5e') {
      return null // Only D&D 5e supported for now
    }

    const classes = this.getClasses()
    const spells = this.getSpells()
    
    // Get top spells by class (for quick reference)
    const spellSummary = {}
    const classNames = classes.map(c => c.name)
    classNames.forEach(className => {
      const classSpells = this.getSpellsByClass(className)
      spellSummary[className] = classSpells.slice(0, 20).map(s => ({
        name: s.name,
        level: s.level,
        school: s.school
      }))
    })

    return {
      classes: classes.map(c => ({
        name: c.name,
        hitDie: c.hitDie,
        primaryAbility: c.primaryAbility,
        savingThrows: c.savingThrows
      })),
      spellSummary,
      totalSpells: spells.length,
      totalMonsters: cache.monsters.length,
      totalItems: cache.items.length
    }
  }
}

export default RPGDataService
