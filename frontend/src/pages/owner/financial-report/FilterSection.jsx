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
    <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Filter Periode
      </h3>

      <div className="flex flex-wrap items-end gap-3">
        {/* Period Buttons */}
        <div className="flex gap-2">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handlePeriodChange(opt.value)}
              className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                filters.period === opt.value
                  ? "bg-sky-500 text-white border-sky-500"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Custom Date Inputs */}
        {filters.period === "custom" && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) =>
                onFilterChange({ ...filters, start_date: e.target.value })
              }
              className="px-3 py-2 text-sm border border-gray-300 rounded-md"
            />
            <span className="text-gray-500 text-sm">s/d</span>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) =>
                onFilterChange({ ...filters, end_date: e.target.value })
              }
              className="px-3 py-2 text-sm border border-gray-300 rounded-md"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterSection;
