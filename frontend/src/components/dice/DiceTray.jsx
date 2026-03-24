// frontend/src/components/dice/DiceTray.jsx
import { useState } from 'react'
import './DiceTray.css'

const DICE_TYPES = [
  { sides: 4, icon: '⚀', color: 'var(--color-danger-400)' },
  { sides: 6, icon: '⚁', color: 'var(--color-success-400)' },
  { sides: 8, icon: '⚂', color: 'var(--color-mana-400)' },
  { sides: 10, icon: '⚃', color: 'var(--color-gold-400)' },
  { sides: 12, icon: '⚄', color: 'var(--color-mana-400)' },
  { sides: 20, icon: '⚅', color: 'var(--color-gold-400)' },
]

export default function DiceTray({ onRoll, disabled }) {
  const [selectedDice, setSelectedDice] = useState(20)
  const [isRolling, setIsRolling] = useState(false)
  const [result, setResult] = useState(null)

  const handleRoll = () => {
    if (isRolling || disabled) return

    setIsRolling(true)
    setResult(null)

    // Animation
    let spins = 0
    const maxSpins = 10
    const interval = setInterval(() => {
      const tempResult = Math.floor(Math.random() * selectedDice) + 1
      setResult(tempResult)
      spins++
      if (spins >= maxSpins) {
        clearInterval(interval)
        
        const finalResult = Math.floor(Math.random() * selectedDice) + 1
        setResult(finalResult)
        setIsRolling(false)
        onRoll?.({ dice: selectedDice, result: finalResult })
      }
    }, 80)
  }

  return (
    <div className="dice-tray">
      <div className="dice-tray__title">
        <span className="dice-tray__icon">🎲</span>
        Roll Dice
      </div>
      
      <div className="dice-tray__grid">
        {DICE_TYPES.map(dice => (
          <button
            key={dice.sides}
            className={`dice-btn ${selectedDice === dice.sides ? 'dice-btn--selected' : ''}`}
            onClick={() => setSelectedDice(dice.sides)}
            disabled={disabled}
            style={{ '--dice-color': dice.color }}
          >
            <span className="dice-btn__icon">{dice.icon}</span>
            <span className="dice-btn__label">d{dice.sides}</span>
          </button>
        ))}
      </div>
      
      <button 
        className={`dice-tray__roll ${isRolling ? 'dice-tray__roll--rolling' : ''}`}
        onClick={handleRoll}
        disabled={isRolling || disabled}
      >
        {isRolling ? 'Rolling...' : `Roll d${selectedDice}`}
      </button>
      
      {result !== null && (
        <div className="dice-tray__result">
          <span className="dice-tray__result-label">Result:</span>
          <span className="dice-tray__result-value">{result}</span>
        </div>
      )}
    </div>
  )
}
