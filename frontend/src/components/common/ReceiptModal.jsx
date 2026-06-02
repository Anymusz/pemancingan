// File: src/components/common/ReceiptModal.jsx

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/FormInput";
import { Label } from "@/components/common/FormLabel";
import { formatCurrency, formatDateTime } from "@/utils/utils";
import { Printer, MessageCircle, X, TrendingUp } from "lucide-react";

const PAYMENT_LABELS = {
  cash: "Cash",
  transfer: "Transfer Bank",
  qris: "QRIS",
};

const ReceiptModal = ({ isOpen, onClose, receipt, memberPhone }) => {
  const [waPhone, setWaPhone] = useState(memberPhone ?? "");

  useEffect(() => {
    if (isOpen) setWaPhone(memberPhone ?? "");
  }, [isOpen]);

  if (!receipt) return null;

  const {
    transaction_code,
    transaction_date,
    employee_name,
    customer,
    items = [],
    total_amount,
    discount_tier,
    discount_voucher,
    final_amount,
    deposit_used,
    deposit_change,
    tips,
    payment_method,
    points_earned,
    total_points,
    current_tier,
    tier_upgraded,
  } = receipt;

  const isGuest = customer?.is_guest ?? false;

  // Compute subtotal from items for display
  const itemsSubtotal = items.reduce(
    (sum, item) => sum + Number(item.subtotal),
    0,
  );

  const buildWaMessage = () => {
    const separator = "━━━━━━━━━━━━━";

    const lines = [
      `*Nota Transaksi - Pemancingan Sutoyo*`,
      `Kode: ${transaction_code}`,
      `Tanggal: ${formatDateTime(transaction_date)}`,
      `Pelanggan: ${customer?.name ?? "-"}`,
      separator,

      ...items.map((item) => {
        const qty =
          item.item_type === "fish"
            ? `${Number(item.quantity).toFixed(2)} kg`
            : `${Number(item.quantity)} pcs`;

        return `- ${item.item_name_snapshot} x${qty} : ${formatCurrency(item.subtotal)}`;
      }),

      separator,

      ...(total_amount !== final_amount
        ? [`Subtotal: ${formatCurrency(total_amount)}`]
        : []),

      ...(discount_tier > 0
        ? [`Diskon Tier: - ${formatCurrency(discount_tier)}`]
        : []),

      ...(discount_voucher > 0
        ? [`Diskon Voucher: -${formatCurrency(discount_voucher)}`]
        : []),

      ...(isGuest && deposit_used > 0
        ? [`Deposit: - ${formatCurrency(deposit_used)}`]
        : []),

      ...(deposit_change > 0
        ? [`Kembalian Deposit: ${formatCurrency(deposit_change)}`]
        : []),

      ...(tips > 0 ? [`Tips: ${formatCurrency(tips)}`] : []),

      `*Total Bayar: ${formatCurrency(final_amount)}*`,
      `Metode: ${PAYMENT_LABELS[payment_method] ?? payment_method ?? "-"}`,

      ...(!isGuest && points_earned > 0
        ? [`Poin diperoleh: ${points_earned}`]
        : []),

      separator,
      `Terima kasih telah berkunjung!`,
    ];

    return lines.join("\n");
  };

  const handleWhatsApp = () => {
    let cleaned = waPhone.replace(/\D/g, "");
    if (!cleaned) return;
    if (cleaned.startsWith("0")) cleaned = "62" + cleaned.slice(1);
    const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(buildWaMessage())}`;
    window.open(url, "_blank");
  };

  const handlePrint = () => {
    const receiptEl = document.querySelector(".receipt-print-area");
    if (!receiptEl) return;
    const printContainer = document.createElement("div");
    printContainer.id = "receipt-for-print";
    printContainer.appendChild(receiptEl.cloneNode(true));
    document.body.appendChild(printContainer);
    const printStyle = document.createElement("style");
    printStyle.textContent = `
  @media print {
    body > *:not(#receipt-for-print) { display: none !important; }
    #receipt-for-print { display: block !important; }
    @page { margin: 0.5cm; }
  }
`;
    document.head.appendChild(printStyle);
    window.print();
    document.body.removeChild(printContainer);
    document.head.removeChild(printStyle);
  };

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Nota Transaksi</DialogTitle>
          </DialogHeader>

          {/* ── Printable receipt area ── */}
          <div className="receipt-print-area p-6 space-y-4">
            {/* Header */}
            <div className="text-center space-y-1">
              <p className="text-xl font-bold text-foreground">
                Pemancingan Sutoyo
              </p>
              <p className="text-sm text-muted-foreground">Nota Transaksi</p>
              <div className="border-t border-dashed border-border mt-2" />
            </div>

            {/* Info block */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <span className="text-muted-foreground">Kode Transaksi</span>
              <span className="font-mono text-right font-medium text-foreground break-all">
                {transaction_code}
              </span>

              <span className="text-muted-foreground">Tanggal</span>
              <span className="text-right text-foreground">
                {formatDateTime(transaction_date)}
              </span>

              <span className="text-muted-foreground">Pelanggan</span>
              <span className="text-right text-foreground flex items-center justify-end gap-1.5">
                {customer?.name ?? "-"}
              </span>

              <span className="text-muted-foreground">Kasir</span>
              <span className="text-right text-foreground">
                {employee_name ?? "-"}
              </span>
            </div>

            <div className="border-t border-dashed border-border" />

            {/* Items table */}
            <div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-1.5 text-muted-foreground font-medium">
                      Item
                    </th>
                    <th className="text-right py-1.5 text-muted-foreground font-medium">
                      Qty
                    </th>
                    <th className="text-right py-1.5 text-muted-foreground font-medium">
                      Harga
                    </th>
                    <th className="text-right py-1.5 text-muted-foreground font-medium">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const displayName =
                      item.item_type === "penalty"
                        ? `${item.item_name_snapshot} (Denda)`
                        : item.item_name_snapshot;
                    const qty =
                      item.item_type === "fish"
                        ? `${Number(item.quantity).toFixed(2)} kg`
                        : `${Number(item.quantity)} pcs`;
                    return (
                      <tr key={idx} className="border-b border-border/50">
                        <td className="py-1.5 text-foreground pr-2">
                          {displayName}
                        </td>
                        <td className="py-1.5 text-right text-foreground whitespace-nowrap">
                          {qty}
                        </td>
                        <td className="py-1.5 text-right text-foreground whitespace-nowrap">
                          {formatCurrency(item.unit_price_snapshot)}
                        </td>
                        <td className="py-1.5 text-right text-foreground whitespace-nowrap">
                          {formatCurrency(item.subtotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary block */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatCurrency(itemsSubtotal)}</span>
              </div>

              {Number(discount_tier) > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Diskon Tier</span>
                  <span className="text-red-600">
                    - {formatCurrency(discount_tier)}
                  </span>
                </div>
              )}

              {Number(discount_voucher) > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Diskon Voucher</span>
                  <span className="text-red-600">
                    - {formatCurrency(discount_voucher)}
                  </span>
                </div>
              )}

              {isGuest && Number(deposit_used) > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Deposit Digunakan</span>
                  <span>- {formatCurrency(deposit_used)}</span>
                </div>
              )}

              {Number(deposit_change) > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Kembalian Deposit</span>
                  <span>{formatCurrency(deposit_change)}</span>
                </div>
              )}

              {Number(tips) > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Tips</span>
                  <span>{formatCurrency(tips)}</span>
                </div>
              )}

              <div className="border-t border-border pt-1 flex justify-between font-bold text-foreground text-base">
                <span>Total Bayar</span>
                <span>{formatCurrency(final_amount)}</span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>Metode Pembayaran</span>
                <span>
                  {PAYMENT_LABELS[payment_method] ?? payment_method ?? "-"}
                </span>
              </div>
            </div>

            {/* Member-only block */}
            {!isGuest && (
              <>
                <div className="border-t border-dashed border-border" />
                <div className="space-y-1 text-sm">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                    Info Member
                  </p>
                  <div className="flex justify-between text-foreground">
                    <span>Poin Diperoleh</span>
                    <span className="text-emerald-600 font-medium">
                      +{points_earned ?? 0}
                    </span>
                  </div>
                  {total_points !== undefined && (
                    <div className="flex justify-between text-foreground">
                      <span>Total Poin</span>
                      <span>{total_points}</span>
                    </div>
                  )}
                  {current_tier !== undefined && (
                    <div className="flex justify-between text-foreground">
                      <span>Tier</span>
                      <span className="flex items-center gap-1.5">
                        {current_tier}
                        {tier_upgraded && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            <TrendingUp className="size-3" />
                            Tier Naik!
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Footer */}
            <div className="border-t border-dashed border-border pt-3 text-center text-sm text-muted-foreground">
              Terima kasih telah berkunjung!
            </div>
          </div>

          {/* ── Actions (no-print) ── */}
          <div className="no-print border-t border-border p-4 space-y-3 bg-background">
            {/* WhatsApp input */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="receipt-wa-phone">Nomor WhatsApp</Label>
              <Input
                id="receipt-wa-phone"
                type="tel"
                value={waPhone}
                onChange={(e) => setWaPhone(e.target.value)}
                placeholder="Contoh: 08123456789"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handlePrint}
              >
                <Printer className="size-4" />
                Print Nota
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleWhatsApp}
                disabled={!waPhone.replace(/\D/g, "")}
              >
                <MessageCircle className="size-4" />
                Kirim WA
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReceiptModal;
