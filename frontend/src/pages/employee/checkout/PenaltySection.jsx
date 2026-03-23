// File: src/pages/employee/checkout/PenaltySection.jsx

import { formatCurrency } from "@/utils/utils";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/common/Button";

const PENALTY_TYPES = [
  { label: "Kail Rusak", price: 2000 },
  { label: "Pelampung Rusak", price: 5000 },
  { label: "Kerusakan Total", price: 200000 },
];

const penaltyColumns = [
  { key: "name", header: "Jenis Denda" },
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

/**
 * Props:
 *   penaltyItems       — current penalty item list (state owned by Checkout.jsx)
 *   onAdd(penaltyType) — called with a PENALTY_TYPES entry
 *   onRemove(name)     — removes a penalty item by name
 */
export function PenaltySection({ penaltyItems, onAdd, onRemove }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">
        4. Denda Kerusakan Alat (Opsional)
      </h2>

      <div className="flex flex-wrap gap-2">
        {PENALTY_TYPES.map((p) => (
          <Button
            key={p.label}
            variant="outline"
            size="sm"
            onClick={() => onAdd(p)}
          >
            + {p.label} ({formatCurrency(p.price)})
          </Button>
        ))}
      </div>

      {penaltyItems.length > 0 && (
        <DataTable
          columns={penaltyColumns}
          data={penaltyItems}
          getRowActions={(row) => [
            {
              label: "Hapus",
              variant: "danger",
              onClick: () => onRemove(row.name),
            },
          ]}
        />
      )}
    </section>
  );
}
