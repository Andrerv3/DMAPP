// frontend/src/pages/Setup.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../stores/session.js'
import PartyBuilder from '../components/PartyBuilder.jsx'
import './Setup.css'

const GAME_SYSTEMS = [
  { id: 'dnd5e', label: 'D&D 5e', icon: '🐉' },
  { id: 'pathfinder', label: 'Pathfinder', icon: '⚔️' },
  { id: 'scifi', label: 'Sci-Fi', icon: '🚀' },
  { id: 'horror', label: 'Horror', icon: '👻' },
  { id: 'cyberpunk', label: 'Cyberpunk', icon: '🌐' },
  { id: 'free', label: 'Free Form', icon: '📜' },
]

const TONE_LABELS = ['Heroic', 'Epic', 'Gritty', 'Dark', 'Brutal']

const DEFAULT_FORM = {
  game_system: 'dnd5e',
  tone: 65,
  world: { name: '', setting: '', current_location: 'a mysterious starting point' },
  party: [],
  activeCharacterId: null,
}

// Reusable ornate card wrapper with corner ornaments
function OrnateCard({ children }) {
  return (
    <div className="setup-card">
      <span className="setup-card__corner setup-card__corner--tl" />
      <span className="setup-card__corner setup-card__corner--tr" />
      <span className="setup-card__corner setup-card__corner--bl" />
      <span className="setup-card__corner setup-card__corner--br" />
      {children}
    </div>
  )
}

export default function Setup() {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [step, setStep] = useState(1)
  const [tonePulsing, setTonePulsing] = useState(false)
  const { createSession, isLoading, error } = useSessionStore()
  const navigate = useNavigate()

  const setField = (path, value) => {
    setForm((prev) => {
      const keys = path.split('.')
      const updated = { ...prev }
      let ref = updated
      for (let i = 0; i < keys.length - 1; i++) {
        ref[keys[i]] = { ...ref[keys[i]] }
        ref = ref[keys[i]]
      }
      ref[keys[keys.length - 1]] = value
      return updated
    })
  }

  const handlePartyChange = ({ party, activeCharacterId }) => {
    setForm(prev => ({ 
      ...prev, 
      party, 
      activeCharacterId 
    }))
  }

  const handleStart = async () => {
    const activeChar = form.party.find(c => c.id === form.activeCharacterId)
    if (!activeChar?.name?.trim()) {
      return alert('At least one character with a name is required')
    }

    const config = {
      game_system: form.game_system,
      tone: form.tone,
      world: form.world,
      party: form.party,
      activeCharacterId: form.activeCharacterId,
    }

    const session = await createSession(config)
    if (session) navigate(`/session/${session.session_id}`)
  }

  const toneLabel = TONE_LABELS[Math.floor((form.tone / 100) * (TONE_LABELS.length - 1))]

  const handleToneChange = (e) => {
    const value = parseInt(e.target.value)
    setField('tone', value)
    setTonePulsing(true)
    setTimeout(() => setTonePulsing(false), 150)
  }

  const goToStep = (targetStep) => {
    if (targetStep < step) {
      setStep(targetStep)
    }
  }

  const steps = [
    { num: 1, label: 'Game' },
    { num: 2, label: 'Party' },
    { num: 3, label: 'World' },
  ]

  if (isLoading) {
    return (
      <div className="setup-page">
        <div className="setup-loading">
          <div className="setup-loading-spinner" />
          <span className="setup-loading-text">Forging your adventure...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="setup-page">
      <div className="setup-wizard">
        {/* Step Indicator */}
        <div className={`setup-steps setup-steps--step-${step}`}>
          {steps.map((s) => (
            <div
              key={s.num}
              className={`setup-step ${
                step === s.num ? 'setup-step--active' : ''
              } ${step > s.num ? 'setup-step--completed' : ''} ${
                step > s.num ? 'setup-step--clickable' : ''
              }`}
              onClick={() => goToStep(s.num)}
            >
              <span className="setup-step-number">
                {step > s.num ? '✓' : s.num}
              </span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Step 1: Game Configuration */}
        {step === 1 && (
          <OrnateCard>
            <div className="setup-card__content">
              <h2 className="setup-title">Choose Your Path</h2>
              <p className="setup-subtitle">Select a game system and set the tone for your adventure</p>
              
              <label className="setup-label">Game System</label>
              <div className="game-system-grid">
                {GAME_SYSTEMS.map((gs) => (
                  <button
                    key={gs.id}
                    className={`game-chip ${form.game_system === gs.id ? 'selected' : ''}`}
                    onClick={() => setField('game_system', gs.id)}
                  >
                    <span className="game-chip-icon">{gs.icon}</span>
                    <span>{gs.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Dock with Tone Slider + CTA */}
            <div className="setup-dock">
              <div className="setup-dock__tone">
                <label className="setup-dock__tone-label">DM Tone</label>
                <div className="setup-dock__tone-slider">
                  <div className="tone-slider-track">
                    <div 
                      className="tone-slider-fill" 
                      style={{ width: `${form.tone}%` }}
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={form.tone}
                    onChange={handleToneChange}
                    className="tone-slider-input"
                  />
                </div>
                <span className="setup-dock__tone-value">{toneLabel}</span>
              </div>
              <button className="setup-btn setup-btn--primary" onClick={() => setStep(2)}>
                Next: Create Party →
              </button>
            </div>
          </OrnateCard>
        )}

        {/* Step 2: Character Creation */}
        {step === 2 && (
          <OrnateCard>
            <div className="setup-card__content">
              <h2 className="setup-title">Assemble Your Party</h2>
              <p className="setup-subtitle">Create up to 5 characters. Select one to be the active character.</p>
              
              <PartyBuilder 
                gameSystem={form.game_system}
                party={form.party}
                onChange={handlePartyChange}
              />
            </div>

            {/* Bottom Dock */}
            <div className="setup-dock">
              <button className="setup-btn setup-btn--back" onClick={() => setStep(1)}>
                ← Back
              </button>
              <button className="setup-btn setup-btn--primary" onClick={() => setStep(3)}>
                Next: Define World →
              </button>
            </div>
          </OrnateCard>
        )}

        {/* Step 3: World Building */}
        {step === 3 && (
          <OrnateCard>
            <div className="setup-card__content">
              <h2 className="setup-title">Shape the Realm</h2>
              <p className="setup-subtitle">Define the world where your adventure takes place</p>
              
              <div className="world-form">
                <div>
                  <label className="setup-label">World Name</label>
                  <input
                    className="setup-input"
                    placeholder="e.g., The Shattered Isles"
                    value={form.world.name}
                    onChange={(e) => setField('world.name', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="setup-label">Setting & Backstory</label>
                  <textarea
                    className="setup-input setup-textarea"
                    placeholder="Describe the world's history, conflicts, and mysteries..."
                    value={form.world.setting}
                    onChange={(e) => setField('world.setting', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="setup-label">Starting Location</label>
                  <input
                    className="setup-input"
                    placeholder="Where does the adventure begin?"
                    value={form.world.current_location}
                    onChange={(e) => setField('world.current_location', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Dock */}
            <div className="setup-dock">
              <button className="setup-btn setup-btn--back" onClick={() => setStep(2)}>
                ← Back
              </button>
              <button className="setup-btn setup-btn--primary" onClick={handleStart}>
                Begin Adventure ⚔
              </button>
            </div>
          </OrnateCard>
        )}
      </div>
    </div>
  )
}
