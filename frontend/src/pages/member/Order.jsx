// File: src/pages/member/Order.jsx

import { useState, useEffect, useCallback, useMemo } from "react";
import memberService from "../../services/memberService";
import { useToast } from "@/hooks/useToast";
import { formatCurrency } from "@/utils/utils";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import { imageCell } from "@/components/common/ImageCell";
import { Star, Minus, Plus } from "lucide-react";

const Order = () => {
  const [menus, setMenus] = useState([]);
  const [quantities, setQuantities] = useState({});
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
    .filter((o) => o.production_status !== "cancelled")
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
  const menuColumns = useMemo(
    () => [
      imageCell,
      {
        key: "name",
        header: "Nama",
        render: (row) => (
          <div className="flex items-center gap-1.5">
            {row.is_special && (
              <Star className="size-3.5 text-amber-500 shrink-0" />
            )}
            <span className="font-medium">{row.name}</span>
          </div>
        ),
      },
      {
        key: "category",
        header: "Kategori",
        render: (row) => <StatusBadge status={row.category} />,
      },
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
            <div className="flex items-center gap-2">
              <button
                className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
                onClick={() => decrement(row.id)}
                disabled={qty <= 0}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span
                className={`w-6 text-center text-sm font-medium ${
                  qty > 0 ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {qty}
              </span>
              <button
                className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors"
                onClick={() => increment(row.id)}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
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
    ],
    [quantities],
  );

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
          Pesanan akan dibayar saat pembayaran akhir bersama hasil tangkapan
          ikan.
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
          rowClassName={(row) => {
            if ((quantities[row.id] || 0) > 0)
              return "bg-primary/5 border-l-2 border-l-primary";
            if (row.is_special)
              return "bg-amber-500/5 border-l-2 border-l-amber-500";
            return "";
          }}
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
                <span className="font-medium">
                  {formatCurrency(item.subtotal)}
                </span>
              </p>
            ))}
          </div>
          <div className="border-t border-border pt-3 flex items-center justify-between">
            <p className="font-semibold text-foreground">
              Total:{" "}
              <span className="text-primary">
                {formatCurrency(totalAmount)}
              </span>
              <span className="text-muted-foreground font-normal text-sm ml-1">
                (dibayar saat pembayaran akhir)
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
              <span className="text-primary">
                {formatCurrency(unpaidTotal)}
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              *Estimasi tagihan pesanan saat pembayaran nanti
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Order;
