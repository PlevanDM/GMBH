#!/usr/bin/env node
/** One-off: copy laptop CSV from Desktop to public/data (UTF-8 safe). */
import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const dest = join(root, 'public', 'data', 'laptop_price.csv')
// Path with Ukrainian "Робочий стіл" (Desktop) - keep file UTF-8
const desktopFolder = '\u0420\u043E\u0431\u043E\u0447\u0438\u0439 \u0441\u0442\u0456\u043B' // Робочий стіл
const src = process.argv[2] || join(process.env.USERPROFILE || '', 'OneDrive', desktopFolder, 'laptop_price (1).csv')

const destDir = dirname(dest)
if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true })

copyFileSync(src, dest)
console.log('Copied:', src, '->', dest)
