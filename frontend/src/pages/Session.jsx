// frontend/src/pages/Session.jsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useSessionStore } from '../stores/session.js'

// Layout Components
import GameLayout from '../components/layout/GameLayout.jsx'
import CharacterPanel from '../components/character/CharacterPanel.jsx'
import NarrativePanel from '../components/narrative/NarrativePanel.jsx'
import DicePanel from '../components/dice/DicePanel.jsx'
import CommandBar from '../components/ui/CommandBar.jsx'

export default function Session() {
  const { id } = useParams()
  const { 
    gameState, 
    currentResponse, 
    turns, 
    isLoading, 
    error, 
    loadSession, 
    submitAction, 
    sessionId,
    setActiveCharacter,
    rollInitiative 
  } = useSessionStore()

  useEffect(() => {
    if (!sessionId && id) loadSession(id)
  }, [id])

  if (!gameState) {
    return <div className="loading">Loading session...</div>
  }

  const party = gameState.party || []
  const activeCharacterId = gameState.activeCharacterId
  const activeCharacter = party.find(c => c.id === activeCharacterId) || party[0] || {}
  
  const turnOrder = gameState.turnOrder || []
  const currentTurnIndex = gameState.currentTurnIndex || 0

  const handleSubmitAction = (action) => {
    submitAction(action)
  }

  const handleSelectCharacter = (characterId) => {
    setActiveCharacter?.(characterId)
  }

  const handleDiceRoll = (result) => {
    console.log('Dice rolled:', result)
  }

  const handleQuickAction = (action) => {
    submitAction(action)
  }

  const handleInitiativeRoll = () => {
    rollInitiative?.()
  }

  const sessionInfo = {
    title: 'DMAPP',
    subtitle: gameState.world?.name || 'New Adventure',
    round: gameState.round,
    turn: gameState.turn
  }

  return (
    <GameLayout
      sessionInfo={sessionInfo}
      leftPanel={
        <CharacterPanel
          activeCharacter={activeCharacter}
          party={party}
          activeCharacterId={activeCharacterId}
          turnOrder={turnOrder}
          currentTurnIndex={currentTurnIndex}
          location={gameState.world?.current_location}
          mode={gameState.mode}
          enemies={gameState.enemies}
          onSelectCharacter={handleSelectCharacter}
          onInitiativeRoll={handleInitiativeRoll}
        />
      }
      centerPanel={
        <NarrativePanel
          turns={turns}
          currentResponse={currentResponse}
          isLoading={isLoading}
          error={error}
          activeCharacterName={activeCharacter.name}
          onSubmitAction={handleSubmitAction}
        >
          <CommandBar 
            onSubmit={handleSubmitAction}
            disabled={isLoading}
            placeholder={`${activeCharacter.name || 'You'} describe your action...`}
          />
        </NarrativePanel>
      }
      rightPanel={
        <DicePanel
          onRollDice={handleDiceRoll}
          onQuickAction={handleQuickAction}
          tone={gameState.tone}
          disabled={isLoading}
        />
      }
    />
  )
}
