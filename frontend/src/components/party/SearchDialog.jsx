// frontend/src/components/party/SearchDialog.jsx
import { useState, useMemo } from 'react'
import './SearchDialog.css'

// Sample data - in production this would come from API or local data
const SAMPLE_SPELLS = [
  { name: 'Fireball', level: 3, school: 'Evocation', castingTime: '1 action', range: '150 feet', components: 'V, S, M', duration: 'Instantaneous', damage: '8d6 fire', description: 'A bright streak flashes from your pointing finger to a point you choose within range and then blossoms with a low roar into an explosion of flame.' },
  { name: 'Magic Missile', level: 1, school: 'Evocation', castingTime: '1 action', range: '120 feet', components: 'V, S', duration: 'Instantaneous', damage: '1d4+1 force', description: 'You create three glowing darts of magical force.' },
  { name: 'Cure Wounds', level: 1, school: 'Evocation', castingTime: '1 action', range: 'Touch', components: 'V, S', duration: 'Instantaneous', healing: '1d8 + modifier', description: 'A creature you touch regains a number of hit points equal to 1d8 + your spellcasting ability modifier.' },
  { name: 'Healing Word', level: 1, school: 'Evocation', castingTime: '1 bonus action', range: '60 feet', components: 'V', duration: 'Instantaneous', healing: '1d4 + modifier', description: 'A creature of your choice that you can see within range regains hit points equal to 1d4 + your spellcasting ability modifier.' },
  { name: 'Shield', level: 1, school: 'Abjuration', castingTime: '1 reaction', range: 'Self', components: 'V, S', duration: '1 round', description: 'An invisible barrier of magical force appears and protects you.' },
  { name: 'Mage Armor', level: 1, school: 'Abjuration', castingTime: '1 action', range: 'Touch', components: 'V, S, M', duration: '8 hours', description: 'You touch a willing creature who isn\'t wearing armor.' },
  { name: 'Hold Person', level: 2, school: 'Enchantment', castingTime: '1 action', range: '60 feet', components: 'V, S, M', duration: 'Concentration, up to 1 minute', description: 'Choose a humanoid that you can see within range.' },
  { name: 'Invisibility', level: 2, school: 'Illusion', castingTime: '1 action', range: 'Touch', components: 'V, S, M', duration: 'Concentration, up to 1 hour', description: 'A creature you touch becomes invisible until the spell ends.' },
  { name: 'Fire Shield', level: 4, school: 'Evocation', castingTime: '1 action', range: 'Self', components: 'V, S, M', duration: '10 minutes', description: 'Thin and warm mantle of flame wreaths your body.' },
  { name: 'Greater Invisibility', level: 4, school: 'Illusion', castingTime: '1 action', range: 'Self', components: 'V, S', duration: '1 minute', description: 'You don\'t become visible when you attack.' },
  { name: 'Cone of Cold', level: 5, school: 'Evocation', castingTime: '1 action', range: 'Self (60-foot cone)', components: 'V, S, M', duration: 'Instantaneous', damage: '8d8 cold', description: 'A blast of cold air erupts from your hands.' },
  { name: 'Teleport', level: 7, school: 'Conjuration', castingTime: '1 action', range: 'Self', components: 'V', duration: 'Instantaneous', description: 'This spell instantly transports you and up to eight other willing creatures.' },
]

const SAMPLE_MONSTERS = [
  { name: 'Goblin', type: 'Humanoid (goblinoid)', cr: '1/4', hp: 7, ac: 15, size: 'Small', alignment: 'Neutral Evil', description: 'Goblins are small, black-hearted humanoids that lair in despoiled dungeons and other dismal settings.' },
  { name: 'Wolf', type: 'Beast', cr: '1/4', hp: 11, ac: 13, size: 'Medium', alignment: 'Unaligned', description: 'A wolf hunts using its keen senses and pack tactics.' },
  { name: 'Orc', type: 'Humanoid (orc)', cr: '1/2', hp: 15, ac: 13, size: 'Medium', alignment: 'Chaotic Evil', description: 'Orcs are savage raiders and pillagers with stooped postures, low foreheads, and piggish faces.' },
  { name: 'Skeleton', type: 'Undead', cr: '1/4', hp: 13, ac: 13, size: 'Medium', alignment: 'Lawful Evil', description: 'Skeletons arise when animated by dark magic.' },
  { name: 'Zombie', type: 'Undead', cr: '1/4', hp: 22, ac: 8, size: 'Medium', alignment: 'Neutral Evil', description: 'Zombies are corpses raised by dark magic.' },
  { name: 'Bandit Captain', type: 'Humanoid (any race)', cr: '2', hp: 65, ac: 15, size: 'Medium', alignment: 'any non-lawful', description: 'A bandit captain leads a band of thieves.' },
  { name: 'Cultist', type: 'Humanoid (any race)', cr: '1/8', hp: 9, ac: 12, size: 'Medium', alignment: 'any non-good', description: 'Cultists serve dark powers.' },
  { name: 'Dire Wolf', type: 'Beast', cr: '1', hp: 37, ac: 14, size: 'Large', alignment: 'Unaligned', description: 'Dire wolves are massive wolves that hunt in packs.' },
  { name: 'Troll', type: 'Giant', cr: '5', hp: 84, ac: 15, size: 'Large', alignment: 'Chaotic Evil', description: 'Born with horrific appetites, trolls eat anything they can catch and devour.' },
  { name: 'Dragon, Adult Red', type: 'Dragon', cr: '17', hp: 256, ac: 19, size: 'Huge', alignment: 'Chaotic Evil', description: 'The most covetous of the true dragons, red dragons tirelessly seek to increase their treasure hoards.' },
]

