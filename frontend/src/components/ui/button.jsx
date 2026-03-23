// src/components/common/Button.jsx

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/utils/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[1.75rem] text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:ring-offset-2 hover:scale-[1.02] active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Default - sama style dengan moving-border tapi tanpa animasi
        default:
          "bg-sky-500 text-white hover:bg-sky-600 shadow-sm hover:shadow-md",

        destructive:
          "bg-red-500 text-white hover:bg-red-600 shadow-sm hover:shadow-md",

        outline:
          "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-sky-500/50 shadow-xs",

        secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-xs",

        ghost: "hover:bg-slate-100 hover:text-slate-900",

        link: "text-sky-500 underline-offset-4 hover:underline hover:scale-100", // No zoom untuk link
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-9 px-4 text-sm",
        lg: "h-11 px-8",
        xl: "h-12 px-10 text-base",
        icon: "size-10",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants };
