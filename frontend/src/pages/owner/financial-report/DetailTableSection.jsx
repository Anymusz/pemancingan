import { useState, Fragment } from "react";
import { formatCurrency, formatDateTime } from "@/utils/utils";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import ImageLightbox from "@/components/common/ImageLightbox";

const CATEGORY_LABELS = {
  fish: "Ikan",
  menu: "Makanan & Minuman",
  rental: "Sewa Alat",
  penalty: "Denda",
};

const PAYMENT_LABELS = {
  cash: "Cash",
  transfer: "Transfer",
  qris: "QRIS",
  null: "Deposit",
};

// ======================== EXPANDABLE ROW ========================

const ExpandableRow = ({ trx }) => {
  const items = trx.items || [];
  const [proofLightboxSrc, setProofLightboxSrc] = useState(null);
  return (
    <tr>
      <td colSpan={10} className="bg-muted/60 px-6 py-4">
        {/* Items sub-table */}
        <table className="w-full text-sm mb-3">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-1 text-muted-foreground font-medium text-xs">
                Item
              </th>
              <th className="text-left py-1 text-muted-foreground font-medium text-xs">
                Kategori
              </th>
              <th className="text-right py-1 text-muted-foreground font-medium text-xs">
                Qty
              </th>
              <th className="text-right py-1 text-muted-foreground font-medium text-xs">
                Harga Satuan
              </th>
              <th className="text-right py-1 text-muted-foreground font-medium text-xs">
                Subtotal
              </th>
              <th className="text-right py-1 text-muted-foreground font-medium text-xs">
                Diskon Tier
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-1 text-foreground text-xs">
                  {item.item_name_snapshot}
                </td>
                <td className="py-1 text-foreground text-xs">
                  {CATEGORY_LABELS[item.item_type] || item.item_type}
                </td>
                <td className="py-1 text-right text-foreground text-xs">
                  {item.item_type === "fish"
                    ? `${Number(item.quantity).toFixed(2)} kg`
                    : Number(item.quantity)}
                </td>
                <td className="py-1 text-right text-foreground text-xs">
                  {formatCurrency(item.unit_price_snapshot)}
                </td>
                <td className="py-1 text-right text-foreground text-xs">
                  {formatCurrency(item.subtotal)}
                </td>
                <td className="py-1 text-right text-foreground text-xs">
                  {formatCurrency(item.discount_tier_item)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Payment summary */}
        <div className="border-t border-border pt-2 space-y-1 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatCurrency(trx.total_amount)}</span>
          </div>
          {trx.discount_tier > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Diskon Tier</span>
              <span>- {formatCurrency(trx.discount_tier)}</span>
            </div>
          )}
          {trx.discount_voucher > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Diskon Voucher</span>
              <span>- {formatCurrency(trx.discount_voucher)}</span>
            </div>
          )}
          {trx.is_guest && trx.deposit_used > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Deposit Tamu</span>
              <span>- {formatCurrency(trx.deposit_used)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-foreground">
            <span>Total Bayar</span>
            <span>{formatCurrency(trx.final_amount)}</span>
          </div>
          {trx.is_guest && trx.deposit_change > 0 && (
            <div className="flex justify-between text-amber-600 font-medium">
              <span>Kembalian Deposit</span>
              <span>{formatCurrency(trx.deposit_change)}</span>
            </div>
          )}
          {trx.tips > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Tips</span>
              <span>{formatCurrency(trx.tips)}</span>
            </div>
          )}
          <div className="flex justify-between text-muted-foreground items-start">
            <span>Bukti Pembayaran</span>
            {trx.payment_proof_url ? (
              <img
                src={trx.payment_proof_url}
                alt="Bukti pembayaran"
                className="h-16 w-auto object-contain rounded border border-border cursor-zoom-in"
                onClick={(e) => {
                  e.stopPropagation();
                  setProofLightboxSrc(trx.payment_proof_url);
                }}
              />
            ) : (
              <span className="text-xs text-muted-foreground">Tidak ada</span>
            )}
          </div>
        </div>
      </td>

      <ImageLightbox
        open={proofLightboxSrc !== null}
        src={proofLightboxSrc ?? ""}
        alt="Bukti pembayaran"
        onClose={() => setProofLightboxSrc(null)}
      />
    </tr>
  );
};

// ======================== DETAIL TABLE SECTION ========================

const DetailTableSection = ({
  data,
  meta,
  loading,
  page,
  onPageChange,
  onExport,
  exporting,
}) => {
  const [expandedRow, setExpandedRow] = useState(null);

  const transactions = data || [];

  const handleRowClick = (transactionCode) => {
    setExpandedRow((prev) =>
      prev === transactionCode ? null : transactionCode,
    );
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">
          Detail Transaksi
        </h3>
        <Button
          variant="default"
          size="sm"
          onClick={onExport}
          disabled={exporting}
        >
          {exporting ? "Mengunduh..." : "Export Excel"}
        </Button>
      </div>

      <div className="bg-background border border-border rounded-lg overflow-hidden">
        {loading ? (
          <p className="text-muted-foreground text-sm p-4">
            Memuat transaksi...
          </p>
        ) : transactions.length === 0 ? (
          <p className="text-muted-foreground text-sm p-4">
            Tidak ada transaksi.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/60 border-b border-border">
                    <th className="text-left px-4 py-3 text-muted-foreground font-semibold text-xs">
                      Tanggal
                    </th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-semibold text-xs">
                      No. Transaksi
                    </th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-semibold text-xs">
                      Pelanggan
                    </th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-semibold text-xs">
                      Tipe
                    </th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-semibold text-xs">
                      Total Bayar
                    </th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-semibold text-xs">
                      Diskon Tier
                    </th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-semibold text-xs">
                      Diskon Voucher
                    </th>
                    <th className="text-center px-4 py-3 text-muted-foreground font-semibold text-xs">
                      Metode
                    </th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-semibold text-xs">
                      Poin
                    </th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-semibold text-xs">
                      Tips
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((trx) => (
                    <Fragment key={trx.transaction_code}>
                      <tr
                        onClick={() => handleRowClick(trx.transaction_code)}
                        className="border-b border-border bg-card hover:bg-muted/30 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 text-foreground text-xs">
                          {formatDateTime(trx.transaction_date)}
                        </td>
                        <td className="px-4 py-3 text-foreground font-mono text-xs">
                          {trx.transaction_code}
                        </td>
                        <td className="px-4 py-3 text-foreground text-xs">
                          {trx.customer_name}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            status={trx.is_guest ? "guest" : "member"}
                          />
                        </td>
                        <td className="px-4 py-3 text-right text-foreground text-xs">
                          {formatCurrency(trx.final_amount)}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground text-xs">
                          {formatCurrency(trx.discount_tier)}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground text-xs">
                          {formatCurrency(trx.discount_voucher)}
                        </td>
                        <td className="px-4 py-3 text-center text-foreground text-xs">
                          {PAYMENT_LABELS[trx.payment_method ?? "null"] ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-right text-emerald-600">
                          {trx.is_guest ? "-" : `+${trx.points_earned ?? 0}`}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground text-xs">
                          {formatCurrency(trx.tips)}
                        </td>
                      </tr>
                      {expandedRow === trx.transaction_code && (
                        <ExpandableRow trx={trx} />
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && meta.last_page > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Halaman {meta.current_page} dari {meta.last_page} (
                  {meta.total} transaksi)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= meta.last_page}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DetailTableSection;
