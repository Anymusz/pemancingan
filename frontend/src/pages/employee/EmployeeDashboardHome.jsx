import { useState, useEffect } from "react";
import employeeService from "@/services/employeeService";
import { UserCheck, ClipboardList, Receipt, ShoppingCart } from "lucide-react";
import FishStockStatus from "@/components/common/FishStockStatus";
import { formatDateTime } from "@/utils/utils";
import { Button } from "@/components/common/Button";

export default function EmployeeDashboardHome({ onGoToCheckout, onNavigate }) {
  const [arrivals, setArrivals] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [fishStocks, setFishStocks] = useState([]);
  const [todayTxCount, setTodayTxCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const todayStr = new Date().toISOString().split("T")[0];

        const [arrRes, pendingRes, fishRes, txRes] = await Promise.all([
          employeeService.getTodayArrivals(),
          employeeService.getAllPendingOrders(),
          employeeService.getFishStocks(),
          employeeService.getTransactions({
            date_from: todayStr,
            date_to: todayStr,
            per_page: 1,
          }),
        ]);

        if (arrRes.success) setArrivals(arrRes.data?.arrivals ?? []);
        if (pendingRes.success) setPendingOrders(pendingRes.data?.orders ?? []);
        if (fishRes.success) {
          setFishStocks(
            (fishRes.data?.fish_stocks ?? []).map((item) => ({
              id: item.id,
              name: item.name,
              is_active: true,
              stock: {
                current_stock_kg: item.current_stock_kg,
                alert_threshold_kg: item.alert_threshold_kg,
                is_below_threshold: item.is_below_threshold,
              },
            })),
          );
        }
        if (txRes.success) setTodayTxCount(txRes.meta?.total ?? 0);
      } catch (err) {
        console.error("Gagal memuat dashboard employee", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeArrivals = arrivals.filter((a) => a.status === "active");
  const pendingItems = pendingOrders.filter(
    (o) => o.production_status === "pending",
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      </div>

      {/* Row 1: Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Kedatangan Aktif */}
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-2">
          {loading ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 bg-muted rounded animate-pulse" />
                <div className="h-9 w-9 bg-muted rounded-lg animate-pulse" />
              </div>
              <div className="h-7 w-36 bg-muted rounded animate-pulse" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-md text-muted-foreground font-medium">
                  Kedatangan Aktif
                </span>
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/10">
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {activeArrivals.length}
              </p>
            </>
          )}
        </div>

        {/* Card 2: Pending Orders */}
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-2">
          {loading ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 bg-muted rounded animate-pulse" />
                <div className="h-9 w-9 bg-muted rounded-lg animate-pulse" />
              </div>
              <div className="h-7 w-36 bg-muted rounded animate-pulse" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-md text-muted-foreground font-medium">
                  Pending Orders
                </span>
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-amber-500/10">
                  <ClipboardList className="w-4 h-4 text-amber-500" />
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {pendingItems.length}
              </p>
            </>
          )}
        </div>

        {/* Card 3: Transaksi Hari Ini */}
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-2">
          {loading ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 bg-muted rounded animate-pulse" />
                <div className="h-9 w-9 bg-muted rounded-lg animate-pulse" />
              </div>
              <div className="h-7 w-36 bg-muted rounded animate-pulse" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground font-medium">
                  Transaksi Hari Ini
                </span>
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-blue-500/10">
                  <Receipt className="w-4 h-4 text-blue-500" />
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {todayTxCount}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Row 2: List kedatangan & order */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Kedatangan Aktif */}
        <div className="rounded-xl border border-border bg-card flex flex-col">
          <div className="p-5 flex flex-col flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">
                Kedatangan Aktif
              </h2>
              {!loading && activeArrivals.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600">
                  {activeArrivals.length}
                </span>
              )}
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-12 bg-muted/40 rounded animate-pulse"
                  />
                ))}
              </div>
            ) : activeArrivals.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-8">
                <p className="text-muted-foreground text-sm text-center">
                  Tidak ada kedatangan aktif
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeArrivals.slice(0, 5).map((arrival) => (
                  <div
                    key={arrival.arrival_id}
                    className="flex justify-between items-center p-3 rounded-lg border border-border bg-muted/10"
                  >
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {arrival.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDateTime(arrival.check_in_at)}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      className="shrink-0"
                      onClick={() => onGoToCheckout(arrival.arrival_id)}
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {activeArrivals.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    ...dan {activeArrivals.length - 5} lainnya
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Pending Orders */}
        <div className="rounded-xl border border-border bg-card flex flex-col">
          <div className="p-5 flex flex-col flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">
                Pending Orders
              </h2>
              {!loading && pendingItems.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600">
                  {pendingItems.length}
                </span>
              )}
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-12 bg-muted/40 rounded animate-pulse"
                  />
                ))}
              </div>
            ) : pendingItems.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-8">
                <p className="text-muted-foreground text-sm text-center">
                  Tidak ada pending order
                </p>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="space-y-3 flex-1 mb-4">
                  {pendingItems.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="flex justify-between items-center p-3 rounded-lg border border-border bg-muted/10"
                    >
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {order.item_name_snapshot}
                          <span className="text-muted-foreground ml-1">
                            x{order.quantity}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {order.member_name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {pendingItems.length > 0 && (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => onNavigate("pendingorder")}
                  >
                    Lihat Semua
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Fish Stocks */}
      <div className="w-full">
        <FishStockStatus
          data={fishStocks}
          loading={loading}
          onNavigate={() => onNavigate("menuavailability")}
          navigateLabel="Ketersediaan Menu"
        />
      </div>
    </div>
  );
}
