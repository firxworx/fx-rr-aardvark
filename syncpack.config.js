// @ts-check

/**
 * Syncpack helps keep package versions in sync across the monorepo.
 *
 * ```sh
 * pnpm syncpack list
 * pnpm syncpack fix
 * ```
 *
 * @see https://syncpack.dev/
 * @type {import("syncpack").RcFile}
 */
const config = {
  versionGroups: [
    {
      label: 'Use workspace protocol for local packages in this pnpm workspace',
      dependencies: ['$LOCAL'],
      dependencyTypes: ['dev', 'prod'],
      pinVersion: 'workspace:*',
    },
    {
      label: 'Ensure peer dependencies are in sync',
      dependencies: ['$LOCAL'],
      dependencyTypes: ['peer'],
      policy: 'sameRange',
    },
    {
      label: 'React',
      dependencies: ['react', 'react-dom'],
      dependencyTypes: ['peer'],
      packages: ['**'],
      isIgnored: true,
    },
  ],
}

export default config
