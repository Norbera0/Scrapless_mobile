
"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

export interface ProgressSegment {
  value: number;
  color: string;
  label?: string;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & { segments?: ProgressSegment[] }
>(({ className, value, segments, style, ...props }, ref) => {
  const total = segments ? segments.reduce((acc, segment) => acc + segment.value, 0) : 100;
  
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      style={style}
      {...props}
    >
      {segments && segments.length > 0 ? (
        <div className="flex h-full w-full">
          {segments.map((segment, index) => {
            const segmentWidth = total > 0 ? (segment.value / total) * 100 : 0;
            return (
              <div
                key={index}
                className="h-full"
                style={{ width: `${segmentWidth}%`, backgroundColor: segment.color }}
                title={`${segment.label}: ${segment.value}`}
              />
            )
          })}
        </div>
      ) : (
        <ProgressPrimitive.Indicator
          className="h-full w-full flex-1 bg-primary transition-all"
          style={{ 
            transform: `translateX(-${100 - (value || 0)}%)`,
            // @ts-ignore
            background: style?.['--indicator-bg'] || 'hsl(var(--primary))'
          }}
        />
      )}
    </ProgressPrimitive.Root>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
