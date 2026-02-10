/**
 * Price Estimation Engine v2 — multi-layer approach:
 *  1. Known Model Reference DB — ~200 popular models with curated EU market prices
 *  2. Spec-based formula engine — brand × series × cpu × ram × storage × year × condition × screen × gpu
 *  3. Cross-validation — reference match adjusts formula result
 *
 * All prices in EUR, EU used-market (B2B/B2C refurbished, mainly DE/DACH).
 */

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 1: Known Model Reference Database
// Prices = average EU used price, Grade B, as of Q1 2026
// ═══════════════════════════════════════════════════════════════════════════════

interface ModelRef {
  /** Fuzzy-match tokens (lowercase) — any query containing ALL of these matches */
  tokens: string[]
  /** Reference price Grade B, EUR */
  priceB: number
  /** Year of release (for depreciation calibration) */
  year: number
  /** Category for context */
  cat: 'laptop' | 'desktop' | 'tablet' | 'aio'
}

const MODEL_DB: ModelRef[] = [
  // ─── Apple MacBook Pro ───
  { tokens: ['macbook', 'pro', '14', 'm4', 'max'], priceB: 2800, year: 2024, cat: 'laptop' },
  { tokens: ['macbook', 'pro', '14', 'm4', 'pro'], priceB: 1900, year: 2024, cat: 'laptop' },
  { tokens: ['macbook', 'pro', '14', 'm4'], priceB: 1500, year: 2024, cat: 'laptop' },
  { tokens: ['macbook', 'pro', '16', 'm4', 'max'], priceB: 3100, year: 2024, cat: 'laptop' },
  { tokens: ['macbook', 'pro', '16', 'm4', 'pro'], priceB: 2200, year: 2024, cat: 'laptop' },
  { tokens: ['macbook', 'pro', '14', 'm3', 'max'], priceB: 2400, year: 2023, cat: 'laptop' },
  { tokens: ['macbook', 'pro', '14', 'm3', 'pro'], priceB: 1600, year: 2023, cat: 'laptop' },
  { tokens: ['macbook', 'pro', '14', 'm3'], priceB: 1250, year: 2023, cat: 'laptop' },
  { tokens: ['macbook', 'pro', '16', 'm3', 'max'], priceB: 2700, year: 2023, cat: 'laptop' },
  { tokens: ['macbook', 'pro', '16', 'm3', 'pro'], priceB: 1900, year: 2023, cat: 'laptop' },
  { tokens: ['macbook', 'pro', '14', 'm2', 'pro'], priceB: 1300, year: 2023, cat: 'laptop' },
  { tokens: ['macbook', 'pro', '14', 'm2', 'max'], priceB: 1900, year: 2023, cat: 'laptop' },
  { tokens: ['macbook', 'pro', '16', 'm2', 'pro'], priceB: 1550, year: 2023, cat: 'laptop' },
  { tokens: ['macbook', 'pro', '16', 'm2', 'max'], priceB: 2200, year: 2023, cat: 'laptop' },
  { tokens: ['macbook', 'pro', '14', 'm1', 'pro'], priceB: 1050, year: 2021, cat: 'laptop' },
  { tokens: ['macbook', 'pro', '14', 'm1', 'max'], priceB: 1400, year: 2021, cat: 'laptop' },
  { tokens: ['macbook', 'pro', '16', 'm1', 'pro'], priceB: 1200, year: 2021, cat: 'laptop' },
  { tokens: ['macbook', 'pro', '16', 'm1', 'max'], priceB: 1600, year: 2021, cat: 'laptop' },
  { tokens: ['macbook', 'pro', '13', 'm2'], priceB: 850, year: 2022, cat: 'laptop' },
  { tokens: ['macbook', 'pro', '13', 'm1'], priceB: 650, year: 2020, cat: 'laptop' },
  { tokens: ['macbook', 'pro', '15', '2019'], priceB: 550, year: 2019, cat: 'laptop' },
  { tokens: ['macbook', 'pro', '15', '2018'], priceB: 440, year: 2018, cat: 'laptop' },
  { tokens: ['macbook', 'pro', '13', '2020', 'intel'], priceB: 450, year: 2020, cat: 'laptop' },
  { tokens: ['macbook', 'pro', '13', '2019'], priceB: 380, year: 2019, cat: 'laptop' },
  { tokens: ['macbook', 'pro', '13', '2018'], priceB: 320, year: 2018, cat: 'laptop' },
  { tokens: ['macbook', 'pro', '13', '2017'], priceB: 260, year: 2017, cat: 'laptop' },
  // ─── Apple MacBook Air ───
  { tokens: ['macbook', 'air', 'm3', '15'], priceB: 1150, year: 2024, cat: 'laptop' },
  { tokens: ['macbook', 'air', 'm3'], priceB: 950, year: 2024, cat: 'laptop' },
  { tokens: ['macbook', 'air', 'm2', '15'], priceB: 900, year: 2023, cat: 'laptop' },
  { tokens: ['macbook', 'air', 'm2'], priceB: 750, year: 2022, cat: 'laptop' },
  { tokens: ['macbook', 'air', 'm1'], priceB: 550, year: 2020, cat: 'laptop' },
  { tokens: ['macbook', 'air', '2020', 'intel'], priceB: 380, year: 2020, cat: 'laptop' },
  { tokens: ['macbook', 'air', '2019'], priceB: 300, year: 2019, cat: 'laptop' },
  { tokens: ['macbook', 'air', '2018'], priceB: 260, year: 2018, cat: 'laptop' },
  // ─── Apple iMac ───
  { tokens: ['imac', '24', 'm3'], priceB: 1100, year: 2023, cat: 'aio' },
  { tokens: ['imac', '24', 'm1'], priceB: 750, year: 2021, cat: 'aio' },
  { tokens: ['imac', '27', '2020'], priceB: 800, year: 2020, cat: 'aio' },
  { tokens: ['imac', '27', '2019'], priceB: 650, year: 2019, cat: 'aio' },
  // ─── Dell Latitude ───
  { tokens: ['latitude', '5550'], priceB: 650, year: 2024, cat: 'laptop' },
  { tokens: ['latitude', '5540'], priceB: 520, year: 2023, cat: 'laptop' },
  { tokens: ['latitude', '5530'], priceB: 420, year: 2022, cat: 'laptop' },
  { tokens: ['latitude', '5520'], priceB: 340, year: 2021, cat: 'laptop' },
  { tokens: ['latitude', '5510'], priceB: 270, year: 2020, cat: 'laptop' },
  { tokens: ['latitude', '5500'], priceB: 210, year: 2019, cat: 'laptop' },
  { tokens: ['latitude', '5340'], priceB: 480, year: 2023, cat: 'laptop' },
  { tokens: ['latitude', '5330'], priceB: 400, year: 2022, cat: 'laptop' },
  { tokens: ['latitude', '5320'], priceB: 320, year: 2021, cat: 'laptop' },
  { tokens: ['latitude', '7440'], priceB: 620, year: 2023, cat: 'laptop' },
  { tokens: ['latitude', '7430'], priceB: 500, year: 2022, cat: 'laptop' },
  { tokens: ['latitude', '7420'], priceB: 400, year: 2021, cat: 'laptop' },
  { tokens: ['latitude', '7410'], priceB: 310, year: 2020, cat: 'laptop' },
  { tokens: ['latitude', '7400'], priceB: 250, year: 2019, cat: 'laptop' },
  { tokens: ['latitude', '7340'], priceB: 560, year: 2023, cat: 'laptop' },
  { tokens: ['latitude', '7330'], priceB: 450, year: 2022, cat: 'laptop' },
  { tokens: ['latitude', '9440'], priceB: 750, year: 2023, cat: 'laptop' },
  { tokens: ['latitude', '9430'], priceB: 600, year: 2022, cat: 'laptop' },
  { tokens: ['latitude', '9420'], priceB: 480, year: 2021, cat: 'laptop' },
  { tokens: ['latitude', 'e5570'], priceB: 150, year: 2016, cat: 'laptop' },
  { tokens: ['latitude', 'e5580'], priceB: 180, year: 2017, cat: 'laptop' },
  { tokens: ['latitude', 'e7470'], priceB: 140, year: 2016, cat: 'laptop' },
  { tokens: ['latitude', 'e7480'], priceB: 170, year: 2017, cat: 'laptop' },
  // ─── Dell XPS ───
  { tokens: ['xps', '13', '9340'], priceB: 750, year: 2024, cat: 'laptop' },
  { tokens: ['xps', '13', '9315'], priceB: 550, year: 2022, cat: 'laptop' },
  { tokens: ['xps', '13', '9310'], priceB: 420, year: 2020, cat: 'laptop' },
  { tokens: ['xps', '13', '9305'], priceB: 380, year: 2021, cat: 'laptop' },
  { tokens: ['xps', '15', '9530'], priceB: 800, year: 2023, cat: 'laptop' },
  { tokens: ['xps', '15', '9520'], priceB: 650, year: 2022, cat: 'laptop' },
  { tokens: ['xps', '15', '9510'], priceB: 520, year: 2021, cat: 'laptop' },
  { tokens: ['xps', '15', '9500'], priceB: 420, year: 2020, cat: 'laptop' },
  { tokens: ['xps', '17', '9730'], priceB: 1000, year: 2023, cat: 'laptop' },
  { tokens: ['xps', '17', '9720'], priceB: 800, year: 2022, cat: 'laptop' },
  // ─── Dell Precision ───
  { tokens: ['precision', '5570'], priceB: 900, year: 2022, cat: 'laptop' },
  { tokens: ['precision', '5560'], priceB: 700, year: 2021, cat: 'laptop' },
  { tokens: ['precision', '5540'], priceB: 500, year: 2019, cat: 'laptop' },
  { tokens: ['precision', '5680'], priceB: 1100, year: 2023, cat: 'laptop' },
  { tokens: ['precision', '7670'], priceB: 950, year: 2022, cat: 'laptop' },
  { tokens: ['precision', '7560'], priceB: 750, year: 2021, cat: 'laptop' },
  // ─── Dell Gaming ───
  { tokens: ['dell', 'g7', '7700'], priceB: 420, year: 2020, cat: 'laptop' },
  { tokens: ['dell', 'g7', '7790'], priceB: 380, year: 2019, cat: 'laptop' },
  { tokens: ['dell', 'g7', '7588'], priceB: 300, year: 2018, cat: 'laptop' },
  { tokens: ['dell', 'g15', '5530'], priceB: 550, year: 2023, cat: 'laptop' },
  { tokens: ['dell', 'g15', '5520'], priceB: 450, year: 2022, cat: 'laptop' },
  { tokens: ['dell', 'g15', '5510'], priceB: 380, year: 2021, cat: 'laptop' },
  { tokens: ['dell', 'g16', '7630'], priceB: 700, year: 2023, cat: 'laptop' },
  { tokens: ['dell', 'g16', '7620'], priceB: 560, year: 2022, cat: 'laptop' },
  { tokens: ['alienware', 'x17', 'r2'], priceB: 950, year: 2022, cat: 'laptop' },
  { tokens: ['alienware', 'x15', 'r2'], priceB: 800, year: 2022, cat: 'laptop' },
  { tokens: ['alienware', 'm16', 'r1'], priceB: 900, year: 2023, cat: 'laptop' },
  { tokens: ['alienware', 'm18', 'r1'], priceB: 1200, year: 2023, cat: 'laptop' },
  // ─── Dell Inspiron ───
  { tokens: ['inspiron', '15', '3520'], priceB: 240, year: 2022, cat: 'laptop' },
  { tokens: ['inspiron', '15', '3530'], priceB: 300, year: 2023, cat: 'laptop' },
  { tokens: ['inspiron', '14', '5430'], priceB: 380, year: 2023, cat: 'laptop' },
  { tokens: ['inspiron', '16', '5630'], priceB: 420, year: 2023, cat: 'laptop' },
  // ─── Dell OptiPlex ───
  { tokens: ['optiplex', '7010'], priceB: 280, year: 2023, cat: 'desktop' },
  { tokens: ['optiplex', '5000'], priceB: 250, year: 2022, cat: 'desktop' },
  { tokens: ['optiplex', '7090'], priceB: 280, year: 2021, cat: 'desktop' },
  { tokens: ['optiplex', '7080'], priceB: 230, year: 2020, cat: 'desktop' },
  { tokens: ['optiplex', '7070'], priceB: 190, year: 2019, cat: 'desktop' },
  { tokens: ['optiplex', '7060'], priceB: 160, year: 2018, cat: 'desktop' },
  // ─── Lenovo ThinkPad ───
  { tokens: ['thinkpad', 'x1', 'carbon', 'gen', '12'], priceB: 1050, year: 2024, cat: 'laptop' },
  { tokens: ['thinkpad', 'x1', 'carbon', 'gen', '11'], priceB: 850, year: 2023, cat: 'laptop' },
  { tokens: ['thinkpad', 'x1', 'carbon', 'gen', '10'], priceB: 700, year: 2022, cat: 'laptop' },
  { tokens: ['thinkpad', 'x1', 'carbon', 'gen', '9'], priceB: 550, year: 2021, cat: 'laptop' },
  { tokens: ['thinkpad', 'x1', 'carbon', 'gen', '8'], priceB: 420, year: 2020, cat: 'laptop' },
  { tokens: ['thinkpad', 'x1', 'carbon', 'gen', '7'], priceB: 320, year: 2019, cat: 'laptop' },
  { tokens: ['thinkpad', 't14s', 'gen', '4'], priceB: 650, year: 2023, cat: 'laptop' },
  { tokens: ['thinkpad', 't14s', 'gen', '3'], priceB: 520, year: 2022, cat: 'laptop' },
  { tokens: ['thinkpad', 't14s', 'gen', '2'], priceB: 400, year: 2021, cat: 'laptop' },
  { tokens: ['thinkpad', 't14s', 'gen', '1'], priceB: 310, year: 2020, cat: 'laptop' },
  { tokens: ['thinkpad', 't14', 'gen', '4'], priceB: 580, year: 2023, cat: 'laptop' },
  { tokens: ['thinkpad', 't14', 'gen', '3'], priceB: 460, year: 2022, cat: 'laptop' },
  { tokens: ['thinkpad', 't14', 'gen', '2'], priceB: 360, year: 2021, cat: 'laptop' },
  { tokens: ['thinkpad', 't14', 'gen', '1'], priceB: 280, year: 2020, cat: 'laptop' },
  { tokens: ['thinkpad', 't16', 'gen', '2'], priceB: 580, year: 2023, cat: 'laptop' },
  { tokens: ['thinkpad', 't16', 'gen', '1'], priceB: 460, year: 2022, cat: 'laptop' },
  { tokens: ['thinkpad', 't480'], priceB: 200, year: 2018, cat: 'laptop' },
  { tokens: ['thinkpad', 't480s'], priceB: 220, year: 2018, cat: 'laptop' },
  { tokens: ['thinkpad', 't490'], priceB: 260, year: 2019, cat: 'laptop' },
  { tokens: ['thinkpad', 't490s'], priceB: 280, year: 2019, cat: 'laptop' },
  { tokens: ['thinkpad', 'x13', 'gen', '3'], priceB: 480, year: 2022, cat: 'laptop' },
  { tokens: ['thinkpad', 'x13', 'gen', '2'], priceB: 380, year: 2021, cat: 'laptop' },
  { tokens: ['thinkpad', 'l14', 'gen', '3'], priceB: 340, year: 2022, cat: 'laptop' },
  { tokens: ['thinkpad', 'l14', 'gen', '2'], priceB: 270, year: 2021, cat: 'laptop' },
  { tokens: ['thinkpad', 'l14', 'gen', '1'], priceB: 210, year: 2020, cat: 'laptop' },
  { tokens: ['thinkpad', 'e14', 'gen', '5'], priceB: 380, year: 2023, cat: 'laptop' },
  { tokens: ['thinkpad', 'e14', 'gen', '4'], priceB: 310, year: 2022, cat: 'laptop' },
  { tokens: ['thinkpad', 'e14', 'gen', '3'], priceB: 250, year: 2021, cat: 'laptop' },
  { tokens: ['thinkpad', 'p14s', 'gen', '4'], priceB: 700, year: 2023, cat: 'laptop' },
  { tokens: ['thinkpad', 'p14s', 'gen', '3'], priceB: 560, year: 2022, cat: 'laptop' },
  { tokens: ['thinkpad', 'p16', 'gen', '2'], priceB: 1000, year: 2023, cat: 'laptop' },
  { tokens: ['thinkpad', 'p16', 'gen', '1'], priceB: 800, year: 2022, cat: 'laptop' },
  { tokens: ['thinkpad', 'p16s', 'gen', '2'], priceB: 700, year: 2023, cat: 'laptop' },
  { tokens: ['thinkpad', 'p16s', 'gen', '1'], priceB: 560, year: 2022, cat: 'laptop' },
  // ─── Lenovo IdeaPad / Yoga / Legion ───
  { tokens: ['ideapad', '5', '14'], priceB: 300, year: 2023, cat: 'laptop' },
  { tokens: ['ideapad', '5', '15'], priceB: 320, year: 2023, cat: 'laptop' },
  { tokens: ['ideapad', '5', 'pro'], priceB: 380, year: 2022, cat: 'laptop' },
  { tokens: ['yoga', '9i', 'gen', '8'], priceB: 700, year: 2023, cat: 'laptop' },
  { tokens: ['yoga', '7i', 'gen', '8'], priceB: 500, year: 2023, cat: 'laptop' },
  { tokens: ['yoga', 'slim', '7', 'pro'], priceB: 500, year: 2022, cat: 'laptop' },
  { tokens: ['legion', '5', 'pro', '16'], priceB: 700, year: 2023, cat: 'laptop' },
  { tokens: ['legion', '5', '15'], priceB: 520, year: 2022, cat: 'laptop' },
  { tokens: ['legion', '7', '16'], priceB: 850, year: 2023, cat: 'laptop' },
  // ─── HP EliteBook ───
  { tokens: ['elitebook', '840', 'g10'], priceB: 600, year: 2023, cat: 'laptop' },
  { tokens: ['elitebook', '840', 'g9'], priceB: 480, year: 2022, cat: 'laptop' },
  { tokens: ['elitebook', '840', 'g8'], priceB: 380, year: 2021, cat: 'laptop' },
  { tokens: ['elitebook', '840', 'g7'], priceB: 300, year: 2020, cat: 'laptop' },
  { tokens: ['elitebook', '840', 'g6'], priceB: 230, year: 2019, cat: 'laptop' },
  { tokens: ['elitebook', '840', 'g5'], priceB: 180, year: 2018, cat: 'laptop' },
  { tokens: ['elitebook', '850', 'g10'], priceB: 650, year: 2023, cat: 'laptop' },
  { tokens: ['elitebook', '850', 'g8'], priceB: 410, year: 2021, cat: 'laptop' },
  { tokens: ['elitebook', '860', 'g10'], priceB: 680, year: 2023, cat: 'laptop' },
  { tokens: ['elitebook', '860', 'g9'], priceB: 540, year: 2022, cat: 'laptop' },
  { tokens: ['elitebook', '1040', 'g10'], priceB: 800, year: 2023, cat: 'laptop' },
  { tokens: ['elitebook', '1040', 'g9'], priceB: 650, year: 2022, cat: 'laptop' },
  { tokens: ['elitebook', '1030', 'g4'], priceB: 400, year: 2021, cat: 'laptop' },
  { tokens: ['elitebook', 'x360', '1040', 'g10'], priceB: 850, year: 2023, cat: 'laptop' },
  { tokens: ['elitebook', 'x360', '1040', 'g9'], priceB: 700, year: 2022, cat: 'laptop' },
  // ─── HP ProBook ───
  { tokens: ['probook', '450', 'g10'], priceB: 400, year: 2023, cat: 'laptop' },
  { tokens: ['probook', '450', 'g9'], priceB: 330, year: 2022, cat: 'laptop' },
  { tokens: ['probook', '450', 'g8'], priceB: 270, year: 2021, cat: 'laptop' },
  { tokens: ['probook', '450', 'g7'], priceB: 220, year: 2020, cat: 'laptop' },
  { tokens: ['probook', '640', 'g9'], priceB: 380, year: 2022, cat: 'laptop' },
  { tokens: ['probook', '640', 'g8'], priceB: 310, year: 2021, cat: 'laptop' },
  // ─── HP ZBook ───
  { tokens: ['zbook', 'fury', '16', 'g10'], priceB: 1100, year: 2023, cat: 'laptop' },
  { tokens: ['zbook', 'fury', '15', 'g9'], priceB: 900, year: 2022, cat: 'laptop' },
  { tokens: ['zbook', 'studio', 'g9'], priceB: 800, year: 2022, cat: 'laptop' },
  { tokens: ['zbook', 'firefly', '14', 'g9'], priceB: 550, year: 2022, cat: 'laptop' },
  { tokens: ['zbook', 'power', 'g10'], priceB: 700, year: 2023, cat: 'laptop' },
  // ─── HP Other ───
  { tokens: ['spectre', 'x360', '14'], priceB: 600, year: 2023, cat: 'laptop' },
  { tokens: ['spectre', 'x360', '16'], priceB: 700, year: 2023, cat: 'laptop' },
  { tokens: ['pavilion', '15', '2023'], priceB: 280, year: 2023, cat: 'laptop' },
  { tokens: ['omen', '16', '2023'], priceB: 650, year: 2023, cat: 'laptop' },
  { tokens: ['omen', '17', '2023'], priceB: 800, year: 2023, cat: 'laptop' },
  { tokens: ['victus', '16', '2023'], priceB: 420, year: 2023, cat: 'laptop' },
  // ─── ASUS ───
  { tokens: ['zenbook', '14', 'oled', '2023'], priceB: 550, year: 2023, cat: 'laptop' },
  { tokens: ['zenbook', '14', '2023'], priceB: 480, year: 2023, cat: 'laptop' },
  { tokens: ['zenbook', 'pro', '14'], priceB: 650, year: 2023, cat: 'laptop' },
  { tokens: ['zenbook', 's', '13', 'oled'], priceB: 600, year: 2023, cat: 'laptop' },
  { tokens: ['rog', 'zephyrus', 'g14', '2024'], priceB: 1100, year: 2024, cat: 'laptop' },
  { tokens: ['rog', 'zephyrus', 'g14', '2023'], priceB: 900, year: 2023, cat: 'laptop' },
  { tokens: ['rog', 'zephyrus', 'g16', '2024'], priceB: 1300, year: 2024, cat: 'laptop' },
  { tokens: ['rog', 'strix', 'g15', '2023'], priceB: 750, year: 2023, cat: 'laptop' },
  { tokens: ['rog', 'strix', 'g17', '2023'], priceB: 850, year: 2023, cat: 'laptop' },
  { tokens: ['tuf', 'gaming', 'a15', '2023'], priceB: 480, year: 2023, cat: 'laptop' },
  { tokens: ['tuf', 'gaming', 'f15', '2023'], priceB: 450, year: 2023, cat: 'laptop' },
  { tokens: ['vivobook', '15', '2023'], priceB: 280, year: 2023, cat: 'laptop' },
  { tokens: ['vivobook', 's', '14', 'oled'], priceB: 420, year: 2023, cat: 'laptop' },
  { tokens: ['expertbook', 'b5', '2023'], priceB: 500, year: 2023, cat: 'laptop' },
  { tokens: ['proart', 'studiobook', '16'], priceB: 1200, year: 2023, cat: 'laptop' },
  // ─── Microsoft Surface ───
  { tokens: ['surface', 'pro', '10'], priceB: 900, year: 2024, cat: 'tablet' },
  { tokens: ['surface', 'pro', '9'], priceB: 700, year: 2022, cat: 'tablet' },
  { tokens: ['surface', 'pro', '8'], priceB: 520, year: 2021, cat: 'tablet' },
  { tokens: ['surface', 'pro', '7'], priceB: 350, year: 2019, cat: 'tablet' },
  { tokens: ['surface', 'laptop', '6'], priceB: 800, year: 2024, cat: 'laptop' },
  { tokens: ['surface', 'laptop', '5'], priceB: 600, year: 2022, cat: 'laptop' },
  { tokens: ['surface', 'laptop', '4'], priceB: 450, year: 2021, cat: 'laptop' },
  { tokens: ['surface', 'laptop', '3'], priceB: 320, year: 2019, cat: 'laptop' },
  { tokens: ['surface', 'laptop', 'studio', '2'], priceB: 1200, year: 2023, cat: 'laptop' },
  { tokens: ['surface', 'go', '3'], priceB: 220, year: 2021, cat: 'tablet' },
  // ─── Samsung ───
  { tokens: ['galaxy', 'book', '3', 'pro', '360'], priceB: 650, year: 2023, cat: 'laptop' },
  { tokens: ['galaxy', 'book', '3', 'pro'], priceB: 550, year: 2023, cat: 'laptop' },
  { tokens: ['galaxy', 'book', '3', 'ultra'], priceB: 900, year: 2023, cat: 'laptop' },
  { tokens: ['galaxy', 'book', '3'], priceB: 400, year: 2023, cat: 'laptop' },
  { tokens: ['galaxy', 'book', '2', 'pro'], priceB: 420, year: 2022, cat: 'laptop' },
  // ─── Acer ───
  { tokens: ['swift', '5', '2023'], priceB: 480, year: 2023, cat: 'laptop' },
  { tokens: ['swift', '3', '2023'], priceB: 350, year: 2023, cat: 'laptop' },
  { tokens: ['predator', 'helios', '300', '2023'], priceB: 700, year: 2023, cat: 'laptop' },
  { tokens: ['predator', 'helios', '16', '2024'], priceB: 900, year: 2024, cat: 'laptop' },
  { tokens: ['nitro', '5', '2023'], priceB: 420, year: 2023, cat: 'laptop' },
  { tokens: ['aspire', '5', '2023'], priceB: 280, year: 2023, cat: 'laptop' },
  // ─── MSI ───
  { tokens: ['msi', 'stealth', '16'], priceB: 900, year: 2023, cat: 'laptop' },
  { tokens: ['msi', 'raider', 'ge78'], priceB: 1100, year: 2023, cat: 'laptop' },
  { tokens: ['msi', 'creator', 'z16'], priceB: 800, year: 2022, cat: 'laptop' },
  { tokens: ['msi', 'modern', '14'], priceB: 350, year: 2023, cat: 'laptop' },
  { tokens: ['msi', 'katana', '15'], priceB: 450, year: 2023, cat: 'laptop' },
]

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 2: Spec-based formula (improved v2)
// ═══════════════════════════════════════════════════════════════════════════════

