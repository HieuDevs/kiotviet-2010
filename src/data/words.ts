export type WordItem = {
  /** Đáp án đúng, ví dụ "lọ cồn" */
  answer: string
  /**
   * Từ đảo, các chữ cái ngăn cách bằng dấu "/", ví dụ "l/ồ/c/o/n".
   * Bỏ trống thì game tự xáo trộn chữ cái của đáp án.
   */
  scrambled?: string
}

export const WORDS: WordItem[] = [
  { answer: 'Bứt tốc', scrambled: 'B/Ố/C/T/Ứ/T' },
  { answer: 'Tứ Kết', scrambled: 'K/Ứ/T/T/Ế' },
  { answer: 'Đụng độ', scrambled: 'Đ/Ụ/Đ/N/G/Ộ' },
  { answer: 'Quạt Trần', scrambled: 'Q/U/Ầ/N/R/T/Ạ/T' },
  { answer: 'Cục đá', scrambled: 'Đ/c/ụ/C/á' },
  { answer: 'mặc cả', scrambled: 'm/ả/c/ặ/c' },
  { answer: 'ruồi bâu', scrambled: 'b/u/ồ/i/r/â/u' },
  { answer: 'chủ tịch', scrambled: 'c/h/ị/c/h/t/ủ' },
  { answer: 'dê tái', scrambled: 'd/á/i/t/ê' },
  { answer: 'đậu phụ', scrambled: 'đ/ụ/p/h/ậ/u' },
  { answer: 'Lời đồn', scrambled: 'Đ/i/ờ/ồ/n/l' },
  { answer: 'Bún cua', scrambled: 'ú/b/n/a/u/c' },
  { answer: 'Căn cước', scrambled: 'ă/n/c/ớ/c/ư/c' },
  { answer: 'Lo lắng', scrambled: 'G/ắ/n/L/o/L' },
  { answer: 'Nồi cá lóc', scrambled: 'C/á/i/L/ồ/c/ó/n' },
  { answer: 'tất niên', scrambled: 'n/ấ/n/t/ê/t/i' },
  { answer: 'Quỹ đạo', scrambled: 'đ/ỹ/q/u/ạ/o' },
  { answer: 'Chó mực', scrambled: 'M/Ó/C/H/C/Ự' },
  { answer: 'Buồn rầu', scrambled: 'R/Ồ/N/U/B/Ầ/U' },
  { answer: 'Cú Sốc', scrambled: 'S/Ú/C/C/Ố' },
  { answer: 'Đá cuội', scrambled: 'C/Á/Đ/U/Ộ/I' },
  { answer: 'Tích đức', scrambled: 'N/H/Ứ/C/Đ/Í/T' },
  { answer: 'Đầu cá hồi', scrambled: 'Đ/Á/I/H/Ồ/C/Ầ/U' },
  { answer: 'Đùi gà rán', scrambled: 'Đ/Á/I/R/Ù/N/G/À' },
  { answer: 'Bún riêu cua', scrambled: 'B/Ú/C/U/R/I/Ê/N/U/A' },
]
