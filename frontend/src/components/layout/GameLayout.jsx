// frontend/src/components/layout/GameLayout.jsx
import Header from './Header.jsx'
import Panel from './Panel.jsx'

export default function GameLayout({ 
  children,
  sessionInfo,
  leftPanel,
  centerPanel,
  rightPanel
}) {
  return (
    <div className="game-layout">
      <Header 
        title={sessionInfo?.title || 'DMAPP'}
        subtitle={sessionInfo?.subtitle}
        round={sessionInfo?.round}
        turn={sessionInfo?.turn}
      />
      
      <div className="game-layout__panels">
        <Panel position="left" className="game-layout__panel--left">
          {leftPanel}
        </Panel>
        
        <main className="game-layout__center">
          {centerPanel}
        </main>
        
        <Panel position="right" className="game-layout__panel--right">
          {rightPanel}
        </Panel>
      </div>
    </div>
  )
}
