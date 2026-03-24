// frontend/src/components/character/PartyList.jsx
import CharacterCard from './CharacterCard.jsx'
import './PartyList.css'

export default function PartyList({ 
  party, 
  activeCharacterId, 
  onSelectCharacter,
  turnOrder = [],
  currentTurnIndex = 0,
  showTurnOrder = false
}) {
  return (
    <div className="party-list">
      {showTurnOrder && turnOrder.length > 0 && (
        <div className="party-list__section">
          <div className="party-list__section-title">
            <span className="party-list__icon">⚔</span>
            Turn Order
          </div>
          <div className="party-list__turn-order">
            {turnOrder.map((char, index) => (
              <div 
                key={`turn-${char.id}`}
                className={`turn-order-item ${
                  index === currentTurnIndex ? 'turn-order-item--active' : ''
                } ${index < currentTurnIndex ? 'turn-order-item--done' : ''}`}
                onClick={() => onSelectCharacter?.(char.id)}
              >
                <span className="turn-order-item__num">{index + 1}</span>
                <span className="turn-order-item__init">d{char.initiative || '?'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="party-list__section">
        <div className="party-list__section-title">
          <span className="party-list__icon">👥</span>
          Party
        </div>
        <div className="party-list__members">
          {party.map((char) => (
            <CharacterCard
              key={char.id}
              character={char}
              isActive={char.id === activeCharacterId}
              onClick={() => onSelectCharacter?.(char.id)}
              size="compact"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
