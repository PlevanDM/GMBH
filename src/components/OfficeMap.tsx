import { memo, useState, useCallback } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
  Graticule,
  ZoomableGroup,
} from 'react-simple-maps'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

/* ─── Types & Data ─── */

export type OfficeId = 'de' | 'pl' | 'ua' | 'usa' | 'uk' | 'mx'

export interface Office {
  id: OfficeId
  address: string
  phone: string
  flag: string
  mapsUrl: string
  /** [longitude, latitude] for react-simple-maps */
  coords: [number, number]
}

export const offices: Office[] = [
  { id: 'de', address: 'Hansaring 61, Köln 50670', phone: '+49 221-16-12-489', flag: '🇩🇪', mapsUrl: 'https://maps.google.com/?q=Hansaring+61+K%C3%B6ln+50670', coords: [6.96, 50.94] },
  { id: 'pl', address: 'ul. Aleksandra Ostrowskiego nr.7 – 315', phone: '+48 452-068-410', flag: '🇵🇱', mapsUrl: 'https://maps.google.com/?q=Aleksandra+Ostrowskiego+7+Wroc%C5%82aw', coords: [17.04, 51.11] },
  { id: 'ua', address: 'Rishelievska St, 43', phone: '+38 048-777-11-40', flag: '🇺🇦', mapsUrl: 'https://maps.google.com/?q=Rishelievska+St+43+Odesa', coords: [30.73, 46.48] },
  { id: 'usa', address: '7901 4th St N, Suite # 24628', phone: '727-7481542', flag: '🇺🇸', mapsUrl: 'https://maps.google.com/?q=7901+4th+St+N+St+Petersburg+FL', coords: [-82.64, 27.77] },
  { id: 'uk', address: 'Segro Park Hayes, North Hyde Gardens, UB3 4QR', phone: '+49 173-436-47-17', flag: '🇬🇧', mapsUrl: 'https://maps.google.com/?q=Segro+Park+Hayes+North+Hyde+Gardens+UB3+4QR', coords: [-0.42, 51.51] },
  { id: 'mx', address: 'Montecito 38 Piso 8, Nápoles, Benito Juárez', phone: '+52 984-266-0470', flag: '🇲🇽', mapsUrl: 'https://maps.google.com/?q=Montecito+38+Piso+8+N%C3%A1poles+Benito+Ju%C3%A1rez+CDMX', coords: [-99.13, 19.43] },
]

const connectionPairs: [OfficeId, OfficeId][] = [
  ['de', 'uk'],
  ['de', 'pl'],
  ['pl', 'ua'],
  ['de', 'usa'],
  ['uk', 'usa'],
  ['usa', 'mx'],
  ['de', 'mx'],
]

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

function getOfficeById(id: OfficeId): Office {
  return offices.find((o) => o.id === id)!
}

/* ─── Props ─── */

export interface OfficeMapProps {
  hoveredOffice: OfficeId | null
  setHoveredOffice: (id: OfficeId | null) => void
  t: (key: string) => string
  theme?: 'dark' | 'light'
}

const DEFAULT_CENTER: [number, number] = [-30, 35]
const DEFAULT_ZOOM = 1

/* ─── Component ─── */

