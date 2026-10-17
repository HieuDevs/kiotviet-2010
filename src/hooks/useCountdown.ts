import { useEffect, useRef, useState } from 'react'

/**
 * Đếm ngược `durationMs`, tính theo mốc thời gian thực nên không bị trôi.
 * Đổi `resetKey` để bắt đầu lại; `running = false` thì dừng (giữ nguyên số giây còn lại).
 */
export function useCountdown(
  durationMs: number,
  running: boolean,
  resetKey: unknown,
  onExpire: () => void,
): number {
  const [tick, setTick] = useState({ key: resetKey, remaining: durationMs })
  const onExpireRef = useRef(onExpire)

  useEffect(() => {
    onExpireRef.current = onExpire
  })

  useEffect(() => {
    if (!running) return
    const deadline = Date.now() + durationMs
    const id = setInterval(() => {
      const remaining = Math.max(0, deadline - Date.now())
      setTick({ key: resetKey, remaining })
      if (remaining === 0) {
        clearInterval(id)
        onExpireRef.current()
      }
    }, 100)
    return () => clearInterval(id)
  }, [durationMs, running, resetKey])

  return tick.key === resetKey ? tick.remaining : durationMs
}
