import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { LayoutContainer } from '@/layout/app-layout'

describe('LayoutContainer', () => {
  it('renders the element given by `as` with its children', () => {
    render(
      <LayoutContainer as="section" aria-label="Example" className="py-4">
        Content
      </LayoutContainer>,
    )

    const container = screen.getByRole('region', { name: 'Example' })

    expect(container.tagName).toBe('SECTION')
    expect(container).toHaveTextContent('Content')
    expect(container).toHaveClass('mx-auto', 'py-4')
  })
})
