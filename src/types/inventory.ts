/** Normalized inventory item (INVENTORY-TOOL-SPEC) */
export type InventoryStatus = 'available' | 'sold' | 'reserved' | 'unavailable'

export interface InventoryItem {
  id: string
  description: string
  /** Бренд (Apple, Dell, HP, …) */
  brand?: string
  category?: string
  inventoryNumber?: string
  serialNumber?: string
  condition?: string
  status: InventoryStatus
  price?: number
  quantity?: number
  sku?: string
  batchId?: string
  /** URL изображения товара */
  imageUrl?: string
  /** Процессор (CPU) */
  processor?: string
  /** Год выпуска */
  year?: string
  /** Циклы АКБ */
  batteryCycles?: string
  /** Состояние АКБ, например 85% */
  batteryHealth?: string
  /** Локация (склад, город), например UKRAINE 11/01/25, Bucharest */
  location?: string
  /** Комментарии к позиции */
  notes?: string
  createdAt: string
  updatedAt: string
  sourceRow?: number
  /** --- Поля для ноутбуков и выкупа (ТЗ) --- */
  ram_raw?: string
  storage_raw?: string
  gpu_raw?: string
  /** Нормализованные: серия, cpu_family, ram_gb, storage_type, storage_gb, gpu_type, year_approx */
  laptopSeries?: string
  laptopCpuFamily?: string
  laptopRamGb?: number
  laptopStorageType?: string
  laptopStorageGb?: number
  laptopGpuType?: string
  laptopYearApprox?: number
  /** Рекомендованная выкупная цена (после расчёта) */
  buyback_price_recommended?: number | null
  /** Состояние для выкупа: new, like_new, good, cosmetic, defective, not_working */
  buyback_condition?: string
}

/** Партия закупки: страна, дата, откуда, от кого */
export interface InventoryBatch {
  id: string
  country: string
  date: string
  source: string
  supplier: string
  notes?: string
  createdAt: string
}

/** Raw row from file (headers as keys) */
export type RawRow = Record<string, string | number | undefined>

/** Column mapping: our field -> column key in raw row (ключ как в файле) */
export interface ColumnMapping {
  description: string
  brand: string
  category: string
  inventoryNumber: string
  serialNumber: string
  condition: string
  status: string
  price: string
  quantity: string
  sku: string
  imageUrl: string
  processor: string
  ram: string
  storage: string
  gpu: string
  year: string
  batteryCycles: string
  batteryHealth: string
  location: string
  notes: string
}

export const DEFAULT_MAPPING: ColumnMapping = {
  description: '',
  brand: '',
  category: '',
  inventoryNumber: '',
  serialNumber: '',
  condition: '',
  status: '',
  price: '',
  quantity: '',
  sku: '',
  imageUrl: '',
  processor: '',
  ram: '',
  storage: '',
  gpu: '',
  year: '',
  batteryCycles: '',
  batteryHealth: '',
  location: '',
  notes: '',
}

/**
 * Синонимы шапок для автоопределения колонок.
 * Поддержка разных форматов прайсов: EN, RU, DE, PL, UA, RO, ES и др.
 */
export const HEADER_ALIASES: Record<keyof ColumnMapping, string[]> = {
  description: [
    'Spec', 'Specification', 'User Item Description', 'Name', 'Description', 'Описание', 'Product', 'Название', 'Товар', 'Наименование',
    'Item', 'Product Name', 'Artikel', 'Bezeichnung', 'Nazwa', 'Denumire', 'Descripción', 'Назва', 'Опис',
  ],
  brand: [
    'Brand', 'Бренд', 'Manufacturer', 'Производитель', 'Make', 'Marke', 'Marca', 'Fabricant', 'Producent',
  ],
  category: [
    'Category', 'Type', 'Категория', 'Тип', 'Item Description', 'Kategorie', 'Categorie', 'Kategoria', 'Categoría', 'Категорія',
  ],
  inventoryNumber: [
    '№', 'No', 'No.', 'Inventory Number', 'Internal ID', 'ID', 'Инв. номер', 'Инвентарный номер', 'Tested', 'In Box',
    'Nr', 'Number', 'Art', 'Article', 'Артикул', 'Код', 'Code', 'SKU', 'Artikelnummer', 'Numer', 'Număr', 'Número', 'Номер',
  ],
  serialNumber: [
    'SN', 'Serial number', 'S/N', 'Serial', 'Серийный номер', 'Serial Number', 'Seriennummer', 'Seria', 'Серийний номер',
  ],
  condition: [
    'Condition', 'Сondition', 'Состояние', 'Condiție', 'Estado', 'Zustand', 'Stan', 'Стан', 'Grade', 'Quality',
  ],
  status: [
    'Status', 'В наличии', 'Статус', 'Availability', 'Available', 'Stock', 'Остаток', 'Stare', 'Estado', 'Status',
    'Sold', 'Reserved', 'Продано', 'Зарезервировано', 'Да', 'Нет', 'Yes', 'No', 'Green', 'Red',
    'Продажа', 'Ремонт', 'Продажа Ремонт', 'READY TO SELL', 'REPAIR', 'Ready to sell', 'Repair',
  ],
  price: [
    '$ Розница', 'Розница', 'Price', 'Цена', 'Precio', 'Preis', 'Prix', 'Cena', 'Preț', 'Ціна', 'Price EUR', 'Price USD', 'Стоимость',
    'Sum', 'Amount', 'Betrag', 'Montant', 'List Price', 'Unit Price', 'Цена за ед', 'Preis/Stück',
  ],
  quantity: [
    'Quantity', 'Qty', 'Количество', 'Кол-во', 'Amount', 'Stock', 'Остаток', 'Menge', 'Ilość', 'Cantidad', 'Cantitate', 'Кількість',
  ],
  sku: [
    'SKU', 'Артикул', 'Article', 'Art', 'Code', 'Код', 'Vendor Code', 'Product Code', 'Item Code', 'Artikelnummer', 'Model',
  ],
  imageUrl: [
    'Image', 'Photo', 'Фото', 'Изображение', 'URL', 'Picture', 'Bild', 'Zdjęcie', 'Imagen', 'Imagine',
  ],
  processor: [
    'CPU', 'Processor', 'Процессор', 'Processor Model', 'Chip', 'Chipset', 'Procesor', 'Procesador', 'Prozessor',
  ],
  ram: [
    'RAM', 'Memory', 'ОЗУ', 'Оперативная память', 'RAM Size', 'RAM GB', 'Arbeitsspeicher', 'Pamięć', 'Memorie', 'Memoria',
  ],
  storage: [
    'Storage', 'SSD', 'HDD', 'Disk', 'Диск', 'Накопитель', 'Hard Drive', 'Festplatte', 'Dysk', 'Stocare', 'Almacenamiento',
  ],
  gpu: [
    'GPU', 'Video', 'Graphics', 'Видео', 'Видеокарта', 'Grafik', 'Grafika', 'Video Card', 'VGA', 'Carte video', 'Tarjeta gráfica',
  ],
  year: [
    'Year', 'Год', 'Year of manufacture', 'Manufacturing year', 'An', 'Jahr', 'Rok', 'Año', 'Anul',
  ],
  batteryCycles: [
    'Cycle BAT', 'Cycles', 'Battery cycles', 'Циклы', 'Циклы АКБ', 'Charge cycles', 'Cycle count', 'Cicluri', 'Ciclos', 'Zyklen',
  ],
  batteryHealth: [
    'Battery', 'Battery health', 'АКБ', 'Здоровье батареи', 'Battery %', 'Health %', 'Baterie', 'Batería', 'Akku',
  ],
  location: [
    'Location', 'Локация', 'Locatie', 'Lokalizacja', 'Standort', 'Ubicación', 'Locație', 'Склад', 'Warehouse', 'City',
  ],
  notes: [
    'Notes', 'Comments', 'Комментарии', 'Коментарии', 'Comment', 'Notizen', 'Notatki', 'Comentarios', 'Observații', 'Примечания',
  ],
}
