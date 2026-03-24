// frontend/src/components/party/CharacterSlot.jsx
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import './CharacterSlot.css'

export default function CharacterSlot({
  character,
  index,
  isActive,
  isSelected,
  gameSystem,
  icons,
  onSelect,
  onRemove,
  onSetActive,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: character.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isComplete = character.name && character.class

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`character-slot character-slot--${gameSystem} ${
        isActive ? 'character-slot--active' : ''
      } ${isSelected ? 'character-slot--selected' : ''} ${
        isDragging ? 'character-slot--dragging' : ''
      } ${isComplete ? 'character-slot--complete' : ''}`}
      onClick={() => onSelect?.()}
      {...attributes}
    >
      {/* Aura for active character */}
      {isActive && <div className="character-slot__aura" />}
      
      {/* Hexagonal Frame */}
      <div className="character-slot__frame">
        <div className="character-slot__avatar">
          {character.avatar ? (
            <img src={character.avatar} alt={character.name} />
          ) : (
            <div className="character-slot__placeholder">
              <i className={`ra ${icons[character.class] || icons[character.race] || 'ra-player'}`} />
            </div>
          )}
        </div>
        
        {/* Drag Handle */}
        <div className="character-slot__drag-handle" {...listeners}>
          <i className="ra ra-dots-vertical" />
        </div>
      </div>

      {/* Character Info */}
      <div className="character-slot__info">
        <h3 className="character-slot__name">
          {character.name || 'Unnamed'}
        </h3>
        <div className="character-slot__meta">
          {character.class && (
            <span className="character-slot__class">
              <i className={`ra ${icons[character.class] || 'ra-player'}`} />
            </span>
          )}
          {character.race && (
            <span className="character-slot__race">
              <i className={`ra ${icons[character.race] || 'ra-player'}`} />
            </span>
          )}
          {character.class && (
            <span className="character-slot__class-name">
              {character.class}
            </span>
          )}
        </div>
      </div>

      {/* Active Badge */}
      {isActive && (
        <div className="character-slot__active-badge">
          <i className="ra ra-crowned-heart" />
          <span>Active</span>
        </div>
      )}

      {/* Set Active Button (for non-active characters) */}
      {!isActive && (
        <button 
          className="character-slot__set-active"
          onClick={(e) => {
            e.stopPropagation()
            onSetActive?.()
          }}
          title="Set as active character"
        >
          <i className="ra ra-star" />
        </button>
      )}

      {/* Remove Button */}
      <button 
        className="character-slot__remove"
        onClick={(e) => {
          e.stopPropagation()
          onRemove?.(character.id)
        }}
        title="Remove character"
      >
        <i className="ra ra-cancel" />
      </button>
    </div>
  )
}
