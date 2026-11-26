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
