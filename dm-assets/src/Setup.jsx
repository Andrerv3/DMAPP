// frontend/src/pages/Setup.jsx
// Fantasy-themed setup page — uses theme-fantasy.css classes
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../stores/session.js'

const GAME_SYSTEMS = [
  { id: 'dnd5e',      label: 'D&D 5e',      icon: 'dnd5e' },
  { id: 'pathfinder', label: 'Pathfinder',   icon: 'pathfinder' },
  { id: 'scifi',      label: 'Sci-Fi',       icon: 'scifi' },
  { id: 'horror',     label: 'Horror',       icon: 'horror' },
  { id: 'cyberpunk',  label: 'Cyberpunk',    icon: 'cyberpunk' },
  { id: 'free',       label: 'Free Form',    icon: 'freeform' },
]

const TONE_LABELS = ['Heroic', 'Epic', 'Gritty', 'Dark', 'Brutal']

const DEFAULT_FORM = {
  game_system: 'dnd5e',
  tone: 55,
  world: { name: '', setting: '', current_location: '' },
  character: { name: '', class: '', race: '', background: '', level: 1, hp: 20, max_hp: 20, mana: 10,
    stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }, inventory: [] },
}

// SVG icon per system — inline for zero HTTP requests
const ICONS = {
  dnd5e: (
    <svg viewBox="0 0 44 44" fill="none" width="44" height="44">
      <path d="M22 4C22 4 18 8 14 10C10 12 6 11 6 11C6 11 8 15 8 20C8 28 14 34 22 38C30 34 36 28 36 20C36 15 38 11 38 11C38 11 34 12 30 10C26 8 22 4 22 4Z" fill="#1c1204" stroke="#d4a017" strokeWidth="1.5"/>
      <path d="M22 9C22 9 19 12 16.5 13.5C14 15 12 14.5 12 14.5C12 14.5 13 17 13 20C13 26 17 30.5 22 33C27 30.5 31 26 31 20C31 17 32 14.5 32 14.5C32 14.5 30 15 27.5 13.5C25 12 22 9 22 9Z" fill="#141008" stroke="#a07010" strokeWidth="0.8"/>
      <text x="22" y="28" textAnchor="middle" fontFamily="Cinzel,serif" fontSize="9" fontWeight="700" fill="#d4a017">D&D</text>
    </svg>
  ),
  pathfinder: (
    <svg viewBox="0 0 44 44" fill="none" width="44" height="44">
      <path d="M22 6L36 16L34 30L22 38L10 30L8 16Z" fill="#141008" stroke="#8a6a18" strokeWidth="1.2"/>
      <line x1="15" y1="15" x2="29" y2="29" stroke="#c8961e" strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="29" y1="15" x2="15" y2="29" stroke="#c8961e" strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="22" cy="22" r="3" fill="#1a1208" stroke="#d4a017" strokeWidth="1"/>
    </svg>
  ),
  scifi: (
    <svg viewBox="0 0 44 44" fill="none" width="44" height="44">
      <path d="M22 6L28 18L28 28L22 32L16 28L16 18Z" fill="#141008" stroke="#8a6a18" strokeWidth="1"/>
      <path d="M22 6L26 16L22 18L18 16Z" fill="#1e1508" stroke="#d4a017" strokeWidth="0.8"/>
      <ellipse cx="22" cy="21" rx="3" ry="4" fill="#0a0808" stroke="#a07010" strokeWidth="0.8"/>
      <path d="M16 28L10 34L16 32ZM28 28L34 34L28 32Z" fill="#1a1008" stroke="#5a4010" strokeWidth="0.8"/>
    </svg>
  ),
  horror: (
    <svg viewBox="0 0 44 44" fill="none" width="44" height="44">
      <path d="M14 22C14 16 17.5 10 22 10C26.5 10 30 16 30 22L30 36L26 33L22 36L18 33L14 36Z" fill="#141008" stroke="#8a6a18" strokeWidth="1.2"/>
      <circle cx="18.5" cy="22" r="2.5" fill="#0a0808" stroke="#6a5018" strokeWidth="0.8"/>
      <circle cx="25.5" cy="22" r="2.5" fill="#0a0808" stroke="#6a5018" strokeWidth="0.8"/>
      <path d="M18 27Q22 30 26 27" fill="none" stroke="#5a4010" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  ),
  cyberpunk: (
    <svg viewBox="0 0 44 44" fill="none" width="44" height="44">
      <circle cx="22" cy="22" r="14" fill="#0d0c08" stroke="#3a3010" strokeWidth="1"/>
      <path d="M22 8C22 8 22 22 22 36M8 22L36 22" stroke="#5a4810" strokeWidth="0.8"/>
      <circle cx="30" cy="14" r="4" fill="#141008" stroke="#d4a017" strokeWidth="1"/>
      <path d="M28.5 14L30 12L31.5 14L30 16Z" fill="#d4a017" opacity="0.7"/>
    </svg>
  ),
  freeform: (
    <svg viewBox="0 0 44 44" fill="none" width="44" height="44">
      <path d="M13 10C13 8 15 7 17 7L31 7C33 7 34 8 34 10L34 36C34 38 33 39 31 39L13 39C11 39 10 38 10 36L10 10Z" fill="#141008" stroke="#6a5018" strokeWidth="1"/>
      <line x1="16" y1="18" x2="28" y2="18" stroke="#5a4010" strokeWidth="1" strokeLinecap="round"/>
      <line x1="16" y1="22" x2="28" y2="22" stroke="#5a4010" strokeWidth="1" strokeLinecap="round"/>
      <line x1="16" y1="26" x2="24" y2="26" stroke="#5a4010" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  ),
}

