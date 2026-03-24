// frontend/src/components/ui/CommandBar.jsx
import { useState } from 'react'
import './CommandBar.css'

export default function CommandBar({ onSubmit, disabled, placeholder }) {
  const [value, setValue] = useState('')

  const handleSubmit = () => {
    if (!value.trim() || disabled) return
    onSubmit?.(value.trim())
    setValue('')
  }

  return (
    <div className="command-bar">
      <div className="command-bar__input-wrapper">
        <span className="command-bar__icon">⚔</span>
        <input
          type="text"
          className="command-bar__input"
          placeholder={placeholder || 'Describe your action...'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          disabled={disabled}
        />
      </div>
      <button 
        className="command-bar__submit"
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
      >
        Execute
      </button>
    </div>
  )
}
