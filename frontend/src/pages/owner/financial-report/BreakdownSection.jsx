const formatCurrency = (val) =>
  `Rp ${Number(val || 0).toLocaleString("id-ID")}`;

const CATEGORY_LABELS = {
  fish: "Ikan",
  menu: "Makanan & Minuman",
  rental: "Sewa Alat",
  penalty: "Denda",
};

const PAYMENT_LABELS = {
  cash: "Cash",
  transfer: "Transfer",
  qris: "QRIS",
};

const BreakdownSection = ({ data, loading }) => {
  if (loading) {
    return <p className="text-gray-500 text-sm py-4">Memuat breakdown...</p>;
  }

  const byCategory = data?.by_category || [];
  const byPayment = data?.by_payment_method || [];

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Breakdown</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Breakdown per Kategori */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-600 mb-3">
            Per Kategori
          </h4>
          {byCategory.length === 0 ? (
            <p className="text-gray-400 text-sm">Tidak ada data.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-500 font-medium">
                    Kategori
                  </th>
                  <th className="text-right py-2 text-gray-500 font-medium">
                    Total
                  </th>
                  <th className="text-right py-2 text-gray-500 font-medium">
                    Berat (kg)
                  </th>
                </tr>
              </thead>
              <tbody>
                {byCategory.map((item) => (
                  <tr key={item.item_type} className="border-b border-gray-100">
                    <td className="py-2 text-gray-700">
                      {CATEGORY_LABELS[item.item_type] || item.item_type}
                    </td>
                    <td className="py-2 text-right text-gray-700">
                      {formatCurrency(item.total_subtotal)}
                    </td>
                    <td className="py-2 text-right text-gray-700">
                      {item.item_type === "fish"
                        ? `${Number(item.total_weight_kg || 0).toFixed(2)} kg`
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Breakdown per Metode Pembayaran */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-600 mb-3">
            Per Metode Pembayaran
          </h4>
          {byPayment.length === 0 ? (
            <p className="text-gray-400 text-sm">Tidak ada data.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 text-gray-500 font-medium">
                    Metode
                  </th>
                  <th className="text-right py-2 text-gray-500 font-medium">
                    Jumlah Trx
                  </th>
                  <th className="text-right py-2 text-gray-500 font-medium">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {byPayment.map((item) => (
                  <tr
                    key={item.payment_method}
                    className="border-b border-gray-100"
                  >
                    <td className="py-2 text-gray-700">
                      {PAYMENT_LABELS[item.payment_method] ||
                        item.payment_method}
                    </td>
                    <td className="py-2 text-right text-gray-700">
                      {item.total_transactions}
                    </td>
                    <td className="py-2 text-right text-gray-700">
                      {formatCurrency(item.total_final_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default BreakdownSection;
