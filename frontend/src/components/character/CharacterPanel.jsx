// frontend/src/components/character/CharacterPanel.jsx
import CharacterCard from './CharacterCard.jsx'
import StatBar from './StatBar.jsx'
import PartyList from './PartyList.jsx'
import './CharacterPanel.css'

export default function CharacterPanel({ 
  activeCharacter,
  party,
  activeCharacterId,
  turnOrder,
  currentTurnIndex,
  location,
  mode,
  enemies,
  onSelectCharacter,
  onInitiativeRoll
}) {
  return (
    <div className="character-panel">
      {/* Active Character */}
      {activeCharacter && (
        <section className="character-panel__active">
          <CharacterCard 
            character={activeCharacter}
            isActive={true}
            size="default"
          />
        </section>
      )}
      
      {/* Party & Turn Order */}
      <PartyList 
        party={party}
        activeCharacterId={activeCharacterId}
        turnOrder={turnOrder}
        currentTurnIndex={currentTurnIndex}
        showTurnOrder={turnOrder?.length > 0}
        onSelectCharacter={onSelectCharacter}
      />
      
      {/* Initiative Roll Button */}
      {mode === 'combat' && !turnOrder?.length && (
        <button 
          className="character-panel__initiative-btn"
          onClick={onInitiativeRoll}
        >
          <span className="character-panel__initiative-icon">⚔</span>
          Roll Initiative
        </button>
      )}
      
      {/* Location */}
      {location && (
        <section className="character-panel__location">
          <div className="character-panel__label">
            <span>📍</span> Location
          </div>
          <div className="character-panel__location-value">{location}</div>
        </section>
      )}
      
      {/* Enemies */}
      {enemies?.length > 0 && (
        <section className="character-panel__enemies">
          <div className="character-panel__label">
            <span>💀</span> Enemies
          </div>
          <div className="character-panel__enemy-list">
            {enemies.map((enemy, index) => (
              <div key={index} className="enemy-item">
                <span className="enemy-item__name">{enemy.name || 'Enemy'}</span>
                <span className="enemy-item__hp">HP: {enemy.hp || '?'}</span>
              </div>
            ))}
          </div>
        </section>
      )}
      
      {/* Mode Badge */}
      <div className={`mode-badge mode-badge--${mode}`}>
        {mode?.toUpperCase() || 'EXPLORATION'}
      </div>
    </div>
  )
}
