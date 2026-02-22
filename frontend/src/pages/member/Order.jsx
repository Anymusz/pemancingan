// File: src/pages/member/Order.jsx

import { useState, useEffect } from "react";
import memberService from "../../services/memberService";

const Order = () => {
  const [menus, setMenus] = useState([]);
  const [quantities, setQuantities] = useState({}); // { menu_id: qty }
  const [fetchLoading, setFetchLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null); // konfirmasi sukses

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ==================== FETCH MENUS ====================
  useEffect(() => {
    const fetchMenus = async () => {
      setFetchLoading(true);
      try {
        const res = await memberService.getMenus();
        if (res.success) setMenus(res.data);
      } catch {
        showToast("Gagal memuat menu", "error");
      } finally {
        setFetchLoading(false);
      }
    };
    fetchMenus();
  }, []);

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
        setSuccessInfo(res.data.orders);
        setQuantities({});
        showToast("Pesanan berhasil dikirim!");
      }
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Gagal mengirim pesanan",
        "error",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleReset = () => setSuccessInfo(null);

  // ==================== RENDER ====================
  return (
    <div>
      {/* Toast */}
      {toast && (
        <div>
          [{toast.type === "success" ? "OK" : "ERROR"}] {toast.message}
        </div>
      )}

      <h1>Pesan Makanan & Minuman</h1>
      <p>Pesanan akan dibayar saat checkout akhir bersama pembelian ikan.</p>

      {/* ===== KONFIRMASI SUKSES ===== */}
      {successInfo && (
        <div
          style={{ border: "2px solid green", padding: 12, marginBottom: 16 }}
        >
          <h2>Pesanan Diterima!</h2>
          <p>Pesanan kamu sudah masuk dan akan disiapkan.</p>
          <table border="1" width="100%">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {successInfo.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>Rp {Number(item.subtotal).toLocaleString("id-ID")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <br />
          <button onClick={handleReset}>Pesan Lagi</button>
        </div>
      )}

      {/* ===== MENU LIST ===== */}
      {!successInfo && (
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
      )}
    </div>
  );
};

export default Order;
