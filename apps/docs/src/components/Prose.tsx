import { cn } from '@/lib/tailwind'

interface ProseProps extends React.HTMLAttributes<HTMLElement> {
  as?: React.ElementType
  className?: string
}

export function Prose({
  as: Component = 'div',
  className,
  ...props
}: ProseProps) {
  return (
    <Component
      className={cn(className, 'prose dark:prose-invert')}
      {...props}
    />
  )
}
