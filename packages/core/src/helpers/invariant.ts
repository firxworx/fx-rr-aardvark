import { InvariantAssertionError } from '../errors/custom-errors'
import { getHttpReasonPhrase } from './http-status'

type InvariantMessage = string | (() => string) | undefined

const DEFAULT_ERROR_MESSAGE: string = 'Invariant assertion failed'

/**
 * Resolves a lazy or literal message to a trimmed string; returns `undefined` if blank.
 */
function resolveMessage(message: InvariantMessage): string | undefined {
  const resolved = (typeof message === 'function' ? message() : message)?.trim()
  return resolved || undefined
}

/**
 * Creates the `Response` thrown by `invariantResponse()` and `invariantNotFoundResponse()`.
 *
 * `status` defaults to `defaultStatus` and `statusText` defaults to the status reason phrase (if known).
 * The body is the given message with fallback to the reason phrase then to a generic `HTTP <status>`.
 */
function createInvariantResponse(
  message: InvariantMessage,
  responseInit: ResponseInit | undefined,
  defaultStatus: number,
): Response {
  const status = responseInit?.status ?? defaultStatus
  const reasonPhrase = getHttpReasonPhrase(status)

  return new Response(resolveMessage(message) ?? reasonPhrase ?? `HTTP ${status}`, {
    ...responseInit,
    status,
    statusText: responseInit?.statusText ?? reasonPhrase ?? '',
  })
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
export function invariant(condition: unknown, message?: InvariantMessage): asserts condition {
  if (condition) {
    return
  }

  throw new InvariantAssertionError(resolveMessage(message) ?? DEFAULT_ERROR_MESSAGE)
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
 * @throws {Response} status 400 (default) if the given condition is falsy
 */
export function invariantResponse(
  condition: unknown,
  message?: InvariantMessage,
  responseInit?: ResponseInit,
): asserts condition {
  if (condition) {
    return
  }

  throw createInvariantResponse(message, responseInit, 400)
}

/**
 * A variation of `invariantResponse()` that throws a default Response status 404
 * if the input condition is falsy.
 *
 * Handy for loaders to ensure that `find(...)` query results exist.
 *
 * @future standardize JSON response body for 404 errors if using extensive JSON API responses
 * @throws {Response} status 404 (default) if the given condition is falsy
 */
export function invariantNotFoundResponse(
  condition: unknown,
  message?: InvariantMessage,
  responseInit?: ResponseInit,
): asserts condition {
  if (condition) {
    return
  }

  throw createInvariantResponse(message, responseInit, 404)
}