const BRAND_BASE: Record<string, number> = {
  apple: 620, dell: 310, lenovo: 300, hp: 280, asus: 260, acer: 220,
  microsoft: 400, samsung: 320, huawei: 260, msi: 380, razer: 450,
  toshiba: 160, fujitsu: 180, panasonic: 200, lg: 240, google: 320,
  dynabook: 200, framework: 450,
}

const SERIES_MULT: Record<string, number> = {
  'macbook pro': 1.8, 'macbook air': 1.2, 'macbook': 1.4, 'imac': 1.5,
  'mac mini': 0.9, 'mac pro': 3.0, 'mac studio': 2.5,
  'latitude': 1.1, 'xps': 1.5, 'precision': 1.6, 'inspiron': 0.8,
  'vostro': 0.85, 'optiplex': 0.7, 'g3': 0.9, 'g5': 1.0, 'g7': 1.1,
  'g15': 1.15, 'g16': 1.2, 'alienware': 1.8,
  'thinkpad': 1.3, 'thinkpad x1': 1.7, 'thinkpad x1 carbon': 1.8,
  'thinkpad t14': 1.2, 'thinkpad t14s': 1.35, 'thinkpad t15': 1.15,
  'thinkpad t16': 1.2, 'thinkpad l14': 0.95, 'thinkpad e14': 0.85,
  'thinkpad x13': 1.3, 'thinkpad p14s': 1.4, 'thinkpad p16': 1.6,
  'thinkpad p16s': 1.35, 'ideapad': 0.75, 'yoga': 1.15, 'legion': 1.3,
  'thinkcentre': 0.6, 'thinkstation': 1.5,
  'elitebook': 1.3, 'elitebook 840': 1.25, 'elitebook 850': 1.3,
  'elitebook 860': 1.35, 'elitebook 1040': 1.5, 'probook': 0.95,
  'zbook': 1.5, 'zbook fury': 1.7, 'zbook studio': 1.5, 'zbook firefly': 1.2,
  'pavilion': 0.7, 'envy': 0.9, 'spectre': 1.4, 'omen': 1.2, 'victus': 0.85,
  'zenbook': 1.2, 'zenbook pro': 1.4, 'vivobook': 0.75, 'rog': 1.5,
  'rog zephyrus': 1.7, 'rog strix': 1.4, 'tuf': 1.0, 'expertbook': 1.1, 'proart': 1.4,
  'surface pro': 1.3, 'surface laptop': 1.2, 'surface book': 1.5, 'surface go': 0.7,
  'galaxy book': 1.1, 'galaxy book pro': 1.3, 'galaxy book ultra': 1.5,
  'stealth': 1.5, 'raider': 1.4, 'creator': 1.3, 'modern': 0.9, 'katana': 1.0,
  'swift': 1.1, 'predator': 1.4, 'nitro': 0.95, 'aspire': 0.7,
  'framework': 1.0,
}

