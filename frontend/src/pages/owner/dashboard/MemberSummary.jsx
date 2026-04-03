// File: src/pages/owner/dashboard/MemberSummary.jsx

import { Button } from "@/components/common/Button";
import { formatNumber } from "@/utils/utils";

const STAT_ITEMS = [
  { key: "active", label: "Aktif", colorClass: "text-emerald-500" },
  { key: "pending", label: "Pending", colorClass: "text-amber-500" },
  { key: "rejected", label: "Ditolak", colorClass: "text-rose-500" },
  {
    key: "deactivated",
    label: "Dinonaktifkan",
    colorClass: "text-muted-foreground",
  },
];

function SkeletonItem() {
  return (
    <div className="animate-pulse flex flex-col items-center gap-1">
      <div className="h-6 w-10 rounded bg-muted" />
      <div className="h-3 w-16 rounded bg-muted" />
    </div>
  );
}

export default function MemberSummary({ data, loading, onNavigate }) {
  const pending = data?.pending ?? 0;

  return (
    <div className="h-full rounded-xl border border-border bg-card p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">
          Ringkasan Member
        </h2>
        {!loading && pending > 0 && (
          <Button
            onClick={() => onNavigate?.("members")}
            className="h-7 px-3 text-xs"
          >
            Lihat Approval ({pending})
          </Button>
        )}
      </div>
      {loading ? (
        <div className="grid grid-cols-4 gap-3">
          {STAT_ITEMS.map((s) => (
            <SkeletonItem key={s.key} />
          ))}
        </div>
      ) : (
        <div className="flex-1 items-center justify-between grid grid-cols-4 gap-3">
          {STAT_ITEMS.map(({ key, label, colorClass }) => (
            <div key={key} className="flex flex-col items-center gap-0.5">
              <span className={`text-2xl font-bold ${colorClass}`}>
                {formatNumber(data?.[key] ?? 0)}
              </span>
              <span className="text-xs text-muted-foreground text-center">
                {label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
