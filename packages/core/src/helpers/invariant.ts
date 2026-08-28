import { InvariantAssertionError } from '../errors'
import { getHttpReasonPhrase } from './http-status'

const DEFAULT_ERROR_MESSAGE: string = 'Invariant assertion failed'

function getInvariantErrorMessage(input?: string | (() => string) | undefined): string {
  return typeof input === 'function' ? input() : input?.trim() || DEFAULT_ERROR_MESSAGE
}

/**
 * Throws custom `InvariantAssertionError` if the given condition is falsy.
 *
 * The `invariant()` function conceptually similar to Node's built-in `assert()`.
 * This version is intended for use across the stack.
 *
 * Based on `@epic-web/invariant` which in turn was inspired by and based on the `tiny-invariant` package
 * that helped popularize the invariant pattern in the TypeScript community.
 *
 * @see https://nodejs.org/api/assert.html
 * @see https://github.com/epicweb-dev/invariant
 * @see https://github.com/alexreardon/tiny-invariant
 *
 * @throws {InvariantAssertionError} if the given condition is falsy
 */
export function invariant(condition: unknown, message?: string | (() => string) | undefined): asserts condition {
  if (condition) {
    return
  }

  throw new InvariantAssertionError(getInvariantErrorMessage(message))
}

/**
 * Throws a `Response` object with a default 400 status code if the given condition is falsy.
 *
 * Provide a final `ResponseInit` object to override the default status code.
 *
 * @example
 * invariantResponse(typeof value === 'string', 'value must be a string')
 * invariantResponse(foo === bar, 'error message', { status: 500 })
 *
 * @see https://nodejs.org/api/assert.html
 * @see https://github.com/epicweb-dev/invariant
 * @see https://github.com/alexreardon/tiny-invariant
 *
 * @throws {Response} status 400 if the given condition is falsy
 */
export function invariantResponse(
  condition: unknown,
  message?: string | (() => string) | undefined,
  responseInit?: ResponseInit,
): asserts condition {
  if (condition) {
    return
  }

  const status = responseInit?.status ?? 400
  const errorMessage = typeof message === 'function' ? message() : message?.trim() || getHttpReasonPhrase(status)

  throw new Response(errorMessage, {
    status,
    ...responseInit,
  })
}

/**
 * A variation of `invariantResponse()` that throws a default Response status 404
 * if the input condition is falsey.
 *
 * Handy for loaders to ensure that `find(...)` result query values
 *
 * @future standardize JSON response body for 404 errors if using extensive JSON API responses
 * @throws {Response} status 404 (default) if the given condition is falsey.
 */
export function invariantNotFoundResponse(
  condition: unknown,
  message?: string | (() => string) | undefined,
  responseInit?: ResponseInit,
): asserts condition {
  if (condition) {
    return
  }

  const status = responseInit?.status ?? 404
  const errorMessage = typeof message === 'function' ? message() : message?.trim() || getHttpReasonPhrase(status)

  throw new Response(errorMessage, {
    ...responseInit,
    status,
    statusText: responseInit?.statusText ?? getHttpReasonPhrase(status),
  })
}
