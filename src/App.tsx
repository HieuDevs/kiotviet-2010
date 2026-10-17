import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import './App.css'
import { WORDS } from './data/words'
import { DateSeal, Flower } from './Decor'
import { randomWinMeme } from './data/memes'
import { Meme } from './Meme'
import { useCountdown } from './hooks/useCountdown'
import {
  isMuted,
  playSolved,
  playStart,
  playTick,
  playTimeUp,
  setMuted,
  startIntroMusic,
  stopIntroMusic,
  subscribeMuted,
} from './lib/sound'
import { shuffle, toQuestion, type Question } from './lib/word'

const QUESTION_TIME_MS = 12_000
const REVEAL_TIME_MS = 3_000
/** Từ mốc này tích-tắc nhanh gấp đôi, màn hình nháy đỏ */
const URGENT_SECONDS = 5
/** Ví dụ ở màn giới thiệu — không lấy từ bộ câu hỏi để khỏi lộ đáp án */
const INTRO_EXAMPLE = { tiles: ['T', 'I', 'E', 'K', 'V', 'O', 'I', 'T'], answer: 'KIOTVIET' }

type Phase = 'intro' | 'playing' | 'finished'
/**
 * guessing: đang đếm ngược · timeup: hết giờ, chờ chọn đoán lại / xem đáp án / câu khác
 * solved: có người đoán ra (nhấn Space) · revealed: hết giờ rồi chọn xem đáp án
 */
type Status = 'guessing' | 'timeup' | 'solved' | 'revealed'
type ResultStatus = 'solved' | 'revealed' | 'skipped'
type Result = { question: Question; status: ResultStatus; timeUsedMs: number }

function newGame(): Question[] {
  return shuffle(WORDS).map(toQuestion)
}

/** Lưu tiến độ vào localStorage để reload trang vẫn chơi tiếp */
const STORAGE_KEY = 'doan-tu-dao:progress:v1'
type Progress = {
  phase: Phase
  questions: Question[]
  index: number
  attempt: number
  status: Status
  results: Result[]
  round: number
}

function loadProgress(): Progress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as Progress
    const valid =
      (p.phase === 'playing' || p.phase === 'finished') &&
      Array.isArray(p.questions) &&
      Array.isArray(p.results) &&
      p.questions[p.index] !== undefined
    return valid ? p : null
  } catch {
    return null
  }
}

function saveProgress(progress: Progress | null) {
  try {
    if (progress) localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // localStorage bị chặn (private mode…) thì bỏ qua, game vẫn chạy bình thường
  }
}

