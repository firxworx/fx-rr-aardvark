import { describe, expect, expectTypeOf, it } from 'vitest'

import { DataIntegrityError, DataNotFoundError } from '../src/errors/custom-errors'
import { ensureOptionalResult, ensureResult, ensureValue, pickResult } from '../src/helpers/ensure'

// pnpm --filter @workspace/core test test/ensure.test.ts

interface Row {
  id: number
}

const row: Row = { id: 1 }

describe('ensureValue', () => {
  it.each([0, '', false, Number.NaN])('returns falsy non-nullish value %j', (value) => {
    expect(ensureValue(value)).toBe(value)
  })

  it('narrows the return type to NonNullable', () => {
    const value: string | null | undefined = 'abc' as string | null | undefined

    expectTypeOf(ensureValue(value)).toEqualTypeOf<string>()
  })

  it.each([null, undefined])('throws TypeError with default message for %s', (value) => {
    expect(() => ensureValue(value)).toThrow(new TypeError('Expected value to not be null or undefined'))
  })

  it('throws TypeError with a custom string message', () => {
    expect(() => ensureValue(null, 'user is required')).toThrow(new TypeError('user is required'))
  })

  it('falls back to the default message for a blank string message', () => {
    expect(() => ensureValue(null, '  ')).toThrow('Expected value to not be null or undefined')
  })

  it('throws a given Error instance as-is', () => {
    const error = new DataNotFoundError('missing')

    expect(() => ensureValue(undefined, error)).toThrow(error)
  })

  it('instantiates a given Error class with the default message', () => {
    expect(() => ensureValue(undefined, DataNotFoundError)).toThrow(DataNotFoundError)
    expect(() => ensureValue(undefined, DataNotFoundError)).toThrow('Expected value to not be null or undefined')
  })
})

describe('pickResult', () => {
  it('returns the single item', () => {
    expect(pickResult([row])).toBe(row)
  })

  it('returns undefined for an empty array or a null item', () => {
    expect(pickResult([])).toBeUndefined()
    expect(pickResult([null])).toBeUndefined()
  })

  it('throws DataIntegrityError for multiple items', () => {
    expect(() => pickResult([row, row])).toThrow(DataIntegrityError)
  })
})

describe('ensureResult', () => {
  it('returns the single row from arrays and promised arrays', async () => {
    await expect(ensureResult([row])).resolves.toBe(row)
    await expect(ensureResult(Promise.resolve([row]))).resolves.toBe(row)
  })

  it('returns single values and promised single values', async () => {
    await expect(ensureResult(row)).resolves.toBe(row)
    await expect(ensureResult(Promise.resolve(row))).resolves.toBe(row)
  })

  it('infers the row type for each input shape', () => {
    expectTypeOf(ensureResult([row])).toEqualTypeOf<Promise<Row>>()
    expectTypeOf(ensureResult(Promise.resolve([row]))).toEqualTypeOf<Promise<Row>>()
    expectTypeOf(ensureResult(Promise.resolve(row as Row | undefined))).toEqualTypeOf<Promise<Row>>()
  })

  it.each([
    ['empty array', []],
    ['array with null item', [null]],
    ['null', null],
    ['undefined', undefined],
  ])('throws DataNotFoundError for %s', async (_label, input) => {
    await expect(ensureResult(input)).rejects.toThrow(new DataNotFoundError('Expected single result: none found'))
  })

  it('throws DataIntegrityError for multiple rows', async () => {
    await expect(ensureResult(Promise.resolve([row, row]))).rejects.toThrow(DataIntegrityError)
  })
})

describe('ensureOptionalResult', () => {
  it('returns the single row from arrays, single values, and promises of either', async () => {
    await expect(ensureOptionalResult([row])).resolves.toBe(row)
    await expect(ensureOptionalResult(Promise.resolve([row]))).resolves.toBe(row)
    await expect(ensureOptionalResult(row)).resolves.toBe(row)
    await expect(ensureOptionalResult(Promise.resolve(row))).resolves.toBe(row)
  })

  it('infers the row type for each input shape', () => {
    expectTypeOf(ensureOptionalResult([row])).toEqualTypeOf<Promise<Row | undefined>>()
    expectTypeOf(ensureOptionalResult(Promise.resolve(row as Row | null))).toEqualTypeOf<Promise<Row | undefined>>()
  })

  it.each([
    ['empty array', []],
    ['array with null item', [null]],
    ['null', null],
    ['undefined', undefined],
  ])('returns undefined for %s', async (_label, input) => {
    await expect(ensureOptionalResult(input)).resolves.toBeUndefined()
  })

  it('throws DataIntegrityError for multiple rows', async () => {
    await expect(ensureOptionalResult([row, row])).rejects.toThrow(DataIntegrityError)
  })
})
