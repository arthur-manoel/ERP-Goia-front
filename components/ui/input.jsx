import * as React from "react"

import { cn } from "@/lib/utils"
import { formatField } from "@/lib/field-format"

const Input = React.forwardRef(({ className, type, onChange, ...props }, ref) => {
  const key = String(props.name || props.id || props.placeholder || '')
  const formattedChange = onChange ? event => { event.target.value = formatField(key, type, event.target.value); onChange(event) } : undefined
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      onChange={formattedChange}
      {...props} />
  );
})
Input.displayName = "Input"

export { Input }