const CPU_MULT: Record<string, number> = {
  'm4 max': 2.1, 'm4 pro': 1.85, 'm4': 1.65,
  'm3 max': 2.0, 'm3 pro': 1.7, 'm3': 1.5,
  'm2 ultra': 2.2, 'm2 max': 1.8, 'm2 pro': 1.55, 'm2': 1.35,
  'm1 ultra': 1.9, 'm1 max': 1.6, 'm1 pro': 1.45, 'm1': 1.2,
  // Intel Core Ultra (Meteor Lake / Arrow Lake)
  'ultra 9': 1.5, 'ultra 7': 1.35, 'ultra 5': 1.2,
  // Intel 14th gen
  'i9-14': 1.45, 'i7-14': 1.3, 'i5-14': 1.15, 'i3-14': 0.95,
  // Intel 13th gen
  'i9-13': 1.35, 'i7-13': 1.2, 'i5-13': 1.1, 'i3-13': 0.9,
  // Intel 12th gen
  'i9-12': 1.25, 'i7-12': 1.15, 'i5-12': 1.05, 'i3-12': 0.85,
  // Intel 11th gen
  'i9-11': 1.15, 'i7-11': 1.05, 'i5-11': 0.95, 'i3-11': 0.78,
  // Intel 10th gen
  'i7-10': 0.9, 'i5-10': 0.82, 'i3-10': 0.7,
  // Intel older
  'i7-9': 0.8, 'i5-9': 0.72, 'i7-8': 0.7, 'i5-8': 0.65,
  'i7-7': 0.6, 'i5-7': 0.55, 'i7-6': 0.5, 'i5-6': 0.45,
  // AMD Ryzen 8000
  'ryzen 9 8': 1.5, 'ryzen 7 8': 1.35, 'ryzen 5 8': 1.2,
  // AMD Ryzen 7000
  'ryzen 9 7': 1.4, 'ryzen 7 7': 1.25, 'ryzen 5 7': 1.1,
  // AMD Ryzen 6000
  'ryzen 9 6': 1.3, 'ryzen 7 6': 1.15, 'ryzen 5 6': 1.0,
  // AMD Ryzen 5000
  'ryzen 9 5': 1.2, 'ryzen 7 5': 1.05, 'ryzen 5 5': 0.92,
  // AMD Ryzen 4000
  'ryzen 7 4': 0.9, 'ryzen 5 4': 0.82,
  // AMD Ryzen 3000
  'ryzen 7 3': 0.78, 'ryzen 5 3': 0.7,
}

