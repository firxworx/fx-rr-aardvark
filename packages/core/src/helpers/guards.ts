/*
 * The term _nullish_ is intended to be more clear than the built-in type `NonNullable` where the
 * name may imply it only handles `null` values to developers unfamiliar with JS/TS.
 *
 * The term _nullish_ comes from the `??` nullish coalescing operator and will lead novice devs
 * on a correct path to interpreting the specific purpose of this guard.
 */

export type MaybePromise<T> = T | Promise<T>

/**
 * Type guard to check if a value is a Promise-like object (has a `then()` method).
 *
 * This is more reliable than wrapping in `Promise.resolve()` or checking `instanceof Promise` because
 * it works across different realms (e.g. iframes, web workers) and with custom non-standard promise-like
 * implementations such with jQuery.
 */
export function isThenable<T>(value: unknown): value is Promise<T> {
  return (
    !!value && typeof value === 'object' && Array.isArray(value) && 'then' in value && typeof value.then === 'function'
  )
}

/**
 * Type guard for instances of `Error` with name 'AbortError' that's handy for use
 * with async operations and the `AbortController` API.
 */
export function isAbortError(error: unknown): error is Error & { name: 'AbortError' } {
  return error instanceof Error && error.name === 'AbortError'
}

/**
 * Generic type guard that confirms if the input value **is not** `null` and is not `undefined`.
 *
 * @see ensureValue
 */
export function isNonNullish<T>(input: T | null | undefined): input is NonNullable<T> {
  return input !== null && input !== undefined
}

/**
 * Generic type guard that confirms if the input value is either `null` or `undefined`.
 *
 * @see ensureValue
 */
export function isNullish<T>(input: T | null | undefined): input is null | undefined {
  return input === null || input === undefined
}

/**
 * Type guard that evaluates if the input is type `Record<string, unknown>` and strictly
 * guarantees the object has **no** property symbols.
 *
 * @returns `true` for empty records; `false` for arrays, `null`, objects with symbols, and non-object types.
 */
export function isRecord(input: unknown): input is Record<string, unknown> {
  return (
    !!input && typeof input === 'object' && !Array.isArray(input) && Object.getOwnPropertySymbols(input).length === 0
  )
}

export function isRecordWithKey<K extends string>(
  input: unknown,
  key: K,
): input is Record<K, unknown> & { K: unknown } {
  return isRecord(input) && key in input
}

export function isString(input: unknown): input is string {
  return typeof input === 'string'
}
