// File: src/pages/owner/dashboard/CategoryBreakdown.jsx

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/utils/utils";

const ITEM_TYPE_META = {
  fish:    { label: "Ikan",    color: "var(--chart-1)" },
  menu:    { label: "Menu",    color: "var(--chart-2)" },
  rental:  { label: "Rental",  color: "var(--chart-3)" },
  penalty: { label: "Penalti", color: "var(--chart-4)" },
};
const ORDER = ["fish", "menu", "rental", "penalty"];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  const meta = ITEM_TYPE_META[name];
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-sm shadow-lg">
      <p className="font-semibold text-foreground">{meta?.label ?? name}</p>
      <p className="text-muted-foreground">{formatCurrency(value)}</p>
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="animate-pulse flex flex-col items-center gap-3">
      <div className="w-36 h-36 rounded-full bg-muted" />
      <div className="flex gap-2">
        {ORDER.map((k) => (
          <div key={k} className="h-4 w-14 rounded bg-muted" />
        ))}
      </div>
    </div>
  );
}

export default function CategoryBreakdown({ data, loading }) {
  const chartData = ORDER
    .map((type) => {
      const entry = data?.find((d) => d.item_type === type);
      return entry ? { name: type, value: entry.total_subtotal } : null;
    })
    .filter(Boolean);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-foreground mb-4">
        Breakdown Kategori
      </h2>
      {loading ? (
        <SkeletonChart />
      ) : chartData.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Belum ada data transaksi.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              dataKey="value"
              nameKey="name"
              paddingAngle={3}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={ITEM_TYPE_META[entry.name]?.color ?? "var(--muted-foreground)"}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => ITEM_TYPE_META[value]?.label ?? value}
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
