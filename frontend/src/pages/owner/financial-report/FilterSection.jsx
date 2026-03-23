import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/FormInput";

const PERIOD_OPTIONS = [
  { value: "daily", label: "Harian" },
  { value: "weekly", label: "Mingguan" },
  { value: "monthly", label: "Bulanan" },
  { value: "custom", label: "Custom" },
];

const FilterSection = ({ filters, onFilterChange }) => {
  const handlePeriodChange = (period) => {
    onFilterChange({ period, start_date: "", end_date: "" });
  };

  return (
    <div className="mb-6 p-4 bg-background border border-border rounded-lg">
      <h3 className="text-sm font-semibold text-foreground mb-3">
        Filter Periode
      </h3>

      <div className="flex flex-wrap items-end gap-3">
        {/* Period Buttons */}
        <div className="flex flex-wrap gap-2">
          {PERIOD_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              size="sm"
              onClick={() => handlePeriodChange(opt.value)}
              variant={filters.period === opt.value ? "default" : "outline"}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        {/* Custom Date Inputs */}
        {filters.period === "custom" && (
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              value={filters.start_date}
              onChange={(e) =>
                onFilterChange({ ...filters, start_date: e.target.value })
              }
              className="w-auto"
            />
            <span className="text-muted-foreground text-sm">s/d</span>
            <Input
              type="date"
              value={filters.end_date}
              onChange={(e) =>
                onFilterChange({ ...filters, end_date: e.target.value })
              }
              className="w-auto"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterSection;
