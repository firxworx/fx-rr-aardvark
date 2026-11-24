import { describe, expect, it } from 'vitest'

import { InvariantAssertionError } from '../src/errors/custom-errors'
import { invariant, invariantNotFoundResponse, invariantResponse } from '../src/helpers/invariant'

// pnpm --filter @workspace/core test test/invariant.test.ts

function catchThrown(callback: () => void): unknown {
  try {
    callback()
  } catch (error: unknown) {
    return error
  }

  throw new Error('expected callback to throw')
}

function catchResponse(callback: () => void): Response {
  const thrown = catchThrown(callback)

  if (!(thrown instanceof Response)) {
    throw new Error('expected a Response to be thrown')
  }

  return thrown
}

describe('invariant', () => {
  it('does not throw for truthy conditions', () => {
    expect(() => invariant(true)).not.toThrow()
    expect(() => invariant(1, 'message')).not.toThrow()
  })

  it('throws InvariantAssertionError with the given message', () => {
    const error = catchThrown(() => invariant(false, 'value is required'))

    expect(error).toBeInstanceOf(InvariantAssertionError)
    expect((error as InvariantAssertionError).message).toBe('value is required')
  })

  it('resolves lazy messages and only calls them on failure', () => {
    let calls = 0
    const message = (): string => {
      calls++
      return 'lazy message'
    }

    invariant(true, message)
    expect(calls).toBe(0)

    expect(() => invariant(false, message)).toThrow('lazy message')
    expect(calls).toBe(1)
  })

  it.each([undefined, '', '   ', () => '  '])('falls back to the default message for blank message %j', (message) => {
    expect(() => invariant(false, message)).toThrow('Invariant assertion failed')
  })
})

describe('invariantResponse', () => {
  it('does not throw for truthy conditions', () => {
    expect(() => invariantResponse(true)).not.toThrow()
  })

  it('throws a 400 Response with reason phrase by default', async () => {
    const response = catchResponse(() => invariantResponse(false))

    expect(response.status).toBe(400)
    expect(response.statusText).toBe('Bad Request')
    expect(await response.text()).toBe('Bad Request')
  })

  it('uses the given message (trimmed, lazy) as the body', async () => {
    expect(await catchResponse(() => invariantResponse(false, '  invalid id  ')).text()).toBe('invalid id')
    expect(await catchResponse(() => invariantResponse(false, () => 'lazy')).text()).toBe('lazy')
  })

  it('applies status, statusText and headers from responseInit', async () => {
    const response = catchResponse(() =>
      invariantResponse(false, undefined, { status: 409, statusText: 'Custom', headers: { 'x-test': '1' } }),
    )

    expect(response.status).toBe(409)
    expect(response.statusText).toBe('Custom')
    expect(response.headers.get('x-test')).toBe('1')
    expect(await response.text()).toBe('Conflict')
  })

  it('throws a Response (not an Error) for status codes without a known reason phrase', async () => {
    const response = catchResponse(() => invariantResponse(false, undefined, { status: 499 }))

    expect(response.status).toBe(499)
    expect(response.statusText).toBe('')
    expect(await response.text()).toBe('HTTP 499')
  })

  it.each([204, 205, 304])('throws a %i Response without a body (null body status)', (status) => {
    const response = catchResponse(() => invariantResponse(false, 'ignored', { status }))

    expect(response.status).toBe(status)
    expect(response.body).toBeNull()
  })
})

describe('invariantNotFoundResponse', () => {
  it('does not throw for truthy conditions', () => {
    expect(() => invariantNotFoundResponse({})).not.toThrow()
  })

  it('throws a 404 Response with reason phrase by default', async () => {
    const response = catchResponse(() => invariantNotFoundResponse(undefined))

    expect(response.status).toBe(404)
    expect(response.statusText).toBe('Not Found')
    expect(await response.text()).toBe('Not Found')
  })

  it('behaves consistently with invariantResponse for overrides', async () => {
    const response = catchResponse(() => invariantNotFoundResponse(null, 'user not found', { status: 410 }))

    expect(response.status).toBe(410)
    expect(response.statusText).toBe('Gone')
    expect(await response.text()).toBe('user not found')
  })
})
