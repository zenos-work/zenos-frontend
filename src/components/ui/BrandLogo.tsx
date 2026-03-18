import logoDark from '../../assets/logo_dark.svg'
import logoLight from '../../assets/logo_light.svg'
import { useUiStore } from '../../stores/uiStore'

type BrandLogoProps = {
  variant?: 'full' | 'mark'
  height?: number
  width?: number | string
  alt?: string
  objectFit?: React.CSSProperties['objectFit']
  objectPosition?: React.CSSProperties['objectPosition']
  style?: React.CSSProperties
}

export default function BrandLogo({
  variant = 'full',
  height = 28,
  width,
  alt = 'zenos.work',
  objectFit = 'contain',
  objectPosition = 'center',
  style,
}: BrandLogoProps) {
  const theme = useUiStore(s => s.theme)
  const src = theme === 'dark' ? logoDark : logoLight
  const frameWidth = width ?? (variant === 'mark' ? height : 'auto')

  if (variant === 'mark') {
    return (
      <span
        style={{
          width: frameWidth,
          height,
          overflow: 'hidden',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          ...style,
        }}
      >
        <img
          src={src}
          alt={alt}
          style={{
            display: 'block',
            height,
            width: frameWidth,
            objectFit,
            objectPosition,
            maxWidth: 'none',
          }}
        />
      </span>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      style={{
        display: 'block',
        height,
        width: frameWidth,
        objectFit,
        objectPosition,
        ...style,
      }}
    />
  )
}
