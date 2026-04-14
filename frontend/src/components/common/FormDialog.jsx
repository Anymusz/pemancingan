import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/common/Button";
import { cn } from "@/utils/utils";

const sizeMap = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
};

const ICON_VARIANT_CONFIG = {
  default: { iconBg: "bg-blue-100", iconColor: "text-blue-600" },
  success: { iconBg: "bg-green-100", iconColor: "text-green-600" },
  warning: { iconBg: "bg-amber-100", iconColor: "text-amber-600" },
  danger: { iconBg: "bg-red-100", iconColor: "text-red-600" },
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

  const hasIcon = Boolean(Icon);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "flex flex-col gap-0 p-0 max-h-[90vh] overflow-hidden",
          sizeMap[size],
        )}
        onEscapeKeyDown={(e) => loading && e.preventDefault()}
        onInteractOutside={(e) => loading && e.preventDefault()}
        showCloseButton={!loading}
      >
        {/* Header */}
        <div
          className={cn(
            "flex flex-col gap-1 px-6 py-5 border-b border-border shrink-0",
            hasIcon && "text-center",
          )}
        >
          {Icon && (
            <div className="flex justify-center mb-2">
              <div className={cn("p-3 rounded-full", iconConfig.iconBg)}>
                <Icon className={cn("size-6", iconConfig.iconColor)} />
              </div>
            </div>
          )}
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 [&::-webkit-scrollbar]:w-0">
          {children}
        </div>

        {/* Footer */}
        {onSubmit && (
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-border shrink-0 bg-background">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              {cancelLabel}
            </Button>
            <Button
              variant={submitVariant}
              onClick={onSubmit}
              disabled={loading}
              loading={loading}
              className="min-w-[100px]"
            >
              {loading ? "Memproses..." : submitLabel}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FormDialog;
