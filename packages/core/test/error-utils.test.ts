import { describe, expect, it } from 'vitest'

import { getErrorMessage, toError } from '../src/errors/error-utils'

// pnpm --filter @workspace/core test test/errors.test.ts

describe('getErrorMessage', () => {
  it('returns message from instances of Error', () => {
    const message = 'hello world'
    expect(getErrorMessage(new Error(message))).toBe(message)
  })

  it('returns message from objects with string error property', () => {
    const message = 'hello world'
    expect(getErrorMessage({ error: message })).toBe(message)
  })

  it('returns non-empty strings as given', () => {
    const message = 'hello world'
    expect(getErrorMessage(message)).toBe(message)
  })

  it('returns generic Unknown Error message given empty string input', () => {
    expect(getErrorMessage('')).toBe('Unknown Error')
  })

  it('returns generic Unknown Error message given nullish input', () => {
    expect(getErrorMessage(undefined)).toBe('Unknown Error')
    expect(getErrorMessage(null)).toBe('Unknown Error')
  })

  it('returns fallback value given nullish input and a custom fallback', () => {
    const fallback = 'custom fallback'
    expect(getErrorMessage(undefined, { fallback })).toBe(fallback)
    expect(getErrorMessage(null, { fallback })).toBe(fallback)
    expect(getErrorMessage('', { fallback })).toBe(fallback)
  })

  it('includes a stringified representation of non-nullish unrecognized input', () => {
    expect(getErrorMessage(42)).toBe('Unknown Error: 42')
    expect(getErrorMessage(false)).toBe('Unknown Error: false')
    expect(getErrorMessage({ foo: 'bar' })).toBe('Unknown Error: {"foo":"bar"}')
  })

  it('returns message from objects with string message property', () => {
    expect(getErrorMessage({ message: 'hello world' })).toBe('hello world')
  })

  it('ignores non-string message/error properties', () => {
    expect(getErrorMessage({ message: undefined })).toBe('Unknown Error: {}')
    expect(getErrorMessage({ message: { nested: true } })).toBe('Unknown Error: {"message":{"nested":true}}')
  })

  it('returns message from nested error objects', () => {
    expect(getErrorMessage({ error: { message: 'hello world' } })).toBe('hello world')
  })

  it('falls back to cause when an Error has an empty message', () => {
    expect(getErrorMessage(new Error('', { cause: new Error('root cause') }))).toBe('root cause')
  })
})

describe('toError', () => {
  it('returns Error instances as-is without wrapping', () => {
    const error = new Error('hello world')
    expect(toError(error)).toBe(error)
  })

  it('returns Error subclass instances as-is', () => {
    const error = new TypeError('bad type')
    const result = toError(error)
    expect(result).toBe(error)
    expect(result).toBeInstanceOf(TypeError)
  })

  it('wraps strings in an Error with the string as message', () => {
    const result = toError('hello world')
    expect(result).toBeInstanceOf(Error)
    expect(result.message).toBe('hello world')
    expect(result.cause).toBe('hello world')
  })

  it('wraps objects with message property and preserves the original as cause', () => {
    const original = { message: 'hello world', code: 'E_THING' }
    const result = toError(original)
    expect(result.message).toBe('hello world')
    expect(result.cause).toBe(original)
  })

  it('wraps objects with string error property', () => {
    const original = { error: 'hello world' }
    const result = toError(original)
    expect(result.message).toBe('hello world')
    expect(result.cause).toBe(original)
  })

  it('wraps unrecognized values with a stringified message and the value as cause', () => {
    const result = toError(42)
    expect(result.message).toBe('Unknown Error: 42')
    expect(result.cause).toBe(42)
  })

  it('wraps nullish input with a generic message and no cause', () => {
    for (const value of [undefined, null]) {
      const result = toError(value)
      expect(result).toBeInstanceOf(Error)
      expect(result.message).toBe('Unknown Error')
      expect('cause' in result).toBe(false)
    }
  })

  it('uses the custom fallback for the message when provided', () => {
    const fallback = 'custom fallback'
    expect(toError(undefined, { fallback }).message).toBe(fallback)
    expect(toError('', { fallback }).message).toBe(fallback)
    expect(toError({ foo: 'bar' }, { fallback }).message).toBe(fallback)
  })

  it('produces a message consistent with getErrorMessage for the same input', () => {
    const inputs: unknown[] = ['hello', '', 42, null, { error: 'x' }, { message: 'y' }, { foo: 'bar' }]
    for (const input of inputs) {
      expect(toError(input).message).toBe(getErrorMessage(input))
    }
  })

  it('is safe to rethrow in a catch block', () => {
    expect(() => {
      try {
        throw { error: 'thrown object' }
      } catch (caught) {
        throw toError(caught)
      }
    }).toThrow(Error)
  })

  it('carries name through from Error-like objects', () => {
    const original = { name: 'AbortError', message: 'The operation was aborted' }
    const result = toError(original)
    expect(result).toBeInstanceOf(Error)
    expect(result.name).toBe('AbortError')
    expect(result.message).toBe('The operation was aborted')
    expect(result.cause).toBe(original)
  })

  it('carries name through even when no message could be derived', () => {
    const result = toError({ name: 'TimeoutError' })
    expect(result.name).toBe('TimeoutError')
    expect(result.message).toBe('Unknown Error: {"name":"TimeoutError"}')
  })

  it('ignores non-string or empty name properties', () => {
    expect(toError({ name: 42, message: 'x' }).name).toBe('Error')
    expect(toError({ name: '', message: 'x' }).name).toBe('Error')
    expect(toError({ name: '   ', message: 'x' }).name).toBe('Error')
  })

  it('preserves name on a structured-clone-like error object', () => {
    const cloned = JSON.parse(
      JSON.stringify({ name: 'AbortError', message: 'aborted', stack: 'AbortError: aborted\n    at fetch' }),
    ) as unknown
    const result = toError(cloned)
    expect(result.name).toBe('AbortError')
    expect(result.stack).not.toBe('AbortError: aborted\n    at fetch')
    expect(result.cause).toEqual(cloned)
  })
})
