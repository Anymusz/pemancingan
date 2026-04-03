// File: src/pages/employee/checkout/v2/PenaltySection.jsx

import { Minus, Plus } from "lucide-react";
import { formatCurrency } from "@/utils/utils";

const PENALTY_TYPES = [
  { label: "Kail Rusak", price: 2000 },
  { label: "Pelampung Rusak", price: 5000 },
  { label: "Kerusakan Total", price: 200000 },
];

/**
 * Props:
 *   penaltyItems       — current penalty item list (state owned by Checkout.jsx)
 *   onAdd(penaltyType) — called with a PENALTY_TYPES entry to increment
 *   onRemove(name)     — called with label name to decrement (or remove if qty reaches 0)
 */
export function PenaltySection({ penaltyItems, onAdd, onRemove }) {
  return (
    <section className="space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
          4
        </span>
        <span className="text-sm font-medium text-foreground">
          Denda Kerusakan
        </span>
        <span className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
          Opsional
        </span>
      </div>

      <div className="rounded-lg border border-border divide-y divide-border">
        {PENALTY_TYPES.map((type) => {
          const current = penaltyItems.find((p) => p.name === type.label);
          const qty = current?.quantity ?? 0;
          const isActive = qty > 0;

          return (
            <div
              key={type.label}
              className={`flex items-center justify-between px-4 py-3 transition-colors ${
                isActive ? "border-l-2 border-l-primary bg-primary/5" : ""
              }`}
            >
              <div
                className={
                  isActive ? "text-foreground" : "text-muted-foreground"
                }
              >
                <p className="text-sm font-medium">{type.label}</p>
                <p className="text-xs">{formatCurrency(type.price)}/item</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
                  onClick={() => onRemove(type.label)}
                  disabled={qty === 0}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span
                  className={`w-6 text-center text-sm font-medium ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {qty}
                </span>
                <button
                  className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  onClick={() => onAdd(type)}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
