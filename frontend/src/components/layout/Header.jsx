// frontend/src/components/layout/Header.jsx
import './Header.css'

export default function Header({ title, subtitle, round, turn }) {
  return (
    <header className="game-header">
      <div className="game-header__brand">
        <div className="game-header__logo">
          <span className="game-header__icon">⚔</span>
          <span className="game-header__title">{title}</span>
        </div>
      </div>
      
      <div className="game-header__info">
        {subtitle && (
          <div className="game-header__session">
            <span className="game-header__label">Session</span>
            <span className="game-header__value">{subtitle}</span>
          </div>
        )}
        
        {(round || turn) && (
          <div className="game-header__turn">
            {round && (
              <span className="game-header__round">
                <span className="game-header__label">Round</span>
                <span className="game-header__value">{round}</span>
              </span>
            )}
            {turn && (
              <span className="game-header__turn-num">
                <span className="game-header__label">Turn</span>
                <span className="game-header__value">{turn}</span>
              </span>
            )}
          </div>
        )}
      </div>
      
      <div className="game-header__actions">
        <button className="game-header__btn" title="Settings">
          ⚙
        </button>
      </div>
    </header>
  )
}
