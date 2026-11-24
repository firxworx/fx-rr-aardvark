import { DataIntegrityError, DataNotFoundError } from '../errors/custom-errors'

const NULLISH_VALUE_MESSAGE = 'Expected value to not be null or undefined'
const MULTIPLE_RESULTS_MESSAGE = 'Expected single result: multiple found'
const NO_RESULT_MESSAGE = 'Expected single result: none found'

/**
 * Type narrowing helper that asserts the input value is not `null` and not `undefined`
 * and returns it as `NonNullable<T>`.
 *
 * The optional `error` customizes what is thrown:
 *
 * - string: thrown as the message of a `TypeError`
 * - `Error` instance: thrown as-is
 * - `Error` class: instantiated with a default message and thrown
 *
 * @throws {TypeError} if input is `null` or `undefined` (unless a custom error is given)
 */
export function ensureValue<T>(
  input: T | null | undefined,
  error?: string | Error | (new (message?: string) => Error),
): NonNullable<T> {
  if (input !== null && input !== undefined) {
    return input
  }

  if (error instanceof Error) {
    throw error
  }

  if (typeof error === 'function') {
    throw new error(NULLISH_VALUE_MESSAGE)
  }

  throw new TypeError(error?.trim() || NULLISH_VALUE_MESSAGE)
}

/**
 * Extracts the single item from an array: returns `undefined` if the array is empty or the item is
 * `null` (normalized to `undefined`).
 *
 * Synchronous counterpart of `ensureOptionalResult()` for arrays.
 *
 * @throws {DataIntegrityError} if the array has multiple items
 */
export function pickResult<T>(result: T[]): NonNullable<T> | undefined {
  if (result.length > 1) {
    throw new DataIntegrityError(MULTIPLE_RESULTS_MESSAGE)
  }

  return result[0] ?? undefined
}

/**
 * Normalizes a query result that may be an array of rows or a single row into a single
 * non-nullish row or `undefined`.
 */
function pickSingleResult<T>(result: T[] | T): NonNullable<T> | undefined {
  return Array.isArray(result) ? pickResult<T>(result) : (result ?? undefined)
}

/**
 * Enforce a single non-nullish query result and return it, otherwise throw an error.
 *
 * Accepts arrays, promises that resolve to arrays, single values, or promises that resolve to
 * single values to support database libraries such as drizzle where different query methods
 * return results in different shapes.
 *
 * @throws {DataIntegrityError} if the result is an array with multiple items
 * @throws {DataNotFoundError} if the result is nullish, an empty array, or an array with a nullish item
 */
export async function ensureResult<T>(queryResult: T[] | Promise<T[]>): Promise<NonNullable<T>>
export async function ensureResult<T>(queryResult: T | Promise<T>): Promise<NonNullable<T>>
export async function ensureResult<T>(queryResult: T[] | T | Promise<T[] | T>): Promise<NonNullable<T>> {
  const result = pickSingleResult<T>(await queryResult)

  if (result === undefined) {
    throw new DataNotFoundError(NO_RESULT_MESSAGE)
  }

  return result
}

/**
 * Enforce a single query result or `undefined` if there is none, otherwise throw an error
 * if multiple rows are found.
 *
 * Accepts the same inputs as `ensureResult()`. A `null` result (or `null` array item) is
 * normalized to `undefined`.
 *
 * @throws {DataIntegrityError} if the result is an array with multiple items
 *
 * @see https://github.com/drizzle-team/drizzle-orm/issues/2745 controversy around drizzle `null` vs. `undefined` results
 */
export async function ensureOptionalResult<T>(queryResult: T[] | Promise<T[]>): Promise<NonNullable<T> | undefined>
export async function ensureOptionalResult<T>(queryResult: T | Promise<T>): Promise<NonNullable<T> | undefined>
export async function ensureOptionalResult<T>(
  queryResult: T[] | T | Promise<T[] | T>,
): Promise<NonNullable<T> | undefined> {
  return pickSingleResult<T>(await queryResult)
}
