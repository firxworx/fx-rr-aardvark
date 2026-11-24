import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'

import {
  isAbortError,
  isErrorLike,
  isNonNullish,
  isNullish,
  isPlainObject,
  isRecord,
  isRecordWithKey,
  isString,
  isThenable,
} from '../src/helpers/guards'

// pnpm --filter @workspace/core test test/guards.test.ts

/** Error created in a separate realm (V8 context) so that `instanceof Error` is `false`. */
const crossRealmError: unknown = runInNewContext('new Error("cross realm")')
const crossRealmAbortError: unknown = runInNewContext('Object.assign(new Error("aborted"), { name: "AbortError" })')

describe('isThenable', () => {
  it('returns true for native promises', () => {
    expect(isThenable(Promise.resolve(1))).toBe(true)
  })

  it('returns true for custom thenable objects and functions', () => {
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable under test
    expect(isThenable({ then: () => undefined })).toBe(true)
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable under test
    expect(isThenable(Object.assign(() => undefined, { then: () => undefined }))).toBe(true)
  })

  it('returns true for promises from another realm', () => {
    expect(isThenable(runInNewContext('Promise.resolve(1)'))).toBe(true)
  })

  it('returns false when then is not a function', () => {
    // biome-ignore lint/suspicious/noThenProperty: intentional non-callable then under test
    expect(isThenable({ then: 'nope' })).toBe(false)
    expect(isThenable({})).toBe(false)
    expect(isThenable([])).toBe(false)
    expect(isThenable(() => undefined)).toBe(false)
  })

  it('returns false for nullish and primitive values', () => {
    expect(isThenable(null)).toBe(false)
    expect(isThenable(undefined)).toBe(false)
    expect(isThenable('then')).toBe(false)
    expect(isThenable(42)).toBe(false)
  })
})

describe('isErrorLike', () => {
  it('returns true for Error instances and subclasses', () => {
    expect(isErrorLike(new Error('x'))).toBe(true)
    expect(isErrorLike(new TypeError('x'))).toBe(true)
  })

  it('returns true for cross-realm errors and DOMException', () => {
    expect(crossRealmError instanceof Error).toBe(false)
    expect(isErrorLike(crossRealmError)).toBe(true)
    expect(isErrorLike(new DOMException('x', 'AbortError'))).toBe(true)
  })

  it('returns true for plain objects with string name and message', () => {
    expect(isErrorLike({ name: 'Error', message: 'x' })).toBe(true)
  })

  it('returns false for objects missing name or message', () => {
    expect(isErrorLike({ message: 'x' })).toBe(false)
    expect(isErrorLike({ name: 'Error' })).toBe(false)
    expect(isErrorLike({ name: 'Error', message: 42 })).toBe(false)
  })

  it('returns false for nullish and primitive values', () => {
    expect(isErrorLike(null)).toBe(false)
    expect(isErrorLike(undefined)).toBe(false)
    expect(isErrorLike('Error')).toBe(false)
  })
})

describe('isAbortError', () => {
  it('returns true for the reason of an aborted AbortController', () => {
    const controller = new AbortController()
    controller.abort()

    expect(isAbortError(controller.signal.reason)).toBe(true)
  })

  it('returns true for AbortError DOMException and cross-realm errors', () => {
    expect(isAbortError(new DOMException('aborted', 'AbortError'))).toBe(true)
    expect(isAbortError(crossRealmAbortError)).toBe(true)
  })

  it('returns true for Error instances named AbortError', () => {
    expect(isAbortError(Object.assign(new Error('aborted'), { name: 'AbortError' }))).toBe(true)
  })

  it('returns false for TimeoutError and other errors', () => {
    expect(isAbortError(new DOMException('timed out', 'TimeoutError'))).toBe(false)
    expect(isAbortError(new Error('AbortError'))).toBe(false)
  })

  it('returns false for non-error values', () => {
    expect(isAbortError('AbortError')).toBe(false)
    expect(isAbortError({ name: 'AbortError' })).toBe(false)
    expect(isAbortError(null)).toBe(false)
  })
})

