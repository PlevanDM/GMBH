/**
 * Generate PNG icons for PWA from design spec.
 * Navy gradient bg, white "R", orange accent square.
 */
import { createCanvas } from 'canvas'
import { writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(__dirname, '..', 'public', 'icons')
mkdirSync(OUT_DIR, { recursive: true })

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

function drawIcon(size, maskable = false) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Content area for maskable (80% safe zone)
  const pad = maskable ? size * 0.1 : 0
  const s = maskable ? size * 0.8 : size
  const ox = pad
  const oy = pad

  // Background gradient (navy)
  const bgGrad = ctx.createLinearGradient(0, 0, size, size)
  bgGrad.addColorStop(0, '#0f172a')
  bgGrad.addColorStop(1, '#1e3a5f')
  
  // Full background
  ctx.fillStyle = bgGrad
  if (maskable) {
    ctx.fillRect(0, 0, size, size)
  } else {
    const rx = s * 0.18
    roundRect(ctx, 0, 0, size, size, rx)
    ctx.fill()
  }

  // Orange accent square
  const aw = s * 0.2
  const ax = ox + s * 0.65
  const ay = oy + s * 0.12
  const acx = ax + aw / 2
  const acy = ay + aw / 2
  const angle = (12 * Math.PI) / 180

  ctx.save()
  ctx.translate(acx, acy)
  ctx.rotate(angle)
  const acGrad = ctx.createLinearGradient(-aw/2, -aw/2, aw/2, aw/2)
  acGrad.addColorStop(0, '#f97316')
  acGrad.addColorStop(1, '#fb923c')
  ctx.fillStyle = acGrad
  ctx.globalAlpha = 0.9
  roundRect(ctx, -aw/2, -aw/2, aw, aw, aw * 0.15)
  ctx.fill()
  ctx.globalAlpha = 1
  ctx.restore()

  // White "R" letter
  const fontSize = s * 0.52
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${fontSize}px "Inter", "Segoe UI", system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('R', ox + s * 0.45, oy + s * 0.54)

  return canvas.toBuffer('image/png')
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

// Generate all sizes
for (const size of SIZES) {
  const buf = drawIcon(size, false)
  const path = resolve(OUT_DIR, `icon-${size}.png`)
  writeFileSync(path, buf)
  console.log(`✓ ${path} (${size}x${size})`)
}

// Maskable 512
const maskBuf = drawIcon(512, true)
const maskPath = resolve(OUT_DIR, 'icon-maskable-512.png')
writeFileSync(maskPath, maskBuf)
console.log(`✓ ${maskPath} (512x512 maskable)`)

console.log('\nDone! PNG icons generated.')
