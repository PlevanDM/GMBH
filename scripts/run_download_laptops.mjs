#!/usr/bin/env node
/**
 * Запуск загрузки базы ноутбуков (Kaggle) одной командой: npm run data:laptops
 * Вызывает Python-скрипт download_laptop_dataset.py (kagglehub).
 * Требуется: Python 3, pip install kagglehub, учётные данные Kaggle (~/.kaggle/kaggle.json).
 */

import { spawnSync } from 'child_process'
import { existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const pyScript = join(root, 'scripts', 'download_laptop_dataset.py')

const isWin = process.platform === 'win32'
const candidates = isWin ? ['py', 'python3', 'python'] : ['python3', 'python']

let python = null
for (const cmd of candidates) {
  const r = spawnSync(cmd, ['--version'], { encoding: 'utf8', shell: true })
  if (r.status === 0) {
    python = cmd
    break
  }
}

if (!python) {
  console.error('Не найден Python. Установите Python 3 и добавьте его в PATH.')
  console.error('Затем: pip install kagglehub')
  console.error('Настройте Kaggle: https://www.kaggle.com/settings → Create New Token, сохраните kaggle.json в ~/.kaggle/')
  process.exit(1)
}

if (!existsSync(pyScript)) {
  console.error('Скрипт не найден:', pyScript)
  process.exit(1)
}

console.log('Запуск загрузки датасета (kagglehub)...\n')
const result = spawnSync(python, [pyScript], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
})

if (result.status !== 0) {
  console.error('\nЕсли ошибка про kagglehub: pip install kagglehub')
  console.error('Если ошибка про доступ Kaggle: настройте ~/.kaggle/kaggle.json (см. https://www.kaggle.com/settings)')
  process.exit(result.status ?? 1)
}

console.log('\nГотово. Обновите страницу «Подбор ноутбуков» в кабинете.')
