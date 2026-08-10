/**
 * Static pre-upload placeholder: the empty drop zone's ring, so the product is visible before
 * a photo lands. This is decorative only — the real, pixel-exact ring is drawn on canvas by
 * lib/render/artboards/*.ts once P1 ships. Do not treat this as the render source of truth.
 */

const CENTER = 100
const PHOTO_R = 70
const BAND_OUTER_R = PHOTO_R * (1.077 + 0.112 / 2) // green band's outer edge
const ORBIT_R = PHOTO_R * 1.158
const ORBIT_STROKE = PHOTO_R * 0.023
const ORBIT_DASH: [number, number] = [PHOTO_R * 0.06, PHOTO_R * 0.051]
const PIP_ANGLE_DEG = 83.5
const PIP_R = PHOTO_R * 0.149

const pipAngleRad = (PIP_ANGLE_DEG * Math.PI) / 180
const pipX = CENTER + ORBIT_R * Math.sin(pipAngleRad)
const pipY = CENTER - ORBIT_R * Math.cos(pipAngleRad)

const FROND_ANGLES = [-55, -27, 0, 27, 55]

function frondPath(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180
  const tipR = PIP_R * 0.62
  const baseX = 0
  const baseY = PIP_R * 0.38
  const tipX = tipR * Math.sin(rad)
  const tipY = -tipR * Math.cos(rad) + PIP_R * 0.05
  const ctrlX = tipX * 0.55
  const ctrlY = (baseY + tipY) * 0.4
  return `M ${baseX} ${baseY} Q ${ctrlX} ${ctrlY} ${tipX} ${tipY}`
}

export function RingMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx={CENTER} cy={CENTER} r={BAND_OUTER_R} fill="var(--hhg-green)" />
      <circle
        cx={CENTER}
        cy={CENTER}
        r={ORBIT_R}
        fill="none"
        stroke="var(--hhg-pink)"
        strokeWidth={ORBIT_STROKE}
        strokeDasharray={ORBIT_DASH.join(' ')}
        strokeLinecap="round"
      />
      <circle cx={pipX} cy={pipY} r={PIP_R} fill="var(--hhg-yellow)" />
      <g transform={`translate(${pipX} ${pipY})`}>
        {FROND_ANGLES.map((angle) => (
          <path
            key={angle}
            d={frondPath(angle)}
            fill="none"
            stroke="var(--hhg-green)"
            strokeWidth={PIP_R * 0.16}
            strokeLinecap="round"
          />
        ))}
      </g>
    </svg>
  )
}
