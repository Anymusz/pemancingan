// File: src/pages/member/Order.jsx

import { useState, useEffect, useCallback } from "react";
import memberService from "../../services/memberService";
import { useToast } from "@/hooks/useToast";

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
        fetchMyOrders(); // tambahkan ini
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal mengirim pesanan");
    } finally {
      setSubmitLoading(false);
    }
  };

  // ==================== RENDER ====================
  return (
    <div>
      <h1>Pesan Makanan & Minuman</h1>
      <p>Pesanan akan dibayar saat checkout akhir bersama pembelian ikan.</p>

      {/* ===== MENU LIST ===== */}
      <>
        {fetchLoading ? (
          <p>Memuat menu...</p>
        ) : menus.length === 0 ? (
          <p>Tidak ada menu tersedia</p>
        ) : (
          <section>
            <h2>Pilih Menu</h2>
            <table border="1" width="100%">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Kategori</th>
                  <th>Harga</th>
                  <th>Qty</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {menus.map((menu) => {
                  const qty = quantities[menu.id] || 0;
                  return (
                    <tr key={menu.id}>
                      <td>{menu.name}</td>
                      <td>{menu.category}</td>
                      <td>Rp {Number(menu.price).toLocaleString("id-ID")}</td>
                      <td>
                        <button onClick={() => decrement(menu.id)}>-</button>
                        <input
                          type="number"
                          min="0"
                          value={qty}
                          onChange={(e) =>
                            handleQtyChange(menu.id, e.target.value)
                          }
                          style={{ width: 50, textAlign: "center" }}
                        />
                        <button onClick={() => increment(menu.id)}>+</button>
                      </td>
                      <td>
                        {qty > 0
                          ? `Rp ${(qty * menu.price).toLocaleString("id-ID")}`
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}

        {/* ===== ORDER SUMMARY ===== */}
        {selectedItems.length > 0 && (
          <section style={{ marginTop: 16 }}>
            <h2>Ringkasan Pesanan</h2>
            {selectedItems.map((item) => (
              <p key={item.menu_id}>
                {item.name} × {item.quantity} = Rp{" "}
                {item.subtotal.toLocaleString("id-ID")}
              </p>
            ))}
            <p>
              <strong>Total: Rp {totalAmount.toLocaleString("id-ID")}</strong>{" "}
              (dibayar saat checkout)
            </p>
            <button onClick={handleSubmit} disabled={submitLoading}>
              {submitLoading ? "Memproses..." : "Kirim Pesanan"}
            </button>
          </section>
        )}

        {selectedItems.length === 0 && !fetchLoading && menus.length > 0 && (
          <p>Pilih minimal 1 item untuk memesan.</p>
        )}
      </>

      {/* ===== STATUS PESANAN SAYA ===== */}
      <section style={{ marginTop: 24 }}>
        <h2>Status Pesanan Saya</h2>
        {ordersLoading ? (
          <p>Memuat status pesanan...</p>
        ) : myOrders.length === 0 ? (
          <p>Belum ada pesanan hari ini.</p>
        ) : (
          <table border="1" width="100%">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Subtotal</th>
                <th>Status</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {myOrders.map((o) => (
                <tr key={o.id}>
                  <td>{o.item_name_snapshot}</td>
                  <td>{o.quantity}</td>
                  <td>Rp {Number(o.subtotal).toLocaleString("id-ID")}</td>
                  <td>
                    {o.production_status === "pending" && "Menunggu"}
                    {o.production_status === "done" && "Selesai"}
                    {o.production_status === "cancelled" && "Dibatalkan"}
                  </td>
                  <td>
                    {o.production_status === "cancelled"
                      ? o.cancellation_reason
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {unpaidTotal > 0 && (
          <div
            style={{
              marginTop: 12,
              borderTop: "1px solid #ccc",
              paddingTop: 8,
            }}
          >
            <strong>
              Total Sementara: Rp {unpaidTotal.toLocaleString("id-ID")}
            </strong>
            <p style={{ fontSize: "14px", color: "gray", margin: "4px 0 0" }}>
              *Estimasi tagihan pesanan saat checkout nanti
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Order;
