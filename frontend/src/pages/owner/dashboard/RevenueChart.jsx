// File: src/pages/owner/dashboard/RevenueChart.jsx

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency, formatShortDay, formatNumber } from "@/utils/utils";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const revenue = payload.find((p) => p.dataKey === "net_revenue");
  const txn = payload.find((p) => p.dataKey === "total_transactions");
  const avg = txn?.value > 0 ? (revenue?.value || 0) / txn.value : 0;
  
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-sm shadow-lg">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {revenue && (
        <p className="text-emerald-500">
          Revenue: {formatCurrency(revenue.value)}
        </p>
      )}
      {txn && (
        <p className="text-blue-500">Transaksi: {formatNumber(txn.value)}</p>
      )}
      {txn?.value > 0 && (
        <p className="text-muted-foreground mt-1 text-xs">
          Avg/transaksi: {formatCurrency(avg)}
        </p>
      )}
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="animate-pulse">
      <div className="h-56 w-full rounded-lg bg-muted" />
    </div>
  );
}

export default function RevenueChart({ data, loading }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-foreground mb-4">
        Tren Revenue 7 Hari Terakhir
      </h2>
      {loading ? (
        <SkeletonChart />
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart
            data={data?.map((d) => ({ ...d, day: formatShortDay(d.date) }))}
            margin={{ top: 4, right: 16, bottom: 0, left: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              tickFormatter={(v) =>
                v === 0
                  ? "0"
                  : v >= 1_000_000
                    ? `${(v / 1_000_000).toFixed(1)}jt`
                    : `${(v / 1_000).toFixed(0)}rb`
              }
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "hsl(var(--muted)/0.4)" }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              formatter={(value) =>
                value === "net_revenue" ? "Net Revenue" : "Transaksi"
              }
            />
            <Bar
              yAxisId="left"
              dataKey="net_revenue"
              name="net_revenue"
              fill="var(--chart-1)"
              radius={[4, 4, 0, 0]}
              maxBarSize={48}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="total_transactions"
              name="total_transactions"
              stroke="var(--chart-2)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--chart-2)" }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
