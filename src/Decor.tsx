import { useId, type CSSProperties } from 'react'

/** Hoa 5 cánh, hai lớp, vẽ bằng SVG */
export function Flower({
  size,
  className,
  petal = '#ff8fbd',
  petalDeep = '#e8306f',
  style,
}: {
  size: number
  className?: string
  petal?: string
  petalDeep?: string
  style?: CSSProperties
}) {
  const id = useId()
  const angles = [0, 72, 144, 216, 288]
  return (
    <svg
      className={className}
      style={style}
      width={size}
      height={size}
      viewBox="-50 -50 100 100"
      aria-hidden
    >
      <defs>
        <radialGradient id={`${id}-p`} cx="0" cy="0" r="50" gradientUnits="userSpaceOnUse">
          <stop offset="0.12" stopColor={petalDeep} />
          <stop offset="1" stopColor={petal} />
        </radialGradient>
        <radialGradient id={`${id}-c`}>
          <stop offset="0" stopColor="#fff3c4" />
          <stop offset="1" stopColor="#ffb703" />
        </radialGradient>
      </defs>
      {angles.map((a) => (
        <ellipse
          key={a}
          cx="0"
          cy="-25"
          rx="18"
          ry="26"
          fill={`url(#${id}-p)`}
          transform={`rotate(${a})`}
        />
      ))}
      {angles.map((a) => (
        <ellipse
          key={`i${a}`}
          cx="0"
          cy="-15"
          rx="9"
          ry="15"
          fill="#ffffff"
          opacity="0.28"
          transform={`rotate(${a + 36})`}
        />
      ))}
      <circle r="11" fill={`url(#${id}-c)`} />
      {angles.map((a) => (
        <circle key={`d${a}`} cx="0" cy="-6" r="2" fill="#c2410c" transform={`rotate(${a + 36})`} />
      ))}
    </svg>
  )
}

/** Con dấu ngày 20/10 */
export function DateSeal({ className }: { className?: string }) {
  return (
    <div className={`date-seal ${className ?? ''}`} aria-label="Ngày 20 tháng 10">
      <span className="date-seal-day">20</span>
      <span className="date-seal-month">Tháng 10</span>
    </div>
  )
}

// Vị trí cánh hoa cố định (giả ngẫu nhiên) để không đổi giữa các lần render
const PETALS = Array.from({ length: 26 }, (_, i) => {
  const r = (n: number) => {
    const x = Math.sin((i + 1) * 9301 + n * 49297) * 233280
    return x - Math.floor(x)
  }
  return {
    x: `${(r(1) * 100).toFixed(1)}vw`,
    size: `${(10 + r(2) * 16).toFixed(0)}px`,
    duration: `${(9 + r(3) * 9).toFixed(1)}s`,
    delay: `${(-r(4) * 18).toFixed(1)}s`,
    spin: `${(180 + r(5) * 540).toFixed(0)}deg`,
    opacity: (0.45 + r(6) * 0.45).toFixed(2),
    hue: r(7) > 0.75 ? 'gold' : 'pink',
  }
})

/** Cánh hoa rơi phía sau nội dung */
export function FallingPetals() {
  return (
    <div className="petals" aria-hidden>
      {PETALS.map((p, i) => (
        <span
          key={i}
          className={`petal ${p.hue}`}
          style={
            {
              '--x': p.x,
              '--s': p.size,
              '--d': p.duration,
              '--delay': p.delay,
              '--spin': p.spin,
              '--o': p.opacity,
            } as CSSProperties
          }
        >
          <i />
        </span>
      ))}
    </div>
  )
}
