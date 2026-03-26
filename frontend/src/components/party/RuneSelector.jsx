// frontend/src/components/party/RuneSelector.jsx
import { useState, useRef, useEffect } from 'react'
import './RuneSelector.css'

export default function RuneSelector({
  label,
  options = [],
  value,
  onChange,
  iconMap = {},
  theme = 'fantasy',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [hovered, setHovered] = useState(null)
  const dropdownRef = useRef(null)

  const selectedOption = options.find(o => o.id === value)

  const handleSelect = (optionId) => {
    onChange(optionId)
    setIsOpen(false)
  }

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className={`rune-selector rune-selector--${theme}`} ref={dropdownRef}>
      <label className="rune-selector__label">
        <i className={`ra ${iconMap[value] || 'ra-kaleidoscope'}`} />
        {label}
      </label>

      <button 
        className={`rune-selector__trigger ${value ? 'rune-selector__trigger--has-value' : ''} ${isOpen ? 'rune-selector__trigger--open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        {selectedOption ? (
          <>
            <i className={`ra ${iconMap[selectedOption.id] || 'ra-player'}`} />
            <span>{selectedOption.name}</span>
          </>
        ) : (
          <span className="rune-selector__placeholder">Select {label}...</span>
        )}
        <i className={`ra ra-chevron-${isOpen ? 'up' : 'down'}`} />
      </button>

      {isOpen && (
        <div className="rune-selector__dropdown">
          {options.length === 0 ? (
            <div className="rune-selector__empty">
              No options available
            </div>
          ) : (
            options.map(option => (
              <button
                key={option.id}
                className={`rune-selector__option ${
                  value === option.id ? 'rune-selector__option--selected' : ''
                } ${hovered === option.id ? 'rune-selector__option--hovered' : ''}`}
                onClick={() => handleSelect(option.id)}
                onMouseEnter={() => setHovered(option.id)}
                onMouseLeave={() => setHovered(null)}
                type="button"
              >
                <i className={`ra ${iconMap[option.id] || 'ra-player'}`} />
                <span>{option.name}</span>
                {option.statBonus && (
                  <span className="rune-selector__bonus">
                    {Object.entries(option.statBonus).map(([k, v]) => `+${v}${k}`).join(' ')}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
