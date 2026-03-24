// frontend/src/components/AvatarSelector.jsx
import { useState, useEffect } from 'react'

const DICEBEAR_BASE = 'https://api.dicebear.com/7.x/adventurer/svg'
const AVATAR_VARIANTS = 8
const BACKGROUND_COLORS = ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf', 'c1e1c1']

function generateSeeds(name) {
  const seeds = []
  for (let i = 0; i < AVATAR_VARIANTS; i++) {
    const seed = `${name}-${i}-${Math.random().toString(36).substr(2, 9)}`
    seeds.push(seed)
  }
  return seeds
}

function getRandomBackground() {
  return BACKGROUND_COLORS[Math.floor(Math.random() * BACKGROUND_COLORS.length)]
}

export default function AvatarSelector({ value, onChange, name = '' }) {
  const [seeds, setSeeds] = useState([])
  const [showPicker, setShowPicker] = useState(false)
  const [bgColor] = useState(getRandomBackground())

  useEffect(() => {
    if (name) {
      setSeeds(generateSeeds(name))
    }
  }, [name])

  const currentAvatar = value || `${DICEBEAR_BASE}?seed=${name || 'default'}&backgroundColor=${bgColor}`

  const handleSelectAvatar = (seed) => {
    const avatarUrl = `${DICEBEAR_BASE}?seed=${seed}&backgroundColor=${bgColor}`
    onChange(avatarUrl)
    setShowPicker(false)
  }

  const handleRefresh = () => {
    const newSeeds = generateSeeds(name || 'refresh')
    setSeeds(newSeeds)
  }

  return (
    <div className="avatar-selector">
      <div className="avatar-preview" onClick={() => setShowPicker(!showPicker)}>
        {value ? (
          <img src={value} alt="Avatar" className="avatar-img" />
        ) : (
          <div className="avatar-placeholder">
            {name ? name.charAt(0).toUpperCase() : '?'}
          </div>
        )}
        <div className="avatar-overlay">
          <span>Change</span>
        </div>
      </div>

      {showPicker && (
        <div className="avatar-picker">
          <div className="avatar-picker-header">
            <span>Choose Avatar</span>
            <button className="refresh-btn" onClick={handleRefresh} title="Refresh options">
              ↻
            </button>
          </div>
          <div className="avatar-grid">
            {seeds.map((seed, index) => (
              <button
                key={index}
                className={`avatar-option ${value === `${DICEBEAR_BASE}?seed=${seed}&backgroundColor=${bgColor}` ? 'selected' : ''}`}
                onClick={() => handleSelectAvatar(seed)}
              >
                <img 
                  src={`${DICEBEAR_BASE}?seed=${seed}&backgroundColor=${bgColor}`} 
                  alt={`Avatar option ${index + 1}`}
                />
              </button>
            ))}
          </div>
          <div className="avatar-picker-footer">
            <button className="random-btn" onClick={() => {
              const random = seeds[Math.floor(Math.random() * seeds.length)]
              handleSelectAvatar(random)
            }}>
              Random
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function AvatarDisplay({ src, name, size = 'medium' }) {
  if (!src) {
    return (
      <div className={`avatar-display avatar-${size} avatar-initials`}>
        {name ? name.charAt(0).toUpperCase() : '?'}
      </div>
    )
  }

  return (
    <img 
      src={src} 
      alt={name} 
      className={`avatar-display avatar-${size}`}
    />
  )
}
