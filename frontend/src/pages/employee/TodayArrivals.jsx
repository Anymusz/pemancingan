// File: src/pages/employee/TodayArrivals.jsx

import { useState, useEffect, useCallback } from "react";
import employeeService from "../../services/employeeService";
import { useToast } from "@/hooks/useToast";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { formatDateTime } from "@/utils/utils";

const TodayArrivals = () => {
  const [arrivals, setArrivals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [checkoutModal, setCheckoutModal] = useState({
    open: false,
    arrival: null,
    notes: "",
  });
  const toast = useToast();

  const fetchArrivals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await employeeService.getTodayArrivals();
      if (res.success) setArrivals(res.data.arrivals);
    } catch {
      toast.error("Gagal memuat data kedatangan");
    } finally {
      setLoading(false);
    }
  }, [toast]);

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
        toast.success(`${res.data.arrival.member_name} berhasil check-out`);
        closeCheckoutModal();
        fetchArrivals();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal melakukan check-out");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div>

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
                    {formatDateTime(arrival.check_in_at)}
                  </td>
                  <td>
                    {arrival.check_out_at
                      ? formatDateTime(arrival.check_out_at)
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

      {checkoutModal.arrival && (
        <ConfirmDialog
          open={checkoutModal.open}
          onClose={closeCheckoutModal}
          onConfirm={handleManualCheckout}
          variant="warning"
          title="Konfirmasi Check-out"
          description={`Check-out member ${checkoutModal.arrival.name} tanpa transaksi?`}
          inputLabel="Catatan (opsional)"
          inputValue={checkoutModal.notes}
          onInputChange={(e) =>
            setCheckoutModal((p) => ({ ...p, notes: e.target.value }))
          }
          confirmLabel="Ya, Check-out"
          loading={submitLoading}
        />
      )}
    </div>
  );
};

export default TodayArrivals;
