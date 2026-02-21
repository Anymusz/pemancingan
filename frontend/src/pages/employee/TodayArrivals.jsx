// File: src/pages/employee/TodayArrivals.jsx

import { useState, useEffect, useCallback } from "react";
import employeeService from "../../services/employeeService";

const TodayArrivals = () => {
  const [arrivals, setArrivals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [checkoutModal, setCheckoutModal] = useState({
    open: false,
    arrival: null,
    notes: "",
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchArrivals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await employeeService.getTodayArrivals();
      if (res.success) setArrivals(res.data.arrivals);
    } catch {
      showToast("Gagal memuat data kedatangan", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArrivals();
  }, [fetchArrivals]);

  const filteredArrivals = arrivals.filter((a) => {
    const matchStatus = statusFilter ? a.status === statusFilter : true;
    const matchSearch = searchQuery
      ? a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.member_code.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchStatus && matchSearch;
  });

  const openCheckoutModal = (arrival) => {
    setCheckoutModal({ open: true, arrival, notes: "" });
  };

  const closeCheckoutModal = () => {
    setCheckoutModal({ open: false, arrival: null, notes: "" });
  };

  const handleManualCheckout = async () => {
    if (!checkoutModal.arrival) return;
    setSubmitLoading(true);
    try {
      const res = await employeeService.checkOutMember(
        checkoutModal.arrival.arrival_id,
        checkoutModal.notes || null,
      );
      if (res.success) {
        showToast(`${res.data.arrival.member_name} berhasil check-out`);
        closeCheckoutModal();
        fetchArrivals();
      }
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Gagal melakukan check-out",
        "error",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div>
      {toast && (
        <div>
          [{toast.type === "success" ? "OK" : "ERROR"}] {toast.message}
        </div>
      )}

      <h1>Kedatangan Hari Ini</h1>

      <section>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama / member ID..."
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Semua Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>

        <button onClick={fetchArrivals} disabled={loading}>
          {loading ? "Memuat..." : "Refresh"}
        </button>
      </section>

      <section>
        <p>Total: {filteredArrivals.length} kedatangan</p>

        {loading ? (
          <p>Memuat data...</p>
        ) : filteredArrivals.length === 0 ? (
          <p>Tidak ada data kedatangan</p>
        ) : (
          <table border="1" width="100%">
            <thead>
              <tr>
                <th>Nama Member</th>
                <th>Member ID</th>
                <th>Tier</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Durasi</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredArrivals.map((arrival) => (
                <tr key={arrival.arrival_id}>
                  <td>{arrival.name}</td>
                  <td>{arrival.member_code}</td>
                  <td>
                    {arrival.tier} ({arrival.discount_percentage ?? 0}%)
                  </td>
                  <td>
                    {new Date(arrival.check_in_at).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td>
                    {arrival.check_out_at
                      ? new Date(arrival.check_out_at).toLocaleTimeString(
                          "id-ID",
                          { hour: "2-digit", minute: "2-digit" },
                        )
                      : "-"}
                  </td>
                  <td>{arrival.duration ?? "-"}</td>
                  <td>
                    {arrival.status === "active" ? "Active" : "Completed"}
                  </td>
                  <td>
                    {arrival.status === "active" ? (
                      <button onClick={() => openCheckoutModal(arrival)}>
                        Manual Check-out
                      </button>
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {checkoutModal.open && checkoutModal.arrival && (
        <div style={{ border: "2px solid #000", padding: 16, marginTop: 16 }}>
          <h2>Konfirmasi Check-out</h2>
          <p>
            Check-out member <strong>{checkoutModal.arrival.name}</strong> tanpa
            transaksi?
          </p>
          <div>
            <label>Alasan / Catatan (opsional)</label>
            <br />
            <textarea
              value={checkoutModal.notes}
              onChange={(e) =>
                setCheckoutModal((p) => ({ ...p, notes: e.target.value }))
              }
              rows={3}
              placeholder="Contoh: Member tidak jadi beli ikan"
            />
          </div>
          <br />
          <button onClick={handleManualCheckout} disabled={submitLoading}>
            {submitLoading ? "Memproses..." : "Ya, Check-out"}
          </button>{" "}
          <button onClick={closeCheckoutModal} disabled={submitLoading}>
            Batal
          </button>
        </div>
      )}
    </div>
  );
};

export default TodayArrivals;