/** Map CPU generation → approximate release year */
const CPU_GEN_YEAR: Record<string, number> = {
  'm4': 2024, 'm4 pro': 2024, 'm4 max': 2024,
  'm3': 2023, 'm3 pro': 2023, 'm3 max': 2023,
  'm2': 2022, 'm2 pro': 2023, 'm2 max': 2023, 'm2 ultra': 2023,
  'm1': 2020, 'm1 pro': 2021, 'm1 max': 2021, 'm1 ultra': 2022,
  'ultra 9': 2024, 'ultra 7': 2024, 'ultra 5': 2024,
  'i9-14': 2024, 'i7-14': 2024, 'i5-14': 2024, 'i3-14': 2024,
  'i9-13': 2023, 'i7-13': 2023, 'i5-13': 2023, 'i3-13': 2023,
  'i9-12': 2022, 'i7-12': 2022, 'i5-12': 2022, 'i3-12': 2022,
  'i9-11': 2021, 'i7-11': 2021, 'i5-11': 2021, 'i3-11': 2021,
  'i7-10': 2020, 'i5-10': 2020, 'i3-10': 2020,
  'i7-9': 2019, 'i5-9': 2019, 'i7-8': 2018, 'i5-8': 2018,
  'i7-7': 2017, 'i5-7': 2017, 'i7-6': 2016, 'i5-6': 2016,
  'ryzen 9 8': 2024, 'ryzen 7 8': 2024, 'ryzen 5 8': 2024,
  'ryzen 9 7': 2023, 'ryzen 7 7': 2023, 'ryzen 5 7': 2023,
  'ryzen 9 6': 2022, 'ryzen 7 6': 2022, 'ryzen 5 6': 2022,
  'ryzen 9 5': 2021, 'ryzen 7 5': 2021, 'ryzen 5 5': 2021,
  'ryzen 7 4': 2020, 'ryzen 5 4': 2020,
  'ryzen 7 3': 2019, 'ryzen 5 3': 2019,
}

