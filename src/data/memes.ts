import failImg from '../assets/memes/fail.png'
import win1 from '../assets/memes/win-1.png'
import win2 from '../assets/memes/win-2.png'
import win3 from '../assets/memes/win-3.png'

/** Ảnh chế khi đoán đúng — chọn ngẫu nhiên 1 trong số này */
export const WIN_MEMES = [
  { src: win1, caption: 'Good job em!' },
  { src: win2, caption: 'Chị quá giỏi =))' },
  { src: win3, caption: 'Em tốt lắm!' },
]

/** Ảnh chế khi hết giờ */
export const FAIL_MEME = { src: failImg, caption: 'Thank you, next!' }

/** Chọn ngẫu nhiên, nhưng không để 1 người xuất hiện quá 2 lần liên tiếp */
export function randomWinMeme(recent: number[] = []) {
  const [a, b] = recent.slice(-2)
  const banned = recent.length >= 2 && a === b ? a : -1
  const choices = WIN_MEMES.map((_, i) => i).filter((i) => i !== banned)
  return choices[Math.floor(Math.random() * choices.length)]
}
