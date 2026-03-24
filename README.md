# AI Dungeon Master

AI-powered Dungeon Master for tabletop RPG sessions. Supports D&D 5e, Pathfinder, Sci-Fi, Horror, Cyberpunk.

## Quick Start

### Requirements
- Node.js 20+
- Google AI Studio API key (free): https://aistudio.google.com/

### Setup

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Configure environment
cp backend/.env.example backend/.env
# → Add GEMINI_API_KEY to .env

# Initialize database
cd backend && npm run db:init

# Run development
cd backend && npm run dev      # :3001
cd frontend && npm run dev     # :5173
```

### Environment Variables
```
GEMINI_API_KEY=your_key_here
NODE_ENV=development
PORT=3001
DB_PATH=./data/game.db
```

## System Flow

```
Player action
  → POST /api/sessions/:id/turns
  → RulesEngine (dice/damage, pure JS)
  → PromptBuilder (assemble context)
  → AI call (Gemini 2.0 Flash)
  → ConsistencyAgent (validate)
  → GameStateAgent (persist)
  → Response to client
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/sessions | Create session |
| GET | /api/sessions/:id | Get session state |
| POST | /api/sessions/:id/turns | Submit player action |
| GET | /api/sessions/:id/turns | Turn history |
| POST | /api/characters | Create character |

## Architecture

See `claude.md` for full agent map and prompt contract.
See `docs/DEV_GUIDE.md` for extension guide.

## Models

| Use | Model | Cost |
|-----|-------|------|
| Narration + options | gemini-2.0-flash | Free tier |
| Memory compression | gemini-2.0-flash | Free tier |

Replace with Claude Haiku or GPT-4o-mini for production scale.
