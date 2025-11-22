import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../shared/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive min-h-[44px] [@media(pointer:coarse)]:min-h-[44px]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border border-input bg-transparent text-muted-foreground/80 shadow-xs hover:bg-accent/50 hover:text-foreground hover:border-accent/60 transition-all duration-200 hover:shadow-md",
        "outline-selected":
          "border border-orange-500/70 bg-orange-500/10 text-foreground shadow-xs hover:bg-orange-500/20 hover:border-orange-500/80 transition-all duration-200 hover:shadow-md hover:shadow-orange-500/20",
        "outline-selected-purple":
          "border border-purple-500/70 bg-purple-500/10 text-foreground shadow-xs hover:bg-purple-500/20 hover:border-purple-500/80 transition-all duration-200 hover:shadow-md hover:shadow-purple-500/20",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-9 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-11 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-10",
        compact: "h-8 px-2.5 py-1.5 text-xs gap-1 has-[>svg]:px-2 [@media(pointer:coarse)]:h-10 [@media(pointer:coarse)]:px-3",
      },
      fullWidthOnMobile: {
        true: "w-full sm:w-auto flex-1 sm:flex-initial",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidthOnMobile: false,
    },
  }
)

interface ButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  selected?: boolean
}

function Button({
  className,
  variant,
  size,
  fullWidthOnMobile,
  selected,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"

  const finalVariant = selected && variant === 'outline' ? 'outline-selected' : variant

  // Add aria-pressed for selection buttons to improve screen reader support
  const ariaProps = selected !== undefined ? { 'aria-pressed': selected } : {}

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant: finalVariant, size, fullWidthOnMobile, className }))}
      {...ariaProps}
      {...props}
    />
  )
}

export { Button, buttonVariants }
