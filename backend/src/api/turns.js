// backend/src/api/turns.js
import { Router } from 'express'
import { Orchestrator } from '../agents/orchestrator.js'
import { GameStateAgent } from '../agents/gameState.js'

const router = Router({ mergeParams: true })

// POST /api/sessions/:id/turns — submit player action
router.post('/', async (req, res) => {
  try {
    const { action, characterId } = req.body
    const sessionId = req.params.id

    if (!action?.trim()) {
      return res.status(400).json({ error: 'action is required' })
    }
    if (action.length > 500) {
      return res.status(400).json({ error: 'action too long (max 500 chars)' })
    }

    const result = await Orchestrator.processTurn(sessionId, action.trim(), characterId)
    res.json(result)
  } catch (err) {
    if (err.message.includes('not found')) return res.status(404).json({ error: err.message })
    console.error('[POST /turns]', err)
    res.status(500).json({ error: 'Failed to process turn' })
  }
})

// GET /api/sessions/:id/turns — turn history
router.get('/', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit ?? '20'), 50)
  const turns = GameStateAgent.getTurns(req.params.id, limit)
  res.json({ turns })
})

// POST /api/sessions/:id/initiative — roll initiative for combat
router.post('/initiative', async (req, res) => {
  try {
    const sessionId = req.params.id
    const result = await Orchestrator.rollInitiative(sessionId)
    res.json(result)
  } catch (err) {
    if (err.message.includes('not found')) return res.status(404).json({ error: err.message })
    console.error('[POST /initiative]', err)
    res.status(500).json({ error: 'Failed to roll initiative' })
  }
})

export default router
