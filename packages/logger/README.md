# @workspace/logger

Structured logging for server code with [LogTape](https://logtape.org): JSON for Cloudflare Workers Logs and readable
lines in development. Refer to [docs/logging.md](../../docs/logging.md) for usage and Cloudflare settings.

## Exports

- `@workspace/logger`: `createLogger()`, `withContext()`, `APP_LOG_CATEGORY`
- `@workspace/logger/configure`: `configureLogging()` for the entry point of each worker

Modules are server-only (`*.server.ts`): React Router fails the build if client code imports them.

## Conventions

- relative imports between files in `src/` without a file extension
- tests live in `test/` and are type checked: run with `pnpm --filter @workspace/logger test`
