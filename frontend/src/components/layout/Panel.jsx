// frontend/src/components/layout/Panel.jsx
import './Panel.css'

export default function Panel({ 
  children, 
  position, 
  className = '',
  title 
}) {
  return (
    <aside className={`game-panel game-panel--${position} ${className}`}>
      {title && (
        <div className="game-panel__header">
          <h2 className="game-panel__title">{title}</h2>
        </div>
      )}
      <div className="game-panel__content">
        {children}
      </div>
    </aside>
  )
}
