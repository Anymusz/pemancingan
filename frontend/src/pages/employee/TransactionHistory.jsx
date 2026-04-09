import { useState, useEffect, useCallback, Fragment } from "react";
import employeeService from "../../services/employeeService";
import { formatCurrency, formatDateTime } from "@/utils/utils";
import { Label } from "@/components/common/FormLabel";
import { Input } from "@/components/common/FormInput";
import { FormSelect } from "@/components/common/FormSelect";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/common/StatusBadge";

// ==================== CONSTANTS ====================

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

const PAYMENT_OPTIONS = [
  { value: "__all__", label: "Semua" },
  { value: "cash", label: "Cash" },
  { value: "transfer", label: "Transfer" },
  { value: "qris", label: "QRIS" },
];

// ==================== COMPONENT ====================

const TransactionHistory = () => {
  // ==================== STATE ====================
  const [transactions, setTransactions] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  // Filter state (draft — applied on "Terapkan")
  const [filterDraft, setFilterDraft] = useState({
    date_from: "",
    date_to: "",
    transaction_code: "",
    payment_method: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({});
  const [dateError, setDateError] = useState("");

  // ==================== FETCH ====================

  const fetchTransactions = useCallback(
    async (targetPage = 1, filters = appliedFilters) => {
      setLoading(true);
      try {
        const params = { page: targetPage, per_page: 10 };
        if (filters.date_from) params.date_from = filters.date_from;
        if (filters.date_to) params.date_to = filters.date_to;
        if (filters.transaction_code)
          params.transaction_code = filters.transaction_code;
        if (filters.payment_method)
          params.payment_method = filters.payment_method;

        const res = await employeeService.getTransactions(params);
        if (res.success) {
          setTransactions(res.data || []);
          setMeta(res.meta || null);
        }
      } catch (err) {
        console.error("Gagal memuat riwayat transaksi:", err);
      } finally {
        setLoading(false);
      }
    },
    [appliedFilters],
  );

  useEffect(() => {
    fetchTransactions(1, appliedFilters);
  }, [appliedFilters, fetchTransactions]);

  // ==================== HANDLERS ====================

  const handleApplyFilter = () => {
    // Validate date range
    if (
      filterDraft.date_from &&
      filterDraft.date_to &&
      filterDraft.date_to < filterDraft.date_from
    ) {
      setDateError("Tanggal akhir tidak boleh sebelum tanggal awal");
      return;
    }
    setDateError("");
    setPage(1);
    setExpandedRow(null);
    setAppliedFilters({ ...filterDraft });
  };

  const handleResetFilter = () => {
    setDateError("");
    setFilterDraft({
      date_from: "",
      date_to: "",
      transaction_code: "",
      payment_method: "",
    });
    setPage(1);
    setExpandedRow(null);
    setAppliedFilters({});
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    setExpandedRow(null);
    fetchTransactions(newPage, appliedFilters);
  };

  const handleRowClick = (code) => {
    setExpandedRow((prev) => (prev === code ? null : code));
  };

  // ==================== RENDER ====================

  return (
    <div className="space-y-4">
      {/* Filter Section */}
      <div className="p-4 bg-background border border-border rounded-lg">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label className="block text-xs mb-1">Dari</Label>
            <Input
              type="date"
              value={filterDraft.date_from}
              onChange={(e) =>
                setFilterDraft((d) => ({ ...d, date_from: e.target.value }))
              }
            />
          </div>
          <div>
            <Label className="block text-xs mb-1">Sampai</Label>
            <Input
              type="date"
              value={filterDraft.date_to}
              onChange={(e) =>
                setFilterDraft((d) => ({ ...d, date_to: e.target.value }))
              }
            />
          </div>
          <div>
            <Label className="block text-xs mb-1">Kode Transaksi</Label>
            <Input
              type="text"
              placeholder="TRX-..."
              value={filterDraft.transaction_code}
              onChange={(e) =>
                setFilterDraft((d) => ({
                  ...d,
                  transaction_code: e.target.value,
                }))
              }
            />
          </div>
          <div>
            <Label className="block text-xs mb-1">Metode Bayar</Label>
            <FormSelect
              options={PAYMENT_OPTIONS}
              value={filterDraft.payment_method || "__all__"}
              onValueChange={(val) =>
                setFilterDraft((d) => ({
                  ...d,
                  payment_method: val === "__all__" ? "" : val,
                }))
              }
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleApplyFilter}>
              Terapkan
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetFilter}>
              Reset
            </Button>
          </div>
        </div>
        {dateError && (
          <p className="text-destructive text-xs mt-2">{dateError}</p>
        )}
      </div>

      {/* Table */}
      <div className="bg-background border border-border/50 rounded-lg overflow-hidden">
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
                    <th className="text-left px-4 py-3 text-muted-foreground font-semibold text-xs sm:text-sm">
                      Tanggal
                    </th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-semibold text-xs sm:text-sm">
                      No. Transaksi
                    </th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-semibold text-xs sm:text-sm">
                      Pelanggan
                    </th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-semibold text-xs sm:text-sm">
                      Tipe
                    </th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-semibold text-xs sm:text-sm">
                      Total Bayar
                    </th>
                    <th className="text-center px-4 py-3 text-muted-foreground font-semibold text-xs sm:text-sm">
                      Metode Bayar
                    </th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-semibold text-xs sm:text-sm">
                      Poin
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((trx) => (
                    <Fragment key={trx.id}>
                      <tr
                        onClick={() => handleRowClick(trx.id)}
                        className="border-b border-border bg-card hover:bg-muted/30 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 text-foreground">
                          {formatDateTime(trx.transaction_date)}
                        </td>
                        <td className="px-4 py-3 text-foreground font-mono text-xs">
                          {trx.transaction_code}
                        </td>
                        <td className="px-4 py-3 text-foreground">
                          {trx.customer_name}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge
                            status={trx.is_guest ? "guest" : "member"}
                          />
                        </td>
                        <td className="px-4 py-3 text-right text-foreground">
                          {formatCurrency(trx.final_amount)}
                        </td>
                        <td className="px-4 py-3 text-center text-foreground">
                          {PAYMENT_LABELS[trx.payment_method ?? "null"] ??
                            trx.payment_method ??
                            "-"}
                        </td>
                        <td className="px-4 py-3 text-right text-emerald-600">
                          {trx.is_guest ? "-" : `+${trx.points_earned ?? 0}`}
                        </td>
                      </tr>

                      {/* Expanded Row */}
                      {expandedRow === trx.id && (
                        <tr>
                          <td colSpan={7} className="bg-muted/60 px-6 py-4">
                            {/* Bagian 1: Daftar Item */}
                            <table className="w-full text-sm mb-3">
                              <thead>
                                <tr className="border-b border-border">
                                  <th className="text-left py-1 text-muted-foreground font-semibold text-xs sm:text-sm">
                                    Item
                                  </th>
                                  <th className="text-left py-1 text-muted-foreground font-semibold text-xs sm:text-sm">
                                    Kategori
                                  </th>
                                  <th className="text-right py-1 text-muted-foreground font-semibold text-xs sm:text-sm">
                                    Qty
                                  </th>
                                  <th className="text-right py-1 text-muted-foreground font-semibold text-xs sm:text-sm">
                                    Harga Satuan
                                  </th>
                                  <th className="text-right py-1 text-muted-foreground font-semibold text-xs sm:text-sm">
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
                                    <td className="py-1.5 text-right text-foreground">
                                      {item.item_type === "fish"
                                        ? `${Number(item.quantity).toFixed(2)} kg`
                                        : `${Number(item.quantity)} pcs`}
                                    </td>
                                    <td className="py-1.5 text-right text-foreground">
                                      {formatCurrency(item.unit_price_snapshot)}
                                    </td>
                                    <td className="py-1.5 text-right text-foreground">
                                      {formatCurrency(item.subtotal)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>

                            {/* Bagian 2: Ringkasan Pembayaran */}
                            <div className="border-t border-border pt-2 space-y-1 text-sm">
                              <div className="flex justify-between text-muted-foreground">
                                <span>Subtotal</span>
                                <span>{formatCurrency(trx.total_amount)}</span>
                              </div>
                              {trx.discount_tier > 0 && (
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Diskon Tier</span>
                                  <span className="text-red-500">
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
                              {trx.is_guest && trx.deposit_used > 0 && (
                                <div className="flex justify-between text-emerald-600">
                                  <span>Deposit Tamu</span>
                                  <span>
                                    - {formatCurrency(trx.deposit_used)}
                                  </span>
                                </div>
                              )}
                              {trx.is_guest && trx.deposit_change > 0 && (
                                <div className="flex justify-between text-amber-600 font-medium">
                                  <span>Kembalian Deposit</span>
                                  <span>
                                    {formatCurrency(trx.deposit_change)}
                                  </span>
                                </div>
                              )}
                              {trx.tips > 0 && (
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Tips</span>
                                  <span>{formatCurrency(trx.tips)}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-muted-foreground text-xs pt-1">
                                <span>Diproses Oleh</span>
                                <span>{trx.processed_by_name || "-"}</span>
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
                  Halaman {meta.current_page} dari {meta.last_page} (
                  {meta.total} transaksi)
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
