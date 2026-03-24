// frontend/src/stores/session.js
import { create } from 'zustand'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'

export const useSessionStore = create((set, get) => ({
  // State
  sessionId: null,
  gameState: null,
  turns: [],
  currentResponse: null,
  isLoading: false,
  error: null,

  // Create new session
  createSession: async (config) => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch(`${API}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      set({
        sessionId: data.session_id,
        gameState: data.state,
        currentResponse: data.intro,
        turns: [],
        isLoading: false,
      })
      return data
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  // Submit player action
  submitAction: async (action) => {
    const { sessionId, gameState } = get()
    if (!sessionId) return
    
    const activeCharacterId = gameState?.activeCharacterId
    
    set({ isLoading: true, error: null })
    try {
      const res = await fetch(`${API}/sessions/${sessionId}/turns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action,
          characterId: activeCharacterId 
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      set((state) => ({
        gameState: data.state,
        currentResponse: data.response,
        turns: [
          { action, response: data.response, diceResult: data.diceResult, turn: data.state.turn },
          ...state.turns,
        ],
        isLoading: false,
      }))
      return data
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  // Set active character
  setActiveCharacter: (characterId) => {
    set((state) => ({
      gameState: state.gameState 
        ? { ...state.gameState, activeCharacterId: characterId }
        : null
    }))
  },

  // Roll initiative for combat
  rollInitiative: async () => {
    const { sessionId } = get()
    if (!sessionId) return
    
    set({ isLoading: true, error: null })
    try {
      const res = await fetch(`${API}/sessions/${sessionId}/turns/initiative`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      set((state) => ({
        gameState: data.state,
        isLoading: false,
      }))
      return data
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  // Load existing session
  loadSession: async (sessionId) => {
    set({ isLoading: true, error: null })
    try {
      const res = await fetch(`${API}/sessions/${sessionId}`)
      if (!res.ok) throw new Error('Session not found')
      const data = await res.json()
      set({
        sessionId,
        gameState: data.state,
        turns: data.turns ?? [],
        isLoading: false,
      })
    } catch (err) {
      set({ error: err.message, isLoading: false })
      throw err
    }
  },

  clearError: () => set({ error: null }),
  reset: () => set({ sessionId: null, gameState: null, turns: [], currentResponse: null }),
}))
