import { useState, Fragment } from "react";
import { formatCurrency, formatDateTime } from "@/utils/utils";
import { Button } from "@/components/common/Button";

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
};

// ======================== EXPANDABLE ROW ========================

const ExpandableRow = ({ items }) => {
  return (
    <tr>
      <td colSpan={9} className="bg-muted/50 px-6 py-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-1 text-muted-foreground font-medium">
                Item
              </th>
              <th className="text-left py-1 text-muted-foreground font-medium">
                Kategori
              </th>
              <th className="text-right py-1 text-muted-foreground font-medium">
                Qty
              </th>
              <th className="text-right py-1 text-muted-foreground font-medium">
                Harga Satuan
              </th>
              <th className="text-right py-1 text-muted-foreground font-medium">
                Subtotal
              </th>
              <th className="text-right py-1 text-muted-foreground font-medium">
                Diskon Tier
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td className="py-1 text-foreground">
                  {item.item_name_snapshot}
                </td>
                <td className="py-1 text-foreground">
                  {CATEGORY_LABELS[item.item_type] || item.item_type}
                </td>
                <td className="py-1 text-right text-foreground">
                  {item.item_type === "fish"
                    ? `${Number(item.quantity).toFixed(2)} kg`
                    : Number(item.quantity)}
                </td>
                <td className="py-1 text-right text-foreground">
                  {formatCurrency(item.unit_price_snapshot)}
                </td>
                <td className="py-1 text-right text-foreground">
                  {formatCurrency(item.subtotal)}
                </td>
                <td className="py-1 text-right text-foreground">
                  {formatCurrency(item.discount_tier_item)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </td>
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
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                      Tanggal
                    </th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                      No. Transaksi
                    </th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">
                      Member
                    </th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-medium">
                      Total Bayar
                    </th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-medium">
                      Diskon Tier
                    </th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-medium">
                      Diskon Voucher
                    </th>
                    <th className="text-center px-4 py-3 text-muted-foreground font-medium">
                      Metode
                    </th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-medium">
                      Poin
                    </th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-medium">
                      Tips
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((trx) => (
                    <Fragment key={trx.transaction_code}>
                      <tr
                        onClick={() => handleRowClick(trx.transaction_code)}
                        className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 text-foreground">
                          {formatDateTime(trx.transaction_date)}
                        </td>
                        <td className="px-4 py-3 text-foreground font-mono text-xs">
                          {trx.transaction_code}
                        </td>
                        <td className="px-4 py-3 text-foreground">
                          {trx.member_name}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground">
                          {formatCurrency(trx.final_amount)}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground">
                          {formatCurrency(trx.discount_tier)}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground">
                          {formatCurrency(trx.discount_voucher)}
                        </td>
                        <td className="px-4 py-3 text-center text-foreground">
                          {PAYMENT_LABELS[trx.payment_method] ||
                            trx.payment_method}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground">
                          {trx.points_earned ?? 0}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground">
                          {formatCurrency(trx.tips)}
                        </td>
                      </tr>
                      {expandedRow === trx.transaction_code && (
                        <ExpandableRow items={trx.items || []} />
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
