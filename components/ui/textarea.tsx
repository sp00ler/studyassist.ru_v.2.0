import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[100px] w-full rounded-[2px] bg-[#23201A] border-2 border-white/15 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#2FAE5B]/60 focus:ring-1 focus:ring-[#2FAE5B]/30 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 resize-y',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
