import type { CSSProperties } from "react"

interface IconProps {
  name: string
  size?: string
  filled?: boolean
  className?: string
  style?: CSSProperties
}

function Icon({ name, size, filled = false, className = "", style }: IconProps) {
  return (
    <span
      aria-hidden
      className={`material-symbols-outlined ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}`,
        ...style,
      }}
    >
      {name}
    </span>
  )
}

export default Icon
