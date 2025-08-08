import * as React from 'react'
import { cn } from '@/lib/utils'

interface CustomProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  trackColorClass: string
  fillColorClass: string
}

const CustomProgressBar = React.forwardRef<HTMLDivElement, CustomProgressBarProps>(
  ({ value, trackColorClass, fillColorClass, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full",
        trackColorClass, // Cor da trilha (parte não preenchida)
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "h-full flex-1 transition-all duration-500 ease-out",
          fillColorClass // Cor do preenchimento (parte preenchida)
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </div>
  )
)
CustomProgressBar.displayName = "CustomProgressBar"

export { CustomProgressBar }
