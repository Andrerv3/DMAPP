// frontend/src/components/narrative/NarrativePanel.jsx
import { useEffect, useRef } from 'react'
import SceneCard from './SceneCard.jsx'
import OptionsCard from './OptionsCard.jsx'
import './NarrativePanel.css'

export default function NarrativePanel({ 
  turns,
  currentResponse,
  isLoading,
  error,
  activeCharacterName,
  onSubmitAction,
  children
}) {
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [currentResponse, turns])

  return (
    <div className="narrative-panel" ref={scrollRef}>
      {/* History - rendered in reverse (most recent at bottom) */}
      <div className="narrative-panel__history">
        {[...turns].reverse().map((turn, index) => (
          <TurnEntry 
            key={index} 
            turn={turn} 
            animationDelay={index * 0.05}
          />
        ))}
        
        {/* Initial response (intro) */}
        {currentResponse && turns.length === 0 && (
          <SceneCard 
            narration={currentResponse.narration}
            event={currentResponse.event}
          />
        )}
      </div>
      
      {/* Children (additional content like custom input) */}
      {children}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="narrative-panel__loading">
          <TypingIndicator />
          <span>Dungeon Master is narrating...</span>
        </div>
      )}
      
      {/* Error display */}
      {error && (
        <div className="narrative-panel__error">
          {error}
        </div>
      )}
      
      {/* Options - shown when response is ready */}
      {currentResponse && !isLoading && (
        <OptionsCard 
          options={currentResponse.options}
          characterName={activeCharacterName}
          onSelectOption={onSubmitAction}
          disabled={isLoading}
        />
      )}
    </div>
  )
}

function TurnEntry({ turn, animationDelay }) {
  return (
    <div 
      className="turn-entry"
      style={{ animationDelay: `${animationDelay}s` }}
    >
      {/* Player Action */}
      <div className="turn-entry__action">
        <span className="turn-entry__action-text">{turn.action}</span>
      </div>
      
      {/* Dice Result if any */}
      {turn.diceResult && (
        <DiceResultDisplay result={turn.diceResult} />
      )}
      
      {/* DM Response */}
      <SceneCard 
        narration={turn.response.narration}
        event={turn.response.event}
      />
    </div>
  )
}

function DiceResultDisplay({ result }) {
  if (!result) return null
  
  const { type, roll, hit, damage, amount, success, failed } = result
  let text = ''
  let style = ''
  
  if (type === 'attack') {
    text = hit ? `🎯 HIT! Rolled ${roll}, dealt ${damage} damage` : `❌ MISS! Rolled ${roll}`
    style = hit ? 'success' : 'fail'
  } else if (type === 'heal') {
    text = `💚 Healed ${amount} HP`
    style = 'success'
  } else if (type === 'flee') {
    text = success ? `🏃 ESCAPED!` : `❌ Failed to flee`
    style = success ? 'success' : 'fail'
  } else if (type === 'spell') {
    text = failed ? `❌ No mana` : `✨ Spell deals ${damage} damage`
    style = failed ? 'fail' : 'success'
  } else if (type === 'deathSave') {
    text = `💀 Death Save: ${roll} - ${success ? 'SUCCESS' : 'FAIL'}`
    style = success ? 'success' : 'fail'
  }
  
  if (!text) return null
  
  return (
    <div className={`dice-result-display dice-result-display--${style}`}>
      {text}
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="typing-indicator">
      <span className="typing-dot" style={{ animationDelay: '0ms' }} />
      <span className="typing-dot" style={{ animationDelay: '150ms' }} />
      <span className="typing-dot" style={{ animationDelay: '300ms' }} />
    </div>
  )
}
