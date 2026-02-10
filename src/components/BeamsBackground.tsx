import { useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface BeamsBackgroundProps {
  className?: string
  children?: React.ReactNode
  intensity?: 'subtle' | 'medium' | 'strong'
}

/**
 * Particle-network background animation (Aether Flow style).
 * - Interactive particles react to mouse position
 * - Lines connect nearby particles forming a network mesh
 * - Brand-tuned blue/cyan palette
 * - Performance: IntersectionObserver, Page Visibility, FPS throttle,
 *   reduced-motion support, mobile particle reduction
 */

interface Particle {
  x: number
  y: number
  dx: number
  dy: number
  size: number
  color: string
}

export function BeamsBackground({
  className,
  children,
  intensity = 'medium',
}: BeamsBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationFrameRef = useRef<number>(0)
  const isVisibleRef = useRef(true)
  const isPausedRef = useRef(false)
  const mouseRef = useRef<{ x: number | null; y: number | null; radius: number }>({
    x: null,
    y: null,
    radius: 180,
  })

  const opacityMultiplier = { subtle: 0.5, medium: 0.75, strong: 1 }[intensity]

  const handleVisibilityChange = useCallback(() => {
    isPausedRef.current = document.hidden
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (prefersReducedMotion) return

    // --- Colors tuned to brand (blue / cyan) ---
    const PARTICLE_COLORS = [
      'rgba(96, 165, 250, 0.8)',   // blue-400
      'rgba(59, 130, 246, 0.7)',   // blue-500
      'rgba(147, 197, 253, 0.6)',  // blue-300
      'rgba(56, 189, 248, 0.6)',   // sky-400
      'rgba(125, 211, 252, 0.5)',  // sky-300
    ]

    const LINE_COLOR_NORMAL = (op: number) =>
      `rgba(96, 165, 250, ${op * opacityMultiplier})`
    const LINE_COLOR_MOUSE = (op: number) =>
      `rgba(255, 255, 255, ${op * opacityMultiplier})`

    function pickColor() {
      return PARTICLE_COLORS[
        Math.floor(Math.random() * PARTICLE_COLORS.length)
      ]
    }

    function initParticles(w: number, h: number) {
      const isMobile = w < 768
      const isLowEnd =
        navigator.hardwareConcurrency != null &&
        navigator.hardwareConcurrency < 4
      const density = isMobile ? 18000 : isLowEnd ? 14000 : 9000
      const count = Math.min(Math.floor((w * h) / density), isMobile ? 40 : 80)
      const pts: Particle[] = []

      for (let i = 0; i < count; i++) {
        const size = Math.random() * 1.8 + 0.6
        pts.push({
          x: Math.random() * w,
          y: Math.random() * h,
          dx: (Math.random() - 0.5) * 0.4,
          dy: (Math.random() - 0.5) * 0.4,
          size,
          color: pickColor(),
        })
      }

      particlesRef.current = pts
    }

    // --- Canvas sizing ---
    function updateCanvasSize() {
      if (!canvas || !ctx || !container) return
      const rect = container.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = rect.width
      const h = rect.height
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      initParticles(w, h)
    }

    updateCanvasSize()

    let resizeTimer: ReturnType<typeof setTimeout>
    const handleResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(updateCanvasSize, 200)
    }
    window.addEventListener('resize', handleResize, { passive: true })

    // Intersection Observer
    const io = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting
      },
      { threshold: 0 },
    )
    io.observe(container)

    // Page visibility
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Mouse tracking (relative to container)
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container!.getBoundingClientRect()
      mouseRef.current.x = e.clientX - rect.left
      mouseRef.current.y = e.clientY - rect.top
    }
    const handleMouseLeave = () => {
      mouseRef.current.x = null
      mouseRef.current.y = null
    }
    container.addEventListener('mousemove', handleMouseMove, { passive: true })
    container.addEventListener('mouseleave', handleMouseLeave)

    // --- Draw loop ---
    const connectionDistance =
      container.getBoundingClientRect().width < 768 ? 100 : 140

    let lastFrameTime = 0
    const targetFPS = 30
    const frameInterval = 1000 / targetFPS

    function animate(currentTime: number) {
      animationFrameRef.current = requestAnimationFrame(animate)
      if (!ctx || !container) return
      if (!isVisibleRef.current || isPausedRef.current) return
      if (currentTime - lastFrameTime < frameInterval) return
      lastFrameTime = currentTime

      const rect = container.getBoundingClientRect()
      const w = rect.width
      const h = rect.height

      ctx.clearRect(0, 0, w, h)

      const particles = particlesRef.current
      const mouse = mouseRef.current

      // Update + draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        // Bounce off edges
        if (p.x > w || p.x < 0) p.dx = -p.dx
        if (p.y > h || p.y < 0) p.dy = -p.dy

        // Mouse repulsion
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - p.x
          const dy = mouse.y - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < mouse.radius + p.size) {
            const force = (mouse.radius - dist) / mouse.radius
            p.x -= (dx / dist) * force * 4
            p.y -= (dy / dist) * force * 4
          }
        }

        p.x += p.dx
        p.y += p.dy

        // Draw particle
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.fill()
      }

      // Draw connections
      const connDistSq = connectionDistance * connectionDistance
      for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
          const dx = particles[a].x - particles[b].x
          const dy = particles[a].y - particles[b].y
          const distSq = dx * dx + dy * dy

          if (distSq < connDistSq) {
            const opacity = (1 - distSq / connDistSq) * 0.6

            // Highlight lines near mouse
            let isNearMouse = false
            if (mouse.x !== null && mouse.y !== null) {
              const dxm = particles[a].x - mouse.x
              const dym = particles[a].y - mouse.y
              const distM = Math.sqrt(dxm * dxm + dym * dym)
              isNearMouse = distM < mouse.radius
            }

            ctx.strokeStyle = isNearMouse
              ? LINE_COLOR_MOUSE(opacity)
              : LINE_COLOR_NORMAL(opacity)
            ctx.lineWidth = 0.6
            ctx.beginPath()
            ctx.moveTo(particles[a].x, particles[a].y)
            ctx.lineTo(particles[b].x, particles[b].y)
            ctx.stroke()
          }
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseleave', handleMouseLeave)
      io.disconnect()
      clearTimeout(resizeTimer)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [intensity, opacityMultiplier, handleVisibilityChange])

  return (
    <div
      ref={containerRef}
      className={cn('relative w-full overflow-hidden', className)}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 size-full"
        style={{ willChange: 'auto' }}
        aria-hidden
      />
      {children != null && (
        <div className="relative z-10 size-full">{children}</div>
      )}
    </div>
  )
}
