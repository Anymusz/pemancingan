// File: src/pages/employee/checkout/PendingOrderSection.jsx

import { formatCurrency } from "@/utils/utils";
import { DataTable } from "@/components/common/DataTable";

const pendingOrderColumns = [
  { key: "name", header: "Item" },
  { key: "item_type", header: "Tipe" },
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
      <h2 className="text-lg font-semibold">
        2. Pending Orders (Makanan / Sewa Alat)
      </h2>
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
