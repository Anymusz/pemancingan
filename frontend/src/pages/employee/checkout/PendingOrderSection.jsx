// File: src/pages/employee/checkout/PendingOrderSection.jsx

import { useState } from "react";
import { formatCurrency } from "@/utils/utils";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import ConfirmDialog from "@/components/common/ConfirmDialog";

const pendingOrderColumns = [
  { key: "name", header: "Item" },
  {
    key: "item_type",
    header: "Tipe",
    render: (row) => <StatusBadge status={row.item_type} />,
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
  onCancelOrder,
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);

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
          Pilih kedatangan terlebih dahulu
        </p>
      ) : pendingOrders.length === 0 ? (
        <p className="text-sm text-muted-foreground">Tidak ada pending order</p>
      ) : (
        <DataTable
          columns={pendingOrderColumns}
          data={pendingOrders}
          getRowActions={(row) => [
            {
              label: "Batalkan",
              variant: "danger",
              onClick: () => {
                setOrderToCancel(row);
                setConfirmOpen(true);
              },
            },
          ]}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setOrderToCancel(null);
        }}
        onConfirm={() => {
          onCancelOrder(orderToCancel.id);
          setConfirmOpen(false);
          setOrderToCancel(null);
        }}
        variant="destructive"
        title="Batalkan Pesanan"
        description="Item ini akan dibatalkan dan tidak ikut dalam perhitungan checkout."
        confirmLabel="Ya, Batalkan"
      />
    </section>
  );
}