const SAMPLE_ITEMS = [
  { name: 'Longsword', type: 'Weapon', damage: '1d8 slashing', weight: 3, value: '15 gp', description: 'A longsword is a versatile weapon.' },
  { name: 'Shield', type: 'Armor', ac: '+2', weight: 6, value: '10 gp', description: 'A shield protects a creature from attacks.' },
  { name: 'Healer\'s Kit', type: 'Equipment', weight: 3, value: '5 gp', description: 'This kit contains a variety of bandages and salves.' },
  { name: 'Ring of Protection', type: 'Wondrous Item', rarity: 'Rare', attunement: true, description: 'You gain a +1 bonus to AC and saving throws while wearing this ring.' },
  { name: 'Potion of Healing', type: 'Potion', rarity: 'Uncommon', weight: 0.5, value: '50 gp', description: 'You regain 2d4+2 hit points when you drink this potion.' },
  { name: 'Boots of Elvenkind', type: 'Wondrous Item', rarity: 'Uncommon', attunement: true, description: 'While you wear these boots, your steps make no sound.' },
]

const TABS = {
  SPELLS: 'spells',
  MONSTERS: 'monsters', 
  ITEMS: 'items'
}

export default function SearchDialog({ isOpen, onClose, onSelect }) {
  const [activeTab, setActiveTab] = useState(TABS.SPELLS)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase()
    if (!query) {
      if (activeTab === TABS.SPELLS) return SAMPLE_SPELLS.slice(0, 10)
      if (activeTab === TABS.MONSTERS) return SAMPLE_MONSTERS.slice(0, 10)
      return SAMPLE_ITEMS.slice(0, 10)
    }

    if (activeTab === TABS.SPELLS) {
      return SAMPLE_SPELLS.filter(s => 
        s.name.toLowerCase().includes(query) || 
        s.school.toLowerCase().includes(query)
      )
    }
    if (activeTab === TABS.MONSTERS) {
      return SAMPLE_MONSTERS.filter(m => 
        m.name.toLowerCase().includes(query) || 
        m.type.toLowerCase().includes(query)
      )
    }
    return SAMPLE_ITEMS.filter(i => 
      i.name.toLowerCase().includes(query) || 
      i.type.toLowerCase().includes(query)
    )
  }, [activeTab, searchQuery])

  if (!isOpen) return null

  return (
    <div className="search-dialog-overlay" onClick={onClose}>
      <div className="search-dialog" onClick={e => e.stopPropagation()}>
        <div className="search-dialog__header">
          <h2><i className="ra ra-hammer" /> Reference Database</h2>
          <button className="search-dialog__close" onClick={onClose}>
            <i className="ra ra-cancel" />
          </button>
        </div>

        <div className="search-dialog__tabs">
          <button 
            className={`search-dialog__tab ${activeTab === TABS.SPELLS ? 'search-dialog__tab--active' : ''}`}
            onClick={() => setActiveTab(TABS.SPELLS)}
          >
            <i className="ra ra-fire" /> Spells
          </button>
          <button 
            className={`search-dialog__tab ${activeTab === TABS.MONSTERS ? 'search-dialog__tab--active' : ''}`}
            onClick={() => setActiveTab(TABS.MONSTERS)}
          >
            <i className="ra ra-monster-skull" /> Monsters
          </button>
          <button 
            className={`search-dialog__tab ${activeTab === TABS.ITEMS ? 'search-dialog__tab--active' : ''}`}
            onClick={() => setActiveTab(TABS.ITEMS)}
          >
            <i className="ra ra-vase" /> Items
          </button>
        </div>

        <div className="search-dialog__search">
          <i className="ra ra-search" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className="search-dialog__results">
          {filteredData.map((item, index) => (
            <div key={index} className="search-dialog__item" onClick={() => onSelect(item, activeTab)}>
              {activeTab === TABS.SPELLS && (
                <>
                  <div className="search-dialog__item-header">
                    <span className="search-dialog__item-name">{item.name}</span>
                    <span className="search-dialog__item-level">Level {item.level} {item.school}</span>
                  </div>
                  <div className="search-dialog__item-details">
                    <span><i className="ra ra-clock" /> {item.castingTime}</span>
                    <span><i className="ra ra-target" /> {item.range}</span>
                    {item.damage && <span><i className="ra ra-flame" /> {item.damage}</span>}
                  </div>
                </>
              )}
              {activeTab === TABS.MONSTERS && (
                <>
                  <div className="search-dialog__item-header">
                    <span className="search-dialog__item-name">{item.name}</span>
                    <span className="search-dialog__item-level">CR {item.cr} {item.type}</span>
                  </div>
                  <div className="search-dialog__item-details">
                    <span><i className="ra ra-heart-shield" /> HP {item.hp} AC {item.ac}</span>
                    <span><i className="ra ra-pawprint" /> {item.size}</span>
                  </div>
                </>
              )}
              {activeTab === TABS.ITEMS && (
                <>
                  <div className="search-dialog__item-header">
                    <span className="search-dialog__item-name">{item.name}</span>
                    <span className="search-dialog__item-level">{item.type}</span>
                  </div>
                  <div className="search-dialog__item-details">
                    {item.value && <span><i className="ra ra-gold-bar" /> {item.value}</span>}
                    {item.rarity && <span className={`search-dialog__rarity search-dialog__rarity--${item.rarity.toLowerCase()}`}>{item.rarity}</span>}
                  </div>
                </>
              )}
            </div>
          ))}
          {filteredData.length === 0 && (
            <div className="search-dialog__empty">
              <i className="ra ra-warning" />
              No results found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
