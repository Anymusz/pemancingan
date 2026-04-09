// File: src/components/common/ArrivalPicker.jsx

import { useCallback } from "react";
import { UserCircle, RefreshCw } from "lucide-react";
import { formatDateTime, formatCurrency } from "@/utils/utils";
import { SearchModal } from "@/components/common/SearchModal";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/common/Button";

/**
 * ArrivalPicker — reusable arrival selector that supports both members and guests.
 *
 * Props:
 *   arrivals: array          — today's arrivals, already fetched by parent
 *   selectedArrival: object | null
 *   onSelect(arrival): void
 *   onClear(): void
 *   fetchLoading: boolean
 */
export function ArrivalPicker({
  arrivals,
  selectedArrival,
  onSelect,
  onClear,
  fetchLoading,
}) {
  const handleSearch = useCallback(
    async (q) => {
      if (!q.trim()) return arrivals;
      const lower = q.toLowerCase();
      return arrivals.filter(
        (a) =>
          a.name?.toLowerCase().includes(lower) ||
          a.member_code?.toLowerCase()?.includes(lower) ||
          a.phone?.includes(lower),
      );
    },
    [arrivals],
  );

  // ── Loading state ──────────────────────────────────────────────
  if (fetchLoading) {
    return (
      <p className="text-sm text-muted-foreground">
        Memuat data kedatangan...
      </p>
    );
  }

  // ── Filled state ───────────────────────────────────────────────
  if (selectedArrival) {
    const isGuest = selectedArrival.is_guest;

    return (
      <div
        className={`rounded-lg border border-border bg-muted/30 p-4 border-l-4 ${
          isGuest ? "border-l-amber-500" : "border-l-primary"
        }`}
      >
        <div className="flex-1 space-y-1.5">
          {/* Top row: name + clear button */}
          <div className="flex items-center justify-between">
            {isGuest ? (
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">{selectedArrival.name}</p>
                <StatusBadge status="guest" />
              </div>
            ) : (
              <p className="font-semibold text-sm">{selectedArrival.name}</p>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={onClear}
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Detail rows */}
          <div className="space-y-1">
            {isGuest ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Deposit</span>
                  <span className="text-sm font-medium text-foreground">
                    {formatCurrency(selectedArrival.deposit_amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Check-in</span>
                  <span className="text-sm font-medium text-foreground">
                    {formatDateTime(selectedArrival.check_in_at)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Member ID
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {selectedArrival.member_code}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tier</span>
                  <StatusBadge status={selectedArrival.tier?.toLowerCase()} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Poin</span>
                  <span className="text-sm font-medium text-foreground">
                    {selectedArrival.total_points}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Diskon Ikan
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {selectedArrival.discount_percentage ?? 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Check-in</span>
                  <span className="text-sm font-medium text-foreground">
                    {formatDateTime(selectedArrival.check_in_at)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Empty state — picker trigger ───────────────────────────────
  return (
    <SearchModal
      triggerContent={
        <button className="w-full rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-colors p-6 flex flex-col items-center gap-2 text-muted-foreground">
          <UserCircle className="w-8 h-8" />
          <span className="text-sm font-medium">
            Pilih member atau tamu yang hadir hari ini
          </span>
          <span className="text-xs">Klik untuk mencari</span>
        </button>
      }
      title="Pilih Kedatangan Hari Ini"
      placeholder="Cari nama / member ID / HP..."
      emptyMessage="Tidak ada kedatangan aktif hari ini"
      onSearch={handleSearch}
      onSelect={onSelect}
      getItemKey={(item) => item.arrival_id}
      renderItem={(item) =>
        item.is_guest ? (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="font-medium">{item.name}</span>
              <StatusBadge status="guest" />
            </div>
            <span className="text-xs text-muted-foreground">
              Deposit: {formatCurrency(item.deposit_amount)}
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="font-medium">{item.name}</span>
              <StatusBadge status={item.tier?.toLowerCase()} />
            </div>
            <span className="text-xs text-muted-foreground">
              {item.member_code} · {item.total_points} poin
            </span>
          </div>
        )
      }
    />
  );
}
