// frontend/src/components/character/StatBar.jsx
import './StatBar.css'

export default function StatBar({ 
  label, 
  value, 
  max, 
  type = 'hp',
  showValue = true 
}) {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100))
  
  const isCritical = type === 'hp' && percentage <= 25
  const isLow = type === 'hp' && percentage <= 50 && percentage > 25
  
  const colorClass = isCritical ? 'critical' : isLow ? 'low' : 'full'
  
  return (
    <div className={`stat-bar stat-bar--${type}`}>
      <div className="stat-bar__header">
        <span className="stat-bar__label">{label}</span>
        {showValue && (
          <span className="stat-bar__value">
            <span className="stat-bar__current">{value}</span>
            <span className="stat-bar__separator">/</span>
            <span className="stat-bar__max">{max}</span>
          </span>
        )}
      </div>
      <div className="stat-bar__track">
        <div 
          className={`stat-bar__fill stat-bar__fill--${colorClass}`}
          style={{ width: `${percentage}%` }}
        >
          <div className="stat-bar__glow" />
        </div>
      </div>
    </div>
  )
}
