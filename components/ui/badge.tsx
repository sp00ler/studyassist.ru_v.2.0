import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center border px-2.5 py-0.5 text-xs font-semibold focus:outline focus:outline-2 focus:outline-dotted focus:outline-offset-2 focus:outline-ink',
  {
    variants: {
      variant: {
        default: 'border-chrome-shadow bg-chrome text-ink',
        secondary: 'border-chrome-shadow bg-paper text-ink',
        destructive: 'border-danger bg-danger/15 text-danger',
        outline: 'border-chrome-shadow text-ink bg-transparent',
        success: 'border-success bg-success/15 text-success',
        warning: 'border-warning bg-warning/15 text-warning',
        info: 'border-title bg-title/10 text-title',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
