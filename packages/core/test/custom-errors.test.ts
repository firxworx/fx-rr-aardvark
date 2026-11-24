import { describe, expect, it } from 'vitest'

import {
  CustomError,
  DataIntegrityError,
  DataNotFoundError,
  InvariantAssertionError,
} from '../src/errors/custom-errors'

// pnpm --filter @workspace/core test test/custom-errors.test.ts

describe.each([
  ['InvariantAssertionError', InvariantAssertionError],
  ['DataIntegrityError', DataIntegrityError],
  ['DataNotFoundError', DataNotFoundError],
])('%s', (name, ErrorClass) => {
  it('is an instance of Error and CustomError', () => {
    const error = new ErrorClass('x')

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(CustomError)
    expect(error).toBeInstanceOf(ErrorClass)
  })

  it('has the explicit class name as its name', () => {
    const error = new ErrorClass('message')

    expect(error.name).toBe(name)
    expect(String(error)).toBe(`${name}: message`)
  })

  it('has a non-enumerable name like native errors', () => {
    const error = new ErrorClass('x')

    expect(Object.keys(error)).toEqual([])
    expect(JSON.stringify(error)).toBe('{}')
  })

  it('supports cause', () => {
    const cause = new Error('root cause')

    expect(new ErrorClass('x', { cause }).cause).toBe(cause)
  })
})

describe('CustomError', () => {
  it('uses the static name of subclasses (minification-safe) and falls back to the class name', () => {
    const MinifiedError = class extends CustomError {
      static override readonly name = 'ExplicitError'
    }
    class ImplicitError extends CustomError {}

    expect(new MinifiedError().name).toBe('ExplicitError')
    expect(new ImplicitError().name).toBe('ImplicitError')
  })
})
