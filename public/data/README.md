# Данные для кабинета

## База ноутбуков (laptops.json)

Раздел «Подбор ноутбуков» в кабинете загружает данные из `laptops.json` в этой папке.

### Вариант 1: свой CSV (например laptop_price (1).csv с рабочего стола)

1. Скопируйте ваш CSV в эту папку и назовите файл **laptop_price.csv**
2. В корне проекта выполните: **`npm run data:laptops:csv`**
3. Будет создан/обновлён `laptops.json`

Колонки CSV: `Company`, `Product`, `TypeName`, `Inches`, `ScreenResolution`, `Cpu`, `Ram`, `Memory`, `Gpu`, `OpSys`, `Weight`, `Price_in_euros` (или `Price_euros`).

### Вариант 2: Kaggle (kagglehub)

В корне проекта: **`npm run data:laptops`**. Нужны Python и `pip install kagglehub`.

**Авторизация Kaggle** (один из вариантов):

- Переменная окружения: **`KAGGLE_API_TOKEN=...`** (токен из [Kaggle → Settings → API → Create New Token](https://www.kaggle.com/settings)).
- Или файл **`~/.kaggle/access_token`** с содержимым токена.
- Или Legacy: **`~/.kaggle/kaggle.json`** (username + key).

**Токен не хранить в коде и не коммитить.**

Скрипт скачивает датасет **durgeshrao9993/laptop-specification-dataset** и пишет сюда `laptops.json` и (через csv_to_laptops_json) можно дополнительно получить `laptopSpecs.json`.

**Другие полезные датасеты Kaggle по ноутбукам** (для расширения базы или сравнения):

| Датасет | Описание |
|--------|----------|
| durgeshrao9993/laptop-specification-dataset | Используется по умолчанию: спецификации, цены в € |
| birajkhatri/laptop-price-datasets | Цены ноутбуков |
| juanmerinobermejo/laptops-price-dataset | laptops.csv, признаки и цены |
| adityamishraml/laptops | Ноутбуки |
| ehtishamsadiq/uncleaned-laptop-price-dataset | Цены (сырые данные) |

Скачать другой датасет вручную: `kagglehub.dataset_download("username/dataset-name")` (Python) или через [Kaggle API](https://github.com/Kaggle/kaggle-api) (`kaggle datasets download -d username/dataset-name`).

---

## Единая база спецификаций (один формат, один файл)

**`specs-db.json`** — единый файл базы: ноутбуки (LaptopSpec) и мобильные (MobileSpec). Формат: `{ version, updated_at, laptops: [], mobiles: [] }`.

**Сборка:** в корне проекта выполните **`npm run data:specs-db`**. Скрипт:
1. Подхватывает существующие ноутбуки из `laptopSpecs.json` (если есть).
2. Добавляет ноутбуки из **laptop-db-excel.xlsx**.
3. Загружает мобильные из **mobiles-spec-db.xlsx**.
4. Записывает всё в **specs-db.json**.

Приложение загружает ноутбуки в первую очередь из `specs-db.json` (поле `laptops`), при отсутствии — из `laptopSpecs.json` или `laptops.json`. Мобильные — только из `specs-db.json` (поле `mobiles`).

## Исходные Excel-файлы

| Файл | Описание |
|------|----------|
| **laptop-db-excel.xlsx** | База ноутбуков (Excel). Участвует в сборке `specs-db.json`. |
| **mobiles-spec-db.xlsx** | База спецификаций телефонов/планшетов (Excel). Участвует в сборке `specs-db.json`. |
