const StockSummarySection = ({ data, loading }) => {
  if (loading) {
    return (
      <p className="text-muted-foreground text-sm py-4">
        Memuat ringkasan stok...
      </p>
    );
  }

  const stocks = data?.stock_summary || [];

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-foreground mb-3">
        Ringkasan Stok Ikan
      </h3>

      <div className="bg-card border border-border rounded-lg p-4">
        {stocks.length === 0 ? (
          <p className="text-muted-foreground text-sm">Tidak ada data stok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/60 border-b border-border">
                  <th className="text-left px-3 py-2 text-muted-foreground font-semibold text-xs sm:text-sm">
                    Nama Ikan
                  </th>
                  <th className="text-right px-3 py-2 text-muted-foreground font-semibold text-xs sm:text-sm">
                    Terjual (kg)
                  </th>
                  <th className="text-right px-3 py-2 text-muted-foreground font-semibold text-xs sm:text-sm">
                    Restock (kg)
                  </th>
                  <th className="text-right px-3 py-2 text-muted-foreground font-semibold text-xs sm:text-sm">
                    Stok Saat Ini (kg)
                  </th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((fish) => (
                  <tr
                    key={fish.name}
                    className="border-b border-border/50 bg-card"
                  >
                    <td className="px-3 py-2 text-foreground">{fish.name}</td>
                    <td className="px-3 py-2 text-right text-foreground">
                      {Number(fish.total_sold_kg || 0).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right text-foreground">
                      {Number(fish.total_restock_kg || 0).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right text-foreground font-semibold">
                      {Number(fish.current_stock_kg || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockSummarySection;