export default function App() {
  const [saved] = useState(loadProgress)
  const [phase, setPhase] = useState<Phase>(saved?.phase ?? 'intro')
  const [questions, setQuestions] = useState<Question[]>(saved?.questions ?? [])
  const [index, setIndex] = useState(saved?.index ?? 0)
  const [attempt, setAttempt] = useState(saved?.attempt ?? 0)
  const [status, setStatus] = useState<Status>(saved?.status ?? 'guessing')
  const [results, setResults] = useState<Result[]>(saved?.results ?? [])
  const [round, setRound] = useState(saved?.round ?? 0)
  const [memeIndex, setMemeIndex] = useState(0)
  const memeHistory = useRef<number[]>([])

  useEffect(() => {
    saveProgress(
      phase === 'intro' ? null : { phase, questions, index, attempt, status, results, round },
    )
  }, [phase, questions, index, attempt, status, results, round])

  const question = questions[index]
  const guessing = phase === 'playing' && status === 'guessing'

  const record = (next: ResultStatus, timeUsedMs: number) =>
    setResults((prev) => [...prev, { question, status: next, timeUsedMs }])

  const remaining = useCountdown(
    QUESTION_TIME_MS,
    guessing,
    `${round}:${index}:${attempt}`,
    () => {
      setStatus('timeup')
      playTimeUp()
    },
  )

  // Nhạc nền ở màn mở đầu
  useEffect(() => {
    if (phase !== 'intro') return
    startIntroMusic()
    return stopIntroMusic
  }, [phase])

  // Tích-tắc mỗi giây, những giây cuối thì mỗi nửa giây
  const tickSlot = guessing ? Math.ceil(remaining / 500) : 0
  useEffect(() => {
    if (tickSlot <= 0) return
    const urgent = tickSlot <= URGENT_SECONDS * 2
    if (!urgent && tickSlot % 2 !== 0) return
    playTick(tickSlot % 2 === 1, urgent)
  }, [tickSlot])

  const start = () => {
    setQuestions(newGame())
    setIndex(0)
    setAttempt(0)
    setStatus('guessing')
    setResults([])
    setRound((r) => r + 1)
    setPhase('playing')
    playStart()
  }

  const nextQuestion = () => {
    if (index + 1 >= questions.length) {
      setPhase('finished')
      return
    }
    setIndex(index + 1)
    setAttempt(0)
    setStatus('guessing')
  }

  const solve = () => {
    setStatus('solved')
    const meme = randomWinMeme(memeHistory.current)
    memeHistory.current = [...memeHistory.current.slice(-1), meme]
    setMemeIndex(meme)
    record('solved', QUESTION_TIME_MS - remaining)
    playSolved()
  }

  const retry = () => {
    setAttempt((a) => a + 1)
    setStatus('guessing')
  }

  const showAnswer = () => {
    setStatus('revealed')
    record('revealed', QUESTION_TIME_MS)
  }

  const reset = () => {
    if (!window.confirm('Chơi lại từ đầu? Toàn bộ tiến độ hiện tại sẽ bị xoá.')) return
    setPhase('intro')
    setQuestions([])
    setIndex(0)
    setAttempt(0)
    setStatus('guessing')
    setResults([])
  }

  const skip = () => {
    record('skipped', QUESTION_TIME_MS)
    nextQuestion()
  }

  // Hiện đáp án một lúc rồi tự chuyển câu
  useEffect(() => {
    if (phase !== 'playing' || (status !== 'solved' && status !== 'revealed')) return
    const id = setTimeout(nextQuestion, REVEAL_TIME_MS)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ hẹn giờ lại khi đổi câu/trạng thái
  }, [phase, status, index])

  // Phím tắt: Space (hành động chính), R (đoán lại), → / N (câu khác), M (tắt/bật tiếng)
  const onKeyRef = useRef<(key: string) => boolean>(() => false)
  useEffect(() => {
    onKeyRef.current = (key) => {
      if (key === 'KeyM') {
        setMuted(!isMuted())
        return true
      }
      if (phase !== 'playing') {
        if (key !== 'Space') return false
        start()
        return true
      }
      if (status === 'guessing') {
        if (key !== 'Space') return false
        solve()
      } else if (status === 'timeup') {
        if (key === 'Space') showAnswer()
        else if (key === 'KeyR') retry()
        else if (key === 'ArrowRight' || key === 'KeyN') skip()
        else return false
      } else {
        if (key !== 'Space' && key !== 'ArrowRight' && key !== 'KeyN') return false
        nextQuestion()
      }
      return true
    }
  })
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
      if (!onKeyRef.current(e.code)) return
      e.preventDefault()
      // Bỏ focus khỏi nút vừa bấm để Space không kích hoạt lại nút đó
      ;(document.activeElement as HTMLElement | null)?.blur()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Mức gấp gáp 0 → 1 theo thời gian còn lại, dùng để đổi màu nền
  let urgency = 0
  if (phase === 'playing' && status === 'guessing') urgency = 1 - remaining / QUESTION_TIME_MS
  else if (phase === 'playing' && status === 'timeup') urgency = 1
  const danger =
    phase === 'playing' &&
    (status === 'timeup' || (status === 'guessing' && remaining <= URGENT_SECONDS * 1000))
  const overlay = createPortal(
    <>
      <div
        className={`urgency-bg ${danger ? 'danger' : ''}`}
        style={{ '--urgency': urgency } as CSSProperties}
        aria-hidden
      />
      <div className="corner">
        <SoundToggle />
        {phase === 'playing' && (
          <button className="btn btn-ghost" onClick={reset} title="Xoá tiến độ, chơi lại từ đầu">
            ↺ Chơi lại từ đầu
          </button>
        )}
      </div>
    </>,
    document.body,
  )

  if (phase === 'intro') {
    return (
      <main className="stage intro">
        {overlay}
        <Flower size={190} className="deco deco-bl" />
        <Flower size={110} className="deco deco-tl" petal="#ffd1e3" petalDeep="#ff5c9a" />
        <Flower size={90} className="deco deco-br" petal="#ffe08a" petalDeep="#ff8a3d" />
        <DateSeal className="intro-seal" />
        <p className="eyebrow">KV-BOOKING · Gameshow mừng 20/10</p>
        <h1 className="logo">
          Đoán <span>Từ Đảo</span>
        </h1>
        <p className="script">Chúc mừng Ngày Phụ nữ Việt Nam</p>
        <div className="example">
          <Tiles tiles={INTRO_EXAMPLE.tiles} size="sm" />
          <span className="arrow">➜</span>
          <span className="example-answer">{INTRO_EXAMPLE.answer}</span>
        </div>
        <ul className="rules">
          <li>
            <b>{QUESTION_TIME_MS / 1000}s</b> cho mỗi câu
          </li>
          <li>
            Đoán ra thì nhấn <b>Space</b>
          </li>
          <li>
            <b>Hết giờ:</b> đoán lại, xem đáp án hoặc câu khác
          </li>
        </ul>
        <button className="btn btn-primary btn-lg btn-fight" onClick={start}>
          CHIẾN!
        </button>
        <KeyHint k="Space">để bắt đầu</KeyHint>
        <p className="credit">
          Created by <b>@hieu.bh1</b>
        </p>
      </main>
    )
  }

  if (phase === 'finished') {
    const solvedCount = results.filter((r) => r.status === 'solved').length
    return (
      <main className="stage">
        {overlay}
        <p className="eyebrow">Kết thúc</p>
        <p className="script">Chúc mừng 20/10!</p>
        <div className="final-score">
          <span className="final-num">{solvedCount}</span>
          <span className="final-total">/{results.length}</span>
        </div>
        <p className="final-label">câu đoán ra trong thời gian</p>
        <ol className="results">
          {results.map((r, i) => (
            <li key={i} className={`result ${r.status}`}>
              <span className="result-tiles">{r.question.tiles.join(' / ')}</span>
              <span className="result-answer">{r.question.answer}</span>
              <ResultBadge result={r} />
            </li>
          ))}
        </ol>
        <button className="btn btn-primary btn-lg" onClick={start}>
          Chơi lại
        </button>
        <KeyHint k="Space">để chơi lại</KeyHint>
      </main>
    )
  }

  const solvedCount = results.filter((r) => r.status === 'solved').length
  const opened = results.filter((r) => r.status !== 'skipped').reverse()

  return (
    <div className={`play-layout ${danger ? 'danger' : ''}`}>
      {overlay}
      <main className="stage">
        <div className={`time-bar ${timeLevel(remaining)}`} aria-hidden>
          <span style={{ transform: `scaleX(${1 - urgency})` }} />
        </div>
        <header className="hud">
          <span className="pill">
            Câu <b>{index + 1}</b>/{questions.length}
          </span>
          <TimerRing remaining={remaining} total={QUESTION_TIME_MS} />
          <span className="pill">
            Đoán ra <b>{solvedCount}</b>
          </span>
        </header>

        <Tiles key={index} tiles={question.tiles} />

        {status === 'solved' && <Meme key={`win-${index}`} kind="win" index={memeIndex} />}
        {status === 'timeup' && <Meme key={`fail-${index}-${attempt}`} kind="fail" />}

        {status === 'guessing' && (
          <div className="actions">
            <button className="btn btn-primary btn-lg" onClick={solve}>
              Hiện đáp án
            </button>
            <KeyHint k="Space">khi có người đoán ra</KeyHint>
          </div>
        )}

        {status === 'timeup' && (
          <div className="timeup">
            <p className="timeup-title">Hết giờ!</p>
            <div className="choices">
              <button className="btn btn-ghost" onClick={retry}>
                Đoán lại <kbd>R</kbd>
              </button>
              <button className="btn btn-primary" onClick={showAnswer}>
                Xem đáp án <kbd>Space</kbd>
              </button>
              <button className="btn btn-ghost" onClick={skip}>
                Câu khác <kbd>→</kbd>
              </button>
            </div>
          </div>
        )}

        {(status === 'solved' || status === 'revealed') && (
          <div className={`reveal ${status}`}>
            <p className="reveal-title">
              {status === 'solved'
                ? `Đoán ra sau ${((QUESTION_TIME_MS - remaining) / 1000).toFixed(1)}s`
                : 'Đáp án'}
            </p>
            <p className="reveal-answer">{question.answer}</p>
            <KeyHint k="Space">để sang câu tiếp</KeyHint>
          </div>
        )}
      </main>

      <aside className="sidebar">
        <h2 className="sidebar-title">
          Đã mở đáp án <span className="count">{opened.length}</span>
        </h2>
        {opened.length === 0 ? (
          <p className="sidebar-empty">Chưa có từ nào</p>
        ) : (
          <ol className="opened">
            {opened.map((r) => (
              <li key={r.question.answer} className={`opened-item ${r.status}`}>
                <span className="opened-answer">{r.question.answer}</span>
                <ResultBadge result={r} />
                <span className="opened-tiles">{r.question.tiles.join('/')}</span>
              </li>
            ))}
          </ol>
        )}
      </aside>
    </div>
  )
}

