// frontend/src/components/character/CharacterCard.jsx
import { AvatarDisplay } from '../AvatarSelector.jsx'
import StatBar from './StatBar.jsx'
import './CharacterCard.css'

export default function CharacterCard({ 
  character, 
  isActive = false,
  onClick,
  size = 'default'
}) {
  const { name, race, class: charClass, level, hp, max_hp, mana, max_mana, avatar, status } = character
  
  return (
    <div 
      className={`character-card ${isActive ? 'character-card--active' : ''} character-card--${size}`}
      onClick={onClick}
    >
      <div className="character-card__avatar">
        <AvatarDisplay src={avatar} name={name} size={size === 'compact' ? 'small' : 'medium'} />
        {isActive && <div className="character-card__active-indicator" />}
      </div>
      
      <div className="character-card__info">
        <div className="character-card__name">{name}</div>
        <div className="character-card__class">
          {race} {charClass} • Lv{level || 1}
        </div>
        
        {status === 'unconscious' && (
          <div className="character-card__status character-card__status--unconscious">
            💀 Unconscious
          </div>
        )}
        
        {(hp !== undefined && max_hp !== undefined) && (
          <div className="character-card__stats">
            <StatBar 
              label="HP" 
              value={Math.max(0, hp)} 
              max={max_hp} 
              type="hp" 
              showValue={true}
            />
            {(mana !== undefined && max_mana > 0) && (
              <StatBar 
                label="Mana" 
                value={mana} 
                max={max_mana} 
                type="mana" 
                showValue={true}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
