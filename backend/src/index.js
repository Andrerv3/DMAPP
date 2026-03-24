// backend/src/index.js
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { initDB } from './config/db.js'
import sessionsRouter from './api/sessions.js'
import turnsRouter from './api/turns.js'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' }))
app.use(express.json())

// Routes
app.use('/api/sessions', sessionsRouter)
app.use('/api/sessions/:id/turns', turnsRouter)

// Health
app.get('/health', (_, res) => res.json({ status: 'ok', model: 'gemini-2.0-flash' }))

// Error handler
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

// Init DB then start
initDB()
app.listen(PORT, () => console.log(`[AI-DM] Backend running on :${PORT}`))

export default app
