// frontend/src/components/dice/DicePanel.jsx
import DiceTray from './DiceTray.jsx'
import './DicePanel.css'

const QUICK_ACTIONS = [
  { id: 'attack', label: 'Attack', icon: '⚔️' },
  { id: 'defend', label: 'Defend', icon: '🛡️' },
  { id: 'spell', label: 'Cast Spell', icon: '✨' },
  { id: 'heal', label: 'Heal', icon: '💚' },
  { id: 'flee', label: 'Flee', icon: '🏃' },
  { id: 'search', label: 'Search', icon: '🔍' },
]

export default function DicePanel({ 
  onRollDice,
  onQuickAction,
  tone = 50,
  onToneChange,
  disabled
}) {
  return (
    <div className="dice-panel">
      <DiceTray onRoll={onRollDice} disabled={disabled} />
      
      <section className="dice-panel__section">
        <div className="dice-panel__section-title">
          <span>⚡</span> Quick Actions
        </div>
        <div className="quick-actions">
          {QUICK_ACTIONS.map(action => (
            <button
              key={action.id}
              className="quick-action-btn"
              onClick={() => onQuickAction?.(action.label)}
              disabled={disabled}
            >
              <span className="quick-action-btn__icon">{action.icon}</span>
              <span className="quick-action-btn__label">{action.label}</span>
            </button>
          ))}
        </div>
      </section>
      
      <section className="dice-panel__section">
        <div className="dice-panel__section-title">
          <span>🎭</span> Tone
        </div>
        <div className="tone-slider">
          <div className="tone-slider__labels">
            <span>Dark</span>
            <span>Heroic</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={tone}
            onChange={(e) => onToneChange?.(parseInt(e.target.value))}
            className="tone-slider__input"
          />
          <div className="tone-slider__value">{tone}</div>
        </div>
      </section>
    </div>
  )
}
