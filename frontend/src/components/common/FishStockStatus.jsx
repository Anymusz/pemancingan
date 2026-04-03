// File: src/pages/owner/dashboard/FishStockStatus.jsx
import { formatNumber } from "@/utils/utils";
import { Button } from "@/components/common/Button";

function SkeletonRow() {
  return (
    <div className="animate-pulse flex items-center gap-3 py-2">
      <div className="flex-1 h-4 rounded bg-muted" />
      <div className="h-4 w-16 rounded bg-muted" />
    </div>
  );
}

export default function FishStockStatus({ data, loading, onNavigate, navigateLabel = "Kelola Stok Ikan →" }) {
  // data: array from getFishStocks response → each item has fish_type + stock object
  const activeFish = (data ?? []).filter((item) => item.is_active !== false);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">
          Status Stok Ikan
        </h2>
        {!loading && (
          <Button
            onClick={() => onNavigate?.("fish-types")}
            className="h-7 px-3 text-xs"
          >
            {navigateLabel}
          </Button>
        )}
      </div>
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      ) : activeFish.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Belum ada jenis ikan aktif.
        </p>
      ) : (
        <ul className="space-y-3">
          {activeFish.map((item) => {
            const stock = item.stock ?? null;
            const currentKg = stock
              ? parseFloat(stock.current_stock_kg ?? 0)
              : null;
            const thresholdKg = stock
              ? parseFloat(stock.alert_threshold_kg ?? 0)
              : 0;
            const isBelowThreshold =
              stock?.is_below_threshold === true && thresholdKg > 0;

            // Compute bar fill: max visual cap = 2× threshold or 100 if no threshold
            const maxVisual = thresholdKg > 0 ? thresholdKg * 2 : 100;
            const barPercent =
              currentKg !== null
                ? Math.min(100, (currentKg / maxVisual) * 100)
                : 0;

            return (
              <li key={item.id}>
                <div className="flex items-center justify-between mb-0.5">
                  <span
                    className={`text-sm font-medium ${
                      isBelowThreshold ? "text-rose-500" : "text-foreground"
                    }`}
                  >
                    {item.name}
                    {isBelowThreshold && (
                      <span className="ml-1.5 text-xs font-normal">
                        (stok menipis)
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {currentKg !== null ? `${formatNumber(currentKg)} kg` : "-"}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isBelowThreshold ? "bg-rose-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${barPercent}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
