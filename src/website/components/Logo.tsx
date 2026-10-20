import type { CSSProperties } from 'react'

export interface LogoProps {
  variant?: 'full' | 'horizontal' | 'icon'
  theme?: 'default' | 'white'
  height?: number | string
  style?: CSSProperties
  className?: string
  alt?: string
}

export function Logo({
  variant = 'horizontal',
  theme = 'default',
  height = 42,
  style,
  className,
  alt = 'DocConnect - Book Appointments. Better Health.',
}: LogoProps) {
  let src = '/logo-horizontal.png'

  if (variant === 'icon') {
    src = '/logo-icon.png'
  } else if (variant === 'full') {
    src = '/logo-full.png'
  } else if (theme === 'white') {
    src = '/logo-horizontal-white.png'
  }

  return (
    <img
      src={src}
      alt={alt}
      height={height}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        width: 'auto',
        display: 'block',
        objectFit: 'contain',
        ...style,
      }}
      className={className}
    />
  )
}

export function LogoIcon({
  size = 40,
  style,
  className,
}: {
  size?: number | string
  style?: CSSProperties
  className?: string
}) {
  return (
    <img
      src="/logo-icon.png"
      alt="DocConnect Mark"
      height={size}
      style={{
        height: typeof size === 'number' ? `${size}px` : size,
        width: 'auto',
        display: 'block',
        objectFit: 'contain',
        ...style,
      }}
      className={className}
    />
  )
}

export default Logo
