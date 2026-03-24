// frontend/src/components/party/PartyWarRoom.jsx
import { useState, useCallback, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import CharacterSlot from './CharacterSlot'
import RuneSelector from './RuneSelector'
import StatPanel from './StatPanel'
import './PartyWarRoom.css'

const MAX_PARTY_SIZE = 5
const DEFAULT_HP = 20
const DEFAULT_MANA = 10

function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

function createEmptyCharacter() {
  return {
    id: generateId(),
    name: '',
    avatar: '',
    race: '',
    class: '',
    background: '',
    stats: {},
    hp: DEFAULT_HP,
    max_hp: DEFAULT_HP,
    mana: DEFAULT_MANA,
    level: 1,
    inventory: [],
    skills: [],
  }
}

// Icon mappings for fantasy theme
const FANTASY_ICONS = {
  // Races
  human: 'ra ra-player',
  elf: 'ra ra-elven-face',
  dwarf: 'ra ra-beard',
  halfling: 'ra ra-footprint',
  gnome: 'ra ra-gear-hammer',
  tiefling: 'ra ra-horns',
  dragonborn: 'ra ra-dragon',
  halfOrc: 'ra ra-muscle-up',
  // Classes
  fighter: 'ra ra-sword',
  wizard: 'ra ra-wizard-face',
  rogue: 'ra ra-dagger',
  cleric: 'ra ra-ankh',
  ranger: 'ra ra-archery-target',
  paladin: 'ra ra-shield',
  bard: 'ra ra-flute',
  druid: 'ra ra-leaf',
  barbarian: 'ra ra-axe',
  monk: 'ra ra-hand',
  warlock: 'ra ra-crystal-wand',
  sorcerer: 'ra ra-fire',
  // Stats
  STR: 'ra ra-muscle-up',
  DEX: 'ra ra-lightning',
  CON: 'ra ra-heart-shield',
  INT: 'ra ra-brain-freeze',
  WIS: 'ra ra-eye-shield',
  CHA: 'ra ra-crowned-heart',
}

const CYBER_ICONS = {
  // Races
  android: 'ra ra-robot-head',
  synthetic: 'ra ra-chip',
  human: 'ra ra-player',
  alien: 'ra ra-alien-fire',
  // Classes
  mercenary: 'ra ra-robot-arm',
  techie: 'ra ra-wrench',
  netrunner: 'ra ra-wifi',
  rocker: 'ra ra-musical-score',
  corp: 'ra ra-gold-bar',
  fixer: 'ra ra-target-arrows',
  // Stats
  REF: 'ra ra-bolt-shield',
  DEX: 'ra ra-lightning',
  TECH: 'ra ra-cog',
  INT: 'ra ra-chip',
  COOL: 'ra ra-lightning-bolt',
  LUCK: 'ra ra-four-leaves',
}

const HORROR_ICONS = {
  // Archetypes
  investigator: 'ra ra-search',
  survivor: 'ra ra-health',
  mystic: 'ra ra-crystal-ball',
  monster: 'ra ra-monster-skull',
  // Stats
  SAN: 'ra ra-bleeding-eye',
  STR: 'ra ra-muscle-up',
  DEX: 'ra ra-running-shoe',
  CON: 'ra ra-heart-shield',
  INT: 'ra ra-library',
  POW: 'ra ra-psyche',
}

export default function PartyWarRoom({ 
  gameSystem, 
  party = [], 
  onChange,
  characterData = {},
  systemStats = [],
}) {
  const [selectedId, setSelectedId] = useState(null)
  const [isEditing, setIsEditing] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const localParty = useMemo(() => {
    return party.length > 0 ? party : [createEmptyCharacter()]
  }, [party])

  const theme = useMemo(() => {
    if (gameSystem === 'cyberpunk' || gameSystem === 'scifi') return 'cyber'
    if (gameSystem === 'horror') return 'horror'
    return 'fantasy'
  }, [gameSystem])

  const icons = useMemo(() => {
    if (gameSystem === 'cyberpunk' || gameSystem === 'scifi') return CYBER_ICONS
    if (gameSystem === 'horror') return HORROR_ICONS
    return FANTASY_ICONS
  }, [gameSystem])

  const getRaceLabel = () => {
    switch(gameSystem) {
      case 'dnd5e': return 'Race'
      case 'pathfinder': return 'Ancestry'
      case 'cyberpunk': return 'Origin'
      case 'scifi': return 'Species'
      case 'horror': return 'Archetype'
      default: return 'Type'
    }
  }

  const getClassLabel = () => {
    switch(gameSystem) {
      case 'cyberpunk': return 'Role'
      case 'scifi': return 'Career'
      case 'horror': return 'Type'
      default: return 'Class'
    }
  }

  const raceOptions = characterData.races || characterData.ancestries || characterData.roles || characterData.species || characterData.archetypes || characterData.types || []
  const classOptions = characterData.classes || []
  const backgroundOptions = characterData.backgrounds || []

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event
    
    if (active.id !== over?.id) {
      const oldIndex = localParty.findIndex(c => c.id === active.id)
      const newIndex = localParty.findIndex(c => c.id === over.id)
      
      const newParty = arrayMove(localParty, oldIndex, newIndex)
      
      const activeChar = localParty.find(c => c.id === active.id)
      let newActiveId = localParty[0]?.id
      
      if (activeChar?.id === localParty[0]?.id) {
        newActiveId = newParty[0]?.id
      }
      
      onChange?.({ party: newParty, activeCharacterId: newActiveId })
    }
  }, [localParty, onChange])

  const handleAddCharacter = () => {
    if (localParty.length >= MAX_PARTY_SIZE) return
    const newChar = createEmptyCharacter()
    onChange?.({ 
      party: [...localParty, newChar], 
      activeCharacterId: localParty[0]?.id 
    })
    setSelectedId(newChar.id)
    setIsEditing(true)
  }

  const handleRemoveCharacter = (id) => {
    if (localParty.length <= 1) return
    const newParty = localParty.filter(c => c.id !== id)
    onChange?.({ 
      party: newParty, 
      activeCharacterId: newParty[0]?.id 
    })
    if (selectedId === id) {
      setSelectedId(newParty[0]?.id)
      setIsEditing(false)
    }
  }

  const handleUpdateCharacter = (id, field, value) => {
    const newParty = localParty.map(char => {
      if (char.id !== id) return char
      
      const updated = { ...char, [field]: value }
      
      // Auto-update stats and HP when class changes
      if (field === 'class' && value) {
        const selectedClass = classOptions.find(c => c.id === value)
        if (selectedClass) {
          updated.stats = { ...updated.stats }
          systemStats.forEach(stat => {
            const bonus = selectedClass.recommendedStats?.[stat] || 10
            updated.stats[stat] = bonus
          })
          updated.hp = calculateHP(gameSystem, value, updated.stats.CON || updated.stats.TECH || 10)
          updated.max_hp = updated.hp
        }
      }
      
      return updated
    })
    
    onChange?.({ 
      party: newParty, 
      activeCharacterId: localParty[0]?.id 
    })
  }

  const handleSelectSlot = (id) => {
    setSelectedId(id)
    setIsEditing(true)
  }

  const selectedChar = selectedId 
    ? localParty.find(c => c.id === selectedId) 
    : localParty[0]

  const selectedClass = classOptions.find(c => c.id === selectedChar?.class)
  const primaryStat = selectedClass?.primaryStat || systemStats[0]

  return (
    <div className={`party-war-room party-war-room--${theme}`}>
      {/* Slots Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={localParty.map(c => c.id)} strategy={rectSortingStrategy}>
          <div className="party-war-room__slots">
            {localParty.map((char, index) => (
              <CharacterSlot
                key={char.id}
                character={char}
                index={index}
                isActive={char.id === localParty[0]?.id}
                isSelected={char.id === selectedId}
                gameSystem={gameSystem}
                icons={icons}
                onSelect={() => handleSelectSlot(char.id)}
                onRemove={() => handleRemoveCharacter(char.id)}
                onSetActive={() => {
                  const newParty = arrayMove(localParty, index, 0)
                  onChange?.({ party: newParty, activeCharacterId: char.id })
                }}
              />
            ))}
            
            {localParty.length < MAX_PARTY_SIZE && (
              <button 
                className="party-war-room__add-slot"
                onClick={handleAddCharacter}
              >
                <i className="ra ra-plus" />
                <span>Add Character</span>
              </button>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Editor Panel */}
      <div className={`party-war-room__editor ${isEditing ? 'party-war-room__editor--open' : ''}`}>
        {selectedChar && (
          <>
            <div className="party-war-room__editor-header">
              <h3>
                <i className={`ra ${icons[selectedChar.class] || 'ra-player'}`} />
                Edit Character
              </h3>
              <button 
                className="party-war-room__editor-close"
                onClick={() => setIsEditing(false)}
              >
                <i className="ra ra-cancel" />
              </button>
            </div>

            <div className="party-war-room__form">
              {/* Name Input */}
              <div className="party-war-room__name-field">
                <label>
                  <i className="ra ra-scroll-unfurled" />
                  Character Name
                </label>
                <input
                  type="text"
                  placeholder="Enter name..."
                  value={selectedChar.name}
                  onChange={(e) => handleUpdateCharacter(selectedChar.id, 'name', e.target.value)}
                  className="party-war-room__name-input"
                />
              </div>

              {/* Selectors */}
              <div className="party-war-room__selectors">
                <RuneSelector
                  label={getRaceLabel()}
                  options={raceOptions}
                  value={selectedChar.race}
                  onChange={(val) => handleUpdateCharacter(selectedChar.id, 'race', val)}
                  iconMap={icons}
                  theme={theme}
                />
                <RuneSelector
                  label={getClassLabel()}
                  options={classOptions}
                  value={selectedChar.class}
                  onChange={(val) => handleUpdateCharacter(selectedChar.id, 'class', val)}
                  iconMap={icons}
                  theme={theme}
                />
                <RuneSelector
                  label="Background"
                  options={backgroundOptions}
                  value={selectedChar.background}
                  onChange={(val) => handleUpdateCharacter(selectedChar.id, 'background', val)}
                  iconMap={icons}
                  theme={theme}
                />
              </div>

              {/* Stats Panel */}
              {selectedChar.class && (
                <StatPanel
                  stats={selectedChar.stats}
                  primaryStat={primaryStat}
                  systemStats={systemStats}
                  onChange={(stat, value) => {
                    const newParty = localParty.map(c => {
                      if (c.id !== selectedChar.id) return c
                      return {
                        ...c,
                        stats: { ...c.stats, [stat]: parseInt(value) || 10 }
                      }
                    })
                    onChange?.({ party: newParty, activeCharacterId: localParty[0]?.id })
                  }}
                  theme={theme}
                  icons={icons}
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* Party Summary */}
      <div className="party-war-room__summary">
        <span className="party-war-room__count">
          <i className="ra ra-player" />
          {localParty.length}/{MAX_PARTY_SIZE}
        </span>
        <span className="party-war-room__active">
          Active: <strong>{localParty[0]?.name || 'None'}</strong>
        </span>
      </div>
    </div>
  )
}

// Helper function to calculate HP
function calculateHP(gameSystem, classId, conStat) {
  const hitDice = {
    fighter: 10,
    ranger: 10,
    paladin: 10,
    barbarian: 12,
    cleric: 8,
    druid: 8,
    monk: 8,
    rogue: 8,
    bard: 8,
    sorcerer: 6,
    warlock: 8,
    wizard: 6,
    mercenary: 10,
    techie: 8,
    netrunner: 6,
  }
  
  const hitDie = hitDice[classId] || 8
  const conModifier = Math.floor((conStat - 10) / 2)
  
  return hitDie + conModifier + 5 // Base + CON mod + level 1 bonus
}
