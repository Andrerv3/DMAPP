// frontend/src/components/PartyBuilder.jsx
import { useState, useEffect } from 'react'
import './PartyBuilder.css'
import PartyWarRoom from './party/PartyWarRoom.jsx'
import { 
  getCharacterData, 
  getStatsForSystem
} from '../data/characterData.js'

const MAX_PARTY_SIZE = 5

export default function PartyBuilder({ gameSystem, party, onChange }) {
  const characterData = getCharacterData(gameSystem)
  const systemStats = getStatsForSystem(gameSystem)
  
  const [localParty, setLocalParty] = useState(party || [])
  const [activeCharacterId, setActiveCharacterId] = useState(
    party?.[0]?.id || null
  )

  useEffect(() => {
    onChange?.({ party: localParty, activeCharacterId })
  }, [localParty, activeCharacterId, onChange])

  const handlePartyChange = ({ party: newParty, activeCharacterId: newActiveId }) => {
    setLocalParty(newParty)
    if (newActiveId) {
      setActiveCharacterId(newActiveId)
    }
  }

  // Ensure we have at least one character
  const displayParty = localParty.length > 0 ? localParty : []

  return (
    <div className="party-builder">
      <PartyWarRoom
        gameSystem={gameSystem}
        party={displayParty}
        onChange={handlePartyChange}
        characterData={characterData}
        systemStats={systemStats}
      />
    </div>
  )
}
