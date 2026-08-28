/**
 * Base class for custom error classes in the workspace to extend.
 *
 * All custom errors should extend this class so `instanceof` checks and workspace helper
 * functions behave consistently across runtimes (Node, Cloudflare Workers, browsers).
 *
 * Note that `new.target.name` can be mangled by minifiers in client bundles so subclasses
 * should explicitly set `override readonly name = '...'` to ensure correct resolution in
 * logging, serialization, etc.
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
  override readonly name = 'InvariantAssertionError'
}

/**
 * Error for when data integrity is compromised and an unexpected result is returned,
 * e.g. expected data missing, multiple rows returned one expected, etc.
 */
export class DataIntegrityError extends CustomError {
  override readonly name = 'DataIntegrityError'
}

/**
 * Error for when data was not found when a result was expected.
 */
export class DataNotFoundError extends CustomError {
  override readonly name = 'DataNotFoundError'
}
