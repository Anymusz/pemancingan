// File: src/pages/employee/PendingOrder.jsx

import { useState, useEffect, useCallback } from "react";
import employeeService from "../../services/employeeService";
import { useToast } from "@/hooks/useToast";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { formatCurrency } from "@/utils/utils";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TabsNav } from "@/components/common/TabsNav";

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
        customer_name: order.customer_name,
        is_guest: order.is_guest,
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
  const tabItems = [
    { value: "all", label: "Semua", badge: orders.length },
    {
      value: "pending",
      label: "Pending",
      badge: orders.filter((o) => o.production_status === "pending").length,
    },
    {
      value: "done",
      label: "Selesai",
      badge: orders.filter((o) => o.production_status === "done").length,
    },
    {
      value: "cancelled",
      label: "Dibatalkan",
      badge: orders.filter((o) => o.production_status === "cancelled").length,
    },
  ];

  const orderItemColumns = [
    {
      key: "item_name_snapshot",
      header: "Item",
      render: (row) => row.item_name_snapshot,
    },
    { key: "quantity", header: "Qty", render: (row) => row.quantity },
    {
      key: "subtotal",
      header: "Subtotal",
      render: (row) => formatCurrency(row.subtotal),
    },
    {
      key: "order_source",
      header: "Sumber",
      render: (row) => (row.order_source === "self" ? "Self-order" : "Manual"),
    },
    {
      key: "production_status",
      header: "Status",
      render: (row) => (
        <div className="space-y-0.5">
          <StatusBadge status={row.production_status} />
          {row.production_status === "cancelled" && row.cancellation_reason && (
            <p className="text-xs text-muted-foreground">
              {row.cancellation_reason}
            </p>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pesanan Masuk</h1>
        <p className="text-sm text-muted-foreground">
          Auto-refresh setiap 30 detik.
        </p>
        <p className="text-sm text-muted-foreground italic">
          Pesanan berstatus &quot;Selesai&quot; akan otomatis tercakup saat
          checkout member terkait.
        </p>
      </div>

      {/* ===== FILTER ===== */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <TabsNav
          items={tabItems}
          value={filterStatus}
          onValueChange={setFilterStatus}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={fetchOrders}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {/* ===== CONTENT ===== */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Memuat pesanan...</p>
      ) : Object.keys(grouped).length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Tidak ada pesanan masuk saat ini.
        </p>
      ) : (
        <div className="space-y-4">
          {Object.values(grouped).map((group) => (
            <div
              key={group.arrival_id}
              className="rounded-lg border border-border p-4 space-y-3"
            >
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-foreground">
                  {group.customer_name}
                </h3>
                <StatusBadge status={group.is_guest ? "guest" : "member"} />
                <span className="text-sm text-muted-foreground">
                  {group.items.length} item
                </span>
              </div>
              <DataTable
                columns={orderItemColumns}
                data={group.items}
                emptyMessage="Tidak ada item"
                getRowActions={(row) => {
                  if (row.production_status !== "pending") return [];
                  return [
                    {
                      label: "Selesai",
                      onClick: () => handleUpdateStatus(row.id, "done"),
                    },
                    {
                      label: "Batalkan",
                      variant: "danger",
                      onClick: () => handleOpenCancelModal(row.id),
                    },
                  ];
                }}
              />
            </div>
          ))}
        </div>
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
        confirmLabel="Konfirmasi"
        onConfirm={handleConfirmCancel}
        loading={actionLoading[cancelModal.orderId]}
      />
    </div>
  );
};

export default PendingOrder;
