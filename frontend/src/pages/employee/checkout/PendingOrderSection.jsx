// File: src/pages/employee/checkout/v2/PendingOrderSection.jsx

import { formatCurrency } from "@/utils/utils";
import { DataTable } from "@/components/common/DataTable";

const pendingOrderColumns = [
  { key: "name", header: "Item" },
  {
    key: "item_type",
    header: "Tipe",
    render: (row) => {
      const config =
        row.item_type === "menu"
          ? "bg-blue-500/10 text-blue-600"
          : "bg-orange-500/10 text-orange-600";
      return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config}`}>
          {row.item_type}
        </span>
      );
    },
  },
  { key: "quantity", header: "Qty" },
  {
    key: "unit_price",
    header: "Harga Satuan",
    render: (row) => formatCurrency(row.unit_price),
  },
  {
    key: "subtotal",
    header: "Subtotal",
    render: (row) => formatCurrency(row.subtotal),
  },
];

export function PendingOrderSection({
  pendingLoading,
  selectedArrival,
  pendingOrders,
}) {
  return (
    <section className="space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
          2
        </span>
        <span className="text-sm font-medium text-foreground">
          Pending Orders
        </span>
      </div>

      {pendingLoading ? (
        <p className="text-sm text-muted-foreground">
          Memuat pending orders...
        </p>
      ) : !selectedArrival ? (
        <p className="text-sm text-muted-foreground">
          Pilih member terlebih dahulu
        </p>
      ) : pendingOrders.length === 0 ? (
        <p className="text-sm text-muted-foreground">Tidak ada pending order</p>
      ) : (
        <DataTable columns={pendingOrderColumns} data={pendingOrders} />
      )}
    </section>
  );
}
