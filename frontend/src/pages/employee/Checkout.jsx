// File: src/pages/employee/Checkout.jsx

import { useState, useEffect, useMemo, useCallback } from "react";
import employeeService from "../../services/employeeService";

const TIER_DISCOUNT_FALLBACK = 0;

const Checkout = () => {
  const [arrivals, setArrivals] = useState([]);
  const [fishTypes, setFishTypes] = useState([]);
  const [selectedArrival, setSelectedArrival] = useState(null);
  const [items, setItems] = useState([]);
  const [tips, setTips] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [tierUpgradeAlert, setTierUpgradeAlert] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");

  const [selectedFishId, setSelectedFishId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [itemError, setItemError] = useState("");

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.subtotal, 0),
    [items],
  );

  const discount = useMemo(() => {
    if (!selectedArrival) return 0;
    const discountPct =
      selectedArrival.discount_percentage ?? TIER_DISCOUNT_FALLBACK;
    const fishSubtotal = items
      .filter((i) => i.item_type === "fish")
      .reduce((sum, i) => sum + i.subtotal, 0);
    return Math.floor(fishSubtotal * (discountPct / 100));
  }, [items, selectedArrival]);

  const finalAmount = useMemo(() => subtotal - discount, [subtotal, discount]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const filteredArrivals = useMemo(() => {
    if (!searchQuery.trim()) return arrivals;
    const q = searchQuery.toLowerCase();
    return arrivals.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.member_code.toLowerCase().includes(q) ||
        (a.phone && a.phone.includes(q)),
    );
  }, [arrivals, searchQuery]);

  const fetchArrivals = useCallback(async () => {
    setFetchLoading(true);
    try {
      const res = await employeeService.getTodayArrivals();
      if (res.success) {
        setArrivals(res.data.arrivals.filter((a) => a.status === "active"));
      }
    } catch {
      showToast("Gagal memuat data kedatangan", "error");
    } finally {
      setFetchLoading(false);
    }
  }, []);

  const fetchFishTypes = async () => {
    try {
      const res = await employeeService.getFishTypes();
      if (res.success) setFishTypes(res.data);
    } catch {
      showToast("Gagal memuat data jenis ikan", "error");
    }
  };

  useEffect(() => {
    fetchArrivals();
    fetchFishTypes();
  }, [fetchArrivals]);

  const handleSelectArrival = (e) => {
    const arrivalId = Number(e.target.value);
    if (!arrivalId) {
      setSelectedArrival(null);
      setItems([]);
      return;
    }
    const arrival = arrivals.find((a) => a.arrival_id === arrivalId);
    setSelectedArrival(arrival || null);
    setItems([]);
  };

  const handleAddItem = () => {
    setItemError("");
    if (!selectedFishId) {
      setItemError("Pilih jenis ikan");
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      setItemError("Masukkan berat yang valid");
      return;
    }

    const fish = fishTypes.find((f) => f.id === Number(selectedFishId));
    if (!fish) {
      setItemError("Jenis ikan tidak ditemukan");
      return;
    }

    const existing = items.find(
      (i) => i.item_id === fish.id && i.item_type === "fish",
    );

    if (existing) {
      setItems((prev) =>
        prev.map((i) => {
          if (i.item_id === fish.id && i.item_type === "fish") {
            const newQty = parseFloat(i.quantity) + parseFloat(quantity);
            return {
              ...i,
              quantity: newQty,
              subtotal: newQty * i.unit_price_snapshot,
            };
          }
          return i;
        }),
      );
    } else {
      const qty = parseFloat(quantity);
      setItems((prev) => [
        ...prev,
        {
          item_type: "fish",
          item_id: fish.id,
          name: fish.name,
          quantity: qty,
          unit_price_snapshot: parseFloat(fish.price_per_kg),
          subtotal: qty * parseFloat(fish.price_per_kg),
        },
      ]);
    }

    setSelectedFishId("");
    setQuantity("");
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedArrival || items.length === 0 || !paymentMethod) return;
    setLoading(true);
    try {
      const payload = {
        arrival_id: selectedArrival.arrival_id,
        items: items.map((i) => ({
          item_type: i.item_type,
          item_id: i.item_id,
          quantity: i.quantity,
        })),
        payment_method: paymentMethod,
        tips: Number(tips) || 0,
        notes: notes || null,
      };

      const res = await employeeService.checkout(payload);
      if (res.success) {
        showToast(
          `Checkout berhasil! Kode: ${res.data.transaction.transaction_code}`,
        );
        if (res.data.tier_upgraded) {
          setTierUpgradeAlert(
            `Selamat! Tier member naik ke ${res.data.new_tier}!`,
          );
          setTimeout(() => setTierUpgradeAlert(null), 6000);
        }
        setSelectedArrival(null);
        setItems([]);
        setTips(0);
        setPaymentMethod("");
        setNotes("");
        fetchArrivals();
      }
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Gagal memproses checkout",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled =
    !selectedArrival || items.length === 0 || !paymentMethod || loading;

  // ==================== RENDER ====================
  return (
    <div>
      {/* Toast */}
      {toast && (
        <div>
          [{toast.type === "success" ? "OK" : "ERROR"}] {toast.message}
        </div>
      )}

      {/* Tier Upgrade Alert */}
      {tierUpgradeAlert && (
        <div style={{ border: "2px solid green", padding: 12 }}>
          🎉 {tierUpgradeAlert}
        </div>
      )}

      <h1>Checkout Transaksi</h1>

      {/* ===== 1. ARRIVAL SELECTOR ===== */}
      <section>
        <h2>1. Pilih Member (Kedatangan Hari Ini)</h2>
        {fetchLoading ? (
          <p>Memuat data kedatangan...</p>
        ) : (
          <>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama / member ID / HP..."
            />
            <select
              onChange={handleSelectArrival}
              value={selectedArrival?.arrival_id || ""}
            >
              <option value="">-- Pilih Member --</option>
              {filteredArrivals.map((a) => (
                <option key={a.arrival_id} value={a.arrival_id}>
                  {a.name} | {a.member_code} | {a.tier} | Check-in:{" "}
                  {new Date(a.check_in_at).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </option>
              ))}
            </select>
          </>
        )}

        {arrivals.length === 0 && !fetchLoading && (
          <p>Belum ada member yang check-in hari ini</p>
        )}

        {selectedArrival && (
          <div style={{ border: "1px solid #000", padding: 8, marginTop: 8 }}>
            <strong>Member terpilih:</strong> {selectedArrival.name} | Tier:{" "}
            {selectedArrival.tier} | Poin: {selectedArrival.total_points} |
            Diskon ikan: {selectedArrival.discount_percentage ?? 0}%
          </div>
        )}
      </section>

      {/* ===== 2. ITEMS FORM ===== */}
      <section>
        <h2>2. Tambah Item Ikan</h2>
        <div>
          <select
            value={selectedFishId}
            onChange={(e) => setSelectedFishId(e.target.value)}
          >
            <option value="">-- Pilih Jenis Ikan --</option>
            {fishTypes.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} - Rp {Number(f.price_per_kg).toLocaleString("id-ID")}
                /kg
              </option>
            ))}
          </select>

          <input
            type="number"
            min="0.01"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Berat (kg)"
          />

          <button onClick={handleAddItem}>Tambah</button>
          {itemError && <span style={{ color: "red" }}> {itemError}</span>}
        </div>

        {items.length > 0 && (
          <table border="1" width="100%" style={{ marginTop: 8 }}>
            <thead>
              <tr>
                <th>Nama Ikan</th>
                <th>Berat (kg)</th>
                <th>Harga/kg</th>
                <th>Subtotal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>
                    Rp{" "}
                    {Number(item.unit_price_snapshot).toLocaleString("id-ID")}
                  </td>
                  <td>Rp {Number(item.subtotal).toLocaleString("id-ID")}</td>
                  <td>
                    <button onClick={() => handleRemoveItem(index)}>
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ===== 3. RINGKASAN HARGA ===== */}
      <section>
        <h2>3. Ringkasan Harga</h2>
        <p>Subtotal: Rp {subtotal.toLocaleString("id-ID")}</p>
        <p>
          Diskon Tier ({selectedArrival?.discount_percentage ?? 0}% khusus
          ikan): - Rp {discount.toLocaleString("id-ID")}
        </p>
        <p>
          <strong>Total Bayar: Rp {finalAmount.toLocaleString("id-ID")}</strong>
        </p>
      </section>

      {/* ===== 4. PEMBAYARAN ===== */}
      <section>
        <h2>4. Pembayaran</h2>

        <div>
          <label>Metode Pembayaran *</label>
          <br />
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="">-- Pilih Metode --</option>
            <option value="cash">Cash</option>
            <option value="transfer">Transfer</option>
            <option value="qris">QRIS</option>
          </select>
        </div>

        <div>
          <label>Tips (Rp) - Opsional</label>
          <br />
          <input
            type="number"
            min="0"
            value={tips}
            onChange={(e) => setTips(e.target.value)}
            placeholder="0"
          />
        </div>

        <div>
          <label>Catatan - Opsional</label>
          <br />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>
      </section>

      {/* ===== 5. SUBMIT ===== */}
      <section>
        <button onClick={handleSubmit} disabled={isSubmitDisabled}>
          {loading ? "Memproses..." : "Proses Checkout"}
        </button>

        {!selectedArrival && <span> (Pilih member terlebih dahulu)</span>}
        {selectedArrival && items.length === 0 && (
          <span> (Tambah item ikan)</span>
        )}
        {selectedArrival && items.length > 0 && !paymentMethod && (
          <span> (Pilih metode pembayaran)</span>
        )}
      </section>
    </div>
  );
};

export default Checkout;
