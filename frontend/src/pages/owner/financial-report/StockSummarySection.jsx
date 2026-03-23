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

      <div className="bg-background border border-border rounded-lg p-4">
        {stocks.length === 0 ? (
          <p className="text-muted-foreground text-sm">Tidak ada data stok.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground font-medium">
                  Nama Ikan
                </th>
                <th className="text-right py-2 text-muted-foreground font-medium">
                  Terjual (kg)
                </th>
                <th className="text-right py-2 text-muted-foreground font-medium">
                  Restock (kg)
                </th>
                <th className="text-right py-2 text-muted-foreground font-medium">
                  Stok Saat Ini (kg)
                </th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((fish) => (
                <tr key={fish.name} className="border-b border-border/50">
                  <td className="py-2 text-foreground">{fish.name}</td>
                  <td className="py-2 text-right text-foreground">
                    {Number(fish.total_sold_kg || 0).toFixed(2)}
                  </td>
                  <td className="py-2 text-right text-foreground">
                    {Number(fish.total_restock_kg || 0).toFixed(2)}
                  </td>
                  <td className="py-2 text-right text-foreground font-semibold">
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
