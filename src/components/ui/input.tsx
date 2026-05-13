import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#1C1C1E] px-3 py-2 text-[13px] text-[#F5F5F7] transition-all duration-200 file:border-0 file:bg-transparent file:text-[13px] file:font-medium placeholder:text-[#48484A] focus:outline-none focus:border-[#0A84FF] focus:ring-2 focus:ring-[rgba(10,132,255,0.25)] disabled:cursor-not-allowed disabled:opacity-40",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
