import { DataIntegrityError, DataNotFoundError } from '../errors'
import { isNullish } from './guards'

/**
 * Type narrowing helper that asserts the input value is not `null` and not `undefined`
 * and returns it as `NonNullable<T>`. Throws a `TypeError` if the assertion fails.
 *
 * @throws {TypeError} if input is `null` or `undefined`.
 */
export function ensureValue<T>(
  input: T | undefined | null,
  error?: string | Error | (new (...args: unknown[]) => Error),
): NonNullable<T> {
  if (input === null || input === undefined) {
    if (error) {
      if (typeof error === 'string') {
        throw new Error(error)
      }

      throw typeof error === 'function' ? new error('Expected value to be truthy') : error
    }

    throw new TypeError('Input value cannot be null or undefined')
  }

  return input
}

/**
 * Enforce a single non-nullish query result row and return it otherwise throw an error.
 *
 * Accepts arrays, promises that resolve to arrays, single objects, or promises that resolve to
 * single objects.
 *
 * Extracts and returns the single result and throws if there are zero rows, multiple rows,
 * or the extracted result is `null` or `undefined`.
 *
 * For use with database libraries such as drizzle where different API's and query methods may return
 * a result in a variety of different formats.
 *
 * This function uses `await` internally; it does not handle cross-boundary edge cases
 * such as between web-workers (i.e. it does not check "if thenable" cases).
 *
 * @throws {DataIntegrityError} if result is an array with multiple items
 * @throws {DataNotFoundError} if the result is nullish or an empty array
 */
export async function ensureResult<T>(queryResult: T[] | Promise<T[]> | T | Promise<T>): Promise<NonNullable<T>> {
  const result = await queryResult

  if (Array.isArray(result)) {
    if (result.length > 1) {
      throw new DataIntegrityError('Found multiple results: expected single result')
    }

    if (isNullish(result[0])) {
      console.warn(`Expected non-nullish result (ensureResult): found ${result === null ? 'null' : 'undefined'}`)
      throw new DataNotFoundError()
    }

    return result[0] as NonNullable<T>
  }

  if (isNullish(result)) {
    console.warn(`Expected non-nullish result (ensureResult): found ${result === null ? 'null' : 'undefined'}`)
    throw new DataNotFoundError()
  }

  return result as NonNullable<T>
}

/**
 * Enforce a _single_ query result row or `undefined` if the result is empty, otherwise throw an error
 * if multiple rows are found.
 *
 * If the result is `null` it is normalized to `undefined` and returned.
 *
 * For use with database libraries such as drizzle where different API's and query methods may return
 * a result in a variety of different formats.
 *
 * This function uses `await` internally; it does not handle cross-boundary edge cases
 * such as between web-workers (i.e. it does not check "if thenable" cases).
 *
 * @throws {DataIntegrityError} if result is an array with multiple items
 * @returns {Promise<T | undefined>} the single result or `undefined` if the result is empty
 *
 * @see https://github.com/drizzle-team/drizzle-orm/issues/2745 controversy around drizzle `null` vs. `undefined` results
 */
export async function ensureOptionalResult<T>(queryResult: T[] | Promise<T[]>): Promise<T | undefined> {
  const result = await queryResult

  if (Array.isArray(result)) {
    if (result.length === 0) {
      return undefined
    }

    if (result.length > 1) {
      throw new DataIntegrityError('Expected single result: multiple found')
    }

    return result[0] ?? undefined
  }

  return result ?? undefined
}

/**
 * Non-async version of `ensureOptionalResult()` that extracts and returns a single item from an array.
 *
 * Returns `undefined` if the array is empty or throws `DataIntegrityError` if there are multiple items.
 *
 * @see {@link ensureOptionalResult} for async version that accepts promises
 */
export function pickResult<T>(result: T[]): T | undefined {
  if (Array.isArray(result)) {
    if (result.length === 0) {
      return undefined
    }

    if (result.length > 1) {
      throw new DataIntegrityError('Expected single result: multiple found')
    }

    return result[0]
  }

  return result
}
