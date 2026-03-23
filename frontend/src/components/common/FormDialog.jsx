import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/common/Button";
import { cn } from "@/utils/utils";

const sizeMap = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
};

const ICON_VARIANT_CONFIG = {
  default: {
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  success: {
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  warning: {
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  danger: {
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
  },
};

const FormDialog = ({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  loading = false,
  onSubmit,
  submitLabel = "Simpan",
  cancelLabel = "Batal",
  submitVariant = "default",
  icon: Icon,
  iconVariant = "default",
}) => {
  const handleOpenChange = (value) => {
    if (loading) return;
    if (!value) onClose();
  };

  const iconConfig =
    ICON_VARIANT_CONFIG[iconVariant] ?? ICON_VARIANT_CONFIG.default;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn("flex flex-col max-h-[90vh]", sizeMap[size])}
        onEscapeKeyDown={(e) => loading && e.preventDefault()}
        onInteractOutside={(e) => loading && e.preventDefault()}
        showCloseButton={!loading}
      >
        {/* Icon */}
        {Icon && (
          <div className="flex justify-center mb-1">
            <div className={`${iconConfig.iconBg} p-3 rounded-full`}>
              <Icon className={`${iconConfig.iconColor} size-6`} />
            </div>
          </div>
        )}

        {/* Header */}
        <DialogHeader className="border-b pb-4">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {/* Content */}
        <div className="pt-1 flex-1 overflow-y-auto">{children}</div>

        {/* Footer */}
        {onSubmit && (
          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              {cancelLabel}
            </Button>
            <Button
              variant={submitVariant}
              onClick={onSubmit}
              disabled={loading}
            >
              {loading ? "Memproses..." : submitLabel}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FormDialog;