const CONDITION_MULT: Record<string, number> = {
  new: 1.7, 'like new': 1.35, 'grade a+': 1.3, 'grade a': 1.2, a: 1.2,
  'a+': 1.3, 'grade b': 1.0, b: 1.0, 'grade c': 0.75, c: 0.75,
  'grade d': 0.55, d: 0.55, good: 1.05, fair: 0.8, poor: 0.6,
  defective: 0.3, refurbished: 1.15,
}

/* GPU premium multiplier */
const GPU_MULT: Record<string, number> = {
  // NVIDIA RTX 40xx
  'rtx 4090': 1.6, 'rtx 4080': 1.45, 'rtx 4070': 1.3, 'rtx 4060': 1.2, 'rtx 4050': 1.12,
  // NVIDIA RTX 30xx
  'rtx 3080': 1.35, 'rtx 3070': 1.25, 'rtx 3060': 1.15, 'rtx 3050': 1.08,
  // NVIDIA RTX 20xx
  'rtx 2080': 1.2, 'rtx 2070': 1.12, 'rtx 2060': 1.08,
  // NVIDIA GTX
  'gtx 1660': 1.05, 'gtx 1650': 1.03, 'gtx 1050': 1.0,
  // NVIDIA Quadro / RTX A-series (pro)
  'rtx a5000': 1.5, 'rtx a4000': 1.35, 'rtx a3000': 1.25, 'rtx a2000': 1.15,
  'rtx a1000': 1.08, 'rtx a500': 1.05,
  'quadro rtx 5000': 1.35, 'quadro rtx 4000': 1.2, 'quadro rtx 3000': 1.12,
  // AMD
  'rx 7600': 1.1, 'rx 6700': 1.1, 'rx 6600': 1.05,
}

