// frontend/src/components/narrative/SceneCard.jsx
import './SceneCard.css'

export default function SceneCard({ narration, event, isIntro }) {
  return (
    <div className="scene-card">
      <div className="scene-card__glow" />
      <div className="scene-card__border" />
      
      <div className="scene-card__header">
        <span className="scene-card__icon">📖</span>
        <span className="scene-card__label">Dungeon Master</span>
      </div>
      
      <div className="scene-card__content">
        <p className="scene-card__narration">{narration}</p>
        
        {event && (
          <div className="scene-card__event">
            <span className="scene-card__event-icon">⚡</span>
            {event}
          </div>
        )}
      </div>
    </div>
  )
}
