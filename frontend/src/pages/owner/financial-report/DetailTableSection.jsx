import { useState, Fragment } from "react";

const formatCurrency = (val) =>
  `Rp ${Number(val || 0).toLocaleString("id-ID")}`;

const formatDateTime = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

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

// ======================== EXPANDABLE ROW ========================

const ExpandableRow = ({ items }) => {
  return (
    <tr>
      <td colSpan={9} className="bg-gray-50 px-6 py-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-1 text-gray-500 font-medium">Item</th>
              <th className="text-left py-1 text-gray-500 font-medium">
                Kategori
              </th>
              <th className="text-right py-1 text-gray-500 font-medium">Qty</th>
              <th className="text-right py-1 text-gray-500 font-medium">
                Harga Satuan
              </th>
              <th className="text-right py-1 text-gray-500 font-medium">
                Subtotal
              </th>
              <th className="text-right py-1 text-gray-500 font-medium">
                Diskon Tier
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="py-1 text-gray-700">
                  {item.item_name_snapshot}
                </td>
                <td className="py-1 text-gray-700">
                  {CATEGORY_LABELS[item.item_type] || item.item_type}
                </td>
                <td className="py-1 text-right text-gray-700">
                  {item.item_type === "fish"
                    ? `${Number(item.quantity).toFixed(2)} kg`
                    : Number(item.quantity)}
                </td>
                <td className="py-1 text-right text-gray-700">
                  {formatCurrency(item.unit_price_snapshot)}
                </td>
                <td className="py-1 text-right text-gray-700">
                  {formatCurrency(item.subtotal)}
                </td>
                <td className="py-1 text-right text-gray-700">
                  {formatCurrency(item.discount_tier_item)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </td>
    </tr>
  );
};

// ======================== DETAIL TABLE SECTION ========================

const DetailTableSection = ({
  data,
  meta,
  loading,
  page,
  onPageChange,
  onExport,
  exporting,
}) => {
  const [expandedRow, setExpandedRow] = useState(null);
  // useEffect(() => {
  //   setExpandedRow(null);
  // }, [data]);

  const transactions = data || [];

  const handleRowClick = (transactionCode) => {
    setExpandedRow((prev) =>
      prev === transactionCode ? null : transactionCode,
    );
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          Detail Transaksi
        </h3>
        <button
          onClick={onExport}
          disabled={exporting}
          className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {exporting ? "Mengunduh..." : "Export Excel"}
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <p className="text-gray-500 text-sm p-4">Memuat transaksi...</p>
        ) : transactions.length === 0 ? (
          <p className="text-gray-400 text-sm p-4">Tidak ada transaksi.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">
                      Tanggal
                    </th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">
                      No. Transaksi
                    </th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">
                      Member
                    </th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">
                      Total Bayar
                    </th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">
                      Diskon Tier
                    </th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">
                      Diskon Voucher
                    </th>
                    <th className="text-center px-4 py-3 text-gray-500 font-medium">
                      Metode
                    </th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">
                      Poin
                    </th>
                    <th className="text-right px-4 py-3 text-gray-500 font-medium">
                      Tips
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((trx) => (
                    <Fragment key={trx.transaction_code}>
                      <tr
                        onClick={() => handleRowClick(trx.transaction_code)}
                        className="border-b border-gray-100 hover:bg-sky-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 text-gray-700">
                          {formatDateTime(trx.transaction_date)}
                        </td>
                        <td className="px-4 py-3 text-gray-700 font-mono text-xs">
                          {trx.transaction_code}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {trx.member_name}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {formatCurrency(trx.final_amount)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {formatCurrency(trx.discount_tier)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {formatCurrency(trx.discount_voucher)}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700">
                          {PAYMENT_LABELS[trx.payment_method] ||
                            trx.payment_method}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {trx.points_earned ?? 0}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {formatCurrency(trx.tips)}
                        </td>
                      </tr>
                      {expandedRow === trx.transaction_code && (
                        <ExpandableRow items={trx.items || []} />
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && meta.last_page > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Halaman {meta.current_page} dari {meta.last_page} (
                  {meta.total} transaksi)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sebelumnya
                  </button>
                  <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= meta.last_page}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DetailTableSection;
