import { resetSync } from '@logtape/logtape'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { configureLogging } from '../src/configure.server'
import { createLogger, withContext } from '../src/index.server'

afterEach(() => {
  resetSync()
  vi.restoreAllMocks()
})

describe('configureLogging', () => {
  it('logs from the level and writes JSON objects', () => {
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    configureLogging({ level: 'info', format: 'json' })

    const logger = createLogger('test')
    logger.debug('Hidden')
    logger.warning('Shown', { id: 1 })

    expect(debug).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledWith({ level: 'warn', category: 'app.test', message: 'Shown', id: 1 })
  })

  it('adds properties of withContext() to logs after await', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {})

    configureLogging({ level: 'info', format: 'json' })

    const logger = createLogger('test')

    const handle = (userId: string) =>
      withContext({ userId }, async () => {
        await Promise.resolve()
        logger.info('Inside')
      })

    await Promise.all([handle('a'), handle('b')])
    logger.info('Outside')

    expect(info.mock.calls.map(([entry]) => (entry as Record<string, unknown>).userId)).toEqual(['a', 'b', undefined])
  })
})
