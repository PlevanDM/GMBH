import type { InventoryItem, InventoryStatus } from '../types/inventory'
import { suggestBrandFromDescription } from './catalogs'

function status(s: string): InventoryStatus {
  const v = s.toUpperCase()
  if (v.includes('READY') && v.includes('SELL')) return 'available'
  if (v.includes('REPAIR') || v.includes('РЕМОНТ')) return 'reserved'
  return 'available'
}

interface RawRowExtra {
  brand?: string
  processor?: string
  ram_raw?: string
  gpu_raw?: string
}

function item(
  no: string,
  sn: string,
  spec: string,
  cycleBat: string,
  condition: string,
  price: number,
  saleRepair: string,
  location: string,
  notes: string,
  category: string,
  extra?: RawRowExtra
): Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    description: spec,
    brand: extra?.brand ?? suggestBrandFromDescription(spec),
    category,
    inventoryNumber: no,
    serialNumber: sn || undefined,
    condition: condition || undefined,
    status: status(saleRepair),
    price: price > 0 ? price : undefined,
    quantity: 1,
    sku: no,
    batteryCycles: cycleBat && cycleBat !== '-' ? cycleBat : undefined,
    location: location || undefined,
    notes: notes || undefined,
    processor: extra?.processor,
    ram_raw: extra?.ram_raw,
    gpu_raw: extra?.gpu_raw,
  }
}

type RawRow = {
  no: string
  sn: string
  spec: string
  cycle: string
  cond: string
  price: number
  sr: string
  loc: string
  notes: string
  processor?: string
  ram_raw?: string
  gpu_raw?: string
}

