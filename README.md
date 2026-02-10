# Restart B2B Platform

Корпоративный лендинг и B2B площадка Restart. Карта разработки: [RESTART-DEV-MAP.md](./RESTART-DEV-MAP.md). Справочник бренда и контента с restartsp.com: [COMPANY-BRAND.md](./COMPANY-BRAND.md).

## Запуск локально (Windows)

```bash
cd c:\GMBH
npm install
npm run dev
```

Открыть в браузере: **http://localhost:5173/** (если порт занят — Vite предложит 5174).

## Доступ по сети и туннель

- **Локальная сеть (Wi‑Fi):** в `vite.config.ts` включён `host: true`. После `npm run dev` в терминале будет строка вида `Network: http://192.168.x.x:5173/` — по ней можно зайти с телефона или другого устройства в той же сети.
- **Публичный туннель (Cloudflare):** в одном терминале запустите `npm run dev`, во втором — `npm run tunnel` (порт 5173) или `npm run tunnel:5174` (если dev занял 5174). Будет выдан URL вида `https://xxx.trycloudflare.com` — им можно поделиться для теста. Требуется: [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/) (`winget install cloudflare.cloudflared`).

## Команды

- `npm run dev` — режим разработки (Vite, порт 5173)
- `npm run build` — production-сборка в `dist/`
- `npm run preview` — просмотр собранного сайта
- `npm run tunnel` — Cloudflare Tunnel на порт 5173 (запускать при уже запущенном dev)
- `npm run tunnel:5174` — Cloudflare Tunnel на порт 5174

## Стек

React 19, Vite 6, TypeScript, Tailwind CSS, React Router.

## Структура

- `src/components` — Layout, Header, Footer
- `src/pages` — страницы (Home и др.)
- `public` — статика, favicon
- `src/data/catalogs.ts` — справочники: бренды, категории, процессоры, локации, состояния (используются в выпадающих списках инвентаря и фильтрах витрины)
- `src/api/specsApi.ts` — клиент API спецификаций телефонов (mobile-specs-api)
- `src/data/laptopSpecs.ts` — загрузка датасета ноутбуков из `public/data/laptops.json`

## Каталоги и внешние базы

- **Каталоги** — единый источник списков для полей «Бренд», «Категория», «Процессор», «Локация», «Состояние» в форме инвентаря и в фильтрах кабинета покупателя. Редактируются в `src/data/catalogs.ts`.
- **mobile-specs-api** (телефоны): задайте в `.env` переменную `VITE_SPECS_API_URL` (например `http://localhost:3001`), если у вас запущен инстанс [mobile-specs-api](https://github.com/thechandrakant15/mobile-specs-api). Иначе подстановка характеристик из API недоступна.
- **Ноутбуки**: раздел «Подбор ноутбуков» (`/my/laptops`) использует базу из `public/data/laptops.json`. **Одна команда загрузки:** в корне проекта выполните `npm run data:laptops`. Требуется: Python 3, `pip install kagglehub`, учётные данные Kaggle (файл `~/.kaggle/kaggle.json` — создаётся в [Kaggle → Account → Create New Token](https://www.kaggle.com/settings)). Скрипт скачивает [durgeshrao9993/laptop-specification-dataset](https://www.kaggle.com/datasets/durgeshrao9993/laptop-specification-dataset) и пишет `public/data/laptops.json`. В кабинете: поиск по бренду/модели/процессору и content-based рекомендации «похожих» ноутбуков.

Правила и конвенции: [CONVENTIONS.md](./CONVENTIONS.md).
