# AI-DM Architecture Documentation

## Overview
AI-DM is a Dungeon Master AI system where the AI narrates, generates options, and enforces rules for tabletop RPG sessions. Players configure game systems, create characters (up to 5), and play sessions.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│  Setup.jsx → Session.jsx → PartyWarRoom.jsx → CharacterPanel   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Express)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  sessions   │  │   turns     │  │    middleware/error     │  │
│  │    API      │  │    API      │  │       handlers          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   ORCHESTRATOR (Pipeline)                       │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ GameState    │  │ RulesEngine  │  │ PromptBuilder         │  │
│  │ Agent        │  │ Agent        │  │ Agent                 │  │
│  │ (DB R/W)     │  │ (Pure JS)    │  │ (Prompt Assembly)     │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│         │                │                     │                │
│         ▼                ▼                     ▼                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Consistency  │  │  Narrative   │  │ MemoryCompressor     │  │
│  │ Agent        │  │ Agent       │  │ Agent                │  │
│  │ (Validation) │  │ (AI Call)   │  │ (Async Compression)  │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (SQLite/PostgreSQL)                 │
│  sessions | game_state | turns | characters                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AI ENGINE (Gemini 2.0 Flash)                 │
│  system.base.txt + templates/*.txt → AI Prompt → JSON Response │
└─────────────────────────────────────────────────────────────────┘
```

## Agent Detailed Specification

### 1. OrchestratorAgent
**File**: `backend/src/agents/orchestrator.js`
**Role**: Turn pipeline controller - coordinates all agents
**Pattern**: Singleton object with async methods

**Methods**:
- `createSession(sessionId, config)` - Initialize new game session
- `processTurn(sessionId, playerAction, characterId)` - Process player action
- `rollInitiative(sessionId)` - Calculate combat turn order
- `getSession(sessionId)` - Retrieve session state + recent turns

**Flow**:
```
processTurn:
1. Load state (GameStateAgent.load)
2. Find active character (party system)
3. Apply rules (RulesEngine.apply)
4. Update state + advance turn
5. Build prompt (PromptBuilder.build)
6. Call AI (NarrativeAgent.call)
7. Validate (ConsistencyAgent.validate)
8. Persist (GameStateAgent.save)
9. Async compress (MemoryCompressor.runAsync)
```

### 2. GameStateAgent
**File**: `backend/src/agents/gameState.js`
**Role**: ONLY agent that reads/writes DB
**Constraints**: Never calls AI, never modifies logic

**Methods**:
- `load(sessionId)` - Load full state from DB
- `create(sessionId, config)` - Create initial state
- `save(sessionId, currentState, aiResponse, delta)` - Persist state
- `updateSummary(sessionId, summary)` - Update history summary
- `getTurns(sessionId, limit)` - Get turn history

**DB Tables**:
- `sessions` - Session metadata
- `game_state` - JSON state blob
- `turns` - Turn history

### 3. RulesEngineAgent
**File**: `backend/src/agents/rulesEngine.js`
**Role**: Pure JS game logic - dice, damage, status effects
**Constraints**: NEVER calls AI, deterministic, no side effects

**Methods**:
- `apply(playerAction, state, activeCharacter)` - Resolve action
- `rollDice(sides, count)` - Roll dice
- `calculateTurnOrder(party)` - Initiative order
- `applyDamage(character, damage)` - Damage calculation

**Action Resolvers**:
- `resolveAttack()` - Combat attacks
- `resolveHeal()` - Healing actions
- `resolveFlee()` - Escape attempts
- `resolveSpell()` - Spell casting
- `resolveDeathSave()` - Death saving throws
- `resolveStabilize()` - Stabilize unconscious

**Action Classifiers** (Regex-based):
```javascript
isAttackAction: /atac|golpe|attack|hit|strike|hiere|corta/
isHealAction: /cura|poción|heal|potion|resto|recover/
isFleeAction: /huye|huir|flee|run|escape|retira/
isCastAction: /lanza|hechizo|cast|spell|magic|conjura/
```

### 4. PromptBuilderAgent
**File**: `backend/src/agents/promptBuilder.js`
**Role**: Assemble prompt from state parts
**Constraints**: No AI call, no DB, token-minimal

**Optimization**:
- Template caching (Map)
- RPG context caching (Map)
- Truncated history (500 chars max)
- Simplified labels (CHAR: vs CHARACTER:)

**Methods**:
- `build(state, playerAction, diceResult, activeCharacter)` - Build prompts
- `buildCompressionPrompt(turns)` - Compression prompt

**Prompt Sections**:
- `BASE_SYSTEM` - DM identity rules
- `SYSTEM` - Game system template
- `TONE` - DM style (0-100)
- `MODE` - exploration/combat/dialogue
- `WORLD` - Location/setting
- `CHARACTER` - Active character stats
- `HISTORY` - Compressed summary + recent turns
- `CURRENT STATE` - Turn/round info
- `DICE` - Dice roll results
- `INSTRUCTION` - Player action + JSON format

### 5. NarrativeAgent
**File**: `backend/src/agents/narrative.js`
**Role**: AI call for narration + options
**Constraints**: Max 1 retry, fallback on double failure

**Methods**:
- `call(prompt, temperature)` - Execute AI call

**Retry Logic**:
1. First attempt: Normal call
2. Retry: Add "CRITICAL: Respond ONLY with valid JSON"
3. Fallback: Return default response if retry fails

**Output Contract**:
```json
{
  "narration": "string, max 200 words",
  "event": "string, one sentence",
  "options": ["option1", "option2", "option3"],
  "state_delta": {}
}
```

### 6. ConsistencyAgent
**File**: `backend/src/agents/consistency.js`
**Role**: Validate AI output against world state
**Constraints**: No AI call, no DB, pure validation

**Validation Checks**:
1. Empty narration → Return fallback
2. Options count → Pad to 3
3. Narration length → Truncate to 200 words
4. 4th wall breaks → Replace with "..."
5. Anachronisms → Flag (no auto-correct)
6. state_delta type → Reset if invalid

**Optimization**: Early return on empty narration

### 7. MemoryCompressorAgent
**File**: `backend/src/agents/memoryCompressor.js`
**Role**: Async history compression every N turns
**Constraints**: Runs async, non-blocking, fail silently

**Methods**:
- `runAsync(sessionId)` - Fire-and-forget compression

**Compression Trigger**: `turn % 10 === 0` (every 10 turns)

**Process**:
1. Load recent_turns
2. Build compression prompt (3 sentences)
3. Call AI with low temperature (0.3)
4. Append to history_summary
5. Trim recent_turns to window

## Data Flow

### Turn Processing Pipeline
```
[HTTP Request]
      │
      ▼
[API: POST /sessions/:id/turns]
      │
      ▼
[Orchestrator.processTurn]
      │
      ├─► GameStateAgent.load()
      │
      ├─► RulesEngine.apply()
      │      └─► rollDice(), calculateTurnOrder()
      │
      ├─► PromptBuilder.build()
      │      └─► loadTemplate(), buildHistory()
      │
      ├─► NarrativeAgent.call()
      │      └─► callAI() → Gemini API
      │
      ├─► ConsistencyAgent.validate()
      │
      ├─► GameStateAgent.save()
      │
      └─► MemoryCompressor.runAsync() [non-blocking]
              │
              └─► PromptBuilder.buildCompressionPrompt()
                  └─► callAI() → compress history
```

### Session Creation Pipeline
```
[HTTP Request]
      │
      ▼
[API: POST /sessions]
      │
      ▼
[Orchestrator.createSession]
      │
      ├─► GameStateAgent.create()
      │      └─► INSERT sessions, game_state
      │
      ├─► RulesEngine.calculateTurnOrder()
      │
      ├─► PromptBuilder.build()
      │
      ├─► NarrativeAgent.call()
      │
      ├─► ConsistencyAgent.validate()
      │
      └─► GameStateAgent.save()
              └─► INSERT turns
```

## State Management

### Session State Shape
```json
{
  "game_system": "dnd5e|pathfinder|scifi|horror|cyberpunk|free",
  "tone": 0-100,
  "mode": "exploration|combat|dialogue",
  "world": {
    "name": "",
    "setting": "",
    "current_location": ""
  },
  "party": [
    {
      "id": "uuid",
      "name": "",
      "avatar": "",
      "race": "",
      "class": "",
      "level": 1,
      "hp": 0,
      "max_hp": 0,
      "mana": 0,
      "stats": { "STR": 10, "DEX": 10, ... },
      "inventory": [],
      "skills": [],
      "initiative": 10
    }
  ],
  "activeCharacterId": "uuid",
  "turnOrder": [...],
  "currentTurnIndex": 0,
  "round": 1,
  "npcs": [],
  "enemies": [],
  "flags": {},
  "turn": 0,
  "history_summary": "",
  "recent_turns": [
    { "turn": 1, "action": "", "narration": "", "event": "" }
  ]
}
```

### Database Schema
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  game_system TEXT NOT NULL,
  tone INTEGER DEFAULT 65,
  created_at DATETIME,
  updated_at DATETIME
);

CREATE TABLE game_state (
  session_id TEXT PRIMARY KEY,
  state JSON NOT NULL,
  turn INTEGER DEFAULT 0,
  mode TEXT DEFAULT 'exploration',
  updated_at DATETIME
);

CREATE TABLE turns (
  id INTEGER PRIMARY KEY,
  session_id TEXT,
  turn_number INTEGER,
  player_action TEXT,
  ai_response JSON,
  state_delta JSON,
  created_at DATETIME
);
```

## Configuration

### Constants (`backend/src/config/constants.js`)
```javascript
GAME_SYSTEMS: { dnd5e, pathfinder, scifi, horror, cyberpunk, free }
AI_TEMPERATURE: { dnd5e: 0.8, pathfinder: 0.75, scifi: 0.65, horror: 0.9, ... }
TONE_DESCRIPTORS: [heroic(0-20), epic(20-40), gritty(40-60), dark(60-80), nihilistic(80-100)]
MAX_NARRATION_WORDS: 200
RECENT_TURNS_WINDOW: 5
COMPRESS_EVERY_N_TURNS: 10
MAX_OPTIONS: 3
```

### AI Config (`backend/src/config/ai.js`)
- Model: Gemini 2.0 Flash
- Base URL: `https://generativelanguage.googleapis.com/v1beta/models`
- Temperature: System-dependent (0.65-0.9)
- Max Output: 1024 tokens
- Response Format: JSON

## Prompt Templates

### Base System (`ai-engine/prompts/system.base.txt`)
- DM identity rules (4th wall, no AI references)
- Narrative rules (descriptive, present tense)
- Output contract (JSON format, 3 options)

### System Templates (`ai-engine/prompts/templates/`)
- `dnd5e.txt` - D&D 5e specific rules
- `pathfinder.txt` - Pathfinder 2e specific
- `scifi.txt` - Sci-fi settings
- `horror.txt` - Horror genre rules
- `cyberpunk.txt` - Cyberpunk setting
- `free.txt` - Open narrative

## Optimization Strategies

### Token Reduction
1. **Prompt Truncation**: History summary truncated to 500 chars
2. **Simplified Labels**: "CHAR:" vs "CHARACTER:", "T1:" vs "[T1]"
3. **Conditional Sections**: Skip empty arrays (enemies, npcs)
4. **Cache Templates**: Map-based template caching

### Memory Optimization
1. **Lazy JSON Parse**: Parse AI responses only when needed
2. **Windowed Turns**: Keep only last 5 in recent_turns
3. **Async Compression**: Non-blocking memory cleanup
4. **Reduced Object Cloning**: Use Object.assign instead of spread

### Performance
1. **Early Returns**: Consistency validation on empty narration
2. **Regex Compilation**: Pre-compile patterns (ANACHRONISM_PATTERNS)
3. **Cache Hit**: RPG context cached per game system

## Extension Points

### New Agent
1. Create file in `backend/src/agents/`
2. Export singleton object with methods
3. Import in `orchestrator.js`
4. Add to pipeline

### New Game System
1. Add template in `ai-engine/prompts/templates/`
2. Add data to `characterData.js` (frontend)
3. Add icons to component maps (PartyWarRoom)
4. Add temperature in constants.js

### New Rule
1. Add case in `rulesEngine.js`
2. Add resolver function
3. Add action classifier regex

### New Data Source
1. Add file in `backend/src/data/`
2. Export service object
3. Import where needed (e.g., PromptBuilder)

## Testing Notes

**Key Test Scenarios**:
- Party turn advancement (multi-player)
- Combat initiative calculation
- Death save mechanics
- Memory compression triggers
- Consistency validation edge cases
- Fallback response on AI failure

**Mock Points**:
- `callAI()` in narrative.js
- `getDB()` in gameState.js
- `readFileSync()` in promptBuilder.js

## File Structure Summary

```
backend/src/
├── agents/
│   ├── orchestrator.js      # Pipeline controller
│   ├── gameState.js         # DB layer
│   ├── promptBuilder.js     # Prompt assembly
│   ├── rulesEngine.js       # Game logic
│   ├── narrative.js        # AI call
│   ├── consistency.js      # Validation
│   └── memoryCompressor.js # Async compression
├── api/
│   ├── sessions.js         # Session endpoints
│   └── turns.js            # Turn endpoints
├── config/
│   ├── ai.js               # Gemini client
│   ├── constants.js        # Game constants
│   └── db.js               # DB connection
├── data/
│   └── rpgData.js          # RPG data service
└── db/
    └── schema.sql           # DB schema
```

---

*Generated: 2026-03-25*
*Last Updated: Architecture v1.0*