/* Screen size multiplier */
function screenSizeMult(inches: number): number {
  if (inches >= 17) return 1.12
  if (inches >= 16) return 1.08
  if (inches >= 15) return 1.04
  if (inches >= 14) return 1.0
  if (inches >= 13) return 0.98
  return 0.95 // 11-12"
}

function ramMultiplier(gb: number): number {
  if (gb >= 96) return 1.6
  if (gb >= 64) return 1.5
  if (gb >= 48) return 1.4
  if (gb >= 32) return 1.3
  if (gb >= 24) return 1.2
  if (gb >= 16) return 1.1
  if (gb >= 8) return 1.0
  if (gb >= 4) return 0.85
  return 0.7
}

function storageMultiplier(gb: number, type?: string): number {
  const isSsd = !type || type.toLowerCase().includes('ssd') || type.toLowerCase().includes('nvme')
  let mult = isSsd ? 1.0 : 0.85
  if (gb >= 4000) mult *= 1.35
  else if (gb >= 2000) mult *= 1.25
  else if (gb >= 1000) mult *= 1.15
  else if (gb >= 512) mult *= 1.05
  else if (gb >= 256) mult *= 1.0
  else if (gb >= 128) mult *= 0.9
  else mult *= 0.8
  return mult
}

function yearDepreciation(yearApprox: number): number {
  const currentYear = new Date().getFullYear()
  const age = currentYear - yearApprox
  if (age <= 0) return 1.3
  if (age === 1) return 1.1
  if (age === 2) return 1.0
  if (age === 3) return 0.85
  if (age === 4) return 0.72
  if (age === 5) return 0.6
  if (age === 6) return 0.5
  if (age === 7) return 0.4
  if (age === 8) return 0.33
  return Math.max(0.15, 0.33 - (age - 8) * 0.04)
}

// ═══════════════════════════════════════════════════════════════════════════════
// Parser: extract device spec from brand + model text
// ═══════════════════════════════════════════════════════════════════════════════

export interface ParsedDevice {
  brand: string
  series: string
  cpuKey: string
  gpuKey: string
  ramGb: number
  storageGb: number
  storageType: string
  screenInch: number
  yearApprox: number
  condition: string
  rawQuery: string
  /** Best matching reference model, if any */
  refMatch?: { model: ModelRef; score: number }
}

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^\w\s./]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 0)
}

/**
 * Check if query token `qt` matches ref token `rt`.
 * - Exact match always OK.
 * - Short tokens (<=3 chars) require exact match to prevent "5" matching "5540".
 * - Reject when qt.startsWith(rt) && qt.length > rt — e.g. "t14s" matches "t14" would
 *   wrongly match ref T14 when user typed T14s.
 * - Allow rt.startsWith(qt) when qt shorter — user abbreviates "t14" for "t14s".
 */
function tokenMatches(qt: string, rt: string): 'exact' | 'partial' | false {
  if (qt === rt) return 'exact'
  // Short tokens: exact only
  if (rt.length <= 3) return false
  // Reject: user typed more specific (t14s), ref has less (t14)
  if (qt.startsWith(rt) && qt.length > rt.length) return false
  // Allow: user abbreviated (t14), ref has full (t14s)
  if (rt.startsWith(qt) && qt.length < rt.length) return 'partial'
  return false
}

/** Find best matching reference model. Higher score = better match. */
function findRefModel(query: string): { model: ModelRef; score: number } | undefined {
  const qtokens = tokenize(query)
  let best: { model: ModelRef; score: number } | undefined

  for (const ref of MODEL_DB) {
    // All ref tokens must appear in query tokens
    const allMatch = ref.tokens.every(rt =>
      qtokens.some(qt => tokenMatches(qt, rt) !== false)
    )
    if (!allMatch) continue

    // Score = number of matched tokens + bonus for exact token matches
    let score = 0
    for (const rt of ref.tokens) {
      const matchType = qtokens.reduce<'exact' | 'partial' | false>((best, qt) => {
        const m = tokenMatches(qt, rt)
        if (m === 'exact') return 'exact'
        if (m === 'partial' && best !== 'exact') return 'partial'
        return best
      }, false)
      if (matchType === 'exact') score += 2
      else if (matchType === 'partial') score += 0.5
    }
    // Bonus for longer token lists (more specific models)
    score += ref.tokens.length * 0.5

    if (!best || score > best.score) {
      best = { model: ref, score }
    }
  }

  return best
}

