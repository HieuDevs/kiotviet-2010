import kiotvietMark from './assets/kiotviet-mark.svg'

export default function BrandBar() {
  return (
    <header className="brand-bar">
      <span className="brand-main">
        <img src={kiotvietMark} alt="" />
        KV-BOOKING
      </span>
      <span className="brand-tag">Mừng 20/10</span>
    </header>
  )
}