function SoundToggle() {
  const muted = useSyncExternalStore(subscribeMuted, isMuted)
  return (
    <button
      className="btn btn-ghost"
      onClick={() => setMuted(!muted)}
      title={muted ? 'Bật âm thanh (M)' : 'Tắt âm thanh (M)'}
      aria-label={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
    >
      <svg className="icon" viewBox="0 0 24 24" aria-hidden>
        <path d="M11 5 6 9H2v6h4l5 4V5z" />
        {muted ? (
          <path d="m23 9-6 6m0-6 6 6" />
        ) : (
          <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" />
        )}
      </svg>
      {muted ? 'Đã tắt tiếng' : 'Âm thanh'}
    </button>
  )
}

function ResultBadge({ result }: { result: Result }) {
  const label =
    result.status === 'solved'
      ? `${(result.timeUsedMs / 1000).toFixed(1)}s`
      : result.status === 'revealed'
        ? 'Xem đáp án'
        : 'Bỏ qua'
  return <span className="badge">{label}</span>
}

function KeyHint({ k, children }: { k: string; children: ReactNode }) {
  return (
    <p className="space-hint">
      Nhấn <kbd>{k}</kbd> {children}
    </p>
  )
}

function Tiles({ tiles, size }: { tiles: string[]; size?: 'sm' }) {
  return (
    <div
      className={`tiles ${size ?? ''}`}
      style={{ '--n': tiles.length } as CSSProperties}
      aria-label={`Từ đảo: ${tiles.join('/')}`}
    >
      {tiles.map((t, i) => (
        <span key={i} className="tile-group">
          {i > 0 && <span className="slash">/</span>}
          <span className="tile" style={{ animationDelay: `${i * 50}ms` }}>
            {t}
          </span>
        </span>
      ))}
    </div>
  )
}

const RING_RADIUS = 34
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

function timeLevel(remaining: number) {
  const seconds = Math.ceil(remaining / 1000)
  return seconds <= URGENT_SECONDS ? 'danger' : seconds <= 8 ? 'warn' : 'ok'
}

function TimerRing({ remaining, total }: { remaining: number; total: number }) {
  const progress = remaining / total
  const seconds = Math.ceil(remaining / 1000)
  const level = timeLevel(remaining)
  return (
    <div className={`ring ${level}`} role="timer" aria-label={`Còn ${seconds} giây`}>
      <svg viewBox="0 0 80 80">
        <circle className="ring-track" cx="40" cy="40" r={RING_RADIUS} />
        <circle
          className="ring-bar"
          cx="40"
          cy="40"
          r={RING_RADIUS}
          strokeDasharray={RING_LENGTH}
          strokeDashoffset={RING_LENGTH * (1 - progress)}
        />
      </svg>
      <span className="ring-text">{seconds}</span>
    </div>
  )
}
