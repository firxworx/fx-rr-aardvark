import { describe, expect, it } from 'vitest'

import { cn } from '../src/lib/style'

// pnpm --filter @workspace/ui test test/style.test.ts

describe('cn', () => {
  it('joins conditional, object, and array class values', () => {
    expect(cn('flex', false, null, undefined, '', { italic: true, underline: false }, ['border', ['p-4']])).toBe(
      'flex italic border p-4',
    )
  })

  it('resolves conflicting tailwind utilities in favor of the last', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    expect(cn('ps-2', 'px-4')).toBe('px-4')
    expect(cn('hover:bg-accent', 'hover:bg-accent/50')).toBe('hover:bg-accent/50')
  })

  it('keeps font size and text color utilities', () => {
    expect(cn('text-sm', 'text-foreground')).toBe('text-sm text-foreground')
  })

  it('merges custom radius tokens', () => {
    expect(cn('rounded-control', 'rounded-none')).toBe('rounded-none')
    expect(cn('rounded-full', 'rounded-control')).toBe('rounded-control')
    expect(cn('rounded-control', 'rounded-control-wrapper')).toBe('rounded-control-wrapper')
    expect(cn('rounded-control', 'rounded-[min(var(--radius-control),10px)]')).toBe(
      'rounded-[min(var(--radius-control),10px)]',
    )
  })

  it('merges custom container tokens', () => {
    expect(cn('max-w-layout', 'max-w-2xl')).toBe('max-w-2xl')
    expect(cn('max-w-layout', 'max-w-typeset')).toBe('max-w-typeset')
  })

  it('does not merge across variants', () => {
    expect(cn('in-data-[slot=button-group]:rounded-control', 'rounded-none')).toBe(
      'in-data-[slot=button-group]:rounded-control rounded-none',
    )
  })
})
