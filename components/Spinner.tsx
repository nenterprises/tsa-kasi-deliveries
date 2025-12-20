"use client"

import * as React from 'react'

export type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg'
  label?: string
  className?: string
  variant?: 'ring' | 'text'
}

const sizeMap = {
  sm: { d: 16, b: 2 },
  md: { d: 24, b: 3 },
  lg: { d: 40, b: 4 },
} as const

export default function Spinner({
  size = 'md',
  label = 'Loading',
  className,
  variant = 'ring',
}: SpinnerProps) {
  const { d, b } = sizeMap[size]

  return (
    <div
      role="status"
      aria-live="polite"
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
    >
      {variant === 'ring' ? (
        <span
          aria-hidden="true"
          className="u-spin"
          style={{
            width: d,
            height: d,
            borderRadius: '50%',
            borderStyle: 'solid',
            borderWidth: b,
            borderColor: 'var(--spinner-bg, rgba(0,0,0,.15))',
            borderTopColor: 'var(--spinner-fg, rgba(0,0,0,.8))',
            flex: '0 0 auto',
          }}
        />
      ) : null}
      <span style={{ color: 'inherit', fontWeight: 500 }}>{label}</span>
    </div>
  )
}
