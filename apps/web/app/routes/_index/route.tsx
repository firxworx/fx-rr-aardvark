import * as React from 'react'
import { Link } from 'react-router'

import type { Route } from './+types/route'

import { cn } from '@workspace/ui/lib/style'
import { envContext } from '@/context.server'
import { LayoutContainer, PageLayout } from '@/layout/app-layout'
import {
  type FeatureItem,
  indexFeatures,
  NoWrap,
  Pkg,
  stylingFeatures,
  toolsFeatures,
  typographyFeatures,
} from './content'

const GITHUB_REPO_URL = 'https://github.com/firxworx/fx-rr-aardvark'

export function loader({ context }: Route.LoaderArgs) {
  return {
    mode: context.get(envContext).ENVIRONMENT,
  }
}

export default function IndexRoute({ loaderData: { mode } }: Route.ComponentProps): React.JSX.Element {
  return (
    <PageLayout variant="full-width">
      <HeroSection className="bg-muted" />
      <FeaturesSection
        description={
          <p>
            Kick-start the development of new projects with a template that wires up the necessities and leaves the rest
            to you.
          </p>
        }
        features={indexFeatures}
      />
      <FeaturesSection
        heading="Styling"
        description={
          <p>
            TailwindCSS is configured to meet the requirements of both <Pkg>coss-ui</Pkg> and <Pkg>shadcn/ui</Pkg> to
            support components from either registry.
          </p>
        }
        features={stylingFeatures}
      />
      <FeaturesSection
        heading="Typography"
        description={<p>Modern variable fonts are self-hosted for performance and privacy.</p>}
        features={typographyFeatures}
      />
      <FeaturesSection
        heading="Tooling"
        description={
          <p>
            Popular, modern tools familiar to most developers in the ecosystem are configured and{' '}
            <NoWrap>ready to use</NoWrap>.
          </p>
        }
        features={toolsFeatures}
      />
      <section className="py-6 sm:py-12 md:py-16 bg-muted">
        <LayoutContainer>
          <p className="text-sm sm:text-base font-semibold text-muted-foreground text-center">
            Cloudflare &bull; <Pkg>{mode}</Pkg>
          </p>
        </LayoutContainer>
      </section>
    </PageLayout>
  )
}

function HeroSection({ className }: { className?: string }): React.JSX.Element {
  return (
    <section className={cn('border-b border-border py-24 sm:py-32', className)}>
      <LayoutContainer className="flex flex-col items-center text-center">
        <h1 className="font-heading max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
          React Router Framework on Cloudflare Workers
        </h1>
        <p className="mt-6 max-w-xl text-lg sm:text-xl text-pretty text-muted-foreground">
          pnpm workspace (monorepo) project starter (boilerplate) with TailwindCSS & Base UI.
        </p>
        <div className="mt-10 flex flex-col gap-0.5">
          <p>
            <Link
              rel="noopener noreferrer"
              target="_blank"
              to={GITHUB_REPO_URL}
              className="block px-4 py-2 bg-P-link/7 border border-border rounded-lg font-semibold text-P-link tracking-tight"
            >
              <span className="inline sm:hidden" aria-hidden="true">
                GitHub Repo&nbsp;&nbsp;&#x276F;
              </span>
              <span className="hidden sm:inline">{GITHUB_REPO_URL}</span>
            </Link>
          </p>
        </div>
      </LayoutContainer>
    </section>
  )
}

interface FeaturesSectionProps {
  heading?: string
  description?: string | string[] | React.ReactNode
  features: FeatureItem[]
  className?: string
}

function FeaturesSection({ heading, description, features, className }: FeaturesSectionProps): React.JSX.Element {
  return (
    <section className={cn('border-b border-border py-12 sm:py-16', className)}>
      <LayoutContainer className="flex flex-col items-center gap-6 md:gap-8 text-center">
        <header className="mx-auto flex flex-col items-center gap-4 text-center">
          <h2 className="text-2xl leading-tight font-bold tracking-tight text-pretty md:text-3xl">
            {heading ?? 'Features'}
          </h2>
          {description ? (
            <div className="flex flex-col gap-4 text-muted-foreground md:text-lg max-w-[60ch] *:text-pretty">
              {typeof description === 'string' && <p>{description}</p>}
              {Array.isArray(description) &&
                description.length > 0 &&
                description.every((desc) => typeof desc === 'string') &&
                description.map((desc, index) => <p key={index}>{desc}</p>)}
              {React.isValidElement(description) && <>{description}</>}
            </div>
          ) : null}
        </header>
        <div className="grid gap-4 sm:gap-6 w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className={cn(
                'col-span-2 flex flex-col items-center gap-2 sm:gap-4 text-center border border-border px-6 py-6 min-w-0 rounded-lg bg-card',
                features.length % 2 === 1 && index === features.length - 1 && 'sm:max-lg:col-start-2',
                features.length % 3 === 1 && index === features.length - 1 && 'lg:col-start-3',
                features.length % 3 === 2 && index === features.length - 2 && 'lg:col-start-2',
              )}
            >
              <h3 className="text-base font-semibold tracking-tight text-pretty md:text-lg">{feature.title}</h3>
              <p className="text-muted-foreground text-pretty text-base">{feature.description}</p>
            </div>
          ))}
        </div>
      </LayoutContainer>
    </section>
  )
}
