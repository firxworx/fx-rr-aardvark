import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Spinner } from '../src/components/spinner'

// pnpm --filter @workspace/ui test test/spinner.test.ts

describe('Spinner', () => {
  it('renders spinner with loading aria label', () => {
    render(<Spinner />)

    const element = screen.getByLabelText(/loading/i)
    expect(element).toBeInTheDocument()
    expect(element).toBeVisible()
  })

  it('renders spinner with role status name loading', () => {
    render(<Spinner />)

    const element = screen.getByRole('status', { name: /loading/i })
    expect(element).toBeInTheDocument()
    expect(element).toBeVisible()
  })
})
