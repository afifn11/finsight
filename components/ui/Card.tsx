// components/ui/Card.tsx
// Shared Card primitive. Wraps the existing `.card` CSS class (globals.css) —
// doesn't replace the token-driven border/radius/shadow already defined there,
// just gives it a component surface with a couple of intentional variants.
// Default stays a subtle border + surface contrast; only `elevated` adds shadow.
import { cn } from '@/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive'
}

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'card',
        variant === 'elevated' && 'shadow-[var(--shadow-dropdown)]',
        variant === 'interactive' && 'transition-shadow hover:shadow-[var(--shadow-dropdown)] cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
