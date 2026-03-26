// frontend/src/components/party/StatPanel.jsx
import { useState } from 'react'
import './StatPanel.css'

export default function StatPanel({
  stats = {},
  primaryStat,
  systemStats = [],
  onChange,
  theme = 'fantasy',
  icons = {},
}) {
  const [flashingStat, setFlashingStat] = useState(null)

  const handleStatChange = (stat, value) => {
    const newValue = Math.min(30, Math.max(1, parseInt(value) || 10))
    
    // Trigger flash animation
    setFlashingStat(stat)
    setTimeout(() => setFlashingStat(null), 300)
    
    onChange?.(stat, newValue)
  }

  const getModifier = (value) => {
    const mod = Math.floor((value - 10) / 2)
    return mod >= 0 ? `+${mod}` : `${mod}`
  }

  return (
    <div className={`stat-panel stat-panel--${theme}`}>
      <div className="stat-panel__header">
        <i className="ra ra-perspective-dice" />
        <span>Ability Scores</span>
      </div>
      
      <div className="stat-panel__grid">
        {systemStats.slice(0, 6).map(stat => {
          const value = stats[stat] || 10
          const isPrimary = stat === primaryStat
          const isFlashing = flashingStat === stat
          const progressPercent = Math.min(100, Math.max(0, (value / 30) * 100))
          
          return (
            <div 
              key={stat} 
              className={`stat-panel__stat ${
                isPrimary ? 'stat-panel__stat--primary' : ''
              } ${isFlashing ? 'stat-panel__stat--flash' : ''}`}
            >
              <div className="stat-panel__stat-bg" style={{ width: `${progressPercent}%` }} />
              
              <div className="stat-panel__icon">
                <i className={`ra ${icons[stat] || 'ra-dice-one'}`} />
              </div>
              
              <div className="stat-panel__info">
                <div className="stat-panel__label">{stat}</div>
                
                <div className="stat-panel__control">
                  <button 
                    type="button" 
                    className="stat-panel__btn" 
                    onClick={() => handleStatChange(stat, value - 1)}
                  >
                    <i className="ra ra-minus" />
                  </button>
                  
                  <div className="stat-panel__value-display">
                    <span className="stat-panel__value">{value}</span>
                    <span className="stat-panel__mod">{getModifier(value)}</span>
                  </div>
                  
                  <button 
                    type="button" 
                    className="stat-panel__btn" 
                    onClick={() => handleStatChange(stat, value + 1)}
                  >
                    <i className="ra ra-plus" />
                  </button>
                </div>
              </div>
              
              {isPrimary && (
                <div className="stat-panel__badge" title="Primary Stat">
                  <i className="ra ra-star" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
