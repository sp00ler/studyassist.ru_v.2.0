import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-dotted focus-visible:outline-offset-2 focus-visible:outline-ink disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Win95 variant map (see scratchpad/BRIEF.md):
        // default -> btn-95-primary, outline/secondary -> btn-95,
        // ghost -> flat with hover bevel, destructive -> danger fill.
        default: 'btn-95-primary',
        destructive:
          'bg-danger text-white font-bold border border-chrome-shadow shadow-[inset_1px_1px_0_0_#fff,inset_-1px_-1px_0_0_#808080] hover:bg-danger/90 active:shadow-[inset_-1px_-1px_0_0_#fff,inset_1px_1px_0_0_#808080]',
        outline: 'btn-95',
        secondary: 'btn-95',
        ghost:
          'bg-transparent text-ink border border-transparent hover:bg-chrome hover:border-chrome-shadow hover:shadow-[inset_1px_1px_0_0_#fff,inset_-1px_-1px_0_0_#808080]',
        link: 'text-title underline-offset-4 hover:underline',
        amber:
          'bg-accent text-ink font-bold border border-chrome-shadow shadow-[inset_1px_1px_0_0_#fff,inset_-1px_-1px_0_0_#808080] hover:bg-accent/80 active:shadow-[inset_-1px_-1px_0_0_#fff,inset_1px_1px_0_0_#808080]',
      },
      size: {
        default: 'h-10 px-6 py-2',
        sm: 'h-9 px-4 text-xs',
        lg: 'h-12 px-8 text-base',
        xl: 'h-14 px-10 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
