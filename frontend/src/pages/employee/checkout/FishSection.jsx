// File: src/pages/employee/checkout/v2/FishSection.jsx

import { formatCurrency } from "@/utils/utils";
import { DataTable } from "@/components/common/DataTable";
import { Input } from "@/components/common/FormInput";

/**
 * Props:
 *   fishTypes          — array of available fish types from the server
 *   fishItems          — current fish item list (state owned by Checkout.jsx)
 *   onWeightChange(fish, weightStr) — called on every input change
 */
export function FishSection({ fishTypes, fishItems, onWeightChange }) {
  const columns = [
    { key: "name", header: "Nama Ikan" },
    {
      key: "price_per_kg",
      header: "Harga/kg",
      render: (row) => formatCurrency(row.price_per_kg),
    },
    {
      key: "weight",
      header: "Berat (kg)",
      render: (row) => (
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          className="w-28"
          value={fishItems.find((i) => i.item_id === row.id)?.quantity ?? ""}
          onChange={(e) => onWeightChange(row, e.target.value)}
        />
      ),
    },
    {
      key: "subtotal",
      header: "Subtotal",
      render: (row) => {
        const item = fishItems.find((i) => i.item_id === row.id);
        return item ? (
          formatCurrency(item.subtotal)
        ) : (
          <span className="text-muted-foreground">Rp 0</span>
        );
      },
    },
  ];

  return (
    <section className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
          3
        </span>
        <span className="text-sm font-medium text-foreground">
          Tambah Item Ikan
        </span>
        <span className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
          Opsional
        </span>
      </div>

      {fishTypes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Memuat daftar ikan...</p>
      ) : (
        <DataTable
          columns={columns}
          data={fishTypes}
          rowClassName={(row) => {
            const hasWeight = fishItems.some((i) => i.item_id === row.id);
            return hasWeight ? "bg-primary/5 border-l-2 border-l-primary" : "";
          }}
        />
      )}
    </section>
  );
}
