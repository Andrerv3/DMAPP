// frontend/src/components/DiceRoller.jsx
import { useState, useEffect } from 'react'

const DICE_TYPES = [
  { sides: 4, icon: '◇', color: '#E24B4A' },
  { sides: 6, icon: '⬡', color: '#1D9E75' },
  { sides: 8, icon: '◈', color: '#534AB7' },
  { sides: 10, icon: '⬢', color: '#F59E0B' },
  { sides: 12, icon: '⬠', color: '#3C3489' },
  { sides: 20, icon: '⬟', color: '#E24B4A' },
]

export default function DiceRoller({ onRoll, disabled, showResult = true }) {
  const [selectedDice, setSelectedDice] = useState(20)
  const [isRolling, setIsRolling] = useState(false)
  const [result, setResult] = useState(null)
  const [rollHistory, setRollHistory] = useState([])

  const rollDice = () => {
    if (isRolling || disabled) return

    setIsRolling(true)
    setResult(null)

    // Animation
    let spins = 0
    const maxSpins = 12
    const interval = setInterval(() => {
      const tempResult = Math.floor(Math.random() * selectedDice) + 1
      setResult(tempResult)
      spins++
      if (spins >= maxSpins) {
        clearInterval(interval)
        
        // Final result
        const finalResult = Math.floor(Math.random() * selectedDice) + 1
        setResult(finalResult)
        
        // Add to history
        setRollHistory(prev => [
          { dice: selectedDice, result: finalResult, timestamp: Date.now() },
          ...prev.slice(0, 4)
        ])
        
        setIsRolling(false)
        onRoll?.({ dice: selectedDice, result: finalResult })
      }
    }, 80)
  }

  return (
    <div className="dice-roller">
      <div className="dice-selector">
        {DICE_TYPES.map(dice => (
          <button
            key={dice.sides}
            className={`dice-btn ${selectedDice === dice.sides ? 'selected' : ''}`}
            onClick={() => !isRolling && setSelectedDice(dice.sides)}
            disabled={isRolling || disabled}
            style={{ '--dice-color': dice.color }}
          >
            <span className="dice-icon">{dice.icon}</span>
            <span className="dice-label">d{dice.sides}</span>
          </button>
        ))}
      </div>

      <button 
        className={`roll-btn ${isRolling ? 'rolling' : ''}`}
        onClick={rollDice}
        disabled={isRolling || disabled}
      >
        {isRolling ? 'Rolling...' : `Roll d${selectedDice}`}
      </button>

      {showResult && result !== null && (
        <div className={`dice-result ${isRolling ? 'animating' : ''}`}>
          <span className="result-label">Result:</span>
          <span className="result-value" style={{ color: getResultColor(result, selectedDice) }}>
            {result}
          </span>
        </div>
      )}

      {rollHistory.length > 0 && (
        <div className="roll-history">
          {rollHistory.map((roll, i) => (
            <span key={i} className="history-item">
              d{roll.dice}: {roll.result}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function getResultColor(result, diceMax) {
  if (diceMax === 20) {
    if (result === 20) return '#1D9E75' // Nat 20
    if (result === 1) return '#E24B4A'  // Nat 1
  }
  if (result >= diceMax * 0.75) return '#1D9E75'
  if (result <= diceMax * 0.25) return '#E24B4A'
  return 'var(--text)'
}

// Mini dice roller for inline use
export function MiniDiceRoller({ onRoll }) {
  const [isOpen, setIsOpen] = useState(false)
  const [result, setResult] = useState(null)

  const rollDice = (sides) => {
    const rollResult = Math.floor(Math.random() * sides) + 1
    setResult({ sides, result: rollResult })
    setTimeout(() => setResult(null), 2000)
    onRoll?.({ sides, result: rollResult })
  }

  return (
    <div className="mini-dice-roller">
      <button 
        className="dice-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Roll dice"
      >
        🎲
      </button>

      {isOpen && (
        <div className="dice-dropdown">
          {DICE_TYPES.map(dice => (
            <button
              key={dice.sides}
              className="dice-option"
              onClick={() => rollDice(dice.sides)}
            >
              d{dice.sides}
            </button>
          ))}
        </div>
      )}

      {result && (
        <div className="dice-popup-result">
          d{result.sides}: {result.result}
        </div>
      )}
    </div>
  )
}
