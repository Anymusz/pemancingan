// File: src/pages/employee/PendingOrder.jsx

import { useState, useEffect, useCallback } from "react";
import employeeService from "../../services/employeeService";
import { useToast } from "@/hooks/useToast";
import ConfirmDialog from "../../components/common/ConfirmDialog";

const PendingOrder = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [actionLoading, setActionLoading] = useState({});
  const [cancelModal, setCancelModal] = useState({
    open: false,
    orderId: null,
    reason: "",
  });
  const toast = useToast();

  // ==================== FETCH ====================
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await employeeService.getAllPendingOrders();
      if (res.success) setOrders(res.data.orders);
    } catch {
      toast.error("Gagal memuat pesanan masuk");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // ==================== FILTER ====================
  const filteredOrders =
    filterStatus === "all"
      ? orders
      : orders.filter((o) => o.production_status === filterStatus);

  // Grouping per member berdasarkan arrival_id + member_name
  const grouped = filteredOrders.reduce((acc, order) => {
    const key = order.arrival_id;
    if (!acc[key]) {
      acc[key] = {
        arrival_id: order.arrival_id,
        member_name: order.member_name,
        items: [],
      };
    }
    acc[key].items.push(order);
    return acc;
  }, {});

  // ==================== ACTION ====================
  const handleUpdateStatus = async (orderId, status, reason = null) => {
    setActionLoading((prev) => ({ ...prev, [orderId]: true }));
    try {
      const res = await employeeService.updateOrderStatus(orderId, {
        status: status,
        cancellation_reason: reason,
      });
      if (res.success) {
        toast.success(res.message);
        fetchOrders();
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Gagal mengubah status pesanan",
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleOpenCancelModal = (orderId) => {
    setCancelModal({ open: true, orderId, reason: "" });
  };

  const handleConfirmCancel = async () => {
    if (!cancelModal.reason.trim()) {
      toast.error("Alasan pembatalan wajib diisi");
      return;
    }
    await handleUpdateStatus(
      cancelModal.orderId,
      "cancelled",
      cancelModal.reason,
    );
    setCancelModal({ open: false, orderId: null, reason: "" });
  };

  const handleCloseCancelModal = () => {
    setCancelModal({ open: false, orderId: null, reason: "" });
  };

  // ==================== RENDER ====================
  const statusLabel = {
    pending: "Pending",
    done: "Selesai",
    cancelled: "Dibatalkan",
  };

  return (
    <div>
      <h1>Pesanan Masuk</h1>
      <p>Auto-refresh setiap 30 detik.</p>
      <p
        style={{
          fontStyle: "italic",
          fontSize: "14px",
          color: "gray",
          marginBottom: 16,
        }}
      >
        Pesanan berstatus "Selesai" akan otomatis tercakup saat checkout member
        terkait.
      </p>

      {/* ===== FILTER ===== */}
      <div style={{ marginBottom: 12 }}>
        {["all", "pending", "done", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            disabled={filterStatus === s}
            style={{ marginRight: 8 }}
          >
            {s === "all" ? "Semua" : statusLabel[s]}
          </button>
        ))}
        <button onClick={fetchOrders} style={{ marginLeft: 16 }}>
          Refresh Manual
        </button>
      </div>

      {/* ===== CONTENT ===== */}
      {loading ? (
        <p>Memuat pesanan...</p>
      ) : Object.keys(grouped).length === 0 ? (
        <p>Tidak ada pesanan masuk saat ini.</p>
      ) : (
        Object.values(grouped).map((group) => (
          <div
            key={group.arrival_id}
            style={{ border: "1px solid #000", padding: 12, marginBottom: 16 }}
          >
            <h3>
              {group.member_name} —{" "}
              <span style={{ fontWeight: "normal", fontSize: 14 }}>
                {group.items.length} item
              </span>
            </h3>
            <table border="1" width="100%">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Subtotal</th>
                  <th>Sumber</th>
                  <th>Status</th>
                  {group.items.some(
                    (item) => item.production_status === "pending",
                  ) && <th>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {group.items.map((order) => (
                  <tr key={order.id}>
                    <td>{order.item_name_snapshot}</td>
                    <td>{order.quantity}</td>
                    <td>Rp {Number(order.subtotal).toLocaleString("id-ID")}</td>
                    <td>
                      {order.order_source === "self" ? "Self-order" : "Manual"}
                    </td>
                    <td>
                      {statusLabel[order.production_status]}
                      {order.production_status === "cancelled" &&
                        order.cancellation_reason && (
                          <span style={{ color: "red", fontSize: 12 }}>
                            {" "}
                            — {order.cancellation_reason}
                          </span>
                        )}
                    </td>
                    {group.items.some(
                      (item) => item.production_status === "pending",
                    ) && (
                      <td>
                        {order.production_status === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                handleUpdateStatus(order.id, "done")
                              }
                              disabled={actionLoading[order.id]}
                              style={{ marginRight: 4 }}
                            >
                              {actionLoading[order.id] ? "..." : "Selesai"}
                            </button>
                            <button
                              onClick={() => handleOpenCancelModal(order.id)}
                              disabled={actionLoading[order.id]}
                            >
                              Batalkan
                            </button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}

      {/* ===== CANCEL MODAL ===== */}
      <ConfirmDialog
        open={cancelModal.open}
        onClose={handleCloseCancelModal}
        title="Pembatalan Pesanan"
        description="Masukkan alasan mengapa pesanan ini dibatalkan."
        variant="destructive"
        inputLabel="Alasan Pembatalan"
        inputValue={cancelModal.reason}
        onInputChange={(e) =>
          setCancelModal((prev) => ({ ...prev, reason: e.target.value }))
        }
        confirmLabel="Konfirmasi Batalkan"
        onConfirm={handleConfirmCancel}
        loading={actionLoading[cancelModal.orderId]}
      />
    </div>
  );
};

export default PendingOrder;