export function parseDeviceFromQuery(brand: string, model: string): ParsedDevice {
  const full = `${brand} ${model}`.toLowerCase().trim()
  const result: ParsedDevice = {
    brand: brand.toLowerCase().trim(),
    series: '', cpuKey: '', gpuKey: '', ramGb: 0, storageGb: 0,
    storageType: 'ssd', screenInch: 0, yearApprox: 0,
    condition: 'b', rawQuery: full,
  }

  // Reference model match
  const refMatch = findRefModel(full)
  if (refMatch && refMatch.score >= 3) {
    result.refMatch = refMatch
  }

  // Detect series (longest match first)
  const seriesKeys = Object.keys(SERIES_MULT).sort((a, b) => b.length - a.length)
  for (const s of seriesKeys) {
    if (full.includes(s)) { result.series = s; break }
  }

  // ── CPU detection ──
  // Apple Silicon (M1-M4 + variant)
  const mChipMatch = full.match(/\b(m[1-4])\s*(ultra|max|pro)?\b/)
  if (mChipMatch) {
    const chip = mChipMatch[1]
    const variant = mChipMatch[2] || ''
    result.cpuKey = variant ? `${chip} ${variant}` : chip
  }
  // Intel Core Ultra
  if (!result.cpuKey) {
    const ultraMatch = full.match(/(?:core\s*)?ultra\s*([579])\s*\d{3}/i)
    if (ultraMatch) {
      result.cpuKey = `ultra ${ultraMatch[1]}`
    }
  }
  // Intel i-series with full model number
  if (!result.cpuKey) {
    const intelMatch = full.match(/\b(i[3579])[\s-]?(\d{2})\d{2,3}/)
    if (intelMatch) {
      result.cpuKey = `${intelMatch[1]}-${intelMatch[2]}`
    }
  }
  // AMD Ryzen
  if (!result.cpuKey) {
    const ryzenMatch = full.match(/ryzen\s*([3-9])\s*(\d)\d{2,3}/i)
    if (ryzenMatch) {
      result.cpuKey = `ryzen ${ryzenMatch[1]} ${ryzenMatch[2]}`
    }
  }

  // ── GPU detection ──
  const gpuKeys = Object.keys(GPU_MULT).sort((a, b) => b.length - a.length)
  for (const g of gpuKeys) {
    if (full.includes(g)) { result.gpuKey = g; break }
  }
  // Also try patterns like "4060" "3070" → RTX
  if (!result.gpuKey) {
    const rtxShort = full.match(/\b(rtx|gtx)\s*(\d{4})\b/i)
    if (rtxShort) {
      const key = `${rtxShort[1].toLowerCase()} ${rtxShort[2]}`
      if (GPU_MULT[key]) result.gpuKey = key
    }
  }

  // ── Screen size ──
  const screenMatch = full.match(/\b(11|12|13|13\.3|13\.4|14|15|15\.6|16|17|17\.3)\s*["'']?\s*(?:inch|zoll|")?\b/)
  if (screenMatch) {
    result.screenInch = parseFloat(screenMatch[1])
  }

  // ── RAM ──
  // "16GB RAM", "RAM 16GB", "16gb ddr5"
  const ramPatterns = [
    /\b(\d{1,3})\s*gb?\s*(?:ram|ddr\d?|memory|unified)/i,
    /\b(?:ram|memory)\s*(\d{1,3})\s*gb?\b/i,
  ]
  for (const rp of ramPatterns) {
    const m = full.match(rp)
    if (m) {
      const val = parseInt(m[1])
      if ([4, 8, 12, 16, 24, 32, 48, 64, 96, 128].includes(val)) { result.ramGb = val; break }
    }
  }
  // Slash pattern "16/512"
  if (!result.ramGb) {
    const slashMatch = full.match(/\b(\d{1,3})\/(\d{2,4})\b/)
    if (slashMatch) {
      const possibleRam = parseInt(slashMatch[1])
      const possibleStorage = parseInt(slashMatch[2])
      if ([4, 8, 16, 32, 64, 128].includes(possibleRam)) {
        result.ramGb = possibleRam
        if (possibleStorage >= 64) result.storageGb = possibleStorage
      }
    }
  }

  // ── Storage ──
  if (!result.storageGb) {
    const tbMatch = full.match(/\b([1-8])\s*tb\b/)
    if (tbMatch) result.storageGb = parseInt(tbMatch[1]) * 1000
  }
  if (!result.storageGb) {
    const gbMatch = full.match(/\b(\d{2,4})\s*gb?\s*(ssd|nvme|hdd|storage|emmc)?/i)
    if (gbMatch) {
      const val = parseInt(gbMatch[1])
      if (val >= 64 && val <= 8000 && val !== result.ramGb) result.storageGb = val
      if (gbMatch[2]) result.storageType = gbMatch[2].toLowerCase()
    }
  }

  // ── Year ──
  const yearMatch = full.match(/\b(20[1-2]\d)\b/)
  if (yearMatch) {
    result.yearApprox = parseInt(yearMatch[1])
  }
  // Infer year from CPU generation if not explicitly stated
  if (!result.yearApprox && result.cpuKey && CPU_GEN_YEAR[result.cpuKey]) {
    result.yearApprox = CPU_GEN_YEAR[result.cpuKey]
  }
  // Infer from reference model
  if (!result.yearApprox && result.refMatch) {
    result.yearApprox = result.refMatch.model.year
  }

  // ── Condition ──
  const condMatch = full.match(/\b(grade\s*[a-d]\+?|refurbished|like\s*new|new|good|fair|poor)\b/i)
  if (condMatch) {
    result.condition = condMatch[1].toLowerCase()
  }

  return result
}

// ═══════════════════════════════════════════════════════════════════════════════
// Price calculation
// ═══════════════════════════════════════════════════════════════════════════════

export interface PriceEstimate {
  low: number
  mid: number
  high: number
  confidence: number   // 0-100
  source: 'estimate'
  factors: string[]
  refModelUsed?: string
}

