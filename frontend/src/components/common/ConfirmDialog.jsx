import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/common/Button";
import { Textarea } from "@/components/common/FormTextarea";
import { Info, AlertTriangle, Trash2, AlignCenter } from "lucide-react";

const VARIANT_CONFIG = {
  default: {
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    Icon: Info,
    buttonVariant: "default",
    buttonClassName: "",
  },
  destructive: {
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    Icon: Trash2,
    buttonVariant: "destructive",
    buttonClassName: "",
  },
  warning: {
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    Icon: AlertTriangle,
    buttonVariant: "outline",
    buttonClassName: "border-amber-500 text-amber-600 hover:bg-amber-50",
  },
};

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  variant = "default",
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  loading = false,
  inputLabel,
  inputValue,
  onInputChange,
}) => {
  const config = VARIANT_CONFIG[variant] ?? VARIANT_CONFIG.default;
  const Icon = config.Icon;

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value && loading) return;
        onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-sm"
        onEscapeKeyDown={(e) => {
          if (loading) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (loading) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (loading) e.preventDefault();
        }}
      >
        <div className="flex justify-center mb-2">
          <div className={`${config.iconBg} p-3 rounded-full`}>
            <Icon className={`${config.iconColor} size-6`} />
          </div>
        </div>

        <DialogHeader className="text-center items-center sm:text-center">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {inputLabel && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">{inputLabel}</label>
            <Textarea
              value={inputValue}
              onChange={onInputChange}
              disabled={loading}
              rows={3}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mt-2 w-full">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={config.buttonVariant}
            className={config.buttonClassName}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Memproses..." : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDialog;
