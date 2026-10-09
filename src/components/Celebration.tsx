import { useState } from 'react'
import type { Burst } from '../useCelebration.ts'

type Particle = {
  key: number
  tx: number
  ty: number
  size: number
  delay: number
  round: boolean
}

/* Radial spread. Purely visual jitter — deliberately not seeded, so a rebuild
 * never produces the exact same burst twice. */
function buildParticles(count: number): Particle[] {
  const particles: Particle[] = []
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5
    const distance = 54 + Math.random() * 46
    particles.push({
      key: i,
      tx: Math.cos(angle) * distance,
      ty: Math.sin(angle) * distance - 18,
      size: 5 + Math.random() * 4,
      delay: Math.random() * 40,
      round: i % 3 === 0,
    })
  }
  return particles
}

export function Celebration({ burst }: { burst: Burst }) {
  const { id, tier, message, sub, reduced } = burst

  // 'clear' is the bigger moment, so it earns more particles. Computed once
  // per mount: the parent keys this subtree on `id`, so a new celebration
  // remounts it and a re-render never re-rolls the random spread mid-flight.
  const [particles] = useState(() =>
    reduced ? [] : buildParticles(tier === 'clear' ? 16 : 11),
  )

  return (
    // Keyed on id so every celebration replays its entrance from scratch.
    // Centred by CSS, not by coordinates — the reward should land where the
    // eye already is, not out at the checkbox in the left gutter.
    <div className={`celebration celebration-${tier}`} key={id} aria-hidden="true">
      {particles.map((particle) => (
        <span
          key={particle.key}
          className={particle.round ? 'particle particle-round' : 'particle'}
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDelay: `${particle.delay}ms`,
            // Custom properties are how the keyframes stay generic; a single
            // @keyframes rule drives every particle.
            ['--tx' as string]: `${particle.tx}px`,
            ['--ty' as string]: `${particle.ty}px`,
          }}
        />
      ))}
      <div className="celebration-message">
        <span className="celebration-title">{message}</span>
        {sub ? <span className="celebration-sub">{sub}</span> : null}
      </div>
    </div>
  )
}