// File: src/pages/employee/checkout/MemberSection.jsx

import { ArrivalPicker } from "@/components/common/ArrivalPicker";

export function MemberSection({
  fetchLoading,
  selectedArrival,
  arrivals,
  onSelect,
  onClear,
}) {
  return (
    <section className="space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
          1
        </span>
        <span className="text-sm font-medium text-foreground">
          Pilih Member / Tamu
        </span>
        <span className="px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
          Kedatangan hari ini
        </span>
      </div>

      <ArrivalPicker
        arrivals={arrivals}
        selectedArrival={selectedArrival}
        onSelect={onSelect}
        onClear={onClear}
        fetchLoading={fetchLoading}
      />
    </section>
  );
}
