/**
 * Curated product photos from Unsplash CDN — mapped by brand + category.
 * Uses auto=format&fit=crop&q=85 for high-quality, properly cropped images.
 */

const U = 'https://images.unsplash.com'
const Q = '&auto=format&fit=crop&q=85&crop=entropy'

/** Curated laptop photos — clean product shots */
const LAPTOPS: Record<string, string[]> = {
  Apple: [
    `${U}/photo-1517336714731-489689fd1ca8?w=600&h=400${Q}`,  // MacBook Pro silver on desk
    `${U}/photo-1611186871348-b1ce696e52c9?w=600&h=400${Q}`,  // MacBook Air M1 open
    `${U}/photo-1541807084-5c52b6b3adef?w=600&h=400${Q}`,  // MacBook side angle
    `${U}/photo-1629131726692-1accd0c53ce0?w=600&h=400${Q}`,  // MacBook Pro 14" notch
    `${U}/photo-1587033411391-5d9e51cce126?w=600&h=400${Q}`,  // MacBook setup workspace
    `${U}/photo-1580522154071-c6ca47a859ad?w=600&h=400${Q}`,  // MacBook keyboard detail
  ],
  Dell: [
    `${U}/photo-1588872657578-7efd1f1555ed?w=600&h=400${Q}`,  // Dell laptop silver
    `${U}/photo-1593642632559-0c6d3fc62b89?w=600&h=400${Q}`,  // Laptop workspace clean
    `${U}/photo-1496181133206-80ce9b88a853?w=600&h=400${Q}`,  // Dell silver minimal
    `${U}/photo-1525547719571-a2d4ac8945e2?w=600&h=400${Q}`,  // Laptop office desk
  ],
  Lenovo: [
    `${U}/photo-1588702547923-7093a6c3ba33?w=600&h=400${Q}`,  // ThinkPad black
    `${U}/photo-1602080858428-57174f9431cf?w=600&h=400${Q}`,  // Black laptop side
    `${U}/photo-1593642632559-0c6d3fc62b89?w=600&h=400${Q}`,  // Business laptop
    `${U}/photo-1531297484001-80022131f5a1?w=600&h=400${Q}`,  // Workspace minimal
  ],
  HP: [
    `${U}/photo-1525547719571-a2d4ac8945e2?w=600&h=400${Q}`,  // HP style laptop
    `${U}/photo-1496181133206-80ce9b88a853?w=600&h=400${Q}`,  // Silver clean
    `${U}/photo-1588872657578-7efd1f1555ed?w=600&h=400${Q}`,  // Work laptop
  ],
  _default: [
    `${U}/photo-1496181133206-80ce9b88a853?w=600&h=400${Q}`,
    `${U}/photo-1525547719571-a2d4ac8945e2?w=600&h=400${Q}`,
    `${U}/photo-1588872657578-7efd1f1555ed?w=600&h=400${Q}`,
    `${U}/photo-1593642632559-0c6d3fc62b89?w=600&h=400${Q}`,
  ],
}

/** Monitors — clean product shots */
const MONITORS = [
  `${U}/photo-1527443224154-c4a3942d3acf?w=600&h=400${Q}`,  // Dell monitor
  `${U}/photo-1585792180666-f7347c490ee2?w=600&h=400${Q}`,  // Ultra-wide
  `${U}/photo-1616763355548-1b11cea702ae?w=600&h=400${Q}`,  // Curved monitor
  `${U}/photo-1593640408182-31c70c8268f5?w=600&h=400${Q}`,  // iMac
]

/** Phones */
const PHONES = [
  `${U}/photo-1592750475338-74b7b21085ab?w=600&h=400${Q}`,  // iPhone
  `${U}/photo-1511707171634-5f897ff02aa9?w=600&h=400${Q}`,  // Phone in hand
  `${U}/photo-1580910051074-3eb694886571?w=600&h=400${Q}`,  // iPhone desk
  `${U}/photo-1605236453806-6ff36851218e?w=600&h=400${Q}`,  // Samsung
]

/** Tablets */
const TABLETS = [
  `${U}/photo-1544244015-0df4b3ffc6b0?w=600&h=400${Q}`,  // iPad
  `${U}/photo-1585790050230-5dd28404ccb9?w=600&h=400${Q}`,  // Tablet work
  `${U}/photo-1561154464-82e6b0dc1b63?w=600&h=400${Q}`,  // iPad Pro
]

/** Desktops */
const DESKTOPS = [
  `${U}/photo-1587831990711-23ca6441447b?w=600&h=400${Q}`,  // Mac Mini
  `${U}/photo-1593640408182-31c70c8268f5?w=600&h=400${Q}`,  // iMac
  `${U}/photo-1547082299-de196ea013d6?w=600&h=400${Q}`,  // Desktop setup
]

/** Components */
const COMPONENTS = [
  `${U}/photo-1591799264318-7e6ef8ddb7ea?w=600&h=400${Q}`,  // RAM modules
  `${U}/photo-1555617981-dac3880eac6e?w=600&h=400${Q}`,  // SSD
  `${U}/photo-1518770660439-4636190af475?w=600&h=400${Q}`,  // Motherboard
  `${U}/photo-1587202372775-e229f172b9d7?w=600&h=400${Q}`,  // GPU
]

/**
 * Pick a demo image URL based on item brand, category and a stable index.
 */
export function getDemoImageUrl(index: number, brand?: string, category?: string): string {
  const cat = (category || '').toLowerCase()

  if (cat.includes('монітор') || cat.includes('монитор') || cat.includes('monitor') || cat.includes('дисплей') || cat.includes('display')) {
    return MONITORS[index % MONITORS.length]
  }
  if (cat.includes('телефон') || cat.includes('phone') || cat.includes('iphone') || cat.includes('смартфон')) {
    return PHONES[index % PHONES.length]
  }
  if (cat.includes('планшет') || cat.includes('tablet') || cat.includes('ipad')) {
    return TABLETS[index % TABLETS.length]
  }
  if (cat.includes('системн') || cat.includes('desktop') || cat.includes('mini') || cat.includes('imac')) {
    return DESKTOPS[index % DESKTOPS.length]
  }
  if (cat.includes('комплект') || cat.includes('плат') || cat.includes('component') || cat.includes('board') || cat.includes('запчаст')) {
    return COMPONENTS[index % COMPONENTS.length]
  }

  const brandKey = brand || '_default'
  const pool = LAPTOPS[brandKey] || LAPTOPS._default
  return pool[index % pool.length]
}

