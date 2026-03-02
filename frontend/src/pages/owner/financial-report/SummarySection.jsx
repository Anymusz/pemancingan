const formatCurrency = (val) =>
  `Rp ${Number(val || 0).toLocaleString("id-ID")}`;

const KPI_CARDS = [
  {
    key: "total_transactions",
    label: "Total Transaksi",
    format: (v) => v ?? 0,
  },
  {
    key: "total_gross_revenue",
    label: "Pendapatan Kotor",
    format: formatCurrency,
  },
  { key: "total_discount_tier", label: "Diskon Tier", format: formatCurrency },
  {
    key: "total_discount_voucher",
    label: "Diskon Voucher",
    format: formatCurrency,
  },
  { key: "total_discount", label: "Total Diskon", format: formatCurrency },
  { key: "net_revenue", label: "Pendapatan Bersih", format: formatCurrency },
  { key: "total_tips", label: "Total Tips", format: formatCurrency },
  { key: "new_members", label: "Member Baru", format: (v) => v ?? 0 },
];

const SummarySection = ({ data, loading }) => {
  if (loading) {
    return <p className="text-gray-500 text-sm py-4">Memuat ringkasan...</p>;
  }

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Ringkasan</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {KPI_CARDS.map((card) => (
          <div
            key={card.key}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            <p className="text-lg font-bold text-gray-800">
              {card.format(data?.[card.key])}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SummarySection;
