// File: src/pages/employee/AddOrder.jsx

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import employeeService from "../../services/employeeService";
import { useToast } from "@/hooks/useToast";
import { formatDateTime } from "@/utils/utils";

const RENTAL_PRICE = 10000;

const AddOrder = ({ preselectArrivalId, onPreselectConsumed }) => {
  const [arrivals, setArrivals] = useState([]);
  const [allArrivals, setAllArrivals] = useState([]); // cache semua active arrival
  const [menus, setMenus] = useState([]);
  const [selectedArrival, setSelectedArrival] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // === MIGRATED: State untuk bulk submission
  const [quantities, setQuantities] = useState({});
  const [rentalQty, setRentalQty] = useState(0);

  const [fetchLoading, setFetchLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const searchTimeout = useRef(null);

  // ==================== FETCH MENUS ====================
  useEffect(() => {
    const fetchMenus = async () => {
      setFetchLoading(true);
      try {
        const res = await employeeService.getMenus();
        if (res.success) setMenus(res.data);
      } catch {
        toast.error("Gagal memuat menu");
      } finally {
        setFetchLoading(false);
      }
    };
    fetchMenus();
  }, [toast]);

  // ==================== FETCH SEMUA ARRIVAL SAAT FOCUS ====================
  const fetchAllArrivals = useCallback(async () => {
    if (allArrivals.length > 0) return; // sudah di-cache
    setSearchLoading(true);
    try {
      const res = await employeeService.getTodayArrivals();
      if (res.success) {
        const active = res.data.arrivals.filter((a) => a.status === "active");
        setAllArrivals(active);
      }
    } catch {
      toast.error("Gagal memuat data kedatangan");
    } finally {
      setSearchLoading(false);
    }
  }, [allArrivals.length, toast]);

  // ==================== AUTO SELECT (DARI PROPS) ====================
  useEffect(() => {
    if (preselectArrivalId) {
      const doPreselect = async () => {
        // Fetch dulu ke backend jika list masih kosong
        if (allArrivals.length === 0) {
          await fetchAllArrivals();
        }
      };
      doPreselect();
    }
  }, [preselectArrivalId, allArrivals.length, fetchAllArrivals]);

  useEffect(() => {
    // Jalankan seleksi bila kombinasi preselect ID ada dan allArrivals sudah sukses termuat
    if (preselectArrivalId && allArrivals.length > 0) {
      const found = allArrivals.find((a) => a.arrival_id === preselectArrivalId);
      if (found) {
        setSelectedArrival(found);
        setSearchQuery(found.name);
        if (onPreselectConsumed) onPreselectConsumed();
      } else {
        toast.error("Kedatangan member tersebut tidak ditemukan di hari ini");
        if (onPreselectConsumed) onPreselectConsumed();
      }
    }
  }, [allArrivals, preselectArrivalId, onPreselectConsumed]);

  // ==================== FILTER REALTIME (DEBOUNCE 300ms) ====================
  useEffect(() => {
    if (selectedArrival || !searchQuery.trim()) return;

    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await employeeService.searchArrival(searchQuery);
        if (res.success) setArrivals(res.data.arrivals);
      } catch {
        toast.error("Gagal mencari arrival");
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout.current);
  }, [searchQuery, selectedArrival, toast]);

  // ==================== ARRIVAL HANDLERS ====================
  const handleFocus = async () => {
    await fetchAllArrivals();
    setShowDropdown(true);
  };

  const handleBlur = () => {
    setTimeout(() => setShowDropdown(false), 150);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (selectedArrival && val !== selectedArrival.name) {
      setSelectedArrival(null);
    }
    setShowDropdown(true);
  };

  const handleSelectArrival = (arrival) => {
    setSelectedArrival(arrival);
    setSearchQuery(arrival.name);
    setShowDropdown(false);
    setArrivals([]);
  };

  const handleClearArrival = () => {
    setSelectedArrival(null);
    setSearchQuery("");
    setArrivals([]);
  };

  // Hasil yang ditampilkan: jika ada query → hasil search, jika kosong → semua active
  const displayArrivals = searchQuery.trim() ? arrivals : allArrivals;

  // ==================== BULK ITEM HANDLERS ====================
  const handleMenuQtyChange = (menuId, change) => {
    setQuantities((prev) => {
      const currentQty = prev[menuId] || 0;
      const newQty = Math.max(0, currentQty + change);
      return { ...prev, [menuId]: newQty };
    });
  };

  const handleMenuQtyManualChange = (menuId, val) => {
    let newQty = parseInt(val, 10);
    if (isNaN(newQty)) newQty = 0;
    setQuantities((prev) => ({
      ...prev,
      [menuId]: Math.max(0, newQty),
    }));
  };

  const handleRentalQtyChange = (change) => {
    setRentalQty((prev) => Math.max(0, prev + change));
  };

  const handleRentalQtyManualChange = (val) => {
    let newQty = parseInt(val, 10);
    if (isNaN(newQty)) newQty = 0;
    setRentalQty(Math.max(0, newQty));
  };

  // ==================== PREVIEW & HAS ITEMS ====================
  const totalMenuQty = Object.values(quantities).reduce((acc, qty) => acc + qty, 0);
  const totalItemQty = totalMenuQty + rentalQty;
  const hasItems = totalItemQty > 0;

  const previewSubtotal = useMemo(() => {
    let total = 0;
    Object.entries(quantities).forEach(([menuId, qty]) => {
      if (qty > 0) {
        const menu = menus.find((m) => m.id === Number(menuId));
        if (menu) total += menu.price * qty;
      }
    });
    total += rentalQty * RENTAL_PRICE;
    return total;
  }, [quantities, rentalQty, menus]);

  // ==================== SUBMIT ====================
  const handleSubmit = async () => {
    if (!selectedArrival) return;
    if (!hasItems) return;

    setSubmitLoading(true);
    try {
      const items = [];

      // Susun item menu
      Object.entries(quantities).forEach(([menuId, qty]) => {
        if (qty > 0) {
          items.push({
            item_type: "menu",
            item_id: Number(menuId),
            quantity: qty,
          });
        }
      });

      // Susun item rental
      if (rentalQty > 0) {
        items.push({
          item_type: "rental",
          quantity: rentalQty,
        });
      }

      const payload = {
        arrival_id: selectedArrival.arrival_id,
        items: items,
      };

      const res = await employeeService.createPendingOrder(payload);
      if (res.success) {
        toast.success(`Berhasil menambahkan ${items.length} jenis item ke order member`);
        // Reset state item
        setQuantities({});
        setRentalQty(0);
        // Reset arrival
        setSelectedArrival(null);
        setSearchQuery("");
        setArrivals([]);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal menambahkan order");
    } finally {
      setSubmitLoading(false);
    }
  };

  const isSubmitDisabled = !selectedArrival || !hasItems || submitLoading;

  return (
    <div>
      <h1>Tambah Order</h1>

      {/* ===== 1. PILIH ARRIVAL ===== */}
      <section>
        <h2>1. Pilih Member (Kedatangan Hari Ini)</h2>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="Cari nama / member ID / HP..."
            autoComplete="off"
            disabled={!!selectedArrival}
          />
          {searchLoading && <span> Mencari...</span>}
          {selectedArrival && (
            <button onClick={handleClearArrival}>Ganti</button>
          )}

          {/* Autocomplete Dropdown */}
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
              {displayArrivals.length === 0 ? (
                <div style={{ padding: 8 }}>
                  {allArrivals.length === 0
                    ? "Belum ada member yang check-in hari ini"
                    : "Tidak ada hasil untuk pencarian ini"}
                </div>
              ) : (
                displayArrivals.map((a) => (
                  <div
                    key={a.arrival_id}
                    onMouseDown={() => handleSelectArrival(a)}
                    style={{
                      padding: 8,
                      cursor: "pointer",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <strong>{a.name}</strong> | {a.member_code} | {a.tier} |
                    Check-in:{" "}
                    {formatDateTime(a.check_in_at)}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {selectedArrival && (
          <div style={{ border: "1px solid #000", padding: 8, marginTop: 8 }}>
            <strong>Member:</strong> {selectedArrival.name} |{" "}
            {selectedArrival.member_code} | Tier: {selectedArrival.tier}
          </div>
        )}
      </section>

      {/* ===== 2. KANTIN / MENU ===== */}
      <section>
        <h2>2. Makanan & Minuman</h2>
        {fetchLoading ? (
          <p>Memuat menu...</p>
        ) : menus.length === 0 ? (
          <p>Tidak ada menu aktif saat ini.</p>
        ) : (
          <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr style={{ textAlign: "left" }}>
                <th>Nama Menu</th>
                <th>Kategori</th>
                <th>Harga</th>
                <th>Qty</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {menus.map((m) => {
                const qty = quantities[m.id] || 0;
                const subtotal = qty * m.price;
                return (
                  <tr key={m.id}>
                    <td><strong>{m.name}</strong></td>
                    <td>{m.category}</td>
                    <td>Rp {Number(m.price).toLocaleString("id-ID")}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button 
                          onClick={() => handleMenuQtyChange(m.id, -1)} 
                          disabled={qty <= 0}
                          style={{ padding: "4px 8px" }}
                        >-</button>
                        <input
                          type="number"
                          min="0"
                          value={qty}
                          onChange={(e) => handleMenuQtyManualChange(m.id, e.target.value)}
                          style={{ width: "50px", textAlign: "center" }}
                        />
                        <button 
                          onClick={() => handleMenuQtyChange(m.id, 1)}
                          style={{ padding: "4px 8px" }}
                        >+</button>
                      </div>
                    </td>
                    <td>{qty > 0 ? `Rp ${subtotal.toLocaleString("id-ID")}` : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {/* ===== 3. RENTAL ALAT PANCING ===== */}
      <section>
        <h2>3. Sewa Alat Pancing</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px", border: "1px solid #ddd" }}>
          <div>
            <strong>Sewa / Rental Stik Pancing</strong>
            <br />
            Rp {RENTAL_PRICE.toLocaleString("id-ID")} / stik
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
            <button 
              onClick={() => handleRentalQtyChange(-1)} 
              disabled={rentalQty <= 0}
              style={{ padding: "4px 12px", fontSize: "16px" }}
            >-</button>
            <input
              type="number"
              min="0"
              value={rentalQty}
              onChange={(e) => handleRentalQtyManualChange(e.target.value)}
              style={{ width: "60px", textAlign: "center", fontSize: "16px", padding: "4px" }}
            />
            <button 
              onClick={() => handleRentalQtyChange(1)}
              style={{ padding: "4px 12px", fontSize: "16px" }}
            >+</button>
          </div>
          <div style={{ minWidth: "120px", textAlign: "right" }}>
            {rentalQty > 0 
              ? <strong>Rp {(rentalQty * RENTAL_PRICE).toLocaleString("id-ID")}</strong> 
              : <span>-</span>}
          </div>
        </div>
      </section>

      {/* ===== 4. RINGKASAN & SUBMIT ===== */}
      <section>
        <h2>4. Ringkasan & Simpan</h2>
        {hasItems ? (
          <div style={{ padding: "16px", background: "#f9f9f9", border: "1px solid #ddd", marginBottom: "16px" }}>
            <p style={{ margin: "0 0 8px 0" }}>Total Item Menu: <strong>{totalMenuQty} pcs</strong></p>
            <p style={{ margin: "0 0 8px 0" }}>Total Sewa Stik: <strong>{rentalQty} stik</strong></p>
            <hr style={{ margin: "12px 0" }} />
            <h3 style={{ margin: 0 }}>Total Estimasi: Rp {previewSubtotal.toLocaleString("id-ID")}</h3>
            <p style={{ fontSize: "12px", color: "#666", margin: "4px 0 0 0" }}>* Total estimasi ini akan ditambah dengan ikan dan penalti saat checkout.</p>
          </div>
        ) : (
          <p style={{ color: "#666", fontStyle: "italic" }}>Silakan tambahkan kuantitas pada jenis makanan / sewa alat di atas.</p>
        )}
        
        <button 
          onClick={handleSubmit} 
          disabled={isSubmitDisabled}
          style={{ padding: "12px 24px", fontSize: "16px", fontWeight: "bold", background: isSubmitDisabled ? "#ccc" : "#0A66C2", color: "#fff", border: "none", borderRadius: "4px", cursor: isSubmitDisabled ? "not-allowed" : "pointer" }}
        >
          {submitLoading ? "Menyimpan..." : "Simpan Order Transaksi"}
        </button>
      </section>
    </div>
  );
};

export default AddOrder;
