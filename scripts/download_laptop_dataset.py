#!/usr/bin/env python3
"""
Скачивание датасета Kaggle durgeshrao9993/laptop-specification-dataset через kagglehub
и конвертация в public/data/laptops.json для кабинета (подбор и рекомендации ноутбуков).

Требования: pip install kagglehub pandas
Настройка (один из вариантов):
  - KAGGLE_API_TOKEN=... (токен из https://www.kaggle.com/settings → Generate New Token)
  - или ~/.kaggle/access_token с содержимым токена
  - или ~/.kaggle/kaggle.json (Legacy API: username + key)

Запуск из корня проекта:
  python scripts/download_laptop_dataset.py
  # или
  pip install kagglehub pandas && python scripts/download_laptop_dataset.py
"""

import csv
import json
import os
import sys

# Попытка импорта kagglehub
try:
    import kagglehub
except ImportError:
    print("Установите kagglehub: pip install kagglehub", file=sys.stderr)
    sys.exit(1)


# Маппинг колонок CSV Kaggle -> наши поля JSON (поддержка разных вариантов названий)
COLUMN_ALIASES = {
    "brand": ["Company", "Brand", "brand", "company", "Manufacturer"],
    "model": ["Product", "Model", "model", "product", "Name", "Laptop"],
    "typeName": ["TypeName", "Type", "typeName", "type"],
    "inches": ["Inches", "inches", "ScreenSize", "Screen"],
    "screenResolution": ["ScreenResolution", "screenResolution", "Resolution"],
    "processor": ["Cpu", "CPU", "Processor", "processor", "cpu"],
    "ram": ["Ram", "RAM", "ram", "Memory_GB"],
    "storage": ["Memory", "Storage", "storage", "memory", "SSD", "HDD"],
    "gpu": ["Gpu", "GPU", "gpu", "Graphics"],
    "opSys": ["OpSys", "opSys", "OS", "Operating System"],
    "weight": ["Weight", "weight"],
    "price_euros": ["Price_euros", "Price", "price", "Price (Euros)"],
}


def find_csv_in_dir(path: str) -> str | None:
    for name in os.listdir(path):
        if name.lower().endswith(".csv"):
            return os.path.join(path, name)
    for root, _dirs, files in os.walk(path):
        for name in files:
            if name.lower().endswith(".csv"):
                return os.path.join(root, name)
    return None


def first_match(row: dict, keys: list[str]) -> str:
    for k in keys:
        if k in row and row[k] is not None and str(row[k]).strip():
            return str(row[k]).strip()
    return ""


def row_to_record(headers: list[str], row: dict) -> dict:
    """Преобразует строку CSV в запись для JSON (нормализованные поля)."""
    record = {}
    for our_key, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            if alias in headers and alias in row:
                v = row.get(alias)
                if v is not None and str(v).strip():
                    record[our_key] = str(v).strip()
                    break
        if our_key not in record and our_key in row and row[our_key]:
            record[our_key] = str(row[our_key]).strip()
    return record


def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    os.chdir(project_root)

    print("Downloading dataset durgeshrao9993/laptop-specification-dataset via kagglehub...")
    path = kagglehub.dataset_download("durgeshrao9993/laptop-specification-dataset")
    print("Path to dataset files:", path)

    csv_path = find_csv_in_dir(path)
    if not csv_path:
        print("No CSV file found in dataset.", file=sys.stderr)
        sys.exit(1)

    rows = []
    with open(csv_path, newline="", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []
        for row in reader:
            rec = row_to_record(headers, row)
            if rec:
                rows.append(rec)

    out_dir = os.path.join(project_root, "public", "data")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "laptops.json")

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=0)

    print(f"Written {len(rows)} records to {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
