# Dev Guide

## Agent Interaction Rules

1. **All agents are pure functions** — `(input) => output`. No internal state.
2. **Only GameStateAgent touches DB**. Other agents receive state as param.
3. **Orchestrator controls flow**. Never call agents directly from API routes.
4. **RulesEngine never calls AI**. Any rule that needs AI = wrong design.

## Turn Pipeline (Orchestrator)

```js
async function processTurn(sessionId, playerAction) {
  const state = await GameStateAgent.load(sessionId)          // 1. Load state
  const delta = RulesEngine.apply(playerAction, state)        // 2. Apply rules
  const updatedState = { ...state, ...delta }
  const prompt = PromptBuilder.build(updatedState, playerAction) // 3. Build prompt
  const aiResponse = await NarrativeAgent.call(prompt)        // 4. AI call
  ConsistencyAgent.validate(aiResponse, updatedState)         // 5. Validate
  await GameStateAgent.save(sessionId, updatedState, aiResponse) // 6. Persist
  if (state.turn % 10 === 0) MemoryCompressor.runAsync(sessionId) // 7. Compress
  return aiResponse
}
```

## Adding a New Game System

1. Create `ai-engine/prompts/templates/{system}.txt`
2. Add system key to `backend/src/config/constants.js → GAME_SYSTEMS`
3. Add tone/temperature mapping in `config/constants.js → TEMP_BY_SYSTEM`
4. No other changes needed — PromptBuilder picks template by `session.game_system`

## Modifying Prompts Safely

- `system.base.txt` = identity + inviolable rules. Edit with care.
- Templates = world flavor. Safe to edit freely.
- Never hardcode world context in prompts. Always inject from state.
- Test prompt changes with `backend/tests/prompt.test.js`

## Adding a New Agent

```js
// backend/src/agents/myAgent.js
export const MyAgent = {
  // role: what it does
  // input: what it receives
  // output: what it returns
  async run(input) {
    // pure logic or single AI call
    return output
  }
}
```
Register in `orchestrator.js` at the appropriate pipeline step.

## State Delta Pattern

RulesEngine returns a **delta** (only changed fields), not full state:
```js
// Good
return { player: { hp: 28 }, mode: 'combat' }

// Bad
return { ...fullState, player: { ...fullState.player, hp: 28 } }
```
Orchestrator merges delta with current state before persisting.

## Memory Compression

- Trigger: every 10 turns (non-blocking, runs after response sent)
- Input: `recent_turns[]` (last 10)
- Output: 3-sentence summary appended to `history_summary`
- Recent turns array is then cleared
- Prompt context = `history_summary` + last 5 `recent_turns`

## Consistency Validation Rules

ConsistencyAgent checks:
- [ ] `options` has exactly 3 items
- [ ] `narration` word count < 250
- [ ] No 4th-wall breaks ("as an AI", "I cannot")
- [ ] No modern language anachronisms (configurable by system)
- [ ] `state_delta` keys are valid state fields

On failure: retry once with correction prompt. On second failure: return safe fallback.

## Database Schema

```sql
sessions    (id, config JSON, created_at, updated_at)
game_state  (session_id PK, state JSON, turn INT, updated_at)
turns       (id, session_id, turn_number, action, response JSON, created_at)
characters  (id, session_id, data JSON, created_at)
```

## Token Budget (per turn)

| Component | ~Tokens |
|-----------|---------|
| Base system prompt | 200 |
| World context | 100 |
| Character state | 80 |
| History summary | 150 |
| Last 5 turns | 400 |
| Player action | 30 |
| **Total input** | **~960** |
| AI response | ~300 |
| **Per turn cost** | **~1,260** |

Gemini 2.0 Flash free tier: 1M tokens/day → ~790 turns/day free.
