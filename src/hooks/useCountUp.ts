import { useEffect, useState } from 'react'

/**
 * Animated counter hook. Counts from 0 to target when `start` is true.
 * Handles numeric values like "200", "5,000", "6", "2".
 */
export function useCountUp(target: string, start: boolean, duration = 1800): string {
  const [display, setDisplay] = useState(target)

  useEffect(() => {
    if (!start) return

    // Extract numeric value and suffix/prefix
    const cleaned = target.replace(/,/g, '')
    const match = cleaned.match(/^([^\d]*)(\d+)(.*)$/)
    if (!match) {
      setDisplay(target)
      return
    }

    const prefix = match[1]
    const num = parseInt(match[2], 10)
    const suffix = match[3]

    if (num === 0 || isNaN(num)) {
      setDisplay(target)
      return
    }

    const startTime = performance.now()
    let frame: number

    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(eased * num)

      // Format with commas if original had commas
      const formatted = target.includes(',')
        ? current.toLocaleString('en-US')
        : String(current)

      setDisplay(`${prefix}${formatted}${suffix}`)

      if (progress < 1) {
        frame = requestAnimationFrame(animate)
      }
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [start, target, duration])

  return display
}