export function estimatePrice(device: ParsedDevice): PriceEstimate {
  const factors: string[] = []
  let confidence = 25

  // ── Path A: Reference model match (highest accuracy) ──
  if (device.refMatch && device.refMatch.score >= 4) {
    const ref = device.refMatch.model
    let price = ref.priceB
    confidence = 65

    factors.push(`Ref model: ${ref.tokens.join(' ')} → ${ref.priceB}€ (Grade B, ${ref.year})`)

    // Adjust for condition
    const condMult = CONDITION_MULT[device.condition] ?? 1.0
    if (device.condition !== 'b' && CONDITION_MULT[device.condition]) {
      price = Math.round(price * condMult)
      factors.push(`Condition: ${device.condition} (×${condMult})`)
    }

    // Adjust for RAM if significantly different from typical
    if (device.ramGb > 0) {
      const rMult = ramMultiplier(device.ramGb)
      if (Math.abs(rMult - 1.0) > 0.05) {
        price = Math.round(price * rMult)
        factors.push(`RAM: ${device.ramGb}GB (×${rMult})`)
      }
      confidence += 5
    }

    // Adjust for storage
    if (device.storageGb > 0) {
      const sMult = storageMultiplier(device.storageGb, device.storageType)
      if (Math.abs(sMult - 1.0) > 0.05) {
        price = Math.round(price * sMult)
        factors.push(`Storage: ${device.storageGb}GB (×${sMult.toFixed(2)})`)
      }
      confidence += 5
    }

    // Adjust for GPU if gaming/workstation
    if (device.gpuKey && GPU_MULT[device.gpuKey]) {
      const gMult = GPU_MULT[device.gpuKey]
      if (gMult > 1.05) {
        price = Math.round(price * gMult)
        factors.push(`GPU: ${device.gpuKey} (×${gMult})`)
        confidence += 5
      }
    }

    confidence = Math.min(confidence, 85)
    const spread = confidence >= 70 ? 0.12 : 0.18
    return {
      low: Math.round(price * (1 - spread)),
      mid: price,
      high: Math.round(price * (1 + spread)),
      confidence,
      source: 'estimate',
      factors,
      refModelUsed: ref.tokens.join(' '),
    }
  }

  // ── Path B: Formula-based calculation ──
  const brandBase = BRAND_BASE[device.brand] ?? 280
  if (BRAND_BASE[device.brand]) {
    factors.push(`Brand: ${device.brand} (base ${brandBase}€)`)
    confidence += 8
  } else {
    factors.push(`Brand: unknown → default 280€ base`)
  }

  let seriesMult = 1.0
  if (device.series && SERIES_MULT[device.series]) {
    seriesMult = SERIES_MULT[device.series]
    factors.push(`Series: ${device.series} (×${seriesMult})`)
    confidence += 12
  }

  let cpuMult = 1.0
  if (device.cpuKey && CPU_MULT[device.cpuKey]) {
    cpuMult = CPU_MULT[device.cpuKey]
    factors.push(`CPU: ${device.cpuKey} (×${cpuMult})`)
    confidence += 10
  }

  let gpuMult = 1.0
  if (device.gpuKey && GPU_MULT[device.gpuKey]) {
    gpuMult = GPU_MULT[device.gpuKey]
    factors.push(`GPU: ${device.gpuKey} (×${gpuMult})`)
    confidence += 5
  }

  let rMult = 1.0
  if (device.ramGb > 0) {
    rMult = ramMultiplier(device.ramGb)
    factors.push(`RAM: ${device.ramGb}GB (×${rMult})`)
    confidence += 5
  }

  let sMult = 1.0
  if (device.storageGb > 0) {
    sMult = storageMultiplier(device.storageGb, device.storageType)
    factors.push(`Storage: ${device.storageGb}GB (×${sMult.toFixed(2)})`)
    confidence += 5
  }

  let scrMult = 1.0
  if (device.screenInch > 0) {
    scrMult = screenSizeMult(device.screenInch)
    factors.push(`Screen: ${device.screenInch}" (×${scrMult})`)
    confidence += 3
  }

  let yearMult = 1.0
  if (device.yearApprox > 0) {
    yearMult = yearDepreciation(device.yearApprox)
    const source = device.cpuKey && CPU_GEN_YEAR[device.cpuKey] === device.yearApprox ? 'from CPU' : 'explicit'
    factors.push(`Year: ~${device.yearApprox} (×${yearMult}) [${source}]`)
    confidence += 8
  } else {
    yearMult = 0.85
    factors.push('Year: unknown → assumed 3y old (×0.85)')
  }

  const condMult = CONDITION_MULT[device.condition] ?? 1.0
  if (CONDITION_MULT[device.condition]) {
    factors.push(`Condition: ${device.condition} (×${condMult})`)
    confidence += 4
  }

  // Apply weak reference model signal if we have a partial match
  let refAdjust = 1.0
  if (device.refMatch && device.refMatch.score >= 3) {
    const refPrice = device.refMatch.model.priceB
    const formulaRaw = brandBase * seriesMult * cpuMult * gpuMult * rMult * sMult * scrMult * yearMult * condMult
    // Blend 30% toward reference price
    const blended = formulaRaw * 0.7 + refPrice * condMult * 0.3
    refAdjust = blended / formulaRaw
    if (Math.abs(refAdjust - 1.0) > 0.01) {
      factors.push(`Ref hint: ${device.refMatch.model.tokens.join(' ')} (blend ×${refAdjust.toFixed(2)})`)
      confidence += 5
    }
  }

  const mid = Math.round(brandBase * seriesMult * cpuMult * gpuMult * rMult * sMult * scrMult * yearMult * condMult * refAdjust)
  confidence = Math.min(confidence, 85)
  const spread = confidence > 55 ? 0.15 : confidence > 40 ? 0.22 : 0.30
  const low = Math.round(mid * (1 - spread))
  const high = Math.round(mid * (1 + spread))

  return { low, mid, high, confidence, source: 'estimate', factors }
}

export function quickEstimate(brand: string, model: string): PriceEstimate {
  const device = parseDeviceFromQuery(brand, model)
  return estimatePrice(device)
}

/** For cross-validation with fetched prices: adjust estimate confidence */
export function crossValidate(
  estimate: PriceEstimate,
  fetchedMid: number,
): { adjustedConfidence: number; delta: number; deltaPercent: number } {
  const delta = fetchedMid - estimate.mid
  const deltaPercent = estimate.mid > 0 ? Math.round((delta / estimate.mid) * 100) : 0
  const absPct = Math.abs(deltaPercent)

  let adjustedConfidence = estimate.confidence
  if (absPct <= 10) adjustedConfidence = Math.min(95, adjustedConfidence + 15) // very close
  else if (absPct <= 20) adjustedConfidence = Math.min(90, adjustedConfidence + 5)
  else if (absPct <= 35) adjustedConfidence = adjustedConfidence // moderate divergence
  else adjustedConfidence = Math.max(20, adjustedConfidence - 10) // large divergence

  return { adjustedConfidence, delta, deltaPercent }
}
