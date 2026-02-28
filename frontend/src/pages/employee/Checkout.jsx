// File: src/pages/employee/Checkout.jsx

import { useState, useEffect, useMemo, useCallback } from "react";
import employeeService from "../../services/employeeService";

const TIER_DISCOUNT_FALLBACK = 0;

const PENALTY_TYPES = [
  { label: "Kail Rusak", price: 2000 },
  { label: "Pelampung Rusak", price: 5000 },
  { label: "Kerusakan Total", price: 200000 },
];

const Checkout = () => {
  const [arrivals, setArrivals] = useState([]);
  const [fishTypes, setFishTypes] = useState([]);
  const [selectedArrival, setSelectedArrival] = useState(null);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [fishItems, setFishItems] = useState([]);
  const [penaltyItems, setPenaltyItems] = useState([]);
  const [tips, setTips] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [tierUpgradeAlert, setTierUpgradeAlert] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeVoucher, setActiveVoucher] = useState(null);

  // Fish input state
  const [selectedFishId, setSelectedFishId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [itemError, setItemError] = useState("");

  // ==================== KALKULASI ====================
  const subtotalFish = useMemo(
    () => fishItems.reduce((sum, i) => sum + i.subtotal, 0),
    [fishItems],
  );

  const subtotalPending = useMemo(
    () => pendingOrders.reduce((sum, o) => sum + Number(o.subtotal), 0),
    [pendingOrders],
  );

  const subtotalPenalty = useMemo(
    () => penaltyItems.reduce((sum, p) => sum + p.subtotal, 0),
    [penaltyItems],
  );

  const discountTier = useMemo(() => {
    if (!selectedArrival) return 0;
    const pct = selectedArrival.discount_percentage ?? TIER_DISCOUNT_FALLBACK;
    return Math.floor(subtotalFish * (pct / 100));
  }, [subtotalFish, selectedArrival]);

  const totalAmount = useMemo(
    () => subtotalFish + subtotalPending + subtotalPenalty,
    [subtotalFish, subtotalPending, subtotalPenalty],
  );

  const discountVoucher = activeVoucher ? Number(activeVoucher.amount) : 0;

  const finalAmount = useMemo(
    () => Math.max(0, totalAmount - discountTier - discountVoucher),
    [totalAmount, discountTier, discountVoucher],
  );

  // Poin: penalty tidak ikut
  const pointsPreview = useMemo(
    () => Math.floor((totalAmount - subtotalPenalty) / 10000),
    [totalAmount, subtotalPenalty],
  );

  // ==================== HELPERS ====================
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const resetForm = () => {
    setSelectedArrival(null);
    setPendingOrders([]);
    setFishItems([]);
    setPenaltyItems([]);
    setTips(0);
    setPaymentMethod("");
    setNotes("");
    setSearchQuery("");
    setActiveVoucher(null);
  };

  // ==================== FETCH ====================
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

  const fetchPendingOrders = async (arrivalId) => {
    setPendingLoading(true);
    try {
      const res = await employeeService.getPendingOrders(arrivalId);
      if (res.success) setPendingOrders(res.data.orders);
    } catch {
      showToast("Gagal memuat pending orders", "error");
    } finally {
      setPendingLoading(false);
    }
  };

  const fetchMemberVoucher = async (memberId) => {
    try {
      const res = await employeeService.getMemberVoucher(memberId);
      if (res.success) setActiveVoucher(res.data.voucher);
    } catch {
      setActiveVoucher(null);
    }
  };

  // ==================== ARRIVAL AUTOCOMPLETE ====================
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

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    // Reset jika input diubah setelah member dipilih
    if (selectedArrival && val !== selectedArrival.name) {
      setSelectedArrival(null);
      setPendingOrders([]);
      setFishItems([]);
      setPenaltyItems([]);
    }
    setShowDropdown(true);
  };

  // [2] handlePickArrival dengan fetch voucher
  const handlePickArrival = (arrival) => {
    setSelectedArrival(arrival);
    setSearchQuery(arrival.name);
    setShowDropdown(false);
    setFishItems([]);
    setPenaltyItems([]);
    setActiveVoucher(null); // reset dulu
    fetchPendingOrders(arrival.arrival_id);
    fetchMemberVoucher(arrival.member_id); // fetch voucher
  };

  const handleSearchBlur = () => {
    // Delay agar onMouseDown di item dropdown sempat terproses sebelum ditutup
    setTimeout(() => setShowDropdown(false), 150);
  };

  // ==================== FISH ITEM HANDLERS ====================
  const handleAddFish = () => {
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

    const existing = fishItems.find((i) => i.item_id === fish.id);
    if (existing) {
      setFishItems((prev) =>
        prev.map((i) => {
          if (i.item_id === fish.id) {
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
      setFishItems((prev) => [
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

  const handleRemoveFish = (index) =>
    setFishItems((prev) => prev.filter((_, i) => i !== index));

  // ==================== PENALTY HANDLERS ====================
  const handleAddPenalty = (penaltyType) => {
    setPenaltyItems((prev) => {
      const existing = prev.find((p) => p.name === penaltyType.label);
      if (existing) {
        return prev.map((p) =>
          p.name === penaltyType.label
            ? {
                ...p,
                quantity: p.quantity + 1,
                subtotal: (p.quantity + 1) * p.unit_price,
              }
            : p,
        );
      }
      return [
        ...prev,
        {
          name: penaltyType.label,
          quantity: 1,
          unit_price: penaltyType.price,
          subtotal: penaltyType.price,
        },
      ];
    });
  };

  const handleRemovePenalty = (index) =>
    setPenaltyItems((prev) => prev.filter((_, i) => i !== index));

  // ==================== SUBMIT ====================
  const handleSubmit = async () => {
    if (!selectedArrival || !paymentMethod) return;

    const hasAnyItem =
      fishItems.length > 0 ||
      pendingOrders.length > 0 ||
      penaltyItems.length > 0;
    if (!hasAnyItem) {
      showToast("Tidak ada item untuk di-checkout", "error");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        arrival_id: selectedArrival.arrival_id,
        fish_items: fishItems.map((i) => ({
          item_id: i.item_id,
          quantity: i.quantity,
        })),
        penalty_items: penaltyItems.map((p) => ({
          name: p.name,
          quantity: p.quantity,
          unit_price: p.unit_price,
        })),
        payment_method: paymentMethod,
        tips: Number(tips) || 0,
        notes: notes || null,
      };

      const res = await employeeService.checkout(payload);

      if (res.success) {
        const voucherInfo =
          res.data.transaction.discount_voucher > 0
            ? ` | Voucher digunakan: Rp ${Number(res.data.transaction.discount_voucher).toLocaleString("id-ID")}`
            : "";
        showToast(
          `Checkout berhasil! Kode: ${res.data.transaction.transaction_code}${voucherInfo}`,
        );

        if (res.data.tier_upgraded) {
          setTierUpgradeAlert(
            `Selamat! Tier member naik ke ${res.data.new_tier}!`,
          );
          setTimeout(() => setTierUpgradeAlert(null), 6000);
        }
        resetForm();
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

  const hasAnyItem =
    fishItems.length > 0 || pendingOrders.length > 0 || penaltyItems.length > 0;
  const isSubmitDisabled =
    !selectedArrival || !paymentMethod || !hasAnyItem || loading;

  // ==================== RENDER ====================
  return (
    <div>
      {toast && (
        <div>
          [{toast.type === "success" ? "OK" : "ERROR"}] {toast.message}
        </div>
      )}
      {tierUpgradeAlert && (
        <div style={{ border: "2px solid green", padding: 12 }}>
          🎉 {tierUpgradeAlert}
        </div>
      )}

      <h1>Checkout Transaksi</h1>

      {/* ===== 1. PILIH MEMBER ===== */}
      <section>
        <h2>1. Pilih Member (Kedatangan Hari Ini)</h2>
        {fetchLoading ? (
          <p>Memuat data kedatangan...</p>
        ) : (
          <div style={{ position: "relative" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setShowDropdown(true)}
              onBlur={handleSearchBlur}
              placeholder="Cari nama / member ID / HP..."
              autoComplete="off"
              disabled={!!selectedArrival}
            />

            {/* Autocomplete dropdown */}
            {showDropdown && !selectedArrival && (
              <div
                style={{
                  border: "1px solid #ccc",
                  position: "absolute",
                  background: "#fff",
                  width: "100%",
                  zIndex: 10,
                }}
              >
                {filteredArrivals.length === 0 ? (
                  <div style={{ padding: 8 }}>
                    {arrivals.length === 0
                      ? "Belum ada member yang check-in hari ini"
                      : "Tidak ada hasil untuk pencarian ini"}
                  </div>
                ) : (
                  filteredArrivals.map((a) => (
                    <div
                      key={a.arrival_id}
                      onMouseDown={() => handlePickArrival(a)}
                      style={{
                        padding: 8,
                        cursor: "pointer",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      <strong>{a.name}</strong> | {a.member_code} | {a.tier} |
                      Check-in:{" "}
                      {new Date(a.check_in_at).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {selectedArrival && (
          <div style={{ border: "1px solid #000", padding: 8, marginTop: 8 }}>
            <strong>Member:</strong> {selectedArrival.name} | Tier:{" "}
            {selectedArrival.tier} | Poin: {selectedArrival.total_points} |
            Diskon ikan: {selectedArrival.discount_percentage ?? 0}%
            <button
              onClick={() => {
                setSelectedArrival(null);
                setPendingOrders([]);
                setFishItems([]);
                setPenaltyItems([]);
                setSearchQuery("");
              }}
              style={{ marginLeft: 8 }}
            >
              Ganti Member
            </button>
          </div>
        )}
      </section>

      {/* ===== 2. PENDING ORDERS ===== */}
      <section>
        <h2>2. Pending Orders (Makanan / Sewa Alat)</h2>
        {pendingLoading ? (
          <p>Memuat pending orders...</p>
        ) : !selectedArrival ? (
          <p>Pilih member terlebih dahulu</p>
        ) : pendingOrders.length === 0 ? (
          <p>Tidak ada pending order</p>
        ) : (
          <table border="1" width="100%">
            <thead>
              <tr>
                <th>Item</th>
                <th>Tipe</th>
                <th>Qty</th>
                <th>Harga Satuan</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {pendingOrders.map((o) => (
                <tr key={o.id}>
                  <td>{o.name}</td>
                  <td>{o.item_type}</td>
                  <td>{o.quantity}</td>
                  <td>Rp {Number(o.unit_price).toLocaleString("id-ID")}</td>
                  <td>Rp {Number(o.subtotal).toLocaleString("id-ID")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ===== 3. INPUT IKAN ===== */}
      <section>
        <h2>3. Tambah Item Ikan (Opsional)</h2>
        <select
          value={selectedFishId}
          onChange={(e) => setSelectedFishId(e.target.value)}
        >
          <option value="">-- Pilih Jenis Ikan --</option>
          {fishTypes.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} - Rp {Number(f.price_per_kg).toLocaleString("id-ID")}/kg
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
        <button onClick={handleAddFish}>Tambah</button>
        {itemError && <span style={{ color: "red" }}> {itemError}</span>}

        {fishItems.length > 0 && (
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
              {fishItems.map((item, i) => (
                <tr key={i}>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>
                    Rp{" "}
                    {Number(item.unit_price_snapshot).toLocaleString("id-ID")}
                  </td>
                  <td>Rp {Number(item.subtotal).toLocaleString("id-ID")}</td>
                  <td>
                    <button onClick={() => handleRemoveFish(i)}>Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ===== 4. DENDA ===== */}
      <section>
        <h2>4. Denda Kerusakan Alat (Opsional)</h2>
        <div>
          {PENALTY_TYPES.map((p) => (
            <button
              key={p.label}
              onClick={() => handleAddPenalty(p)}
              style={{ marginRight: 8 }}
            >
              + {p.label} (Rp {p.price.toLocaleString("id-ID")})
            </button>
          ))}
        </div>
        {penaltyItems.length > 0 && (
          <table border="1" width="100%" style={{ marginTop: 8 }}>
            <thead>
              <tr>
                <th>Jenis Denda</th>
                <th>Qty</th>
                <th>Harga Satuan</th>
                <th>Subtotal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {penaltyItems.map((p, i) => (
                <tr key={i}>
                  <td>{p.name}</td>
                  <td>{p.quantity}</td>
                  <td>Rp {Number(p.unit_price).toLocaleString("id-ID")}</td>
                  <td>Rp {Number(p.subtotal).toLocaleString("id-ID")}</td>
                  <td>
                    <button onClick={() => handleRemovePenalty(i)}>
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ===== 5. RINGKASAN ===== */}
      <section>
        <h2>5. Ringkasan Harga</h2>
        <p>Subtotal Ikan: Rp {subtotalFish.toLocaleString("id-ID")}</p>
        <p>
          Diskon Tier ({selectedArrival?.discount_percentage ?? 0}% khusus
          ikan): - Rp {discountTier.toLocaleString("id-ID")}
        </p>
        {/* [6] Info voucher aktif */}
        {activeVoucher && (
          <p style={{ color: "green" }}>
            Voucher aktif: - Rp{" "}
            {Number(activeVoucher.amount).toLocaleString("id-ID")} (akan
            otomatis digunakan)
          </p>
        )}
        <p>
          Subtotal Pending Orders: Rp {subtotalPending.toLocaleString("id-ID")}
        </p>
        <p>Subtotal Denda: Rp {subtotalPenalty.toLocaleString("id-ID")}</p>
        <hr />
        <p>
          <strong>Total Bayar: Rp {finalAmount.toLocaleString("id-ID")}</strong>
        </p>
        <p>Poin yang akan didapat: +{pointsPreview} poin</p>
      </section>

      {/* ===== 6. PEMBAYARAN ===== */}
      <section>
        <h2>6. Pembayaran</h2>
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

      {/* ===== 7. SUBMIT ===== */}
      <section>
        <button onClick={handleSubmit} disabled={isSubmitDisabled}>
          {loading ? "Memproses..." : "Proses Checkout"}
        </button>
        {!selectedArrival && <span> (Pilih member terlebih dahulu)</span>}
        {selectedArrival && !hasAnyItem && <span> (Tidak ada item)</span>}
        {selectedArrival && hasAnyItem && !paymentMethod && (
          <span> (Pilih metode pembayaran)</span>
        )}
      </section>
    </div>
  );
};

export default Checkout;
