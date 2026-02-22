// File: src/pages/employee/AddOrder.jsx

import { useState, useEffect, useRef } from "react";
import employeeService from "../../services/employeeService";

const RENTAL_PRICE = 10000;

const AddOrder = () => {
  const [arrivals, setArrivals] = useState([]);
  const [allArrivals, setAllArrivals] = useState([]); // cache semua active arrival
  const [menus, setMenus] = useState([]);
  const [selectedArrival, setSelectedArrival] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [itemType, setItemType] = useState("menu");
  const [selectedMenuId, setSelectedMenuId] = useState("");
  const [rentalQty, setRentalQty] = useState(1);
  const [menuQty, setMenuQty] = useState(1);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const searchTimeout = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ==================== FETCH MENUS ====================
  useEffect(() => {
    const fetchMenus = async () => {
      setFetchLoading(true);
      try {
        const res = await employeeService.getMenus();
        if (res.success) setMenus(res.data);
      } catch {
        showToast("Gagal memuat menu", "error");
      } finally {
        setFetchLoading(false);
      }
    };
    fetchMenus();
  }, []);

  // ==================== FETCH SEMUA ARRIVAL SAAT FOCUS ====================
  const fetchAllArrivals = async () => {
    if (allArrivals.length > 0) return; // sudah di-cache
    setSearchLoading(true);
    try {
      const res = await employeeService.getTodayArrivals();
      if (res.success) {
        const active = res.data.arrivals.filter((a) => a.status === "active");
        setAllArrivals(active);
      }
    } catch {
      showToast("Gagal memuat data kedatangan", "error");
    } finally {
      setSearchLoading(false);
    }
  };

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
        showToast("Gagal mencari arrival", "error");
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout.current);
  }, [searchQuery, selectedArrival]);

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

  // ==================== ITEM HANDLERS ====================
  const handleItemTypeChange = (val) => {
    setItemType(val);
    setSelectedMenuId("");
    setMenuQty(1);
    setRentalQty(1);
  };

  // ==================== PREVIEW ====================
  const previewSubtotal = () => {
    if (itemType === "rental") return rentalQty * RENTAL_PRICE;
    if (itemType === "menu" && selectedMenuId) {
      const menu = menus.find((m) => m.id === Number(selectedMenuId));
      return menu ? menuQty * menu.price : 0;
    }
    return 0;
  };

  // ==================== SUBMIT ====================
  const handleSubmit = async () => {
    if (!selectedArrival) return;
    if (itemType === "menu" && !selectedMenuId) {
      showToast("Pilih menu terlebih dahulu", "error");
      return;
    }

    setSubmitLoading(true);
    try {
      const payload = {
        arrival_id: selectedArrival.arrival_id,
        item_type: itemType,
        item_id: itemType === "menu" ? Number(selectedMenuId) : undefined,
        quantity: itemType === "menu" ? menuQty : rentalQty,
      };

      const res = await employeeService.createPendingOrder(payload);
      if (res.success) {
        showToast(
          `Order berhasil ditambahkan: ${res.data.order.name} ×${res.data.order.quantity}`,
        );
        setItemType("menu");
        setSelectedMenuId("");
        setMenuQty(1);
        setRentalQty(1);
      }
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Gagal menambahkan order",
        "error",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const isSubmitDisabled =
    !selectedArrival ||
    (itemType === "menu" && (!selectedMenuId || menuQty < 1)) ||
    (itemType === "rental" && rentalQty < 1) ||
    submitLoading;

  // ==================== RENDER ====================
  return (
    <div>
      {/* Toast */}
      {toast && (
        <div>
          [{toast.type === "success" ? "OK" : "ERROR"}] {toast.message}
        </div>
      )}

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

        {selectedArrival && (
          <div style={{ border: "1px solid #000", padding: 8, marginTop: 8 }}>
            <strong>Member:</strong> {selectedArrival.name} |{" "}
            {selectedArrival.member_code} | Tier: {selectedArrival.tier}
          </div>
        )}
      </section>

      {/* ===== 2. PILIH ITEM TYPE ===== */}
      <section>
        <h2>2. Jenis Order</h2>
        <select
          value={itemType}
          onChange={(e) => handleItemTypeChange(e.target.value)}
        >
          <option value="menu">Makanan / Minuman</option>
          <option value="rental">Sewa Alat Pancing</option>
        </select>
      </section>

      {/* ===== 3. DETAIL ITEM ===== */}
      <section>
        <h2>3. Detail Item</h2>

        {itemType === "menu" && (
          <div>
            {fetchLoading ? (
              <p>Memuat menu...</p>
            ) : (
              <>
                <select
                  value={selectedMenuId}
                  onChange={(e) => setSelectedMenuId(e.target.value)}
                >
                  <option value="">-- Pilih Menu --</option>
                  {menus.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.category}) — Rp{" "}
                      {Number(m.price).toLocaleString("id-ID")}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={menuQty}
                  onChange={(e) =>
                    setMenuQty(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  style={{ width: 60 }}
                />
                <span> pcs</span>
              </>
            )}
          </div>
        )}

        {itemType === "rental" && (
          <div>
            <span>
              Sewa Alat Pancing — Rp {RENTAL_PRICE.toLocaleString("id-ID")}/stik
            </span>
            <br />
            <input
              type="number"
              min="1"
              value={rentalQty}
              onChange={(e) =>
                setRentalQty(Math.max(1, parseInt(e.target.value) || 1))
              }
              style={{ width: 60 }}
            />
            <span> stik</span>
          </div>
        )}
      </section>

      {/* ===== 4. PREVIEW & SUBMIT ===== */}
      <section>
        {previewSubtotal() > 0 && (
          <p>
            Subtotal: Rp {previewSubtotal().toLocaleString("id-ID")} (dibayar
            saat checkout)
          </p>
        )}
        <button onClick={handleSubmit} disabled={isSubmitDisabled}>
          {submitLoading ? "Menyimpan..." : "Simpan Order"}
        </button>
      </section>
    </div>
  );
};

export default AddOrder;
