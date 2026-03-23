import * as React from "react";
import {
  Button as PrimitiveButton,
  buttonVariants,
} from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/utils/utils";

const Button = React.forwardRef(
  ({ fullWidth, loading, className, children, disabled, ...props }, ref) => {
    return (
      <PrimitiveButton
        ref={ref}
        className={cn(
          "whitespace-normal box-border",
          fullWidth && "w-full",
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="animate-spin size-4" />}
        {children}
      </PrimitiveButton>
    );
  },
);

Button.displayName = "Button";

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants };
