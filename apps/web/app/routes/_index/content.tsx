import { AppWindowIcon, SearchIcon, ServerIcon, ShieldCheckIcon } from 'lucide-react'

import type { FeatureGroup, FeatureItem } from './components/sections'
import { NoWrap, Pkg } from './components/text'

export const indexFeatureGroups = [
  {
    heading: 'Runtime',
    icon: ServerIcon,
    features: [
      {
        title: 'env',
        description: (
          <>
            <Pkg>zod</Pkg> parsing & validation of environment variables.
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
        title: 'logging',
        description: (
          <>
            Structured JSON logs with <Pkg>@logtape</Pkg>.
          </>
        ),
      },
    ],
  },
  {
    heading: 'Headers',
    icon: ShieldCheckIcon,
    features: [
      {
        title: 'csp',
        description: <>Strict nonce-based content security policy.</>,
      },
      {
        title: 'security',
        description: <>Security headers and permissions policy.</>,
      },
      {
        title: 'cache',
        description: <>Cache headers for worker and static assets.</>,
      },
    ],
  },
  {
    heading: 'Interface',
    icon: AppWindowIcon,
    features: [
      {
        title: 'transitions',
        description: (
          <>
            Animated route changes with <Pkg>&lt;ViewTransition&gt;</Pkg>.
          </>
        ),
      },
      {
        title: 'nuqs',
        description: <>Type-safe search params and URL state management.</>,
      },
      {
        title: 'toaster',
        description: (
          <>
            Custom toasts inspired by <Pkg>remix-toast</Pkg> and coss-ui.
          </>
        ),
      },
    ],
  },
  {
    heading: 'SEO',
    icon: SearchIcon,
    features: [
      {
        title: 'canonical',
        description: <>Canonical URLs and trailing slash redirects.</>,
      },
      {
        title: 'meta',
        description: <>Title, Open Graph, and JSON-LD from route values.</>,
      },
      {
        title: 'crawlers',
        description: (
          <>
            Routes for <Pkg>robots.txt</Pkg> and <Pkg>sitemap.xml</Pkg>.
          </>
        ),
      },
    ],
  },
] satisfies FeatureGroup[]

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

export const agenticFeatures = [
  {
    title: 'agents',
    description: (
      <>
        Includes <Pkg>AGENTS.md</Pkg>, <Pkg>CLAUDE.md</Pkg>, and docs for agents and humans.
      </>
    ),
  },
  {
    title: 'skills',
    description: (
      <>
        Recommended skills pinned in <Pkg>skills-lock.json</Pkg>.
      </>
    ),
  },
  {
    title: 'agent tools',
    description: <>Custom screenshot script tailored for the workspace.</>,
  },
] satisfies FeatureItem[]

export const toolsFeatures = [
  {
    title: 'actions',
    description: <>GitHub actions workflow for continuous integration.</>,
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
    title: 'instrumentation',
    description: <>Wired for observability and monitoring platforms.</>,
  },
  {
    title: 'playwright',
    description: (
      <>
        End-to-end (e2e) testing with <Pkg>playwright</Pkg>.
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

export const deploymentFeatures = [
  {
    title: 'checklist',
    description: <>Audit checklist for production readiness.</>,
  },
  {
    title: 'preview',
    description: <>Preview deployments on a separate worker.</>,
  },
  {
    title: 'production',
    description: <>Production deployments on the main worker.</>,
  },
] satisfies FeatureItem[]
