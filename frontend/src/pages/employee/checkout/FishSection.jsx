// File: src/pages/employee/checkout/FishSection.jsx

import { useState } from "react";
import { formatCurrency } from "@/utils/utils";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/FormInput";

// ==================== COLUMNS ====================

const buildAvailableColumns = (weights, setWeights) => [
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
        min="0.01"
        step="0.01"
        value={weights[row.id] || ""}
        onChange={(e) =>
          setWeights((prev) => ({ ...prev, [row.id]: e.target.value }))
        }
        placeholder="0.00"
        className="w-28"
      />
    ),
  },
  {
    key: "subtotal",
    header: "Subtotal",
    render: (row) => {
      const w = parseFloat(weights[row.id]);
      return w > 0 ? formatCurrency(w * parseFloat(row.price_per_kg)) : "-";
    },
  },
];

const fishItemColumns = [
  { key: "name", header: "Nama Ikan" },
  {
    key: "quantity",
    header: "Berat (kg)",
    render: (row) => Number(row.quantity).toFixed(2),
  },
  {
    key: "unit_price_snapshot",
    header: "Harga/kg",
    render: (row) => formatCurrency(row.unit_price_snapshot),
  },
  {
    key: "subtotal",
    header: "Subtotal",
    render: (row) => formatCurrency(row.subtotal),
  },
];

// ==================== COMPONENT ====================

/**
 * Props:
 *   fishTypes    — array of available fish types from the server
 *   fishItems    — current fish item list (state owned by Checkout.jsx)
 *   onAdd({ fish, quantity }) — called once per fish type to add/merge
 *   onRemove(itemId)          — removes a fish item by item_id
 */
export function FishSection({ fishTypes, fishItems, onAdd, onRemove }) {
  const [weights, setWeights] = useState({}); // { fish_id: weight_string }

  const hasAnyWeight = fishTypes.some((f) => parseFloat(weights[f.id]) > 0);

  const handleAddAll = () => {
    fishTypes
      .filter((f) => parseFloat(weights[f.id]) > 0)
      .forEach((fish) => {
        onAdd({ fish, quantity: parseFloat(weights[fish.id]) });
      });
    setWeights({});
  };

  const availableColumns = buildAvailableColumns(weights, setWeights);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">3. Tambah Item Ikan (Opsional)</h2>

      {fishTypes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Memuat daftar ikan...
        </p>
      ) : (
        <>
          <DataTable columns={availableColumns} data={fishTypes} />

          {hasAnyWeight && (
            <Button variant="outline" onClick={handleAddAll}>
              Tambah Semua
            </Button>
          )}
        </>
      )}

      {fishItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Ikan Dipilih
          </p>
          <DataTable
            columns={fishItemColumns}
            data={fishItems}
            getRowActions={(row) => [
              {
                label: "Hapus",
                variant: "danger",
                onClick: () => onRemove(row.item_id),
              },
            ]}
          />
        </div>
      )}
    </section>
  );
}
