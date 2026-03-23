// File: src/pages/employee/checkout/SummarySection.jsx

import { formatCurrency } from "@/utils/utils";

/**
 * Props:
 *   subtotalFish
 *   subtotalPending
 *   subtotalPenalty
 *   discountTier
 *   discountPercentage
 *   activeVoucher       — voucher object or null
 *   finalAmount
 *   pointsPreview
 */
export function SummarySection({
  subtotalFish,
  subtotalPending,
  subtotalPenalty,
  discountTier,
  discountPercentage,
  activeVoucher,
  finalAmount,
  pointsPreview,
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">5. Ringkasan Harga</h2>
      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal Ikan</span>
          <span>{formatCurrency(subtotalFish)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Diskon Tier ({discountPercentage ?? 0}% khusus ikan)
          </span>
          <span className="text-destructive">
            {discountTier > 0
              ? `- ${formatCurrency(discountTier)}`
              : formatCurrency(0)}
          </span>
        </div>
        {activeVoucher && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Voucher aktif (otomatis digunakan)
            </span>
            <span className="text-green-600">
              - {formatCurrency(activeVoucher.amount)}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal Pending Orders</span>
          <span>{formatCurrency(subtotalPending)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal Denda</span>
          <span>{formatCurrency(subtotalPenalty)}</span>
        </div>
        <hr className="border-border" />
        <div className="flex justify-between font-semibold text-base">
          <span>Total Bayar</span>
          <span>{formatCurrency(finalAmount)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Poin yang akan didapat</span>
          <span className="text-green-600">+{pointsPreview} poin</span>
        </div>
      </div>
    </section>
  );
}
