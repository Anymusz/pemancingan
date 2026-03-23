// File: src/pages/employee/checkout/PaymentSection.jsx

import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/FormInput";
import { Label } from "@/components/common/FormLabel";
import { FormSelect } from "@/components/common/FormSelect";
import { Textarea } from "@/components/common/FormTextarea";

const PAYMENT_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "transfer", label: "Transfer" },
  { value: "qris", label: "QRIS" },
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
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">6. Pembayaran</h2>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="payment-method">Metode Pembayaran *</Label>
          <FormSelect
            value={paymentMethod}
            onValueChange={onPaymentMethodChange}
            placeholder="-- Pilih Metode --"
            options={PAYMENT_OPTIONS}
            className="w-56"
          />
        </div>

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

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes">Catatan — Opsional</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={onNotesChange}
            rows={2}
            className="max-w-md"
          />
        </div>
      </section>

      {/* ===== 7. SUBMIT ===== */}
      <section>
        <Button
          onClick={onSubmit}
          disabled={isSubmitDisabled}
          loading={loading}
          fullWidth
        >
          {loading ? "Memproses..." : "Proses Checkout"}
        </Button>
      </section>
    </>
  );
}
