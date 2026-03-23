import { useState, useEffect, useCallback, Fragment } from "react";
import memberService from "../../services/memberService";
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

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  const fetchTransactions = useCallback(async (targetPage = 1) => {
    setLoading(true);
    try {
      const res = await memberService.getTransactionHistory({
        page: targetPage,
        per_page: 10,
      });
      if (res.success) {
        setTransactions(res.data || []);
        setMeta(res.meta || null);
      }
    } catch (err) {
      console.error("Gagal memuat riwayat transaksi:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions(1);
  }, [fetchTransactions]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    setExpandedRow(null);
    fetchTransactions(newPage);
  };

  const handleRowClick = (code) => {
    setExpandedRow((prev) => (prev === code ? null : code));
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-4">
        Riwayat Transaksi
      </h2>

      <div className="bg-background border border-border rounded-lg overflow-hidden">
        {loading ? (
          <p className="text-muted-foreground text-sm p-4">
            Memuat transaksi...
          </p>
        ) : transactions.length === 0 ? (
          <p className="text-muted-foreground text-sm p-4">
            Belum ada riwayat transaksi.
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
                    <th className="text-right px-4 py-3 text-muted-foreground font-medium">
                      Total Bayar
                    </th>
                    <th className="text-center px-4 py-3 text-muted-foreground font-medium">
                      Metode Bayar
                    </th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-medium">
                      Poin
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((trx) => (
                    <Fragment key={trx.transaction_code}>
                      <tr
                        onClick={() => handleRowClick(trx.transaction_code)}
                        className="hover:bg-muted/30 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 text-foreground">
                          {formatDateTime(trx.transaction_date)}
                        </td>
                        <td className="px-4 py-3 text-foreground font-mono text-xs">
                          {trx.transaction_code}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground">
                          {formatCurrency(trx.final_amount)}
                        </td>
                        <td className="px-4 py-3 text-center text-foreground">
                          {PAYMENT_LABELS[trx.payment_method] ||
                            trx.payment_method}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground">
                          +{trx.points_earned ?? 0}
                        </td>
                      </tr>

                      {/* Expanded Row */}
                      {expandedRow === trx.transaction_code && (
                        <tr>
                          <td colSpan={5} className="bg-muted/50 px-6 py-4">
                            {/* Bagian 1: Daftar Item */}
                            <table className="w-full text-sm mb-1">
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
                                </tr>
                              </thead>
                              <tbody>
                                {(trx.items || []).map((item, idx) => (
                                  <tr key={idx}>
                                    <td className="py-1 text-foreground">
                                      {item.item_name_snapshot}
                                    </td>
                                    <td className="py-1 text-foreground">
                                      {CATEGORY_LABELS[item.item_type] ||
                                        item.item_type}
                                    </td>
                                    <td className="py-1 text-right text-foreground">
                                      {item.item_type === "fish"
                                        ? `${Number(item.quantity).toFixed(2)} kg`
                                        : `${Number(item.quantity)} pcs`}
                                    </td>
                                    <td className="py-1 text-right text-foreground">
                                      {formatCurrency(item.unit_price_snapshot)}
                                    </td>
                                    <td className="py-1 text-right text-foreground">
                                      {formatCurrency(item.subtotal)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>

                            {/* Bagian 2: Ringkasan Pembayaran */}
                            <div className="border-t border-border pt-2 space-y-1 text-sm">
                              {trx.discount_tier > 0 && (
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Diskon Tier</span>
                                  <span>
                                    - {formatCurrency(trx.discount_tier)}
                                  </span>
                                </div>
                              )}
                              {trx.discount_voucher > 0 && (
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Diskon Voucher</span>
                                  <span>
                                    - {formatCurrency(trx.discount_voucher)}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between font-bold text-foreground">
                                <span>Total Bayar</span>
                                <span>{formatCurrency(trx.final_amount)}</span>
                              </div>
                              <div className="flex justify-between text-green-600">
                                <span>Poin Diperoleh</span>
                                <span>+{trx.points_earned ?? 0} poin</span>
                              </div>
                            </div>
                          </td>
                        </tr>
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
                  Halaman {meta.current_page} dari {meta.last_page}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                  >
                    Sebelumnya
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page + 1)}
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

export default TransactionHistory;