const OfficeMap = memo(function OfficeMap({ hoveredOffice, setHoveredOffice, t, theme = 'light' }: OfficeMapProps) {
  const isDark = theme === 'dark'

  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER)

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(z * 1.5, 8)), [])
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(z / 1.5, 1)), [])
  const handleReset = useCallback(() => { setZoom(DEFAULT_ZOOM); setCenter(DEFAULT_CENTER) }, [])

  const landFill = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(30,58,95,0.08)'
  const landStroke = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(30,58,95,0.15)'
  const landHover = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(30,58,95,0.14)'
  const gratStroke = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(30,58,95,0.06)'
  const lineDefault = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(30,58,95,0.12)'
  const lineActive = 'rgba(251,146,60,0.6)'
  const labelBg = isDark ? 'rgba(15,15,15,0.92)' : 'rgba(255,255,255,0.96)'
  const labelStroke = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
  const labelStrokeHover = 'rgba(251,146,60,0.5)'
  const labelTextColor = isDark ? 'white' : '#1e3a5f'
  const labelSubColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(30,58,95,0.5)'

  const bgGradient = isDark
    ? 'radial-gradient(ellipse at 55% 40%, rgba(59,130,246,0.06) 0%, rgba(0,0,0,0) 70%)'
    : 'radial-gradient(ellipse at 55% 40%, rgba(59,130,246,0.03) 0%, rgba(245,245,245,0) 70%)'

  const borderClass = isDark ? 'border-white/[0.06]' : 'border-neutral-200'
  const btnClass = isDark
    ? 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white'
    : 'bg-white hover:bg-neutral-50 text-neutral-500 hover:text-neutral-800 border border-neutral-200 shadow-sm'

  // Scale labels with zoom so they stay readable
  const labelScale = 1 / Math.sqrt(zoom)

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border ${borderClass}`}
      style={{ background: bgGradient }}
    >
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          center: [-30, 35],
          scale: 200,
        }}
        width={960}
        height={480}
        className="w-full h-auto"
      >
        <ZoomableGroup
          center={center}
          zoom={zoom}
          onMoveEnd={({ coordinates, zoom: z }) => { setCenter(coordinates); setZoom(z) }}
          minZoom={1}
          maxZoom={8}
        >
          <Graticule stroke={gratStroke} strokeWidth={0.4} />

          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={landFill}
                  stroke={landStroke}
                  strokeWidth={0.3}
                  style={{
                    default: { outline: 'none' },
                    hover: { fill: landHover, outline: 'none' },
                    pressed: { outline: 'none' },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Connection lines */}
          {connectionPairs.map(([idA, idB]) => {
            const a = getOfficeById(idA)
            const b = getOfficeById(idB)
            const isHighlighted = hoveredOffice === idA || hoveredOffice === idB
            return (
              <Line
                key={`${idA}-${idB}`}
                from={a.coords}
                to={b.coords}
                stroke={isHighlighted ? lineActive : lineDefault}
                strokeWidth={isHighlighted ? 1.5 / zoom : 0.6 / zoom}
                strokeLinecap="round"
              />
            )
          })}

          {/* Office markers */}
          {offices.map((o) => {
            const isHovered = hoveredOffice === o.id
            const dotR = (isHovered ? 4 : 2.8) / Math.sqrt(zoom)
            const coreR = (isHovered ? 1.8 : 1) / Math.sqrt(zoom)
            const glowR = (isHovered ? 8 : 5) / Math.sqrt(zoom)

            return (
              <Marker
                key={o.id}
                coordinates={o.coords}
                onMouseEnter={() => setHoveredOffice(o.id)}
                onMouseLeave={() => setHoveredOffice(null)}
                onClick={() => setHoveredOffice(hoveredOffice === o.id ? null : o.id)}
                style={{ default: { cursor: 'pointer' }, hover: { cursor: 'pointer' }, pressed: {} }}
              >
                {/* Pulse ring */}
                <circle r={9 / Math.sqrt(zoom)} fill="none" stroke="rgba(251,146,60,0.3)" strokeWidth={0.8 / zoom}>
                  <animate attributeName="r" values={`${5 / Math.sqrt(zoom)};${11 / Math.sqrt(zoom)};${5 / Math.sqrt(zoom)}`} dur="2.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="2.5s" repeatCount="indefinite" />
                </circle>
                {/* Glow */}
                <circle r={glowR} fill={isHovered ? 'rgba(251,146,60,0.2)' : 'rgba(251,146,60,0.1)'} />
                {/* Dot */}
                <circle r={dotR} fill={isHovered ? '#fb923c' : '#f97316'} />
                {/* Core */}
                <circle r={coreR} fill="white" />
                {/* Label */}
                <g transform={`scale(${labelScale})`}>
                  <rect
                    x={6}
                    y={-9}
                    width={isHovered ? 100 : 72}
                    height={isHovered ? 26 : 18}
                    rx={4}
                    fill={isHovered ? labelBg : labelBg}
                    stroke={isHovered ? labelStrokeHover : labelStroke}
                    strokeWidth={0.5}
                  />
                  <text
                    x={10}
                    y={isHovered ? 2 : 4}
                    fill={labelTextColor}
                    fontSize={isHovered ? 8 : 6.5}
                    fontWeight={isHovered ? 600 : 500}
                    fontFamily="system-ui, sans-serif"
                    className="select-none pointer-events-none"
                  >
                    {o.flag} {t(`footerOffice.${o.id}.city`)}
                  </text>
                  {isHovered && (
                    <text
                      x={10}
                      y={13}
                      fill={labelSubColor}
                      fontSize={5.5}
                      fontFamily="system-ui, sans-serif"
                      className="select-none pointer-events-none"
                    >
                      {t(`footerOffice.${o.id}.country`)}
                    </text>
                  )}
                </g>
              </Marker>
            )
          })}
        </ZoomableGroup>
      </ComposableMap>

      {/* Zoom controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={handleZoomIn}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${btnClass}`}
          title="Zoom in"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${btnClass}`}
          title="Zoom out"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        {zoom !== DEFAULT_ZOOM && (
          <button
            type="button"
            onClick={handleReset}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${btnClass}`}
            title="Reset view"
            aria-label="Reset view"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Zoom level indicator */}
      {zoom > 1.1 && (
        <div className={`absolute bottom-3 left-3 px-2 py-1 rounded-md text-[10px] font-medium select-none ${isDark ? 'bg-black/50 text-white/50' : 'bg-white/80 text-neutral-500 border border-neutral-200'}`}>
          {zoom.toFixed(1)}x
        </div>
      )}

      {/* LIVE badge */}
      <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-md ${isDark ? 'bg-black/50' : 'bg-white/80 border border-neutral-200'} backdrop-blur-sm`}>
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className={`text-[10px] font-semibold tracking-wider select-none ${isDark ? 'text-white/50' : 'text-neutral-500'}`}>LIVE</span>
      </div>
    </div>
  )
})

export default OfficeMap
