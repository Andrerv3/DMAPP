// backend/src/api/sessions.js
import { Router } from 'express'
import { randomUUID } from 'crypto'
import { Orchestrator } from '../agents/orchestrator.js'
import { GAME_SYSTEMS } from '../config/constants.js'

const router = Router()

// POST /api/sessions — create session + intro
router.post('/', async (req, res) => {
  try {
    const { game_system, tone, world, character, party, activeCharacterId } = req.body

    if (!GAME_SYSTEMS[game_system]) {
      return res.status(400).json({ error: `Invalid game_system. Valid: ${Object.keys(GAME_SYSTEMS).join(', ')}` })
    }

    // Support both legacy (character) and new (party) formats
    if (!character?.name && (!party || party.length === 0)) {
      return res.status(400).json({ error: 'character.name is required or party must have at least one character' })
    }

    const sessionId = randomUUID()
    const config = { 
      game_system, 
      tone, 
      world, 
      character,  // Legacy support
      party,      // New party system
      activeCharacterId 
    }

    const result = await Orchestrator.createSession(sessionId, config)

    res.status(201).json({ session_id: sessionId, ...result })
  } catch (err) {
    console.error('[POST /sessions]', err)
    res.status(500).json({ error: 'Failed to create session' })
  }
})

// GET /api/sessions/:id
router.get('/:id', (req, res) => {
  const result = Orchestrator.getSession(req.params.id)
  if (!result) return res.status(404).json({ error: 'Session not found' })
  res.json(result)
})

export default router