describe('isNonNullish / isNullish', () => {
  it.each([null, undefined])('treats %s as nullish', (value) => {
    expect(isNullish(value)).toBe(true)
    expect(isNonNullish(value)).toBe(false)
  })

  it.each([0, '', false, Number.NaN, {}, []])('treats falsy and empty value %j as non-nullish', (value) => {
    expect(isNullish(value)).toBe(false)
    expect(isNonNullish(value)).toBe(true)
  })

  it('narrows types for use with filter()', () => {
    const values: (string | null | undefined)[] = ['a', null, 'b', undefined]
    const result: string[] = values.filter(isNonNullish)

    expect(result).toEqual(['a', 'b'])
  })
})

describe('isRecord', () => {
  it('returns true for plain objects including empty and null-prototype objects', () => {
    expect(isRecord({})).toBe(true)
    expect(isRecord({ a: 1 })).toBe(true)
    expect(isRecord(Object.create(null))).toBe(true)
  })

  it('returns true for objects with symbol keys', () => {
    expect(isRecord({ [Symbol('key')]: 1 })).toBe(true)
  })

  it('returns true for class instances including cross-realm errors', () => {
    expect(isRecord(new Error('x'))).toBe(true)
    expect(isRecord(crossRealmError)).toBe(true)
    expect(isRecord(new Date())).toBe(true)
  })

  it('returns false for arrays, functions, nullish and primitive values', () => {
    expect(isRecord([])).toBe(false)
    expect(isRecord(() => undefined)).toBe(false)
    expect(isRecord(null)).toBe(false)
    expect(isRecord(undefined)).toBe(false)
    expect(isRecord('string')).toBe(false)
    expect(isRecord(42)).toBe(false)
  })
})

describe('isPlainObject', () => {
  it('returns true for object literals, new Object() and null-prototype objects', () => {
    expect(isPlainObject({})).toBe(true)
    expect(isPlainObject({ a: 1, [Symbol('key')]: 2 })).toBe(true)
    expect(isPlainObject(new Object())).toBe(true)
    expect(isPlainObject(Object.create(null))).toBe(true)
  })

  it('returns true for plain objects from another realm', () => {
    expect(isPlainObject(runInNewContext('({ a: 1 })'))).toBe(true)
  })

  it('returns false for class instances', () => {
    class Example {}

    expect(isPlainObject(new Example())).toBe(false)
    expect(isPlainObject(new Date())).toBe(false)
    expect(isPlainObject(new Map())).toBe(false)
    expect(isPlainObject(new Error('x'))).toBe(false)
    expect(isPlainObject(crossRealmError)).toBe(false)
  })

  it('returns false for arrays, functions, nullish and primitive values', () => {
    expect(isPlainObject([])).toBe(false)
    expect(isPlainObject(() => undefined)).toBe(false)
    expect(isPlainObject(null)).toBe(false)
    expect(isPlainObject(undefined)).toBe(false)
    expect(isPlainObject('string')).toBe(false)
  })
})

describe('isRecordWithKey', () => {
  it('returns true when the key is an own property', () => {
    expect(isRecordWithKey({ id: 1 }, 'id')).toBe(true)
    expect(isRecordWithKey({ id: undefined }, 'id')).toBe(true)
  })

  it('narrows the type so the key can be read', () => {
    const input: unknown = { id: 'abc' }

    if (!isRecordWithKey(input, 'id')) {
      throw new Error('expected record with key')
    }

    expect(input.id).toBe('abc')
  })

  it('returns false for missing and inherited keys', () => {
    expect(isRecordWithKey({}, 'id')).toBe(false)
    expect(isRecordWithKey({}, 'toString')).toBe(false)
    expect(isRecordWithKey(Object.create({ id: 1 }), 'id')).toBe(false)
  })

  it('returns false for non-records', () => {
    expect(isRecordWithKey(null, 'id')).toBe(false)
    expect(isRecordWithKey(['id'], '0')).toBe(false)
  })
})

describe('isString', () => {
  it('returns true for strings including empty string', () => {
    expect(isString('')).toBe(true)
    expect(isString('abc')).toBe(true)
  })

  it('returns false for non-strings including String objects', () => {
    expect(isString(new String('abc'))).toBe(false)
    expect(isString(42)).toBe(false)
    expect(isString(null)).toBe(false)
  })
})
