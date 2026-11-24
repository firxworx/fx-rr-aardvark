export type MaybePromise<T> = T | Promise<T>

/**
 * Type guard for Promise-like values: any object or function with a callable `then()` method
 * per the Promises/A+ definition of a "thenable".
 *
 * More reliable than `instanceof Promise` because it works across realms (e.g. iframes, web workers)
 * and with non-native promise implementations. Narrows to `PromiseLike<T>` (not `Promise<T>`) because
 * a thenable is not guaranteed to implement `catch()` or `finally()`.
 */
export function isThenable<T = unknown>(value: unknown): value is PromiseLike<T> {
  if ((typeof value !== 'object' || value === null) && typeof value !== 'function') {
    return false
  }

  return 'then' in value && typeof value.then === 'function'
}

/**
 * Type guard for `Error` instances and error-like objects (any object with string `name` and `message`).
 *
 * Unlike `instanceof Error` this also matches errors created in other realms (e.g. iframes, workers,
 * jsdom vs. native `DOMException`) and errors that were serialized and deserialized.
 */
export function isErrorLike(value: unknown): value is Error {
  return (
    value instanceof Error || (isRecord(value) && typeof value.name === 'string' && typeof value.message === 'string')
  )
}

/**
 * Type guard for errors with name `'AbortError'` such as those thrown by `fetch()` and other
 * async APIs when an `AbortController` signal is aborted (typically user or app cancellation).
 *
 * Matches cross-realm errors (see `isErrorLike()`). Timeouts via `AbortSignal.timeout()` produce an
 * error named `'TimeoutError'` that is intentionally not matched: use `isTimeoutError()` for those.
 *
 * If `controller.abort(reason)` is called with a custom reason, that reason is what gets thrown
 * and this guard only matches if it is an error named `'AbortError'`.
 */
export function isAbortError(error: unknown): error is Error & { name: 'AbortError' } {
  return isErrorLike(error) && error.name === 'AbortError'
}

/**
 * Type guard for errors with name `'TimeoutError'` such as those thrown by `fetch()` and other
 * async APIs when an `AbortSignal.timeout()` signal (or `AbortSignal.any()` including one) expires.
 *
 * Matches cross-realm errors (see `isErrorLike()`). Combine with `isAbortError()` to handle
 * any cancellation: `isAbortError(error) || isTimeoutError(error)`.
 */
export function isTimeoutError(error: unknown): error is Error & { name: 'TimeoutError' } {
  return isErrorLike(error) && error.name === 'TimeoutError'
}

/**
 * Generic type guard that confirms the input value **is not** `null` and is not `undefined`.
 *
 * The term _nullish_ (from the `??` nullish coalescing operator) is used because it is clearer than
 * the built-in `NonNullable` whose name may imply that it only handles `null`.
 *
 * @see ensureValue
 */
export function isNonNullish<T>(input: T | null | undefined): input is NonNullable<T> {
  return input !== null && input !== undefined
}

/**
 * Generic type guard that confirms the input value is either `null` or `undefined`.
 *
 * @see isNonNullish
 */
export function isNullish<T>(input: T | null | undefined): input is null | undefined {
  return input === null || input === undefined
}

/**
 * Type guard for non-null, non-array objects whose properties can be read by string key.
 *
 * This is a relaxed check that matches any object including class instances (e.g. `Date`, `Map`, `Error`).
 * Use `isPlainObject()` to match only plain data objects.
 *
 * @returns `true` for objects including empty objects; `false` for arrays, `null`, functions, and primitives.
 */
export function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input)
}

/**
 * Type guard for plain objects: objects created by an object literal, `new Object()`, or `Object.create(null)`.
 *
 * Class instances (e.g. `Date`, `Map`, `Error`) and arrays do not match. Plain objects from other realms
 * (e.g. iframes) do match because the prototype check does not compare against this realm's `Object.prototype`.
 */
export function isPlainObject(input: unknown): input is Record<string, unknown> {
  if (typeof input !== 'object' || input === null) {
    return false
  }

  const prototype: unknown = Object.getPrototypeOf(input)
  return prototype === null || Object.getPrototypeOf(prototype) === null
}

/**
 * Type guard for records (see `isRecord()`) that have the given key as an **own** property.
 *
 * Inherited properties such as `toString` do not count.
 */
export function isRecordWithKey<K extends string>(
  input: unknown,
  key: K,
): input is Record<string, unknown> & Record<K, unknown> {
  return isRecord(input) && Object.hasOwn(input, key)
}

export function isString(input: unknown): input is string {
  return typeof input === 'string'
}