const RAW: RawRow[] = [
  { no: 'PR04', sn: 'C02X63U5JG5L \\ A1990', spec: 'MacBook Pro (15-inch, 2018) MBP 15.4 SILVER 2.2GHZ/16GB/RP 555X/256G', cycle: '291', cond: 'A', price: 400, sr: 'READY TO SELL', loc: 'UKRAINE 11/01/25', notes: '', processor: 'Intel Core i7 2.2 GHz', ram_raw: '16 GB', gpu_raw: 'Radeon Pro 555X' },
  { no: 'PR05', sn: 'C02tT805TH03Y \\ A1707', spec: 'MacBook Pro (15-inch, 2016) MBP 15.4 SILVER 2.6GHZ/16GB/RP 450/256G', cycle: '715', cond: 'B-', price: 300, sr: 'READY TO SELL', loc: 'UKRAINE 11/01/25', notes: '', processor: 'Intel Core i7 2.6 GHz', ram_raw: '16 GB', gpu_raw: 'Radeon Pro 450' },
  { no: 'PR06', sn: 'C02X63TSJG5L \\ A1990', spec: 'MacBook Pro (15-inch, 2018) MBP 15.4 SILVER 2.2GHZ/16GB/RP 555X/256G', cycle: '240', cond: 'A', price: 400, sr: 'READY TO SELL', loc: 'UKRAINE 11/01/25', notes: '', processor: 'Intel Core i7 2.2 GHz', ram_raw: '16 GB', gpu_raw: 'Radeon Pro 555X' },
  { no: 'PR07', sn: 'C02XH5MHJG5M \\ A1990', spec: 'MacBook Pro (15-inch, 2018) MBP 15.4 SILVER 2.2GHZ/16GB/RP 555X/256G', cycle: '-', cond: '-', price: 200, sr: 'REPAIR/ПЛАТА ПОСЛЕ РЕМНОТА', loc: 'UKRAINE 07/12/24', notes: 'Дислей на продажу', processor: 'Intel Core i7 2.2 GHz', ram_raw: '16 GB', gpu_raw: 'Radeon Pro 555X' },
  { no: 'PR09', sn: 'C02X11S5JG5L \\ A1990', spec: 'MacBook Pro (15-inch, 2018) MBP 15.4 SILVER 2.2GHZ/16GB/RP 555X/256G', cycle: '650', cond: 'A-', price: 350, sr: 'READY TO SELL', loc: 'UKRAINE 11/01/25', notes: '', processor: 'Intel Core i7 2.2 GHz', ram_raw: '16 GB', gpu_raw: 'Radeon Pro 555X' },
  { no: 'PR10', sn: '9S2TJ72', spec: 'Dell Latitude E5570, I7 6820HQ, 16RAM, 512SSD, RADEON R7 M360 2GB, TOUCH SCREEN', cycle: '-', cond: 'A-', price: 250, sr: 'READY TO SELL', loc: 'UKRAINE 07/12/24', notes: 'Battery not installed', processor: 'Intel Core i7 6820HQ', ram_raw: '16 GB', gpu_raw: 'AMD Radeon R7 M360 2GB' },
  { no: 'PR11', sn: 'HT2TJ72', spec: 'Dell Latitude E5570, I7 6820HQ, 16RAM, 512SSD, RADEON R7 M360 2GB, TOUCH SCREEN', cycle: '-', cond: 'B-', price: 200, sr: 'READY TO SELL', loc: 'Bucharest', notes: '', processor: 'Intel Core i7 6820HQ', ram_raw: '16 GB', gpu_raw: 'AMD Radeon R7 M360 2GB' },
  { no: 'PR12', sn: 'JL62BG2', spec: 'Dell Latitude E5570, I7 6820HQ, 16RAM, 512SSD, RADEON R7 M360 2GB, TOUCH SCREEN', cycle: '-', cond: 'B', price: 200, sr: 'READY TO SELL', loc: 'Bucharest', notes: '', processor: 'Intel Core i7 6820HQ', ram_raw: '16 GB', gpu_raw: 'AMD Radeon R7 M360 2GB' },
  { no: 'PR13', sn: 'CQS33G2', spec: 'Dell Latitude E5570, I7 6820HQ, 16RAM, 512SSD, RADEON R7 M360 2GB, TOUCH SCREEN', cycle: '-', cond: 'B', price: 200, sr: 'READY TO SELL', loc: 'UKRAINE 11/01/25', notes: '', processor: 'Intel Core i7 6820HQ', ram_raw: '16 GB', gpu_raw: 'AMD Radeon R7 M360 2GB' },
  { no: 'PR14', sn: 'JW2TJ72', spec: 'Dell Latitude E5570, I7 6820HQ, 16RAM, 512SSD, RADEON R7 M360 2GB, TOUCH SCREEN', cycle: '-', cond: 'B', price: 200, sr: 'READY TO SELL', loc: 'UKRAINE 11/01/25', notes: '', processor: 'Intel Core i7 6820HQ', ram_raw: '16 GB', gpu_raw: 'AMD Radeon R7 M360 2GB' },
  { no: 'PR15', sn: '5TZMJ72', spec: 'Dell Latitude E5570, I7 6820HQ, 16RAM, 512SSD, RADEON R7 M360 2GB, TOUCH SCREEN', cycle: '-', cond: 'B-', price: 200, sr: 'READY TO SELL', loc: 'UKRAINE 07/12/24', notes: 'Засветы на экране.', processor: 'Intel Core i7 6820HQ', ram_raw: '16 GB', gpu_raw: 'AMD Radeon R7 M360 2GB' },
  { no: 'PR16', sn: 'CTWY9G2', spec: 'Dell Latitude E5570, I7 6820HQ, 16RAM, 512SSD, RADEON R7 M360 2GB, TOUCH SCREEN', cycle: '-', cond: 'B', price: 200, sr: 'READY TO SELL', loc: 'Bucharest', notes: '', processor: 'Intel Core i7 6820HQ', ram_raw: '16 GB', gpu_raw: 'AMD Radeon R7 M360 2GB' },
  { no: 'PR17', sn: 'GNXSJ72', spec: 'Dell Latitude E5570, I7 6820HQ, 16RAM, 512SSD, RADEON R7 M360 2GB, TOUCH SCREEN', cycle: '-', cond: 'B', price: 200, sr: 'READY TO SELL', loc: 'Bucharest', notes: '', processor: 'Intel Core i7 6820HQ', ram_raw: '16 GB', gpu_raw: 'AMD Radeon R7 M360 2GB' },
  { no: 'PR19', sn: 'BXT8WT2', spec: 'Dell Latitude E5591, I7 8850H 32RAM, 512SSD, GeForce MX130 2 GB TOUCH SCREEN', cycle: '-', cond: 'B', price: 300, sr: 'READY TO SELL', loc: 'Bucharest', notes: '', processor: 'Intel Core i7 8850H', ram_raw: '32 GB', gpu_raw: 'NVIDIA GeForce MX130 2GB' },
  { no: 'PR20', sn: '5BK9WT2', spec: 'Dell Latitude E5591, I7 8850H 16RAM, 226SSD, GeForce MX130 2 GB', cycle: '-', cond: 'B', price: 250, sr: 'READY TO SELL', loc: 'Bucharest', notes: '', processor: 'Intel Core i7 8850H', ram_raw: '16 GB', gpu_raw: 'NVIDIA GeForce MX130 2GB' },
  { no: 'PR21', sn: 'F1WTQQ2', spec: 'Dell Latitude E5591, I7 8850H 16RAM, 226SSD, GeForce MX130 2 GB TOUCH SCREEN', cycle: '-', cond: 'B', price: 250, sr: 'READY TO SELL', loc: 'Bucharest', notes: '', processor: 'Intel Core i7 8850H', ram_raw: '16 GB', gpu_raw: 'NVIDIA GeForce MX130 2GB' },
  { no: 'PR30', sn: 'C02ZX009MD6P \\ A2141', spec: 'MacBook Pro (16-inch, 2019) MBP 16.0 SILVER 2.6GHZ/16GB/5300M/512GB', cycle: '389', cond: 'A', price: 600, sr: 'READY TO SELL', loc: 'UKRAINE 11/01/25', notes: '', processor: 'Intel Core i7 2.6 GHz', ram_raw: '16 GB', gpu_raw: 'AMD Radeon Pro 5300M' },
  { no: 'PR32', sn: 'C02X51XEJG5L \\ A1990', spec: 'MacBook Pro (15-inch, 2018) MBP 15.4 SILVER 2.2GHZ/16GB/RP 555X/256G', cycle: '213', cond: 'B', price: 400, sr: 'READY TO SELL', loc: 'Bucharest', notes: '', processor: 'Intel Core i7 2.2 GHz', ram_raw: '16 GB', gpu_raw: 'Radeon Pro 555X' },
  { no: 'PR33', sn: 'HSDVL33', spec: 'Dell Latitude 5401 I7 9850H, 16RAM, 512SSD', cycle: '-', cond: 'B', price: 200, sr: 'READY TO SELL', loc: 'Bucharest', notes: '', processor: 'Intel Core i7 9850H', ram_raw: '16 GB', gpu_raw: 'Intel UHD' },
  { no: 'PR35', sn: 'H81S4M2', spec: 'Dell Latitude 5480, I7 7820HQ, 16RAM, 512SSD', cycle: '-', cond: 'B', price: 150, sr: 'READY TO SELL', loc: 'UKRAINE 07/12/24', notes: '', processor: 'Intel Core i7 7820HQ', ram_raw: '16 GB', gpu_raw: 'Intel HD' },
  { no: 'PR36', sn: '6GJ2VN2', spec: 'Dell Latitude 5480, I7 7820HQ, 16RAM, 512SSD', cycle: '-', cond: 'B', price: 150, sr: 'READY TO SELL', loc: 'Bucharest', notes: '', processor: 'Intel Core i7 7820HQ', ram_raw: '16 GB', gpu_raw: 'Intel HD' },
  { no: 'PR37', sn: 'H2590N2', spec: 'Dell Latitude 5480, I7 7820HQ, 16RAM, 512SSD', cycle: '-', cond: 'B', price: 150, sr: 'READY TO SELL', loc: 'UKRAINE 11/01/25', notes: '', processor: 'Intel Core i7 7820HQ', ram_raw: '16 GB', gpu_raw: 'Intel HD' },
  { no: 'PR39', sn: 'F4590N2', spec: 'Dell Latitude 5480, I7 7820HQ, 16RAM, 512SSD', cycle: '-', cond: 'B', price: 150, sr: 'READY TO SELL', loc: 'Bucharest', notes: '', processor: 'Intel Core i7 7820HQ', ram_raw: '16 GB', gpu_raw: 'Intel HD' },
  { no: 'PR40', sn: '5C01PH2', spec: 'Dell Latitude 5480, I7 7820HQ, 16RAM, 512SSD', cycle: '-', cond: 'B', price: 150, sr: 'READY TO SELL', loc: 'Bucharest', notes: '', processor: 'Intel Core i7 7820HQ', ram_raw: '16 GB', gpu_raw: 'Intel HD' },
  { no: 'PR41', sn: '12XCRQ2', spec: 'Dell Latitude 5491, I7 8850H, 16RAM, 512SSD', cycle: '-', cond: 'B', price: 150, sr: 'READY TO SELL', loc: 'Bucharest', notes: '', processor: 'Intel Core i7 8850H', ram_raw: '16 GB', gpu_raw: 'Intel UHD' },
  { no: 'PR43', sn: '85379H2', spec: 'Dell Latitude 5480, I7 7820HQ, 16RAM, 512SSD', cycle: '-', cond: 'B', price: 150, sr: 'READY TO SELL', loc: 'Bucharest', notes: '', processor: 'Intel Core i7 7820HQ', ram_raw: '16 GB', gpu_raw: 'Intel HD' },
  { no: 'PR44', sn: 'C07RJ0AYG1J2', spec: 'Mac mini (Late 2014) 3.0GHZ DUAL-CORE INTEL CORE I7 /16GB', cycle: '-', cond: 'B', price: 150, sr: 'READY TO SELL', loc: 'Bucharest', notes: '', processor: 'Intel Core i7 3.0 GHz', ram_raw: '16 GB' },
  { no: 'PR46', sn: '-', spec: 'Monitor DELL 22 INCH', cycle: '-', cond: 'B', price: 30, sr: 'READY TO SELL', loc: 'UKRAINE 11/01/25', notes: '' },
  { no: 'PR47', sn: '-', spec: 'Monitor DELL 22 INCH', cycle: '-', cond: 'B', price: 30, sr: 'READY TO SELL', loc: 'Bucharest', notes: '' },
  { no: 'PR48', sn: '-', spec: 'Monitor DELL 22 INCH', cycle: '-', cond: 'B', price: 30, sr: 'READY TO SELL', loc: 'Bucharest', notes: '' },
]

