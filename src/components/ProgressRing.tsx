type ProgressRingProps = {
  /** Completed fraction, 0..1. At exactly 1 the ring turns the success colour. */
  progress: number
  size?: number
  stroke?: number
  /** Fraction label rendered in the ring's centre, e.g. "2/5". */
  label: string
}

function ProgressRing({ progress, size = 56, stroke = 5, label }: ProgressRingProps) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(1, Math.max(0, progress))

  return (
    <div
      className="progress-ring"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label} done`}
    >
      <svg width={size} height={size} aria-hidden="true">
        <circle
          className="progress-ring-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
        />
        <circle
          className={clamped >= 1 ? 'progress-ring-fill is-complete' : 'progress-ring-fill'}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
        />
      </svg>
      <span className="progress-ring-label" aria-hidden="true">{label}</span>
    </div>
  )
}

export default ProgressRing
