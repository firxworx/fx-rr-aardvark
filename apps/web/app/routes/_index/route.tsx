import type { Route } from './+types/route'

import { envContext } from '@/context.server'
import { LayoutContainer, PageLayout } from '@/layout/app-layout'
import { ClosingSection } from './components/closing-section'
import { FeaturesSection, HeroSection } from './components/sections'
import { NoWrap, Pkg } from './components/text'
import {
  agenticFeatures,
  deploymentFeatures,
  indexFeatures,
  stylingFeatures,
  toolsFeatures,
  typographyFeatures,
} from './content'

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
            Kick-start the development of new projects with a template that wires up production-grade necessities and
            leaves the rest to you.
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
        // uncomment when the setup skill ships (BACKLOG.md) and import `InfoIcon`
        // trailer={
        //   <div className="flex flex-col sm:flex-row justify-center items-center gap-2 border border-border p-4 rounded-lg text-base bg-card">
        //     <InfoIcon className="size-5 inline shrink-0" aria-hidden="true" />
        //     <p>A custom agent skill is included to reset to minimal styling.</p>
        //   </div>
        // }
      />
      <FeaturesSection
        heading="Typography"
        description={<p>Modern variable fonts are self-hosted for performance and privacy.</p>}
        features={typographyFeatures}
      />
      <FeaturesSection
        heading="Agentic Development"
        description={<p>Ready for AI-powered development workflows with docs, skills, and tools.</p>}
        features={agenticFeatures}
      />
      <FeaturesSection
        heading="Quality Assurance"
        description={
          <p>
            Modern development tools are configured and <NoWrap>ready to use</NoWrap>.
          </p>
        }
        features={toolsFeatures}
      />
      <FeaturesSection
        heading="Deployment"
        description={<p>Ships ready to deploy on Cloudflare Workers.</p>}
        features={deploymentFeatures}
      />
      <ClosingSection />
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
