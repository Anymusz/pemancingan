import { formatCurrency } from "@/utils/utils";
import {
  Receipt,
  TrendingUp,
  Tag,
  Ticket,
  CircleDollarSign,
  HandCoins,
  Users,
} from "lucide-react";

const KPI_CARDS = [
  {
    key: "total_transactions",
    label: "Total Transaksi",
    format: (v) => v ?? 0,
    icon: Receipt,
    colorClass: "text-blue-600",
    bgClass: "bg-blue-500/10",
  },
  {
    key: "total_gross_revenue",
    label: "Pendapatan Kotor",
    format: formatCurrency,
    icon: TrendingUp,
    colorClass: "text-emerald-600",
    bgClass: "bg-emerald-500/10",
  },
  {
    key: "total_discount_tier",
    label: "Diskon Tier",
    format: formatCurrency,
    icon: Tag,
    colorClass: "text-amber-600",
    bgClass: "bg-amber-500/10",
  },
  {
    key: "total_discount_voucher",
    label: "Diskon Voucher",
    format: formatCurrency,
    icon: Ticket,
    colorClass: "text-violet-600",
    bgClass: "bg-violet-500/10",
  },
  {
    key: "total_discount",
    label: "Total Diskon",
    format: formatCurrency,
    icon: Tag,
    colorClass: "text-orange-600",
    bgClass: "bg-orange-500/10",
  },
  {
    key: "net_revenue",
    label: "Pendapatan Bersih",
    format: formatCurrency,
    icon: CircleDollarSign,
    colorClass: "text-green-600",
    bgClass: "bg-green-500/10",
  },
  {
    key: "total_tips",
    label: "Total Tips",
    format: formatCurrency,
    icon: HandCoins,
    colorClass: "text-cyan-600",
    bgClass: "bg-cyan-500/10",
  },
  {
    key: "new_members",
    label: "Member Baru",
    format: (v) => v ?? 0,
    icon: Users,
    colorClass: "text-indigo-600",
    bgClass: "bg-indigo-500/10",
  },
];

const SummarySection = ({ data, loading }) => {
  if (loading) {
    return (
      <p className="text-muted-foreground text-sm py-4">Memuat ringkasan...</p>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-foreground mb-3">Ringkasan</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {KPI_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className="bg-card border border-border rounded-lg p-4 flex flex-col justify-between"
            >
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs text-muted-foreground font-medium">
                  {card.label}
                </p>
                <div
                  className={`w-9 h-9 min-w-[36px] flex items-center justify-center rounded-lg ${card.bgClass} ${card.colorClass}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xl font-bold text-foreground">
                {card.format(data?.[card.key])}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SummarySection;
