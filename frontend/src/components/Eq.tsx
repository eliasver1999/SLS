// Equalizer motif — the SLS brand corner anchor.
export default function Eq({
  heights,
  lg = false,
  className = '',
  style,
}: {
  heights: number[]
  lg?: boolean
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div className={`eq${lg ? ' lg' : ''}${className ? ' ' + className : ''}`} style={style} aria-hidden>
      {heights.map((h, i) => (
        <span key={i} style={{ height: `${h}%` }} />
      ))}
    </div>
  )
}

export const HERO_EQ = [
  30, 55, 40, 75, 95, 60, 100, 70, 88, 45, 66, 52, 80, 38, 58, 30, 48, 24,
]
export const BAND_EQ = [40, 70, 100, 60, 85, 45, 75, 55]
