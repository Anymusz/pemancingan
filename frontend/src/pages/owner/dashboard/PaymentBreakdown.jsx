// File: src/pages/owner/dashboard/PaymentBreakdown.jsx

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/utils/utils";

const PAYMENT_COLORS = {
  cash:     "var(--chart-1)",
  transfer: "var(--chart-2)",
  qris:     "var(--chart-3)",
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { payment_method, total_final_amount, total_transactions } = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-sm shadow-lg">
      <p className="font-semibold text-foreground uppercase mb-1">
        {payment_method}
      </p>
      <p className="text-muted-foreground">
        Revenue: {formatCurrency(total_final_amount)}
      </p>
      <p className="text-muted-foreground">
        Transaksi: {total_transactions}
      </p>
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="animate-pulse space-y-3">
      {["cash", "transfer", "qris"].map((k) => (
        <div key={k} className="h-8 w-full rounded bg-muted" />
      ))}
    </div>
  );
}

export default function PaymentBreakdown({ data, loading }) {
  const chartData = (data ?? []).map((d) => ({
    ...d,
    payment_method: d.payment_method?.toUpperCase(),
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-foreground mb-4">
        Metode Pembayaran
      </h2>
      {loading ? (
        <SkeletonChart />
      ) : chartData.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Belum ada data transaksi.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{ top: 4, right: 48, bottom: 0, left: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(v) =>
                v >= 1_000_000
                  ? `${(v / 1_000_000).toFixed(1)}jt`
                  : `${(v / 1_000).toFixed(0)}rb`
              }
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="payment_method"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Bar dataKey="total_final_amount" radius={[0, 4, 4, 0]} maxBarSize={28}>
              {chartData.map((entry) => (
                <Cell
                  key={entry.payment_method}
                  fill={
                    PAYMENT_COLORS[entry.payment_method?.toLowerCase()] ?? "var(--muted-foreground)"
                  }
                />
              ))}
              <LabelList
                dataKey="total_transactions"
                position="right"
                style={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                formatter={(v) => `${v}x`}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