/** Демо-данные для тестирования фильтров и наполнения витрины: бренды, категории, локации, состояния. */
const DEMO_EXTRA: Array<{
  no: string
  sn?: string
  spec: string
  cycle?: string
  cond: string
  price: number
  sr: string
  loc: string
  notes?: string
  category: string
  brand?: string
  processor?: string
  ram_raw?: string
  gpu_raw?: string
}> = [
  // HP ноутбуки — разные локации и состояния
  { no: 'HP01', sn: '5CD1234X', spec: 'HP EliteBook 840 G5, 14" FHD, i5-8250U, 8GB, 256GB SSD', category: 'Ноутбук', brand: 'HP', processor: 'Intel Core i5-8250U', ram_raw: '8 GB', gpu_raw: 'Intel UHD 620', cycle: '120', cond: 'A', price: 320, sr: 'READY TO SELL', loc: 'UKRAINE 11/01/25', notes: '' },
  { no: 'HP02', sn: '5CD5678Y', spec: 'HP ProBook 450 G6, 15.6", i7-8565U, 16GB, 512GB SSD', category: 'Ноутбук', brand: 'HP', processor: 'Intel Core i7-8565U', ram_raw: '16 GB', gpu_raw: 'Intel UHD 620', cycle: '89', cond: 'A-', price: 380, sr: 'READY TO SELL', loc: 'Киев', notes: '' },
  { no: 'HP03', sn: '5CD9012Z', spec: 'HP ZBook 15 G4, i7-7820HQ, 32GB, 512GB SSD, Quadro M1200', category: 'Ноутбук', brand: 'HP', processor: 'Intel Core i7-7820HQ', ram_raw: '32 GB', gpu_raw: 'NVIDIA Quadro M1200', cycle: '210', cond: 'B+', price: 520, sr: 'READY TO SELL', loc: 'Одесса', notes: '' },
  { no: 'HP04', spec: 'HP 24" Monitor FHD IPS', category: 'Монитор', brand: 'HP', cond: 'B', price: 85, sr: 'READY TO SELL', loc: 'Bucharest', notes: '' },
  { no: 'HP05', spec: 'HP 27" Monitor QHD', category: 'Монитор', brand: 'HP', cond: 'A', price: 140, sr: 'READY TO SELL', loc: 'Варшава', notes: '' },
  // Lenovo
  { no: 'LV01', sn: 'PF2ABC3D', spec: 'Lenovo ThinkPad T480, i5-8250U, 16GB, 256GB SSD', category: 'Ноутбук', brand: 'Lenovo', processor: 'Intel Core i5-8250U', ram_raw: '16 GB', gpu_raw: 'Intel UHD 620', cycle: '156', cond: 'A', price: 340, sr: 'READY TO SELL', loc: 'UKRAINE 07/12/24', notes: '' },
  { no: 'LV02', sn: 'PF2EFG4H', spec: 'Lenovo ThinkPad X1 Carbon 6th, i7-8650U, 16GB, 512GB', category: 'Ноутбук', brand: 'Lenovo', processor: 'Intel Core i7-8650U', ram_raw: '16 GB', gpu_raw: 'Intel UHD 620', cycle: '98', cond: 'A-', price: 580, sr: 'READY TO SELL', loc: 'Берлин', notes: '' },
  { no: 'LV03', sn: 'PF2IJK5L', spec: 'Lenovo ThinkPad E14, i5-10210U, 8GB, 256GB SSD', category: 'Ноутбук', brand: 'Lenovo', processor: 'Intel Core i5-10210U', ram_raw: '8 GB', gpu_raw: 'Intel UHD', cycle: '45', cond: 'B+', price: 290, sr: 'READY TO SELL', loc: 'Прага', notes: '' },
  { no: 'LV04', spec: 'Lenovo ThinkVision 24" FHD', category: 'Монитор', brand: 'Lenovo', cond: 'B', price: 95, sr: 'READY TO SELL', loc: 'Будапешт', notes: '' },
  // Samsung
  { no: 'SM01', sn: 'R58N123XY', spec: 'Samsung Galaxy Tab S7 FE 12.4", 128GB, Wi-Fi', category: 'Планшет', brand: 'Samsung', processor: 'Qualcomm Snapdragon 750G', ram_raw: '4 GB', cond: 'A', price: 280, sr: 'READY TO SELL', loc: 'UKRAINE 11/01/25', notes: '' },
  { no: 'SM02', sn: 'R58N456AB', spec: 'Samsung Galaxy Book Pro 15.6", i5-1135G7, 8GB, 256GB', category: 'Ноутбук', brand: 'Samsung', processor: 'Intel Core i5-1135G7', ram_raw: '8 GB', gpu_raw: 'Intel Iris Xe', cycle: '62', cond: 'A', price: 420, sr: 'READY TO SELL', loc: 'Киев', notes: '' },
  { no: 'SM03', spec: 'Samsung 27" Odyssey G5 Curved', category: 'Монитор', brand: 'Samsung', cond: 'B+', price: 220, sr: 'READY TO SELL', loc: 'Bucharest', notes: '' },
  // Acer
  { no: 'AC01', sn: 'NHQABC123', spec: 'Acer Aspire 5 A515-54, i5-10210U, 8GB, 512GB SSD', category: 'Ноутбук', brand: 'Acer', processor: 'Intel Core i5-10210U', ram_raw: '8 GB', gpu_raw: 'NVIDIA MX250', cycle: '78', cond: 'B', price: 260, sr: 'READY TO SELL', loc: 'Варшава', notes: '' },
  { no: 'AC02', sn: 'NHQDEF456', spec: 'Acer Nitro 5, i5-9300H, 16GB, 512GB SSD, GTX 1650', category: 'Ноутбук', brand: 'Acer', processor: 'Intel Core i5-9300H', ram_raw: '16 GB', gpu_raw: 'NVIDIA GTX 1650', cycle: '134', cond: 'B+', price: 450, sr: 'READY TO SELL', loc: 'UKRAINE 07/12/24', notes: '' },
  { no: 'AC03', spec: 'Acer 24" K242HYL FHD', category: 'Монитор', brand: 'Acer', cond: 'B-', price: 70, sr: 'READY TO SELL', loc: 'Одесса', notes: '' },
  // Asus
  { no: 'AS01', sn: 'J9N0K123', spec: 'ASUS VivoBook 15 X1502, i3-1215U, 8GB, 256GB SSD', category: 'Ноутбук', brand: 'Asus', processor: 'Intel Core i3-1215U', ram_raw: '8 GB', gpu_raw: 'Intel UHD', cycle: '22', cond: 'A', price: 310, sr: 'READY TO SELL', loc: 'Прага', notes: '' },
  { no: 'AS02', sn: 'J9N0L456', spec: 'ASUS ROG Strix G15, Ryzen 5 4600H, 16GB, 512GB, GTX 1650', category: 'Ноутбук', brand: 'Asus', processor: 'AMD Ryzen 5 4600H', ram_raw: '16 GB', gpu_raw: 'NVIDIA GTX 1650', cycle: '89', cond: 'B', price: 520, sr: 'READY TO SELL', loc: 'Берлин', notes: '' },
  { no: 'AS03', spec: 'ASUS 27" VP279QGL FHD', category: 'Монитор', brand: 'Asus', cond: 'A-', price: 130, sr: 'READY TO SELL', loc: 'Будапешт', notes: '' },
  // Телефоны
  { no: 'AP10', sn: 'DNQP123', spec: 'Apple iPhone 12, 64GB, Black', category: 'Телефон', brand: 'Apple', cond: 'A', price: 380, sr: 'READY TO SELL', loc: 'UKRAINE 11/01/25', notes: '' },
  { no: 'AP11', sn: 'DNQP456', spec: 'Apple iPhone 11, 128GB, Green', category: 'Телефон', brand: 'Apple', cond: 'B+', price: 280, sr: 'READY TO SELL', loc: 'Киев', notes: '' },
  { no: 'SS10', sn: 'SM-G998B', spec: 'Samsung Galaxy S21 Ultra 5G, 128GB', category: 'Телефон', brand: 'Samsung', cond: 'A-', price: 420, sr: 'READY TO SELL', loc: 'Bucharest', notes: '' },
  { no: 'XM01', sn: '2107113SG', spec: 'Xiaomi 11T Pro, 256GB, 120W', category: 'Телефон', brand: 'Xiaomi', cond: 'B', price: 220, sr: 'READY TO SELL', loc: 'Варшава', notes: '' },
  // Ещё Dell и Apple в разных локациях
  { no: 'DL50', sn: '8XYYZ99', spec: 'Dell OptiPlex 7080 SFF, i5-10500, 16GB, 256GB SSD', category: 'Системный блок', brand: 'Dell', processor: 'Intel Core i5-10500', ram_raw: '16 GB', cond: 'B+', price: 280, sr: 'READY TO SELL', loc: 'Берлин', notes: '' },
  { no: 'DL51', sn: '9AAB11', spec: 'Dell P2422H 24" FHD IPS', category: 'Монитор', brand: 'Dell', cond: 'A', price: 125, sr: 'READY TO SELL', loc: 'Прага', notes: '' },
  { no: 'DL52', sn: '9AAB22', spec: 'Dell U2720Q 27" 4K USB-C', category: 'Дисплей', brand: 'Dell', cond: 'A-', price: 380, sr: 'READY TO SELL', loc: 'Будапешт', notes: '' },
  { no: 'MB50', sn: 'C02ZZ99HH', spec: 'MacBook Air (M1, 2020) 8GB/256GB', category: 'Ноутбук', brand: 'Apple', processor: 'Apple M1', ram_raw: '8 GB', gpu_raw: 'Apple M1', cycle: '55', cond: 'A', price: 720, sr: 'READY TO SELL', loc: 'UKRAINE 11/01/25', notes: '' },
  { no: 'MB51', sn: 'C02AA11JJ', spec: 'MacBook Air (M2, 2022) 8GB/256GB', category: 'Ноутбук', brand: 'Apple', processor: 'Apple M2', ram_raw: '8 GB', gpu_raw: 'Apple M2', cycle: '18', cond: 'A', price: 920, sr: 'READY TO SELL', loc: 'Киев', notes: '' },
  { no: 'MB52', sn: 'FVFQ2XYZ', spec: 'iPad Pro 11" (2021) 128GB Wi-Fi', category: 'Планшет', brand: 'Apple', cond: 'A-', price: 580, sr: 'READY TO SELL', loc: 'Одесса', notes: '' },
  // Состояние C (FOR_PARTS) и разные локации
  { no: 'PR70', sn: 'C02OLD', spec: 'MacBook Pro (13-inch, 2015) for parts', cycle: '-', cond: 'C', price: 80, sr: 'READY TO SELL', loc: 'UKRAINE 07/12/24', notes: 'Не включается, на запчасти', category: 'Ноутбук', brand: 'Apple' },
  { no: 'PR71', sn: 'DELLPARTS', spec: 'Dell Latitude E5470 корпус + плата', cycle: '-', cond: 'C', price: 60, sr: 'READY TO SELL', loc: 'Bucharest', notes: 'Без дисплея', category: 'Ноутбук', brand: 'Dell' },
  // Дополнительно для пагинации и фильтров
  { no: 'HP06', spec: 'HP EliteDisplay E243 24"', category: 'Монитор', brand: 'HP', cond: 'B', price: 90, sr: 'READY TO SELL', loc: 'Варшава', notes: '' },
  { no: 'LV05', sn: 'PF2MNO6P', spec: 'Lenovo IdeaPad 3 15ADA05, Ryzen 5 3500U, 8GB, 256GB', category: 'Ноутбук', brand: 'Lenovo', processor: 'AMD Ryzen 5 3500U', ram_raw: '8 GB', gpu_raw: 'AMD Vega 8', cycle: '167', cond: 'B-', price: 240, sr: 'READY TO SELL', loc: 'UKRAINE 11/01/25', notes: '' },
  { no: 'MS01', sn: 'BB12345', spec: 'Microsoft Surface Laptop 4, i5-1135G7, 8GB, 256GB', category: 'Ноутбук', brand: 'Microsoft', processor: 'Intel Core i5-1135G7', ram_raw: '8 GB', gpu_raw: 'Intel Iris Xe', cycle: '44', cond: 'A-', price: 620, sr: 'READY TO SELL', loc: 'Берлин', notes: '' },
  { no: 'LG01', spec: 'LG 24MP88HV 24" FHD IPS', category: 'Монитор', brand: 'LG', cond: 'B+', price: 100, sr: 'READY TO SELL', loc: 'Прага', notes: '' },
  { no: 'AC04', sn: 'NHQGHI789', spec: 'Acer Swift 3, Ryzen 7 5700U, 16GB, 512GB', category: 'Ноутбук', brand: 'Acer', processor: 'AMD Ryzen 7 5700U', ram_raw: '16 GB', gpu_raw: 'AMD Radeon', cycle: '31', cond: 'A', price: 410, sr: 'READY TO SELL', loc: 'Будапешт', notes: '' },
]

