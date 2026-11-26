import { describe, expect, it } from 'vitest'

import { getErrorInfo } from '@/layout/error-boundary'

/** Same shape as the responses that react-router passes to error boundaries (`isRouteErrorResponse`). */
function errorResponse(status: number, statusText: string, data: unknown = null) {
  return { status, statusText, internal: false, data }
}

describe('getErrorInfo', () => {
  it('describes known statuses', () => {
    expect(getErrorInfo(errorResponse(404, 'Not Found'))).toEqual({
      message: '404 Not Found',
      detail: 'The page you are looking for does not exist.',
    })
  })

  it('uses the status text of other statuses', () => {
    expect(getErrorInfo(errorResponse(429, 'Too Many Requests'))).toEqual({
      message: '429 Too Many Requests',
      detail: '',
    })
  })

  it('uses the message and detail of thrown data', () => {
    expect(getErrorInfo(errorResponse(404, 'Not Found', { message: 'Post not found' }))).toEqual({
      message: 'Post not found',
      detail: 'The page you are looking for does not exist.',
    })
  })

  it('ignores thrown data that is not text', () => {
    expect(getErrorInfo(errorResponse(404, 'Not Found', { message: 42 })).message).toBe('404 Not Found')
    expect(getErrorInfo(errorResponse(404, 'Not Found', 'Not Found')).message).toBe('404 Not Found')
  })

  it('does not reveal the message of an error', () => {
    expect(getErrorInfo(new Error('secret internal detail'))).toEqual({
      message: 'Something went wrong',
      detail: 'An unexpected error occurred. Refresh the page or try again later.',
    })
  })
})
