// File: src/pages/employee/checkout/v2/PaymentSection.jsx

import { Banknote, ArrowLeftRight, Smartphone } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/FormInput";
import { Label } from "@/components/common/FormLabel";
import { Textarea } from "@/components/common/FormTextarea";

const PAYMENT_OPTIONS = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "transfer", label: "Transfer", icon: ArrowLeftRight },
  { value: "qris", label: "QRIS", icon: Smartphone },
];

/**
 * Props:
 *   paymentMethod
 *   onPaymentMethodChange
 *   tips
 *   onTipsChange
 *   notes
 *   onNotesChange
 *   onSubmit
 *   loading
 *   isSubmitDisabled
 */
export function PaymentSection({
  paymentMethod,
  onPaymentMethodChange,
  tips,
  onTipsChange,
  notes,
  onNotesChange,
  onSubmit,
  loading,
  isSubmitDisabled,
}) {
  return (
    <>
      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
        <h2 className="text-sm font-semibold text-foreground mb-4">
          Pembayaran
        </h2>

        {/* Payment Method Cards */}
        <div className="flex flex-col gap-1.5">
          <Label>Metode Pembayaran *</Label>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_OPTIONS.map((method) => {
              const Icon = method.icon;
              const isSelected = paymentMethod === method.value;
              return (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => onPaymentMethodChange(method.value)}
                  className={`rounded-lg border p-3 cursor-pointer text-center transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/40"
                  }`}
                >
                  <Icon className="h-5 w-5 mx-auto mb-1" />
                  <span className="text-sm font-medium">{method.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tips */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tips">Tips (Rp) — Opsional</Label>
          <Input
            id="tips"
            type="number"
            min="0"
            value={tips}
            onChange={onTipsChange}
            placeholder="0"
            className="w-40"
          />
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes">Catatan — Opsional</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={onNotesChange}
            rows={2}
          />
        </div>
      </div>

      {/* Submit */}
      <Button
        onClick={onSubmit}
        disabled={isSubmitDisabled}
        loading={loading}
        fullWidth
      >
        {loading ? "Memproses..." : "Proses Checkout"}
      </Button>
    </>
  );
}
