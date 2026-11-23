export type FeatureItem = {
  title: string
  description: React.ReactNode
}

export function Pkg({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <code className="rounded bg-muted text-muted-foreground px-1.5 py-0.5 font-mono text-sm sm:text-sm font-semibold whitespace-nowrap">
      {children}
    </code>
  )
}

export function NoWrap({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <span className="whitespace-nowrap">{children}</span>
}

export const indexFeatures = [
  {
    title: 'nuqs',
    description: 'Type-safe search params state management.',
  },
  {
    title: 'toaster',
    description: (
      <>
        Custom toasts inspired by <Pkg>remix-toast</Pkg> and coss-ui.
      </>
    ),
  },
  {
    title: 'csp',
    description: <>Strict nonce-based content security policy.</>,
  },
  {
    title: 'search engines',
    description: (
      <>
        Wired to generate <Pkg>robots.txt</Pkg> and <Pkg>sitemap.xml</Pkg>.
      </>
    ),
  },
  {
    title: 'context',
    description: (
      <>
        <Pkg>react-router</Pkg> context set via worker entrypoint.
      </>
    ),
  },
  {
    title: 'environment',
    description: (
      <>
        <Pkg>zod</Pkg> parsing & validation of server env variables.
      </>
    ),
  },
] satisfies FeatureItem[]

export const stylingFeatures = [
  {
    title: 'light-dark()',
    description: 'Modern CSS approach to theming that works without JS.',
  },
  {
    title: 'coss-ui',
    description: 'Pre-installed tokens, base styles, and animations.',
  },
  {
    title: 'shadcn/ui',
    description: 'Pre-installed tokens, theming, and animations.',
  },
] satisfies FeatureItem[]

export const typographyFeatures = [
  {
    title: '@fontsource',
    description: (
      <>
        Self-hosted variable fonts from <Pkg>@fontsource</Pkg>.
      </>
    ),
  },

  {
    title: 'typeset',
    description: (
      <>
        shadcn <Pkg>typeset</Pkg> ready for <NoWrap>long-form</NoWrap> content.
      </>
    ),
  },
  {
    title: 'customizable',
    description: 'Change fonts and styling with minimal effort.',
  },
] satisfies FeatureItem[]

export const toolsFeatures = [
  {
    title: 'agents',
    description: (
      <>
        Ready for AI with <Pkg>AGENTS.md</Pkg> and screenshot tooling.
      </>
    ),
  },
  {
    title: 'biome',
    description: (
      <>
        Performant code formatting and linting with <Pkg>biome</Pkg>.
      </>
    ),
  },
  {
    title: 'vitest',
    description: (
      <>
        Unit and component testing with <Pkg>react-testing-library</Pkg>.
      </>
    ),
  },
] satisfies FeatureItem[]
