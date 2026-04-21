'use client'

interface RadialProgressProps {
  value: number // 0-100
  size?: number
  label?: string
  sublabel?: string
}

export default function RadialProgress({
  value,
  size = 80,
  label,
  sublabel,
}: RadialProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value))
  const radius = (size - 12) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#2A2A2A"
            strokeWidth={6}
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#D4FF4F"
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        {/* Center text */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ fontFamily: 'Inter Tight, sans-serif' }}
        >
          <span
            className="tabular-nums leading-none"
            style={{
              fontSize: size * 0.22,
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
            }}
          >
            {Math.round(clampedValue)}%
          </span>
          {label && (
            <span
              style={{
                fontSize: size * 0.12,
                color: '#666666',
                marginTop: 2,
                textAlign: 'center',
                lineHeight: 1.1,
              }}
            >
              {label}
            </span>
          )}
        </div>
      </div>
      {sublabel && (
        <span
          className="text-center"
          style={{
            fontSize: 10,
            color: '#666666',
            marginTop: 4,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {sublabel}
        </span>
      )}
    </div>
  )
}
