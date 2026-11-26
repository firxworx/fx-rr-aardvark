import * as React from 'react'
import { Link } from 'react-router'

import { cn } from '@workspace/ui/lib/style'
import { LayoutContainer } from '@/layout/app-layout'
import { GitHubIcon } from './github-icon'
import { Mascot } from './mascot'

const GITHUB_REPO_URL = 'https://github.com/firxworx/fx-rr-aardvark'

export type FeatureItem = {
  title: string
  description: React.ReactNode
}

export function HeroSection({ className }: { className?: string }): React.JSX.Element {
  return (
    <section className={cn('border-b border-border py-16 sm:py-24', className)}>
      <LayoutContainer className="flex flex-col items-center text-center">
        <div className="mb-8 sm:mb-10 flex size-28 sm:size-36 items-center justify-center rounded-full border-2 border-foreground/15 bg-background">
          <Mascot className="size-[62%]" />
        </div>
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
              className="flex items-center gap-2 px-4 py-2 bg-P-link/7 border border-border rounded-lg font-semibold text-P-link tracking-tight"
            >
              <GitHubIcon className="size-5" aria-hidden="true" />
              <span className="inline sm:hidden">
                GitHub Repo<span aria-hidden="true">&nbsp;&nbsp;&#x276F;</span>
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
  trailer?: React.ReactNode
  className?: string
}

function BlockContent({
  content,
  className,
}: {
  content: string | string[] | React.ReactNode
  className?: string
}): React.JSX.Element {
  return (
    <div className={cn('flex flex-col gap-4 text-muted-foreground md:text-lg max-w-[60ch] *:text-pretty', className)}>
      {typeof content === 'string' && <p>{content}</p>}
      {Array.isArray(content) &&
        content.length > 0 &&
        content.every((desc) => typeof desc === 'string') &&
        content.map((desc, index) => <p key={index}>{desc}</p>)}
      {React.isValidElement(content) && <>{content}</>}
    </div>
  )
}

export function FeaturesSection({
  heading,
  description,
  features,
  trailer,
  className,
}: FeaturesSectionProps): React.JSX.Element {
  return (
    <section className={cn('border-b border-border py-12 sm:py-16', className)}>
      <LayoutContainer className="flex flex-col items-center gap-6 md:gap-8 text-center">
        <header className="mx-auto flex flex-col items-center gap-4 text-center">
          <h2 className="text-2xl leading-tight font-bold tracking-tight text-pretty md:text-3xl">
            {heading ?? 'Features'}
          </h2>
          {description ? <BlockContent content={description} /> : null}
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
        {trailer && <BlockContent content={trailer} />}
      </LayoutContainer>
    </section>
  )
}