function categoryFromSpec(spec: string): string {
  const s = spec.toLowerCase()
  if (s.includes('macbook') || s.includes('latitude') || s.includes('elitebook') || s.includes('thinkpad') || s.includes('notebook') || s.includes('aspire') || s.includes('vivobook') || s.includes('nitro') || s.includes('zbook') || s.includes('probook') || s.includes('galaxy book') || s.includes('surface') || s.includes('ideapad') || s.includes('swift')) return 'Ноутбук'
  if (s.includes('monitor') || s.includes('дисплей') || s.includes('display') || s.includes('thinkvision') || s.includes('elitedisplay') || s.includes('odyssey') || s.includes('optiplex')) return s.includes('optiplex') ? 'Системный блок' : 'Монитор'
  if (s.includes('mac mini')) return 'Системный блок'
  if (s.includes('iphone') || s.includes('galaxy s') || s.includes('xiaomi') || s.includes('телефон')) return 'Телефон'
  if (s.includes('ipad') || s.includes('galaxy tab') || s.includes('планшет')) return 'Планшет'
  if (s.includes('4k') || s.includes('u2720')) return 'Дисплей'
  return 'Оборудование'
}

export function getSeedTradeInItems(): InventoryItem[] {
  const now = new Date().toISOString()
  const toItem = (r: (typeof RAW)[0] | (typeof DEMO_EXTRA)[0]) => {
    const cat = 'category' in r && r.category ? r.category : categoryFromSpec(r.spec)
    const hasExtra = 'brand' in r || 'processor' in r
    const extra: RawRowExtra | undefined = hasExtra
      ? { brand: 'brand' in r ? r.brand : undefined, processor: 'processor' in r ? r.processor : undefined, ram_raw: 'ram_raw' in r ? r.ram_raw : undefined, gpu_raw: 'gpu_raw' in r ? r.gpu_raw : undefined }
      : undefined
    const base = item(r.no, r.sn ?? '-', r.spec, (r as { cycle?: string }).cycle ?? '-', r.cond, r.price, r.sr, r.loc, (r as { notes?: string }).notes ?? '', cat, extra)
    return { ...base, id: crypto.randomUUID(), createdAt: now, updatedAt: now }
  }
  return [...RAW.map(toItem), ...DEMO_EXTRA.map(toItem)]
}
