import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[10px] text-[13px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/50 disabled:pointer-events-none disabled:opacity-40 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#0A84FF] text-white hover:bg-[#409CFF] active:bg-[#0071E3] shadow-[0_1px_3px_rgba(0,0,0,0.3)]",
        destructive:
          "bg-[rgba(255,69,58,0.12)] text-[#FF453A] hover:bg-[rgba(255,69,58,0.2)] active:bg-[rgba(255,69,58,0.28)]",
        outline:
          "border border-[rgba(255,255,255,0.12)] bg-transparent hover:bg-[rgba(255,255,255,0.06)] text-[#F5F5F7] active:bg-[rgba(255,255,255,0.1)]",
        secondary:
          "bg-[#2C2C2E] text-[#A1A1A6] hover:bg-[#3A3A3C] hover:text-[#F5F5F7] active:bg-[#48484A]",
        ghost: "hover:bg-[rgba(255,255,255,0.06)] text-[#A1A1A6] hover:text-[#F5F5F7]",
        link: "text-[#0A84FF] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-7 px-3 text-[12px]",
        lg: "h-11 px-6 text-[14px]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
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
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
