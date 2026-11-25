import type { LogRecord } from '@logtape/logtape'
import { describe, expect, it } from 'vitest'

import { createDevConsoleFormatter, createJsonConsoleFormatter } from '../src/formatters'
import { APP_LOG_CATEGORY } from '../src/index.server'

function createRecord(overrides: Partial<LogRecord> = {}): LogRecord {
  return {
    category: [APP_LOG_CATEGORY, 'test'],
    level: 'info',
    message: ['Hello'],
    rawMessage: 'Hello',
    timestamp: 0,
    properties: {},
    ...overrides,
  }
}

describe('createJsonConsoleFormatter', () => {
  const format = createJsonConsoleFormatter()

  it('returns one flat object', () => {
    expect(format(createRecord({ properties: { path: '/', status: 200 } }))).toEqual([
      { level: 'info', category: 'app.test', message: 'Hello', path: '/', status: 200 },
    ])
  })

  it.each([
    ['trace', 'debug'],
    ['warning', 'warn'],
    ['fatal', 'error'],
  ] as const)('writes level %s as %s (names of Workers Logs)', (level, expected) => {
    expect(format(createRecord({ level }))).toMatchObject([{ level: expected }])
  })

  it('does not let properties replace reserved fields', () => {
    const properties = { level: 'fatal', category: 'x', message: 'spoofed' }

    expect(format(createRecord({ properties }))).toEqual([{ level: 'info', category: 'app.test', message: 'Hello' }])
  })

  it('renders placeholder values in the message', () => {
    const message = ['', 'GET', ' ', { a: 1 }, ' ', new Error('boom'), ' ', 1n, '']

    expect(format(createRecord({ message }))).toMatchObject([{ message: 'GET {"a":1} boom "1"' }])
  })

  it('serializes the error with its stack and cause', () => {
    const error = new TypeError('boom', { cause: new Error('root') })

    expect(format(createRecord({ properties: { error } }))).toEqual([
      {
        level: 'info',
        category: 'app.test',
        message: 'Hello',
        error: {
          name: 'TypeError',
          message: 'boom',
          stack: error.stack,
          cause: { name: 'Error', message: 'root', stack: (error.cause as Error).stack },
        },
      },
    ])
  })

  it('accepts any thrown value as error', () => {
    expect(format(createRecord({ properties: { error: 'boom' } }))).toMatchObject([{ error: { message: 'boom' } }])
    expect(format(createRecord({ properties: { error: undefined } }))[0]).toHaveProperty('error', undefined)
  })

  it('keeps the entry when a value cannot be serialized', () => {
    const circular: Record<string, unknown> = {}
    circular.self = circular

    const [entry] = format(
      createRecord({ properties: { circular, big: 1n, nested: { big: 2n }, list: [new Error('x')] } }),
    )

    expect(entry).toMatchObject({
      message: 'Hello',
      circular: '[unserializable]',
      big: '1',
      nested: { big: '2' },
      list: [{ name: 'Error', message: 'x' }],
    })
    expect(() => JSON.stringify(entry)).not.toThrow()
  })
})

describe('createDevConsoleFormatter', () => {
  const format = createDevConsoleFormatter()

  it('returns a line followed by properties and the error', () => {
    const error = new Error('boom')
    const [line, ...rest] = format(createRecord({ properties: { error, status: 500 } }))

    expect(line).toMatch(/Hello$/)
    expect(rest).toEqual(['{"status":500}', error])
  })

  it('returns only the line when there are no properties', () => {
    expect(format(createRecord())).toHaveLength(1)
  })
})

describe('error property', () => {
  const format = createJsonConsoleFormatter()
  const getError = (error: unknown) => (format(createRecord({ properties: { error } }))[0] as { error: unknown }).error

  it('limits the depth of causes', () => {
    let error = new Error('0')

    for (let index = 1; index <= 10; index++) {
      error = new Error(String(index), { cause: error })
    }

    expect(getError(error)).toHaveProperty('cause.cause.cause')
    expect(getError(error)).not.toHaveProperty('cause.cause.cause.cause')
  })

  it('does not fail when an error is its own cause', () => {
    const error = new Error('loop')
    error.cause = error

    expect(() => JSON.stringify(getError(error))).not.toThrow()
  })
})
