/**
 * Âm thanh tổng hợp bằng Web Audio — không cần file mp3.
 * Trình duyệt chỉ cho phát âm thanh sau lần tương tác đầu tiên (click / phím),
 * nên AudioContext được "mở khoá" ở lần tương tác đó.
 */

const MUTE_KEY = 'doan-tu-dao:muted'

let ctx: AudioContext | null = null
let master: GainNode | null = null
let muted = readMuted()
let unlocked = false
const listeners = new Set<() => void>()

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

/** Chưa có tương tác nào thì bỏ qua, tránh dồn cả loạt âm thanh phát cùng lúc khi mở khoá */
function canPlay(): boolean {
  return unlocked || ctx?.state === 'running'
}

function audio(): { ctx: AudioContext; out: GainNode } {
  if (!ctx || !master) {
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : 1
    master.connect(ctx.destination)
  }
  return { ctx, out: master }
}

/** Gọi trong handler của click/phím để trình duyệt cho phép phát âm thanh */
export function unlockAudio() {
  unlocked = true
  const { ctx } = audio()
  if (ctx.state === 'suspended') void ctx.resume()
}

if (typeof window !== 'undefined') {
  const unlock = () => unlockAudio()
  window.addEventListener('pointerdown', unlock, true)
  window.addEventListener('keydown', unlock, true)
}

export function isMuted() {
  return muted
}

export function setMuted(next: boolean) {
  muted = next
  try {
    localStorage.setItem(MUTE_KEY, next ? '1' : '0')
  } catch {
    // bỏ qua nếu localStorage bị chặn
  }
  if (master && ctx) master.gain.setTargetAtTime(next ? 0 : 1, ctx.currentTime, 0.02)
  listeners.forEach((fn) => fn())
}

export function subscribeMuted(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

type Tone = {
  freq: number
  at?: number
  dur: number
  type?: OscillatorType
  vol?: number
  slideTo?: number
}

function tone({ freq, at = 0, dur, type = 'sine', vol = 0.3, slideTo }: Tone, dest?: AudioNode) {
  if (!canPlay()) return
  const { ctx, out } = audio()
  const t = ctx.currentTime + at
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(gain).connect(dest ?? out)
  osc.start(t)
  osc.stop(t + dur + 0.02)
}

type Noise = { at?: number; dur: number; vol?: number; highpass?: number }

function noise({ at = 0, dur, vol = 0.2, highpass = 6000 }: Noise, dest?: AudioNode) {
  if (!canPlay()) return
  const { ctx, out } = audio()
  const t = ctx.currentTime + at
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource()
  src.buffer = buffer
  const filter = ctx.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = highpass
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(vol, t)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(filter).connect(gain).connect(dest ?? out)
  src.start(t)
}

/** Tiếng tích-tắc. `urgent` = những giây cuối: cao hơn, to hơn */
export function playTick(tock: boolean, urgent: boolean) {
  const base = tock ? 1100 : 1600
  tone({ freq: urgent ? base * 1.3 : base, dur: 0.05, type: 'square', vol: urgent ? 0.22 : 0.12 })
  noise({ dur: 0.03, vol: urgent ? 0.18 : 0.1 })
  if (urgent && !tock) tone({ freq: 70, dur: 0.12, type: 'sine', vol: 0.5, slideTo: 45 })
}

/** Hết giờ: kèn buồn "wah wah wah waaah" */
export function playTimeUp() {
  if (!canPlay()) return
  const { ctx, out } = audio()
  const notes = [
    { freq: 311.13, at: 0, dur: 0.38 },
    { freq: 293.66, at: 0.42, dur: 0.38 },
    { freq: 277.18, at: 0.84, dur: 0.38 },
    { freq: 261.63, at: 1.26, dur: 1.3 },
  ]
  notes.forEach(({ freq, at, dur }, i) => {
    const t = ctx.currentTime + at
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(freq, t)
    osc.frequency.linearRampToValueAtTime(freq * 0.97, t + dur)
    // Nốt cuối rung rung cho thêm phần thảm
    if (i === notes.length - 1) {
      const lfo = ctx.createOscillator()
      const depth = ctx.createGain()
      lfo.frequency.value = 6
      depth.gain.value = 7
      lfo.connect(depth).connect(osc.frequency)
      lfo.start(t)
      lfo.stop(t + dur)
    }
    // Lọc thấp để tiếng giống kèn đồng, "wah" bằng cách mở dần bộ lọc
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.Q.value = 6
    filter.frequency.setValueAtTime(400, t)
    filter.frequency.linearRampToValueAtTime(1600, t + 0.12)
    filter.frequency.linearRampToValueAtTime(700, t + dur)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.35, t + 0.04)
    gain.gain.setValueAtTime(0.35, t + dur - 0.08)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    osc.connect(filter).connect(gain).connect(out)
    osc.start(t)
    osc.stop(t + dur + 0.02)
  })
}

