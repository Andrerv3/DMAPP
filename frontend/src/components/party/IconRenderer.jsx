// frontend/src/components/party/IconRenderer.jsx
// Reusable component for rendering RPG-Awesome icons

import {
  getSpellSchoolIcon,
  getMonsterTypeIcon,
  getItemTypeIcon,
  getClassIcon,
  getRaceIcon,
  getBackgroundIcon,
  getSkillIcon,
  getStatIcon,
  getConditionIcon,
  getDamageTypeIcon,
  getGameSystemIcon,
  getModeIcon,
} from '../../data/iconMap'

const ICON_TYPES = {
  spellSchool: getSpellSchoolIcon,
  monsterType: getMonsterTypeIcon,
  itemType: getItemTypeIcon,
  class: getClassIcon,
  race: getRaceIcon,
  background: getBackgroundIcon,
  skill: getSkillIcon,
  stat: getStatIcon,
  condition: getConditionIcon,
  damageType: getDamageTypeIcon,
  gameSystem: getGameSystemIcon,
  mode: getModeIcon,
}

export default function IconRenderer({ 
  type, 
  value, 
  icon = null,
  size = 'normal',
  className = '',
  fallback = 'ra-star'
}) {
  let iconClass = fallback

  if (icon) {
    iconClass = icon.startsWith('ra-') ? icon : `ra-${icon}`
  } else if (type && value && ICON_TYPES[type]) {
    const iconGetter = ICON_TYPES[type]
    iconClass = iconGetter(value) || fallback
  }

  const sizeClass = {
    small: 'icon--small',
    normal: 'icon--normal',
    large: 'icon--large',
    xlarge: 'icon--xlarge',
  }[size] || 'icon--normal'

  return (
    <i 
      className={`ra ${iconClass} icon ${sizeClass} ${className}`}
      aria-hidden="true"
    />
  )
}

export function Icon({ icon, size = 'normal', className = '' }) {
  if (!icon) return null
  
  const iconClass = icon.startsWith('ra-') ? icon : `ra-${icon}`
  
  const sizeClass = {
    small: 'icon--small',
    normal: 'icon--normal', 
    large: 'icon--large',
    xlarge: 'icon--xlarge',
  }[size] || 'icon--normal'

  return (
    <i 
      className={`ra ${iconClass} icon ${sizeClass} ${className}`}
      aria-hidden="true"
    />
  )
}
