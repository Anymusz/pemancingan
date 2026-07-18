import { useState, useEffect, useCallback, useRef } from "react";
import ownerService from "../../services/ownerService";
import { formatCurrency, formatDateTime } from "@/utils/utils";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/common/Button";
import { Receipt, ShoppingBag } from "lucide-react";

// ==================== CONSTANTS ====================

const PAYMENT_LABELS = {
  cash: "Cash",
  transfer: "Transfer",
  qris: "QRIS",
};

const TABS = [
  { key: "transactions", label: "Log Transaksi", icon: Receipt },
  { key: "orders", label: "Pesanan Mandiri Member", icon: ShoppingBag },
];

// ==================== PAGINATION CONTROLS ====================

const PaginationBar = ({ meta, page, onPageChange }) => {
  if (!meta || meta.last_page <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <p className="text-sm text-muted-foreground">
        Halaman {meta.current_page} dari {meta.last_page} ({meta.total} data)
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
  );
};

// ==================== COMPONENT ====================

const ActivityLog = () => {
  const [activeTab, setActiveTab] = useState("transactions");

  // ── Transaction log state ──────────────────────────────────
  const [transactions, setTransactions] = useState([]);
  const [transactionMeta, setTransactionMeta] = useState(null);
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const transactionFetched = useRef(false);

  // ── Order log state ────────────────────────────────────────
  const [orders, setOrders] = useState([]);
  const [orderMeta, setOrderMeta] = useState(null);
  const [orderPage, setOrderPage] = useState(1);
  const [orderLoading, setOrderLoading] = useState(false);
  const orderFetched = useRef(false);

  const tableRef = useRef(null);

  // ==================== FETCH ====================

  const fetchTransactions = useCallback(async (page = 1) => {
    setTransactionLoading(true);
    try {
      const res = await ownerService.getActivityTransactions({
        page,
        per_page: 20,
      });
      if (res.success) {
        setTransactions(res.data || []);
        setTransactionMeta(res.meta || null);
      }
    } catch (err) {
      console.error("Gagal memuat log transaksi:", err);
    } finally {
      setTransactionLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async (page = 1) => {
    setOrderLoading(true);
    try {
      const res = await ownerService.getActivityOrders({ page, per_page: 20 });
      if (res.success) {
        setOrders(res.data || []);
        setOrderMeta(res.meta || null);
      }
    } catch (err) {
      console.error("Gagal memuat log pesanan:", err);
    } finally {
      setOrderLoading(false);
    }
  }, []);

  // Lazy fetch: load each tab's data only on first activation
  useEffect(() => {
    if (activeTab === "transactions" && !transactionFetched.current) {
      transactionFetched.current = true;
      fetchTransactions(1);
    }
    if (activeTab === "orders" && !orderFetched.current) {
      orderFetched.current = true;
      fetchOrders(1);
    }
  }, [activeTab, fetchTransactions, fetchOrders]);

  // ==================== HANDLERS ====================

  const handleTabChange = (key) => {
    setActiveTab(key);
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleTransactionPageChange = (newPage) => {
    setTransactionPage(newPage);
    fetchTransactions(newPage);
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleOrderPageChange = (newPage) => {
    setOrderPage(newPage);
    fetchOrders(newPage);
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ==================== RENDER ====================

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="flex gap-1">
          {TABS.map(({ key, label, icon: Icon }) => {
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className={[
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                ].join(" ")}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div
        ref={tableRef}
        className="bg-background border border-border/50 rounded-lg overflow-hidden"
      >
        {/* ── Tab: Log Transaksi ─────────────────────────────── */}
        {activeTab === "transactions" && (
          <>
            {transactionLoading ? (
              <p className="text-sm text-muted-foreground p-4">
                Memuat data transaksi...
              </p>
            ) : transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">
                Belum ada transaksi.
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/60 border-b border-border">
                        <th className="text-left px-4 py-3 text-muted-foreground font-semibold text-xs">
                          Waktu
                        </th>
                        <th className="text-left px-4 py-3 text-muted-foreground font-semibold text-xs">
                          Kode
                        </th>
                        <th className="text-left px-4 py-3 text-muted-foreground font-semibold text-xs">
                          Pelanggan
                        </th>
                        <th className="text-left px-4 py-3 text-muted-foreground font-semibold text-xs">
                          Tipe
                        </th>
                        <th className="text-left px-4 py-3 text-muted-foreground font-semibold text-xs">
                          Diproses Oleh
                        </th>
                        <th className="text-left px-4 py-3 text-muted-foreground font-semibold text-xs">
                          Metode
                        </th>
                        <th className="text-right px-4 py-3 text-muted-foreground font-semibold text-xs">
                          Total Bayar
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((trx) => (
                        <tr
                          key={trx.transaction_code}
                          className="border-b border-border bg-card hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3 text-foreground text-xs whitespace-nowrap">
                            {formatDateTime(trx.transaction_date)}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-foreground">
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
                          <td className="px-4 py-3 text-foreground">
                            {trx.processed_by_name}
                          </td>
                          <td className="px-4 py-3 text-foreground">
                            {PAYMENT_LABELS[trx.payment_method] ??
                              trx.payment_method ??
                              "-"}
                          </td>
                          <td className="px-4 py-3 text-right text-foreground font-medium">
                            {formatCurrency(trx.final_amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <PaginationBar
                  meta={transactionMeta}
                  page={transactionPage}
                  onPageChange={handleTransactionPageChange}
                />
              </>
            )}
          </>
        )}

        {/* ── Tab: Pesanan Mandiri Member ────────────────────── */}
        {activeTab === "orders" && (
          <>
            {orderLoading ? (
              <p className="text-sm text-muted-foreground p-4">
                Memuat data pesanan...
              </p>
            ) : orders.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">
                Belum ada pesanan mandiri dari member.
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/60 border-b border-border">
                        <th className="text-left px-4 py-3 text-muted-foreground font-semibold text-xs">
                          Waktu
                        </th>
                        <th className="text-left px-4 py-3 text-muted-foreground font-semibold text-xs">
                          Member
                        </th>
                        <th className="text-left px-4 py-3 text-muted-foreground font-semibold text-xs">
                          Item
                        </th>
                        <th className="text-right px-4 py-3 text-muted-foreground font-semibold text-xs">
                          Qty
                        </th>
                        <th className="text-right px-4 py-3 text-muted-foreground font-semibold text-xs">
                          Subtotal
                        </th>
                        <th className="text-left px-4 py-3 text-muted-foreground font-semibold text-xs">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-b border-border bg-card hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3 text-foreground text-xs whitespace-nowrap">
                            {formatDateTime(order.created_at)}
                          </td>
                          <td className="px-4 py-3 text-foreground">
                            {order.member_name}
                          </td>
                          <td className="px-4 py-3 text-foreground">
                            {order.item_name_snapshot}
                          </td>
                          <td className="px-4 py-3 text-right text-foreground">
                            {order.quantity}
                          </td>
                          <td className="px-4 py-3 text-right text-foreground font-medium">
                            {formatCurrency(order.subtotal)}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={order.production_status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <PaginationBar
                  meta={orderMeta}
                  page={orderPage}
                  onPageChange={handleOrderPageChange}
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
