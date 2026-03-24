// frontend/src/components/narrative/OptionsCard.jsx
import './OptionsCard.css'

export default function OptionsCard({ 
  options, 
  onSelectOption,
  characterName,
  disabled
}) {
  return (
    <div className="options-card">
      <div className="options-card__header">
        <span className="options-card__label">
          {characterName ? `${characterName}'s` : 'Choose Your'} Action
        </span>
      </div>
      
      <div className="options-card__list">
        {options?.map((option, index) => (
          <button
            key={index}
            className="option-card"
            onClick={() => onSelectOption(option)}
            disabled={disabled}
          >
            <span className="option-card__number">{index + 1}</span>
            <span className="option-card__text">{option}</span>
            <span className="option-card__arrow">→</span>
          </button>
        ))}
      </div>
    </div>
  )
}
