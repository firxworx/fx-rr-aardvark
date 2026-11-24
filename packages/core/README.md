# @workspace/core

Shared utilities, constants, zod schemas, and types for the workspace. Runtime agnostic: code must work in
browsers and Cloudflare Workers (with `nodejs_compat`).

## Exports

- `@workspace/core/csp`: Content Security Policy (nonce-based) helpers
- `@workspace/core/errors`: custom error classes (`CustomError` and subclasses) and error utilities
  (`getErrorMessage()`, `toError()`)
- `@workspace/core/helpers`: type guards, invariant assertions, `ensure*` helpers for values and query results, and
  HTTP status helpers
- `@workspace/core/security-headers`: security response headers (other than CSP)
- `@workspace/core/theme`: theme mode schema and conventions shared by the server and client

Refer to the `exports` entry in `package.json` and the source in `src/`.

## Conventions

- relative imports between files in `src/` without a file extension
- folders with an `index.ts` barrel are exported as a single entry (e.g. `errors/`, `helpers/`)
- files and folders prefixed with `_` are private/work in progress and excluded from type checking
- tests live in `test/` and are type checked: run with `pnpm --filter @workspace/core test`
