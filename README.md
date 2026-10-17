# Đoán Từ Đảo

Gameshow đoán từ tiếng Việt (React + Vite + TypeScript), giao diện theo màu thương hiệu KiotViet.

- Mỗi câu hiển thị các chữ cái bị đảo, ví dụ `T/I/E/K/V/O/I/T` → `KIOTVIET`.
- Người chơi đoán bằng lời. Có người đoán ra thì nhấn **Space** (hoặc nút "Hiện đáp án") để hiện đáp án.
- Mỗi câu 12 giây. Hết giờ thì chọn: **Đoán lại** (`R`, đếm lại 12s), **Xem đáp án** (`Space`) hoặc **Câu khác** (`→`, không mở đáp án).
- Khi đang hiện đáp án: nhấn **Space** để sang câu ngay, hoặc chờ 3 giây tự chuyển.
- Sidebar bên phải liệt kê các từ đã mở đáp án (xanh: đoán ra, vàng: xem đáp án sau khi hết giờ).

## Chạy

```bash
npm install
npm run dev
```

## Thêm / sửa từ

Sửa `src/data/words.ts`:

```ts
{ answer: 'Bứt tốc', scrambled: 'B/Ố/C/T/Ứ/T' },
{ answer: 'áo dài' }, // bỏ trống `scrambled` thì game tự xáo chữ
```

Ô chữ luôn hiển thị chữ hoa. Thời gian mỗi câu chỉnh ở `QUESTION_TIME_MS`, thời gian hiện đáp án ở `REVEAL_TIME_MS` trong `src/App.tsx`.
