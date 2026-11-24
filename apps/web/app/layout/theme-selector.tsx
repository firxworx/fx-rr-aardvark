import { Form } from 'react-router'
import clsx from 'clsx'

import { APP_ACTIONS_THEME_PATHNAME, THEME_INPUT_NAME, THEME_MODES, type ThemeMode } from '@workspace/core/theme'
import { Button } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/style'
import { useTheme } from '@/hooks/use-theme'

interface ThemeSelectorProps {
  className?: string
  groupClassName?: string
}

const THEME_MODE_LABELS: Record<ThemeMode, string> = {
  dark: 'Dark',
  light: 'Light',
  system: 'System',
}

/**
 * Container styles that frame the options as a single segmented control so the group reads as
 * an interactive widget rather than page copy.
 *
 * `rounded-control-wrapper` is `--radius-control` + one spacing step, which pairs with `p-1`
 * to keep the container corners concentric with the items' `rounded-control`.
 */
const themeToggleGroupClassName = clsx(
  'inline-flex items-center gap-1 p-1',
  'rounded-control-wrapper border border-input bg-popover shadow-xs',
)

/**
 * Toggle-item styles for each theme option, following the shadcn/ui + coss-ui toggle group
 * convention of a subtle hover surface when off and an accent surface when toggled on.
 *
 * `not-aria-pressed:` and `aria-pressed:` are attribute-qualified so they outrank the
 * `ghost` variant's own `hover:` rules regardless of stylesheet order.
 */
const themeToggleItemClassName = clsx(
  'cursor-pointer transition-colors',
  'not-aria-pressed:hover:bg-accent/75 not-aria-pressed:dark:hover:bg-accent/50',
  'not-aria-pressed:hover:text-foreground',
  'aria-pressed:bg-accent aria-pressed:hover:bg-accent',
  'aria-pressed:text-accent-foreground',
)

/**
 * Progressively enhanced theme switch component powered by react-router Form that works without JavaScript.
 *
 * `className` prop applies to the outer `Form` for layout; `groupClassName` prop applies to the inner
 * `div` that wraps the toggle buttons.
 *
 * Each option is a submit button that sends a POST request to the server with the selected theme.
 */
export function ThemeSelector({ className, groupClassName }: ThemeSelectorProps): React.JSX.Element {
  const theme = useTheme()

  return (
    <Form navigate={false} method="POST" action={APP_ACTIONS_THEME_PATHNAME} className={className}>
      {/** biome-ignore lint/a11y/useSemanticElements: role group for theme button group */}
      <div role="group" aria-label="Theme Toggle" className={cn(themeToggleGroupClassName, groupClassName)}>
        {THEME_MODES.map((themeMode) => (
          <Button
            key={themeMode}
            type="submit"
            name={THEME_INPUT_NAME}
            variant="ghost"
            value={themeMode}
            className={cn('text-muted-foreground', themeToggleItemClassName)}
            aria-pressed={theme === themeMode}
          >
            {THEME_MODE_LABELS[themeMode]}
          </Button>
        ))}
      </div>
    </Form>
  )
}
