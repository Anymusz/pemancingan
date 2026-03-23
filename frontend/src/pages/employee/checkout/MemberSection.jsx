// File: src/pages/employee/checkout/MemberSection.jsx

import { useCallback } from "react";
import { formatDateTime } from "@/utils/utils";
import { Button } from "@/components/common/Button";
import { SearchModal } from "@/components/common/SearchModal";

export function MemberSection({
  fetchLoading,
  selectedArrival,
  arrivals,
  onSelect,
  onClear,
}) {
  const handleSearchArrival = useCallback(
    async (query) => {
      if (!query.trim()) return arrivals;
      const q = query.toLowerCase();
      return arrivals.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.member_code.toLowerCase().includes(q) ||
          (a.phone && a.phone.includes(q)),
      );
    },
    [arrivals],
  );

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">
        1. Pilih Member (Kedatangan Hari Ini)
      </h2>

      {fetchLoading ? (
        <p className="text-sm text-muted-foreground">
          Memuat data kedatangan...
        </p>
      ) : (
        <SearchModal
          triggerLabel="Pilih Member"
          placeholder="Cari nama / member ID / HP..."
          title="Pilih Member (Kedatangan Hari Ini)"
          emptyMessage="Tidak ada member yang check-in aktif hari ini"
          onSearch={handleSearchArrival}
          onSelect={onSelect}
          getItemKey={(item) => item.arrival_id}
          disabled={!!selectedArrival}
          renderItem={(item) => (
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">{item.name}</span>
              <span className="text-xs text-muted-foreground">
                {item.member_code} · {item.tier} · {item.total_points} poin
              </span>
              <span className="text-xs text-muted-foreground">
                Check-in: {formatDateTime(item.check_in_at)}
              </span>
            </div>
          )}
        />
      )}

      {selectedArrival && (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5 text-sm">
              <p className="font-semibold">{selectedArrival.name}</p>
              <p className="text-muted-foreground">
                {selectedArrival.member_code} · Tier:{" "}
                <span className="font-medium text-foreground">
                  {selectedArrival.tier}
                </span>
              </p>
              <p className="text-muted-foreground">
                Poin:{" "}
                <span className="font-medium text-foreground">
                  {selectedArrival.total_points}
                </span>{" "}
                · Diskon ikan:{" "}
                <span className="font-medium text-foreground">
                  {selectedArrival.discount_percentage ?? 0}%
                </span>
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onClear}>
              Ganti Member
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
