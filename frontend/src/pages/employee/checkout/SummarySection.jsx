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
 *   isGuest             — boolean
 *   depositAmount       — number (0 for members)
 *   depositChange       — number (change returned if deposit > total)
 *   finalAmountAfterDeposit — number
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
  isGuest = false,
  depositAmount = 0,
  depositChange = 0,
  finalAmountAfterDeposit,
}) {
  const effectiveFinal = finalAmountAfterDeposit ?? finalAmount;
  const isFullyCovered = depositAmount > 0 && effectiveFinal === 0;
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-sm">
      <h2 className="text-sm font-semibold text-foreground mb-4">
        Ringkasan Transaksi
      </h2>

      <div className="flex justify-between">
        <span className="text-muted-foreground">Subtotal Ikan</span>
        <span>{formatCurrency(subtotalFish)}</span>
      </div>

      {!isGuest && (
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
      )}

      {!isGuest && activeVoucher && (
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Voucher aktif (otomatis digunakan)
          </span>
          <span className="text-emerald-600">
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

      {isGuest && depositAmount > 0 && (
        <div className="flex justify-between text-emerald-600">
          <span>Deposit Tamu</span>
          <span>- {formatCurrency(depositAmount)}</span>
        </div>
      )}

      <hr className="border-border" />

      <div className="flex justify-between font-semibold text-base">
        <span>{isFullyCovered ? "Lunas via Deposit" : "Total Bayar"}</span>
        <span>{formatCurrency(effectiveFinal)}</span>
      </div>

      {isGuest && depositChange > 0 && (
        <div className="flex justify-between font-medium text-amber-600">
          <span>Kembalian Deposit</span>
          <span>{formatCurrency(depositChange)}</span>
        </div>
      )}

      {!isGuest && (
        <div className="flex justify-between text-muted-foreground">
          <span>Poin yang akan didapat</span>
          <span className="text-emerald-600">+{pointsPreview} poin</span>
        </div>
      )}
    </div>
  );
}
