import React from 'react'

type BrandMarkProps = {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  align?: 'left' | 'center'
}

/**
 * BrandMark renders the TSA KASi title with the Deliveries subline underneath,
 * matching the visual treatment used across the customer portal header.
 */
export default function BrandMark({ className, size = 'md', align = 'left' }: BrandMarkProps) {
  const titleSize = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-xl' : 'text-2xl'
  const deliverySize = size === 'lg' ? 'text-sm' : size === 'sm' ? 'text-xs' : 'text-xs'
  const container = align === 'center' ? 'text-center' : 'text-left'

  const classes = (...parts: Array<string | undefined>) => parts.filter(Boolean).join(' ')

  return (
    <div className={classes('leading-tight', container, className)}>
      <h1 className={classes(titleSize, 'font-display font-bold')}
        aria-label="TSA KASi">
        <span className="text-kasi-blue">TSA</span>{' '}
        <span className="text-kasi-orange">KASi</span>
      </h1>
      <div className={classes('text-kasi-orange font-semibold tracking-wide', deliverySize)}>
        Deliveries
      </div>
    </div>
  )
}
