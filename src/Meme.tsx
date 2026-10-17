import { useEffect, useState, type CSSProperties } from 'react'
import { FAIL_MEME, WIN_MEMES } from './data/memes'

/** Ảnh "sai" tự ẩn sau chừng này để không che ô chữ khi chọn Đoán lại */
const FAIL_SHOW_MS = 3200

const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  angle: `${(360 / 18) * i + (i % 3) * 7}deg`,
  dist: `${150 + (i % 4) * 40}px`,
  color: ['#ff5c9a', '#ffd36e', '#5be92a', '#3ae3ff', '#ffffff'][i % 5],
  delay: `${(i % 4) * 30}ms`,
}))

/** Ảnh chế bật lên khi đoán đúng (win) hoặc hết giờ (fail) */
export function Meme({ kind, index = 0 }: { kind: 'win' | 'fail'; index?: number }) {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (kind !== 'fail') return
    const id = setTimeout(() => setHidden(true), FAIL_SHOW_MS)
    return () => clearTimeout(id)
  }, [kind])

  if (hidden) return null
  const meme = kind === 'win' ? WIN_MEMES[index % WIN_MEMES.length] : FAIL_MEME

  return (
    <div className={`meme ${kind}`} onClick={() => setHidden(true)} aria-live="polite">
      {kind === 'win' && (
        <div className="confetti" aria-hidden>
          {CONFETTI.map((c, i) => (
            <i
              key={i}
              style={
                {
                  '--angle': c.angle,
                  '--dist': c.dist,
                  '--color': c.color,
                  animationDelay: c.delay,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}
      <div className="meme-card">
        <div className="meme-photo">
          <img src={meme.src} alt="" />
        </div>
        <p className="meme-caption">{meme.caption}</p>
      </div>
    </div>
  )
}
