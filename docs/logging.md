# Logging

Server code logs with [LogTape](https://logtape.org).

Logs are JSON in deployed environments, where Workers Logs indexes their fields, and readable lines in development.

## Usage

```ts
import { createLogger } from '@workspace/logger'

const logger = createLogger('contact')

logger.info('Message sent', { formId })
logger.error('Failed to send message', { error, formId })
```

- Use a constant message and put values in properties so that they can be filtered. Do not use `{placeholders}`.
- Pass a caught error as the `error` property: its stack and `cause` are logged.
- Do not log personal data, secrets, cookies, headers, query strings, or request bodies. Error messages count too.
- Do not use `console` in server code (the linter reports it).
- Client code cannot import the logger. Refer to `reportClientError()` for client errors.
- Apps and packages use the same `createLogger()`. Only the entry point of a worker calls `configureLogging()`.

## Levels

- `error`, `fatal`: a failure that someone should look into. Workers Issues records every one.
- `warning`: unexpected but handled
- `info`: normal events that are worth keeping
- `debug`, `trace`: details for development

Workers Logs has fewer levels: `trace` is logged as `debug`, `warning` as `warn`, and `fatal` as `error`.

Do not log expected outcomes as errors, such as invalid input or a page that does not exist: bots cause many of them.

`LOG_LEVEL` sets the lowest level to log. Set it for each environment in `vars` of `wrangler.jsonc` and override it for
development in `.dev.vars`.

## Request context

Workers Logs adds details of the request to each log: method, path, URL without the query string
(`$workers.event.request`), and the Ray ID (`$metadata.rayId`, which matches the `cf-ray` response header). Do not add
them to logs.

To add properties to all logs of a block of code (e.g. the ID of the signed-in user) use
[`withContext()`](https://logtape.org/manual/contexts#implicit-contexts) from `@workspace/logger`.

Paths are logged. Do not put personal data or secrets in paths.

## What is logged

- `handleError` in `entry.server.tsx`: errors of loaders, actions, middleware, and rendering. It skips aborted requests,
  4xx errors of react-router, and rejected cross-origin requests.
- Render `onError` in `entry.server.tsx`: errors in content that is streamed after the shell
- `request-logging.server.ts`: each request with its route pattern and status, at `debug` level. Deployed environments
  do not need it because Workers Logs records each request (invocation logs).
- `env.server.ts` throws instead of logging because it runs before LogTape is configured. Invalid environment variables
  cause a deploy to fail.

## How it works

`packages/logger` (`@workspace/logger`):

- `src/index.server.ts`: `createLogger()` and `withContext()`
- `src/configure.server.ts`: `configureLogging()`, called at startup in `apps/web/workers/app.ts`. A new worker (e.g.
  cron or queue consumer) calls it in its own entry point.
- `src/formatters.ts`: JSON and development formatters

The production formatter writes one object for each log. Workers Logs indexes its fields and reads `level`, `message`, and
`error` from it. It also handles behavior of the Workers runtime:

- An `Error` inside of an object is logged as `{}`. It is converted to an object with its name, message, stack, and
  `cause`. Workers Issues maps the stack to source files.
- If any value of an object cannot be serialized (e.g. `bigint`, circular reference) the whole object is logged as `{}`.

The console sink is synchronous so there is nothing to flush. Before adding a sink that sends or buffers logs read
[Keeping serverless requests alive](https://logtape.org/manual/sinks#keeping-serverless-requests-alive).

## Cloudflare

Settings are in `observability` of `wrangler.jsonc`.

- **[Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/)** stores logs for up to
  seven days and can be searched in the dashboard. `head_sampling_rate` is `1`: every request is logged. A lower rate
  reduces cost but drops all logs of a request, including errors.
- **`redact_query_string`** is on: query strings often contain tokens, email addresses, and search terms. Cloudflare
  records the URL of each request, so this cannot be prevented in code. Turn it off only if the app never has such values
  in query strings. It does not change paths or what the app logs.
- **[Issues](https://developers.cloudflare.com/workers/observability/issues/)** is on: it groups uncaught errors, `5xx`
  responses, and error logs, and can send notifications
  ([automations](https://developers.cloudflare.com/workers/observability/issues/automations/)).
  - Each issue shows "No application context found" until the app adds user, account, or session IDs to the active
    trace span with `tracing.getActiveSpan()` from `cloudflare:workers`. It requires tracing (`observability.traces`),
    which incurs costs: refer to
    [Add application context](https://developers.cloudflare.com/workers/observability/issues/investigate/#add-application-context).
- **[Source maps](https://developers.cloudflare.com/workers/observability/source-maps/)** are uploaded by default. Issues
  shows stacks with source files; Workers Logs shows them as logged (minified).
- In the query builder of the dashboard, put quotes around string values of filters (e.g. `category = "app.server"`).

### Cost

From December 1, 2026 Cloudflare charges by GB ingested and stored
([pricing](https://developers.cloudflare.com/observability/pricing/)). Logs, traces, and Issues share the allowance of the
account. The Issues page says that Issues is free during its beta: check both before relying on it.

- Each request has an invocation log in addition to the logs of the app. `logs.invocation_logs: false` turns them off, and
  then there is no record of requests unless the app logs them.
- Free accounts stop ingesting logs for the day when they reach the limit. Paid accounts are charged.
- To reduce cost: raise `LOG_LEVEL`, log less in code that runs often, then lower `head_sampling_rate`.

### Export and long-term storage

Not set up by the starter:

- [OpenTelemetry export](https://developers.cloudflare.com/workers/observability/opentelemetry-export/): send logs and
  traces to another service. Cloudflare recommends it for new integrations.
- [Logpush](https://developers.cloudflare.com/workers/observability/logs/logpush/): send logs to storage such as R2 or a
  log service (paid)
- [Tail Workers](https://developers.cloudflare.com/workers/observability/logs/tail-workers/): process logs with code
- [Log Explorer](https://developers.cloudflare.com/observability/logs/log-explorer/): store and search logs of the zone
  and account. Cloudflare labels it legacy and is merging it into Observability.
- Error tracker or OpenTelemetry sink in the app: [LogTape sinks](https://logtape.org/manual/sinks)
