# @workspace/tsconfig

Shared TypeScript configuration files to be extended by project `tsconfig.json` files.

Add this package as a dev dependency to any apps/packages; do not extend config files using relative paths except in special cases such as workspace root (if required) or Cloudflare Containers (if in play).

## Exported Configurations

Refer to `files`/`exports` entries in `package.json`.

- `tsconfig.base.json`: Base TypeScript configuration for all projects
- `tsconfig.react-library.json`: React component libraries and SPA apps
- `tsconfig.react-router.json`: Configuration for React Router Framework (SSR) in Node or `nodejs_compat`
- `tsconfig.worker.json`: Cloudflare Workers with `nodejs_compat` and Cloudflare Containers running node

## Extending Configurations

Remember tsconfig merge rules regarding extended configs:

- `files`, `include`, `exclude`, `references` are overridden
- `compilerOptions` are shallow merged with extending config taking precedence in case of conflicts
- array values in `compilerOptions` (e.g. `lib`, `types`, `plugins`) are overridden
- `paths` object is overridden

Since TypeScript 4.1 `paths` is resolved relative to the config file where it is defined _not_ the extending config.

### Cloudflare Workers

Ensure wrangler generated types `worker-configuration.d.ts` entry exists in the `include` array.

### React Router Framework Mode (SSR)

Any react-router v8+ in framework mode (SSR) app should include:

- `".react-router/types/**/*"` in the `include` array
- `"./.react-router/types"` entry in the `compilerOptions.rootDirs` array

### Vite

If `vite/client` types such as `import.meta.env.*` declarations are required, add `vite/client` to `compilerOptions.types` or create a `.d.ts` file with triple-slash reference:

```ts
/// <reference types="vite/client" />
```

Any code that references vite-isms such as `import.meta.env.DEV` must be bundled with Vite or have relevant workarounds in place to avoid build and runtime errors.
