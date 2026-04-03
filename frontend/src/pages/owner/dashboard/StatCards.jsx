// File: src/pages/owner/dashboard/StatCards.jsx

import { formatCurrency, formatNumber } from "@/utils/utils";
import { TrendingUp, Receipt, Users, Tag } from "lucide-react";

const CARDS = [
  {
    key: "net_revenue",
    label: "Net Revenue",
    icon: TrendingUp,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    format: (v) => formatCurrency(v),
  },
  {
    key: "total_transactions",
    label: "Total Transaksi",
    icon: Receipt,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    format: (v) => formatNumber(v),
  },
  {
    key: "new_members",
    label: "Member Baru",
    icon: Users,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    format: (v) => formatNumber(v),
  },
  {
    key: "total_discount",
    label: "Total Diskon",
    icon: Tag,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    format: (v) => formatCurrency(v),
  },
];

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 rounded bg-muted" />
        <div className="h-9 w-9 rounded-lg bg-muted" />
      </div>
      <div className="h-7 w-36 rounded bg-muted" />
    </div>
  );
}

export default function StatCards({ data, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS.map((c) => (
          <SkeletonCard key={c.key} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {CARDS.map(({ key, label, icon: Icon, color, bg, format }) => {
        const value = data?.[key] ?? 0;
        return (
          <div
            key={key}
            className="rounded-xl border border-border bg-card p-5 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">
                {label}
              </span>
              <span
                className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${bg}`}
              >
                <Icon className={`w-4 h-4 ${color}`} />
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {format(value)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
