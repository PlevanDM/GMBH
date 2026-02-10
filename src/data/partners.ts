/** Partner data with company details */
const BASE = 'https://restartsp.com/wp-content/uploads'

export interface Partner {
  name: string
  logo: string
  industry: string
  description: string
  scale: string
  url?: string
}

export const PARTNERS: Partner[] = [
  {
    name: 'EPAM',
    logo: `${BASE}/2024/10/epam-150x150.jpg`,
    industry: 'IT Services & Engineering',
    description: 'Global provider of digital platform engineering and software development services.',
    scale: '55,000+ employees',
    url: 'https://epam.com',
  },
  {
    name: 'Luxoft',
    logo: `${BASE}/2024/05/luxsoft-150x150.png`,
    industry: 'IT Consulting & Solutions',
    description: 'DXC Technology company delivering digital strategy, engineering, and consulting.',
    scale: '13,000+ employees',
    url: 'https://luxoft.com',
  },
  {
    name: 'SoftServe',
    logo: `${BASE}/2024/05/softserve-150x150.png`,
    industry: 'IT Consulting & Digital',
    description: 'Digital authority advising and providing software engineering and consulting services.',
    scale: '14,000+ employees',
    url: 'https://softserveinc.com',
  },
  {
    name: 'Ciklum',
    logo: `${BASE}/2024/05/ciklum-150x150.png`,
    industry: 'Software Engineering',
    description: 'Global digital solutions company delivering custom software engineering and innovation.',
    scale: '4,000+ employees',
    url: 'https://ciklum.com',
  },
  {
    name: 'inDrive',
    logo: `${BASE}/2024/05/in_drive-150x150.png`,
    industry: 'Mobility & Technology',
    description: 'Global mobility and urban services platform operating in 46+ countries.',
    scale: '2,000+ employees',
    url: 'https://indrive.com',
  },
  {
    name: 'Lyft',
    logo: `${BASE}/2024/05/lyft-150x150.png`,
    industry: 'Mobility & Transportation',
    description: 'Leading ride-sharing and multimodal transportation platform in North America.',
    scale: '4,000+ employees',
    url: 'https://lyft.com',
  },
  {
    name: 'About You',
    logo: `${BASE}/2024/05/about_you-150x150.png`,
    industry: 'E-Commerce & Fashion',
    description: 'European fashion and technology company with a personalized shopping experience.',
    scale: '1,400+ employees',
    url: 'https://aboutyou.com',
  },
  {
    name: 'Outfittery',
    logo: `${BASE}/2024/05/outfittery-150x150.png`,
    industry: 'E-Commerce & Fashion',
    description: 'Personal styling service combining data science with expert styling.',
    scale: '250+ employees',
    url: 'https://outfittery.de',
  },
  {
    name: 'Provectus',
    logo: `${BASE}/2024/05/provectus-150x150.png`,
    industry: 'AI & Cloud Engineering',
    description: 'AI-first consultancy helping enterprises adopt machine learning and cloud.',
    scale: '400+ employees',
    url: 'https://provectus.com',
  },
  {
    name: 'Solvd',
    logo: `${BASE}/2024/05/solvd-150x150.png`,
    industry: 'QA & Software Testing',
    description: 'Software testing and quality assurance services for enterprise applications.',
    scale: '600+ employees',
    url: 'https://solvd.com',
  },
  {
    name: 'Miratech',
    logo: `${BASE}/2024/05/miratech-150x150.png`,
    industry: 'IT Services & Digital',
    description: 'Global technology company delivering software engineering and IT services.',
    scale: '3,000+ employees',
    url: 'https://miratech.com',
  },
]
