import type { WordItem } from '../data/words'

export type Question = {
  answer: string
  tiles: string[]
}

/** Chuẩn hoá: NFC (gộp dấu tiếng Việt), chữ thường, bỏ khoảng trắng. */
export function normalize(text: string): string {
  return text.normalize('NFC').toLowerCase().replace(/\s+/g, '')
}

export function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Xáo chữ cái của đáp án, đảm bảo khác thứ tự gốc (nếu có thể). */
export function scramble(answer: string): string[] {
  const letters = Array.from(normalize(answer))
  if (new Set(letters).size < 2) return letters
  let result = shuffle(letters)
  while (result.join('') === letters.join('')) result = shuffle(letters)
  return result
}

export function toQuestion(item: WordItem): Question {
  const tiles = item.scrambled
    ? item.scrambled.normalize('NFC').split('/').map((s) => s.trim()).filter(Boolean)
    : scramble(item.answer)
  return { answer: item.answer, tiles: tiles.map((t) => t.toLocaleUpperCase('vi')) }
}
