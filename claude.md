# AI-DM: Dungeon Master AI System

## Purpose
Web app where AI acts as Dungeon Master. Players configure game system, create characters (up to 5), play sessions. AI narrates, generates options, enforces rules.

## Stack
- Backend: Node.js + Express + SQLite (dev) / PostgreSQL (prod)
- AI: Gemini 2.0 Flash (free tier) via REST
- Frontend: React + Vite
- State: Per-session JSON in DB, compressed every 10 turns
- Data Layer: `backend/src/data/rpgData.js` (RPGDataService for D&D 5e SRD data)

## Agent Map
```
OrchestratorAgent
├── GameStateAgent       → read/write session state to DB
├── PromptBuilderAgent   → assemble prompt from state parts
├── RulesEngineAgent     → dice, damage, status effects (no AI)
├── NarrativeAgent       → AI call → narration text
├── ConsistencyAgent     → validates AI output against world state
└── MemoryCompressorAgent → every 10 turns, compress history
```

## File Responsibilities
```
backend/src/
  agents/
    orchestrator.js      → turn pipeline controller
    gameState.js         → GameStateAgent (DB layer)
    promptBuilder.js     → PromptBuilderAgent
    rulesEngine.js       → RulesEngineAgent (pure logic)
    narrative.js         → NarrativeAgent (AI call)
    consistency.js       → ConsistencyAgent (validator)
    memoryCompressor.js  → MemoryCompressorAgent (AI call)
  api/
    sessions.js          → POST /sessions, GET /sessions/:id
    turns.js             → POST /sessions/:id/turns
  config/
    ai.js                → Gemini client config
    db.js                → DB connection
    constants.js         → GAME_SYSTEMS, TONES, MODES
  data/
    rpgData.js           → RPGDataService (spells, monsters, items, classes)
  db/
    schema.sql           → sessions, characters, turns, game_state
ai-engine/
  prompts/
    system.base.txt      → immutable DM identity + rules
    templates/           → per-system prompt variants
```

## Prompt Contract
Every AI call receives:
```json
{
  "system": "<base_prompt + world_context + party_info>",
  "history": "<compressed_summary + last_5_turns>",
  "state": { "location": "", "mode": "exploration|combat|dialogue", "party": [], "activeCharacterId": "" },
  "instruction": "<turn_specific_instruction>"
}
```
Every AI response MUST be:
```json
{
  "narration": "string, max 200 words",
  "event": "string, one sentence",
  "options": ["string", "string", "string"],
  "state_delta": { "optional_state_changes": {} }
}
```
If AI response fails schema → retry once → fallback response.

## Rules of Interaction
- RulesEngine NEVER calls AI. Pure JS logic only.
- GameStateAgent is the ONLY agent that writes to DB.
- AI is called max 1x per turn (narrative includes options).
- ConsistencyAgent runs AFTER AI response, BEFORE returning to client.
- MemoryCompressor runs ASYNC after turn 10, 20, 30... (non-blocking).
- temperature: 0.8 (exploration), 0.6 (combat), 0.9 (horror)
- All agents are stateless functions. State lives in DB only.

## Party System (Up to 5 Players)

### Session State Shape
```json
{
  "id": "uuid",
  "game_system": "dnd5e|pathfinder|scifi|horror|cyberpunk|free",
  "tone": 0-100,
  "mode": "exploration|combat|dialogue",
  "world": { "name": "", "setting": "", "current_location": "" },
  "party": [
    {
      "id": "uuid",
      "name": "",
      "avatar": "url",
      "race": "",
      "class": "",
      "background": "",
      "level": 1,
      "hp": 0,
      "max_hp": 0,
      "mana": 0,
      "stats": { "STR": 10, "DEX": 10, "CON": 10, "INT": 10, "WIS": 10, "CHA": 10 },
      "inventory": [],
      "skills": []
    }
  ],
  "activeCharacterId": "uuid",
  "npcs": [],
  "enemies": [],
  "flags": {},
  "turn": 0,
  "history_summary": "",
  "recent_turns": []
}
```

### Turn Flow with Party
1. Player selects active character in sidebar (or uses default)
2. Player submits action via frontend
3. `POST /sessions/:id/turns` includes `characterId`
4. RulesEngine applies rules to the specific character
5. PromptBuilder includes active character info in prompt
6. Response updates that character's HP/mana

## Design System

### Hybrid Theme System
The UI supports three themes based on game system:
- **Fantasy** (default): Dark fantasy with gold accents - for D&D, Pathfinder, Free Form
- **Cyber**: Neon cyan/blue - for Cyberpunk, Sci-Fi
- **Horror**: Deep crimson - for Horror game system

### CSS Custom Properties (tokens.css)
```
--fantasy-border, --fantasy-glow, --fantasy-primary
--cyber-border, --cyber-glow, --cyber-primary  
--horror-border, --horror-glow, --horror-primary
```

### Animations (animations.css)
- sealStamp: Wax seal effect on character completion
- cardInsert: Slide-in effect for drag & drop
- auraPulse: Active character glow
- runeWiggle: Selector hover effect
- statFlash: Stat change highlight

### Components
All UI components use CSS variables for theming. Apply theme class to root:
- `.theme-fantasy` - Default dark fantasy
- `.theme-cyber` - Sci-fi/Cyberpunk
- `.theme-horror` - Horror

## Party Builder (War Room Style)
The party creation uses an immersive "War Room" interface:
- **Drag & Drop**: Reorder characters, set active character
- **Rune Selectors**: Icon-based race/class selection using RPG-Awesome
- **Stat Panel**: Visual ability score display with modifiers
- **Theme Integration**: Styles adapt to selected game system

### Dependencies
- @dnd-kit/core - Drag and drop functionality
- @dnd-kit/sortable - Sortable list components
- @dnd-kit/utilities - CSS transform utilities
- RPG-Awesome - Fantasy icon font (CDN)

## Character Data Files
`frontend/src/data/characterData.js` contains:
- Races/Ancestries per system
- Classes with hit die, primary stat, skills, equipment
- Backgrounds with skills and equipment
- Helper functions: `generateDefaultStats()`, `calculateHP()`

## Supported Game Systems
- **dnd5e**: 9 races, 12 classes, 9 backgrounds
- **pathfinder**: 10 ancestries, 12 classes, 8 backgrounds
- **cyberpunk**: 8 roles, 5 backgrounds
- **scifi**: 6 species, 6 roles, 5 backgrounds
- **horror**: 6 archetypes, 5 backgrounds
- **free**: 6 preset types + custom

## Avatar System
- Uses DiceBear Adventurer API
- Auto-generates 8 avatar options based on character name
- Avatars displayed in:
  - Party Builder (during creation)
  - Sidebar (during game session)

## Extend Points
- New game system: add template in `ai-engine/prompts/templates/` + add data to `characterData.js` + add icons to component icon maps
- New agent: add file in `backend/src/agents/`, register in orchestrator
- New rule: add case in `rulesEngine.js`
- New character option: add to `characterData.js`
- New theme: add tokens to `tokens.css` and create icon map in `PartyWarRoom.jsx`
- New data source: add file in `backend/src/data/`, import where needed

## Agent Optimization Notes
All agents are optimized for token reduction and memory efficiency:
- **promptBuilder.js**: Map-based template cache, RPG context cache, truncated history (500 chars), simplified labels
- **narrative.js**: Simplified regex, direct array manipulation
- **gameState.js**: Lazy JSON parse for turns, reduced string operations
- **consistency.js**: Early return on empty narration, pre-compiled regex patterns
- **orchestrator.js**: Object.assign instead of spread operator to reduce cloning
