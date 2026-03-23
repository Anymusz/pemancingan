// File: src/pages/member/Order.jsx

import { useState, useEffect, useCallback } from "react";
import memberService from "../../services/memberService";
import { useToast } from "@/hooks/useToast";
import { formatCurrency } from "@/utils/utils";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/FormInput";
import { StatusBadge } from "@/components/common/StatusBadge";

const Order = () => {
  const [menus, setMenus] = useState([]);
  const [quantities, setQuantities] = useState({}); // { menu_id: qty }
  const [fetchLoading, setFetchLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [myOrders, setMyOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const toast = useToast();

  // ==================== FETCH MY ORDERS ====================
  const fetchMyOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await memberService.getMyOrders();
      if (res.success) setMyOrders(res.data.orders);
    } catch {
      // silent fail
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  // ==================== FETCH MENUS ====================
  useEffect(() => {
    const fetchMenus = async () => {
      setFetchLoading(true);
      try {
        const res = await memberService.getMenus();
        if (res.success) setMenus(res.data);
      } catch {
        toast.error("Gagal memuat menu");
      } finally {
        setFetchLoading(false);
      }
    };
    fetchMenus();
  }, [toast]);

  useEffect(() => {
    fetchMyOrders();
  }, [fetchMyOrders]);

  useEffect(() => {
    const hasPending = myOrders.some((o) => o.production_status === "pending");
    if (!hasPending) return;
    const interval = setInterval(fetchMyOrders, 30000);
    return () => clearInterval(interval);
  }, [myOrders, fetchMyOrders]);

  // ==================== QUANTITY HANDLERS ====================
  const handleQtyChange = (menuId, value) => {
    const qty = Math.max(0, parseInt(value) || 0);
    setQuantities((prev) => ({ ...prev, [menuId]: qty }));
  };

  const increment = (menuId) => {
    setQuantities((prev) => ({ ...prev, [menuId]: (prev[menuId] || 0) + 1 }));
  };

  const decrement = (menuId) => {
    setQuantities((prev) => ({
      ...prev,
      [menuId]: Math.max(0, (prev[menuId] || 0) - 1),
    }));
  };

  // ==================== DERIVED STATE ====================
  const selectedItems = menus
    .filter((m) => (quantities[m.id] || 0) > 0)
    .map((m) => ({
      menu_id: m.id,
      name: m.name,
      quantity: quantities[m.id],
      subtotal: quantities[m.id] * m.price,
    }));

  const totalAmount = selectedItems.reduce((sum, i) => sum + i.subtotal, 0);

  // ==================== MY ORDERS SUBTOTAL ====================
  const unpaidTotal = myOrders
    .filter(
      (o) =>
        o.production_status === "pending" || o.production_status === "done",
    )
    .reduce((sum, o) => sum + Number(o.subtotal), 0);

  // ==================== SUBMIT ====================
  const handleSubmit = async () => {
    if (selectedItems.length === 0) return;

    setSubmitLoading(true);
    try {
      const payload = {
        items: selectedItems.map((i) => ({
          menu_id: i.menu_id,
          quantity: i.quantity,
        })),
      };

      const res = await memberService.createOrder(payload);
      if (res.success) {
        setQuantities({});
        toast.success("Pesanan berhasil dikirim!");
        fetchMyOrders();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal mengirim pesanan");
    } finally {
      setSubmitLoading(false);
    }
  };

  // ==================== COLUMN DEFINITIONS ====================
  const menuColumns = [
    { key: "name", header: "Nama", render: (row) => row.name },
    { key: "category", header: "Kategori", render: (row) => row.category },
    {
      key: "price",
      header: "Harga",
      render: (row) => formatCurrency(row.price),
    },
    {
      key: "qty",
      header: "Qty",
      render: (row) => {
        const qty = quantities[row.id] || 0;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => decrement(row.id)}
            >
              −
            </Button>
            <Input
              type="number"
              min="0"
              value={qty}
              onChange={(e) => handleQtyChange(row.id, e.target.value)}
              className="w-14 text-center h-7 px-1"
            />
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => increment(row.id)}
            >
              +
            </Button>
          </div>
        );
      },
    },
    {
      key: "subtotal",
      header: "Subtotal",
      render: (row) => {
        const qty = quantities[row.id] || 0;
        return qty > 0 ? formatCurrency(qty * row.price) : "-";
      },
    },
  ];

  const orderColumns = [
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
      key: "production_status",
      header: "Status",
      render: (row) => <StatusBadge status={row.production_status} />,
    },
    {
      key: "cancellation_reason",
      header: "Keterangan",
      render: (row) =>
        row.production_status === "cancelled" ? row.cancellation_reason : "-",
    },
  ];

  // ==================== RENDER ====================
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Pesan Makanan &amp; Minuman
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Pesanan akan dibayar saat checkout akhir bersama pembelian ikan.
        </p>
      </div>

      {/* ===== MENU LIST ===== */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Pilih Menu</h2>
        <DataTable
          columns={menuColumns}
          data={menus}
          loading={fetchLoading}
          emptyMessage="Tidak ada menu tersedia"
        />
        {selectedItems.length === 0 && !fetchLoading && menus.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Pilih minimal 1 item untuk memesan.
          </p>
        )}
      </section>

      {/* ===== ORDER SUMMARY ===== */}
      {selectedItems.length > 0 && (
        <section className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <h2 className="text-lg font-semibold text-foreground">
            Ringkasan Pesanan
          </h2>
          <div className="space-y-1">
            {selectedItems.map((item) => (
              <p key={item.menu_id} className="text-sm text-foreground">
                {item.name} × {item.quantity} ={" "}
                <span className="font-medium">{formatCurrency(item.subtotal)}</span>
              </p>
            ))}
          </div>
          <div className="border-t border-border pt-3 flex items-center justify-between">
            <p className="font-semibold text-foreground">
              Total:{" "}
              <span className="text-primary">{formatCurrency(totalAmount)}</span>
              <span className="text-muted-foreground font-normal text-sm ml-1">
                (dibayar saat checkout)
              </span>
            </p>
            <Button onClick={handleSubmit} loading={submitLoading}>
              Kirim Pesanan
            </Button>
          </div>
        </section>
      )}

      {/* ===== STATUS PESANAN SAYA ===== */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">
          Status Pesanan Saya
        </h2>
        <DataTable
          columns={orderColumns}
          data={myOrders}
          loading={ordersLoading}
          emptyMessage="Belum ada pesanan hari ini."
        />

        {unpaidTotal > 0 && (
          <div className="border-t border-border pt-3 space-y-1">
            <p className="font-semibold text-foreground">
              Total Sementara:{" "}
              <span className="text-primary">{formatCurrency(unpaidTotal)}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              *Estimasi tagihan pesanan saat checkout nanti
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Order;
