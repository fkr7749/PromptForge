/**
 * Custom PromptForge logo mark — geometric forge/anvil spark.
 * Replaces the generic Zap icon everywhere.
 */
export default function Logo({
  size = 32,
  className = '',
  variant = 'filled',
}: {
  size?: number
  className?: string
  variant?: 'filled' | 'outline' | 'mono'
}) {
  if (variant === 'outline') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        className={className}
        aria-hidden
      >
        <rect x="2" y="2" width="28" height="28" rx="7" stroke="currentColor" strokeWidth="2" />
        <path
          d="M10.5 21L14 16L11.5 12.5L16 7L20.5 12.5L18 16L21.5 21L16 25L10.5 21Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M16 7L17 9.5L16 8.5L15 9.5L16 7Z" fill="currentColor" opacity="0.6" />
      </svg>
    )
  }

  if (variant === 'mono') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        className={className}
        aria-hidden
      >
        <path
          d="M10.5 21L14 16L11.5 12.5L16 7L20.5 12.5L18 16L21.5 21L16 25L10.5 21Z"
          fill="currentColor"
        />
        <path d="M16 7L17 9.5L16 8.5L15 9.5L16 7Z" fill="currentColor" opacity="0.5" />
      </svg>
    )
  }

  // Default: filled container with white mark
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden
    >
      {/* Rounded container */}
      <rect x="1" y="1" width="30" height="30" rx="8" fill="currentColor" />
      {/* Forge spark mark */}
      <path
        d="M10.5 21L14 16L11.5 12.5L16 7L20.5 12.5L18 16L21.5 21L16 25L10.5 21Z"
        fill="white"
      />
      {/* Top spark accent */}
      <path d="M16 7L17 9.5L16 8.5L15 9.5L16 7Z" fill="white" opacity="0.5" />
    </svg>
  )
}
