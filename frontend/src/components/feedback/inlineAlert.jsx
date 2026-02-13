// File: src/components/feedback/InlineAlert.jsx
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * InlineAlert Component - Standalone (No shadcn alert dependency)
 */
export const InlineAlert = ({
  variant = "info",
  title,
  description,
  icon,
  dismissible = false,
  onDismiss,
  className,
  action,
}) => {
  // Auto-select icon based on variant
  const defaultIcons = {
    success: <CheckCircle2 className="h-5 w-5" />,
    error: <AlertCircle className="h-5 w-5" />,
    warning: <AlertTriangle className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />,
  };

  // Variant styles
  const variantStyles = {
    success: cn(
      "border-green-200 bg-green-50 text-green-900",
      "dark:border-green-900/50 dark:bg-green-950/50 dark:text-green-50",
    ),
    error: cn(
      "border-red-200 bg-red-50 text-red-900",
      "dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-50",
    ),
    warning: cn(
      "border-amber-200 bg-amber-50 text-amber-900",
      "dark:border-amber-900/50 dark:bg-amber-950/50 dark:text-amber-50",
    ),
    info: cn(
      "border-blue-200 bg-blue-50 text-blue-900",
      "dark:border-blue-900/50 dark:bg-blue-950/50 dark:text-blue-50",
    ),
  };

  return (
    <div
      role="alert"
      className={cn(
        "relative w-full rounded-lg border p-4",
        "flex gap-3 items-start",
        "transition-all duration-300 animate-in fade-in slide-in-from-top-2",
        variantStyles[variant],
        className,
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {icon || defaultIcons[variant]}
      </div>

      {/* Content Container */}
      <div className="flex-1 min-w-0">
        {/* Title */}
        {title && (
          <h5 className="mb-1 font-semibold leading-tight text-base">
            {title}
          </h5>
        )}

        {/* Description */}
        {description && (
          <div className="text-sm leading-relaxed opacity-90">
            {description}
          </div>
        )}

        {/* Action Button */}
        {action && <div className="mt-3">{action}</div>}
      </div>

      {/* Dismiss Button */}
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className={cn(
            "flex-shrink-0 rounded-md p-1 transition-colors",
            "hover:bg-black/5 dark:hover:bg-white/10",
            "focus:outline-none focus:ring-2 focus:ring-offset-2",
            variant === "success" && "focus:ring-green-500",
            variant === "error" && "focus:ring-red-500",
            variant === "warning" && "focus:ring-amber-500",
            variant === "info" && "focus:ring-blue-500",
          )}
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

// Pre-configured variants
export const SuccessAlert = (props) => (
  <InlineAlert variant="success" {...props} />
);

export const ErrorAlert = (props) => <InlineAlert variant="error" {...props} />;

export const WarningAlert = (props) => (
  <InlineAlert variant="warning" {...props} />
);

export const InfoAlert = (props) => <InlineAlert variant="info" {...props} />;

export default InlineAlert;
