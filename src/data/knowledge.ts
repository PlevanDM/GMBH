/**
 * База знаний (по аналогии с NEXX-LAST).
 * Категории и статьи для раздела /tools/knowledge.
 */

export interface KnowledgeArticle {
  id: string
  categoryId: string
  title: string
  slug: string
  summary: string
  content: string
  updatedAt: string
}

export interface KnowledgeCategory {
  id: string
  title: string
  slug: string
  order: number
}

export const KNOWLEDGE_CATEGORIES: KnowledgeCategory[] = [
  { id: 'equipment', title: 'Оборудование и техника', slug: 'equipment', order: 1 },
  { id: 'logistics', title: 'Логистика и доставка', slug: 'logistics', order: 2 },
  { id: 'support', title: 'Поддержка и сервис', slug: 'support', order: 3 },
  { id: 'processes', title: 'Процессы и регламенты', slug: 'processes', order: 4 },
]

export const KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
  {
    id: 'art-1',
    categoryId: 'equipment',
    title: 'Приёмка и учёт техники',
    slug: 'priemka-uchet',
    summary: 'Правила приёмки оборудования, проверка комплектации и серийных номеров.',
    content: `## Приёмка и учёт техники

При приёмке оборудования необходимо:

1. **Проверить комплектацию** по накладной или счёту.
2. **Зафиксировать серийные номера** всех единиц техники.
3. **Визуальный осмотр** на повреждения при транспортировке.
4. **Включение и базовая проверка** (при возможности).

Все данные вносятся в учётную систему. При расхождениях — акт и уведомление поставщика.`,
    updatedAt: '2026-02-01',
  },
  {
    id: 'art-2',
    categoryId: 'equipment',
    title: 'Категории оборудования в витрине',
    slug: 'kategorii-oborudovaniya',
    summary: 'Как распределять позиции по категориям (Laptops, Monitors и т.д.) для витрины продаж.',
    content: `## Категории оборудования

В витрине продаж используются категории для удобной фильтрации:

- **Laptops** — ноутбуки и ультрабуки
- **Monitors** — мониторы
- **Desktops** — десктопы и моноблоки
- **Phones** — смартфоны и планшеты
- **Other** — прочее оборудование

Категория задаётся при импорте прайса (колонка Category / Item Description) или вручную при редактировании позиции.`,
    updatedAt: '2026-02-01',
  },
  {
    id: 'art-3',
    categoryId: 'logistics',
    title: 'Упаковка и маркировка',
    slug: 'upakovka-markirovka',
    summary: 'Требования к упаковке и маркировке при отгрузке.',
    content: `## Упаковка и маркировка

- Использование антистатических материалов при необходимости.
- Жёсткая упаковка для техники (короб, пенопласт/пузырёк).
- Маркировка: получатель, адрес, номер заказа, хрупкое при необходимости.
- Наклейка с серийным номером на короб при отправке.`,
    updatedAt: '2026-01-15',
  },
  {
    id: 'art-4',
    categoryId: 'logistics',
    title: 'Доставка в офисы Restart',
    slug: 'dostavka-ofisy',
    summary: 'Адреса складов и офисов для приёмки и отгрузки.',
    content: `## Доставка в офисы Restart

Актуальные адреса офисов см. на странице [Офисы](/offices).

При планировании поставки согласуйте дату и время с ответственным менеджером.`,
    updatedAt: '2026-01-10',
  },
  {
    id: 'art-5',
    categoryId: 'support',
    title: 'Заявка: типовой процесс',
    slug: 'zapros-kp-process',
    summary: 'Как обрабатываются запросы коммерческих предложений от покупателей.',
    content: `## Заявка: типовой процесс

1. Покупатель формирует запрос на витрине или в кабинете.
2. Менеджер получает уведомление и подготавливает предложение.
3. Статус запроса обновляется: В работе → Требует уточнений (при необходимости) → Готово.
4. Покупатель видит статус в разделе «Мои заявки».`,
    updatedAt: '2026-02-01',
  },
  {
    id: 'art-6',
    categoryId: 'processes',
    title: 'Обновление прайса и витрины',
    slug: 'obnovlenie-praysa',
    summary: 'Как загружать Excel/CSV и обновлять витрину продаж.',
    content: `## Обновление прайса и витрины

1. Войдите в **Мой кабинет** → **Обновление прайса и остатков**.
2. Загрузите файл (Excel или CSV).
3. Выберите лист (если несколько) и сопоставьте колонки с полями: описание, категория, инв. номер, S/N, состояние, статус.
4. Нажмите **Импортировать**. Данные появятся на витрине; позиции со статусом «В наличии» видны покупателям.
5. Редактирование и смена статуса — в таблице позиций на той же странице.`,
    updatedAt: '2026-02-01',
  },
]

export function getCategoryBySlug(slug: string): KnowledgeCategory | undefined {
  return KNOWLEDGE_CATEGORIES.find((c) => c.slug === slug)
}

export function getCategoryById(id: string): KnowledgeCategory | undefined {
  return KNOWLEDGE_CATEGORIES.find((c) => c.id === id)
}

export function getArticleById(id: string): KnowledgeArticle | undefined {
  return KNOWLEDGE_ARTICLES.find((a) => a.id === id)
}

export function getArticleBySlug(slug: string): KnowledgeArticle | undefined {
  return KNOWLEDGE_ARTICLES.find((a) => a.slug === slug)
}

export function getArticlesByCategory(categoryId: string): KnowledgeArticle[] {
  return KNOWLEDGE_ARTICLES.filter((a) => a.categoryId === categoryId).sort(
    (a, b) => a.title.localeCompare(b.title)
  )
}

export function searchArticles(query: string): KnowledgeArticle[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return KNOWLEDGE_ARTICLES.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q)
  )
}