// Reusable corner ornament
const Corner = ({ pos }) => (
  <div className={`corner-ornament ${pos}`} aria-hidden="true" />
)

export default function Setup() {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [step, setStep] = useState(1)
  const { createSession, isLoading, error } = useSessionStore()
  const navigate = useNavigate()

  const set = (path, value) => {
    setForm(prev => {
      const keys = path.split('.')
      const next = { ...prev }
      let ref = next
      for (let i = 0; i < keys.length - 1; i++) {
        ref[keys[i]] = { ...ref[keys[i]] }
        ref = ref[keys[i]]
      }
      ref[keys[keys.length - 1]] = value
      return next
    })
  }

  const toneLabel = TONE_LABELS[Math.round((form.tone / 100) * (TONE_LABELS.length - 1))]

  const handleStart = async () => {
    if (!form.character.name.trim()) return alert('Character name is required')
    const session = await createSession(form)
    if (session) navigate(`/session/${session.session_id}`)
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <svg viewBox="0 0 40 40" fill="none" width="40" height="40">
            <path d="M20 4L28 12L36 14L30 22L32 32L20 28L8 32L10 22L4 14L12 12Z" fill="none" stroke="#d4a017" strokeWidth="1.5"/>
            <text x="20" y="25" textAnchor="middle" fontFamily="Cinzel,serif" fontSize="14" fontWeight="700" fill="#d4a017">M</text>
          </svg>
        </div>
        <nav className="nav-item active"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg><span>Campaigns</span></nav>
        <nav className="nav-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg><span>Characters</span></nav>
        <nav className="nav-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20"/></svg><span>World Atlas</span></nav>
        <nav className="nav-item nav-bottom"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><circle cx="12" cy="12" r="3"/></svg><span>Settings</span></nav>
      </aside>

      {/* Main */}
      <main className="main-content">
        {/* Steps */}
        <div className="steps">
          {['Game','Party','World'].map((label, i) => (
            <>
              {i > 0 && <div className="step-connector" key={`line-${i}`} />}
              <div className="step" key={label}>
                <div className={`step-circle ${step === i+1 ? 'active' : 'inactive'}`}>{i+1}</div>
                <span className={`step-label ${step === i+1 ? 'active' : 'inactive'}`}>{label}</span>
              </div>
            </>
          ))}
        </div>

        {/* Panel */}
        <div className="panel">
          <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />

          {/* Step 1: Game System */}
          {step === 1 && <>
            <h1 className="panel-title">Choose Your Path</h1>
            <p className="section-label">Game System</p>
            <div className="game-grid">
              {GAME_SYSTEMS.map(gs => (
                <div
                  key={gs.id}
                  className={`game-card${form.game_system === gs.id ? ' selected' : ''}`}
                  onClick={() => set('game_system', gs.id)}
                >
                  <div className="game-card-icon">{ICONS[gs.icon]}</div>
                  <div className="game-card-name">{gs.label}</div>
                </div>
              ))}
            </div>

            <div className="tone-section">
              <div className="tone-header">
                <p className="section-label" style={{marginBottom:0}}>DM Tone</p>
                <span className="tone-value">{toneLabel}</span>
              </div>
              <div className="slider-wrap">
                <div className="slider-track-bg" />
                <input
                  type="range" className="dm-tone"
                  min="0" max="100" step="1"
                  value={form.tone}
                  onChange={e => set('tone', parseInt(e.target.value))}
                />
              </div>
              <div className="tone-labels">
                {TONE_LABELS.map(t => <span key={t}>{t}</span>)}
              </div>
            </div>

            <div style={{display:'flex', justifyContent:'flex-end'}}>
              <button className="btn-primary" onClick={() => setStep(2)}>Next: Create Party</button>
            </div>
          </>}

          {/* Step 2: Character */}
          {step === 2 && <>
            <h1 className="panel-title">Create Your Character</h1>
            <div style={{display:'flex', flexDirection:'column', gap:14}}>
              <div>
                <p className="section-label">Character Name</p>
                <input type="text" placeholder="Enter name..." value={form.character.name} onChange={e => set('character.name', e.target.value)} />
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10}}>
                <div><p className="section-label">Race</p><input type="text" placeholder="Human..." value={form.character.race} onChange={e => set('character.race', e.target.value)} /></div>
                <div><p className="section-label">Class</p><input type="text" placeholder="Fighter..." value={form.character.class} onChange={e => set('character.class', e.target.value)} /></div>
                <div><p className="section-label">Background</p><input type="text" placeholder="Acolyte..." value={form.character.background} onChange={e => set('character.background', e.target.value)} /></div>
              </div>
              <div>
                <p className="section-label">Ability Scores</p>
                <div style={{display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:8}}>
                  {['str','dex','con','int','wis','cha'].map(stat => {
                    const val = form.character.stats[stat] ?? 10
                    const mod = Math.floor((val - 10) / 2)
                    return (
                      <div key={stat} className="stat-box">
                        <span className="stat-abbr">{stat.toUpperCase()}</span>
                        <input type="number" min="1" max="30" value={val}
                          onChange={e => set(`character.stats.${stat}`, parseInt(e.target.value) || 10)}
                          style={{background:'transparent', border:'none', color:'#e8e0d0', fontFamily:'Cinzel,serif', fontSize:22, fontWeight:700, textAlign:'center', width:'100%', padding:0}} />
                        <span className={`stat-mod ${mod >= 0 ? 'positive' : 'negative'}`}>{mod >= 0 ? '+' : ''}{mod}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                <div><p className="section-label">Max HP</p><input type="number" min="1" value={form.character.max_hp} onChange={e => { const v = parseInt(e.target.value); set('character.max_hp', v); set('character.hp', v); }} /></div>
                <div><p className="section-label">Mana / SP</p><input type="number" min="0" value={form.character.mana} onChange={e => set('character.mana', parseInt(e.target.value))} /></div>
              </div>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', marginTop:24}}>
              <button className="btn-primary" style={{background:'transparent', border:'1px solid #3a2e10', color:'#8a7030'}} onClick={() => setStep(1)}>← Back</button>
              <button className="btn-primary" onClick={() => setStep(3)}>Next: Define World</button>
            </div>
          </>}

          {/* Step 3: World */}
          {step === 3 && <>
            <h1 className="panel-title">Define Your World</h1>
            <div style={{display:'flex', flexDirection:'column', gap:14}}>
              <div><p className="section-label">World Name</p><input type="text" placeholder="Arathos, The Shattered Realm..." value={form.world.name} onChange={e => set('world.name', e.target.value)} /></div>
              <div><p className="section-label">Setting & Lore</p><textarea rows={4} placeholder="Describe the world, its history, the current conflict..." value={form.world.setting} onChange={e => set('world.setting', e.target.value)} /></div>
              <div><p className="section-label">Starting Location</p><input type="text" placeholder="The tavern at the edge of the Darkwood..." value={form.world.current_location} onChange={e => set('world.current_location', e.target.value)} /></div>
            </div>
            {error && <div style={{marginTop:12, padding:'8px 12px', background:'#1a0808', border:'1px solid #5a1a1a', borderRadius:3, color:'#c06060', fontFamily:'Cinzel,serif', fontSize:12}}>{error}</div>}
            <div style={{display:'flex', justifyContent:'space-between', marginTop:24}}>
              <button className="btn-primary" style={{background:'transparent', border:'1px solid #3a2e10', color:'#8a7030'}} onClick={() => setStep(2)}>← Back</button>
              <button className="btn-primary" onClick={handleStart} disabled={isLoading}>
                {isLoading ? 'Summoning the DM...' : 'Begin Adventure ⚔'}
              </button>
            </div>
          </>}
        </div>
      </main>
    </div>
  )
}