/** Chuông khi có người đoán ra */
export function playSolved() {
  ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
    tone({ freq: f, at: i * 0.07, dur: 0.5, type: 'triangle', vol: 0.25 }),
  )
  noise({ at: 0.28, dur: 0.4, vol: 0.06, highpass: 9000 })
}

/** Hiệu ứng khi bấm bắt đầu */
export function playStart() {
  ;[392, 523.25, 659.25, 783.99].forEach((f, i) =>
    tone({ freq: f, at: i * 0.08, dur: 0.18, type: 'square', vol: 0.12 }),
  )
  tone({ freq: 1046.5, at: 0.32, dur: 0.6, type: 'triangle', vol: 0.25 })
  tone({ freq: 130.81, at: 0.32, dur: 0.6, type: 'sawtooth', vol: 0.15 })
}

// ---------- Nhạc nền màn mở đầu ----------

const BPM = 128
const STEP = 60 / BPM / 2 // nốt móc đơn
// Vòng hợp âm C – Am – F – G, mỗi hợp âm 8 bước
const CHORDS = [
  [261.63, 329.63, 392.0, 523.25],
  [220.0, 261.63, 329.63, 440.0],
  [174.61, 220.0, 261.63, 349.23],
  [196.0, 246.94, 293.66, 392.0],
]
const ARP = [0, 1, 2, 3, 2, 1, 2, 3]

let musicTimer: ReturnType<typeof setInterval> | null = null
let musicBus: GainNode | null = null

export function startIntroMusic() {
  if (musicTimer) return
  const { ctx, out } = audio()
  musicBus = ctx.createGain()
  musicBus.gain.value = 0.5
  musicBus.connect(out)
  const bus = musicBus
  let step = 0
  let nextTime = ctx.currentTime + 0.05

  // Lên lịch trước ~0.2s để nhịp không bị giật khi tab bận
  musicTimer = setInterval(() => {
    if (ctx.state !== 'running') {
      nextTime = ctx.currentTime + 0.05
      return
    }
    while (nextTime < ctx.currentTime + 0.2) {
      const at = nextTime - ctx.currentTime
      const chord = CHORDS[Math.floor(step / 8) % CHORDS.length]
      const i = step % 8
      tone({ freq: chord[ARP[i]] * 2, at, dur: STEP * 0.9, type: 'square', vol: 0.05 }, bus)
      if (i % 2 === 0) {
        tone({ freq: chord[0] / 2, at, dur: STEP * 1.8, type: 'triangle', vol: 0.3 }, bus)
      }
      if (i % 4 === 0) {
        tone({ freq: 120, at, dur: 0.15, type: 'sine', vol: 0.5, slideTo: 40 }, bus)
      }
      if (i % 2 === 1) noise({ at, dur: 0.05, vol: 0.06 }, bus)
      step++
      nextTime += STEP
    }
  }, 25)
}

export function stopIntroMusic() {
  if (!musicTimer) return
  clearInterval(musicTimer)
  musicTimer = null
  if (musicBus && ctx) {
    const bus = musicBus
    bus.gain.setTargetAtTime(0, ctx.currentTime, 0.05)
    setTimeout(() => bus.disconnect(), 400)
  }
  musicBus = null
}
