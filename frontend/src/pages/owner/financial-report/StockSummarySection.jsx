const StockSummarySection = ({ data, loading }) => {
  if (loading) {
    return (
      <p className="text-gray-500 text-sm py-4">Memuat ringkasan stok...</p>
    );
  }

  const stocks = data?.stock_summary || [];

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">
        Ringkasan Stok Ikan
      </h3>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        {stocks.length === 0 ? (
          <p className="text-gray-400 text-sm">Tidak ada data stok.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-gray-500 font-medium">
                  Nama Ikan
                </th>
                <th className="text-right py-2 text-gray-500 font-medium">
                  Terjual (kg)
                </th>
                <th className="text-right py-2 text-gray-500 font-medium">
                  Restock (kg)
                </th>
                <th className="text-right py-2 text-gray-500 font-medium">
                  Stok Saat Ini (kg)
                </th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((fish) => (
                <tr key={fish.name} className="border-b border-gray-100">
                  <td className="py-2 text-gray-700">{fish.name}</td>
                  <td className="py-2 text-right text-gray-700">
                    {Number(fish.total_sold_kg || 0).toFixed(2)}
                  </td>
                  <td className="py-2 text-right text-gray-700">
                    {Number(fish.total_restock_kg || 0).toFixed(2)}
                  </td>
                  <td className="py-2 text-right text-gray-700 font-semibold">
                    {Number(fish.current_stock_kg || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StockSummarySection;
