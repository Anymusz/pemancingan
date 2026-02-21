// File: src/pages/employee/TransactionHistory.jsx

import { useState, useEffect } from "react";
import employeeService from "../../services/employeeService";

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingDetailId, setLoadingDetailId] = useState(null); // per-row loading
  const [toast, setToast] = useState(null);
  const [filterError, setFilterError] = useState("");

  const [filters, setFilters] = useState({
    date_from: "",
    date_to: "",
    payment_method: "",
    transaction_code: "",
    limit: 20,
  });

  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // ==================== TOAST ====================
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ==================== FETCH ====================
  const fetchTransactions = async (currentFilters) => {
    setLoading(true);
    try {
      const params = {};
      if (currentFilters.date_from) params.date_from = currentFilters.date_from;
      if (currentFilters.date_to) params.date_to = currentFilters.date_to;
      if (currentFilters.payment_method)
        params.payment_method = currentFilters.payment_method;
      params.limit = currentFilters.limit;
      if (currentFilters.transaction_code)
        params.transaction_code = currentFilters.transaction_code;

      const res = await employeeService.getTransactions(params);
      if (res.success) {
        setTransactions(res.data.transactions);
        setTotal(res.data.total);
      }
    } catch {
      showToast("Gagal memuat data transaksi", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(filters);
  }, []);

  const handleFilter = () => {
    // Validasi date range sebelum fetch
    if (
      filters.date_from &&
      filters.date_to &&
      filters.date_to < filters.date_from
    ) {
      setFilterError("Tanggal akhir tidak boleh sebelum tanggal mulai");
      return;
    }
    setFilterError("");
    fetchTransactions(filters);
  };

  const handleResetFilter = () => {
    const reset = { date_from: "", date_to: "", payment_method: "", limit: 20 };
    setFilterError("");
    setFilters(reset);
    fetchTransactions(reset);
  };

  // ==================== DETAIL ====================
  const handleViewDetail = async (id) => {
    setLoadingDetailId(id); // hanya loading pada baris yang diklik
    try {
      const res = await employeeService.getTransactionDetail(id);
      if (res.success) setSelectedTransaction(res.data.transaction);
    } catch {
      showToast("Gagal memuat detail transaksi", "error");
    } finally {
      setLoadingDetailId(null);
    }
  };

  const closeDetail = () => setSelectedTransaction(null);

  // ==================== RENDER ====================
  return (
    <div>
      {/* Toast */}
      {toast && (
        <div>
          [{toast.type === "success" ? "OK" : "ERROR"}] {toast.message}
        </div>
      )}

      <h1>Riwayat Transaksi</h1>

      {/* ===== FILTER FORM ===== */}
      <section>
        <h2>Filter</h2>

        <label>Dari Tanggal: </label>
        <input
          type="date"
          value={filters.date_from}
          onChange={(e) =>
            setFilters((p) => ({ ...p, date_from: e.target.value }))
          }
        />

        <label> Sampai Tanggal: </label>
        <input
          type="date"
          value={filters.date_to}
          min={filters.date_from}
          onChange={(e) =>
            setFilters((p) => ({ ...p, date_to: e.target.value }))
          }
        />
        <label> Kode Transaksi: </label>
        <input
          type="text"
          value={filters.transaction_code}
          onChange={(e) =>
            setFilters((p) => ({ ...p, transaction_code: e.target.value }))
          }
          placeholder="Cari kode transaksi..."
        />

        <label> Metode Bayar: </label>
        <select
          value={filters.payment_method}
          onChange={(e) =>
            setFilters((p) => ({ ...p, payment_method: e.target.value }))
          }
        >
          <option value="">Semua</option>
          <option value="cash">Cash</option>
          <option value="transfer">Transfer</option>
          <option value="qris">QRIS</option>
        </select>

        <label> Limit: </label>
        <select
          value={filters.limit}
          onChange={(e) =>
            setFilters((p) => ({ ...p, limit: Number(e.target.value) }))
          }
        >
          <option value={20}>20</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>

        <button onClick={handleFilter}>Terapkan Filter</button>
        <button onClick={handleResetFilter}>Reset</button>

        {/* Validasi error */}
        {filterError && <span style={{ color: "red" }}> {filterError}</span>}
      </section>

      {/* ===== TRANSACTION TABLE ===== */}
      <section>
        <p>
          Menampilkan {transactions.length} dari {total} transaksi
        </p>

        {loading ? (
          <p>Memuat data...</p>
        ) : transactions.length === 0 ? (
          <p>Belum ada transaksi</p>
        ) : (
          <table border="1" width="100%">
            <thead>
              <tr>
                <th>Kode Transaksi</th>
                <th>Member</th>
                <th>Total Bayar</th>
                <th>Metode Bayar</th>
                <th>Tanggal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((trx) => (
                <tr key={trx.id}>
                  <td>{trx.transaction_code}</td>
                  <td>
                    {trx.member_name} ({trx.member_code})
                  </td>
                  <td>Rp {Number(trx.final_amount).toLocaleString("id-ID")}</td>
                  <td>{trx.payment_method.toUpperCase()}</td>
                  <td>
                    {new Date(trx.transaction_date).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td>
                    {/* Loading hanya pada baris yang diklik */}
                    <button
                      onClick={() => handleViewDetail(trx.id)}
                      disabled={loadingDetailId === trx.id}
                    >
                      {loadingDetailId === trx.id ? "..." : "Lihat Detail"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ===== DETAIL MODAL ===== */}
      {selectedTransaction && (
        <div style={{ border: "2px solid #000", padding: 16, marginTop: 16 }}>
          <h2>Detail Transaksi</h2>
          <button onClick={closeDetail}>Tutup</button>

          <p>
            <strong>Kode:</strong> {selectedTransaction.transaction_code}
          </p>
          <p>
            <strong>Member:</strong> {selectedTransaction.member?.name} (
            {selectedTransaction.member?.member_id})
          </p>
          <p>
            <strong>Tanggal:</strong>{" "}
            {new Date(selectedTransaction.transaction_date).toLocaleString(
              "id-ID",
            )}
          </p>
          <p>
            <strong>Diproses oleh:</strong> {selectedTransaction.processed_by}
          </p>
          <p>
            <strong>Metode Bayar:</strong>{" "}
            {selectedTransaction.payment_method?.toUpperCase()}
          </p>
          {selectedTransaction.notes && (
            <p>
              <strong>Catatan:</strong> {selectedTransaction.notes}
            </p>
          )}

          <h3>Item Transaksi</h3>
          <table border="1" width="100%">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Harga Satuan</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {selectedTransaction.items?.map((item, i) => (
                <tr key={i}>
                  <td>{item.name}</td>
                  <td>
                    {item.quantity} {item.item_type === "fish" ? "kg" : "pcs"}
                  </td>
                  <td>Rp {Number(item.unit_price).toLocaleString("id-ID")}</td>
                  <td>Rp {Number(item.subtotal).toLocaleString("id-ID")}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Ringkasan Pembayaran</h3>
          <p>
            Subtotal: Rp{" "}
            {Number(selectedTransaction.total_amount).toLocaleString("id-ID")}
          </p>
          <p>
            Diskon Tier: - Rp{" "}
            {Number(selectedTransaction.discount_tier).toLocaleString("id-ID")}
          </p>
          <p>
            <strong>
              Total Bayar: Rp{" "}
              {Number(selectedTransaction.final_amount).toLocaleString("id-ID")}
            </strong>
          </p>
          {Number(selectedTransaction.tips) > 0 && (
            <p>
              Tips: Rp{" "}
              {Number(selectedTransaction.tips).toLocaleString("id-ID")}
            </p>
          )}
          <p>Poin Diperoleh: +{selectedTransaction.points_earned} poin</p>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
