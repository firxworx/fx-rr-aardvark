/**
 * Base class for custom error classes in the workspace to extend.
 *
 * All custom errors should extend this class so `instanceof` checks and workspace helper
 * functions behave consistently across runtimes (Node, Cloudflare Workers, browsers).
 *
 * The error `name` is set from the subclass constructor name (`new.target.name`). Class names can be
 * mangled by minifiers in client bundles so subclasses should declare an explicit static name
 * (`static override readonly name = '...'`) to ensure the correct `name` in logging, serialization, etc.
 *
 * Like native errors, `name` is not an enumerable property so it does not appear in `Object.keys()`,
 * object spread, or `JSON.stringify()` output.
 *
 * @example
 * export class PaymentDeclinedError extends CustomError {
 *   static override readonly name = 'PaymentDeclinedError'
 * }
 */
export abstract class CustomError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options)

    // non-enumerable to match the native Error `name` property
    Object.defineProperty(this, 'name', {
      value: new.target.name,
      enumerable: false,
      writable: true,
      configurable: true,
    })
  }
}

/**
 * Error for when an invariant assertion is violated or a runtime smoke-check / sanity-check fails.
 *
 * @see https://www.strictmode.io/articles/invariant
 */
export class InvariantAssertionError extends CustomError {
  static override readonly name = 'InvariantAssertionError'
}

/**
 * Error for when data integrity is compromised and an unexpected result is returned,
 * e.g. expected data missing, multiple rows returned when one was expected, etc.
 */
export class DataIntegrityError extends CustomError {
  static override readonly name = 'DataIntegrityError'
}

/**
 * Error for when data was not found when a result was expected.
 */
export class DataNotFoundError extends CustomError {
  static override readonly name = 'DataNotFoundError'
}
