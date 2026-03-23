// File: src/pages/employee/AddOrder.jsx

import { useState, useEffect, useCallback, useMemo } from "react";
import employeeService from "../../services/employeeService";
import { useToast } from "@/hooks/useToast";
import { formatDateTime, formatCurrency } from "@/utils/utils";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/FormInput";
import { SearchModal } from "@/components/common/SearchModal";

const RENTAL_PRICE = 10000;

const AddOrder = ({ preselectArrivalId, onPreselectConsumed }) => {
  const [menus, setMenus] = useState([]);
  const [selectedArrival, setSelectedArrival] = useState(null);

  const [quantities, setQuantities] = useState({});
  const [rentalQty, setRentalQty] = useState(0);

  const [fetchLoading, setFetchLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const toast = useToast();

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

  // ==================== PRESELECT ARRIVAL (FROM PROPS) ====================
  useEffect(() => {
    if (!preselectArrivalId) return;
    const doPreselect = async () => {
      try {
        const res = await employeeService.getTodayArrivals();
        if (res.success) {
          const found = res.data.arrivals.find(
            (a) => a.arrival_id === preselectArrivalId,
          );
          if (found) {
            setSelectedArrival(found);
          } else {
            toast.error(
              "Kedatangan member tersebut tidak ditemukan di hari ini",
            );
          }
        }
      } catch {
        toast.error("Gagal memuat data kedatangan");
      } finally {
        if (onPreselectConsumed) onPreselectConsumed();
      }
    };
    doPreselect();
    // Only run once when preselectArrivalId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectArrivalId]);

  // ==================== SEARCH ARRIVAL (for SearchModal) ====================
  const handleSearchArrival = useCallback(async (query) => {
    if (query.trim()) {
      const res = await employeeService.searchArrival(query);
      return res.data.arrivals;
    } else {
      const res = await employeeService.getTodayArrivals();
      return res.data.arrivals.filter((a) => a.status === "active");
    }
  }, []);

  const handleClearArrival = () => {
    setSelectedArrival(null);
    setQuantities({});
    setRentalQty(0);
  };

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
  const totalMenuQty = Object.values(quantities).reduce(
    (acc, qty) => acc + qty,
    0,
  );
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

      Object.entries(quantities).forEach(([menuId, qty]) => {
        if (qty > 0) {
          items.push({
            item_type: "menu",
            item_id: Number(menuId),
            quantity: qty,
          });
        }
      });

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
        toast.success(
          `Berhasil menambahkan ${items.length} jenis item ke order member`,
        );
        setQuantities({});
        setRentalQty(0);
        setSelectedArrival(null);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal menambahkan order");
    } finally {
      setSubmitLoading(false);
    }
  };

  const isSubmitDisabled = !selectedArrival || !hasItems || submitLoading;

  // ==================== MENU COLUMNS ====================
  const menuColumns = [
    {
      key: "name",
      header: "Nama Menu",
      render: (row) => <span className="font-medium">{row.name}</span>,
    },
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
              disabled={qty <= 0}
              onClick={() => handleMenuQtyChange(row.id, -1)}
            >
              −
            </Button>
            <Input
              type="number"
              min="0"
              value={qty}
              onChange={(e) =>
                handleMenuQtyManualChange(row.id, e.target.value)
              }
              className="w-14 text-center h-7 px-1"
            />
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => handleMenuQtyChange(row.id, 1)}
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

  // ==================== RENDER ====================
  return (
    <div className="space-y-8">
      {/* Page header */}
      <h1 className="text-2xl font-bold text-foreground">Tambah Order</h1>

      {/* ===== 1. PILIH ARRIVAL ===== */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">
          1. Pilih Member (Kedatangan Hari Ini)
        </h2>

        {selectedArrival ? (
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
            <div className="space-y-0.5">
              <p className="font-semibold text-foreground">
                {selectedArrival.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedArrival.member_code} · Tier {selectedArrival.tier} ·
                Check-in {formatDateTime(selectedArrival.check_in_at)}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleClearArrival}>
              Ganti
            </Button>
          </div>
        ) : (
          <SearchModal
            triggerLabel="Pilih Member"
            placeholder="Cari nama / member ID / HP..."
            title="Pilih Member (Kedatangan Hari Ini)"
            emptyMessage="Tidak ada member yang check-in aktif hari ini"
            onSearch={handleSearchArrival}
            onSelect={(arrival) => setSelectedArrival(arrival)}
            getItemKey={(item) => item.arrival_id}
            renderItem={(item) => (
              <div className="flex flex-col gap-0.5 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {item.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.member_code} · Tier {item.tier} · Check-in{" "}
                  {formatDateTime(item.check_in_at)}
                </p>
              </div>
            )}
          />
        )}
      </section>

      {/* ===== 2. KANTIN / MENU ===== */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">
          2. Makanan &amp; Minuman
        </h2>
        <DataTable
          columns={menuColumns}
          data={menus}
          loading={fetchLoading}
          emptyMessage="Tidak ada menu aktif saat ini."
        />
      </section>

      {/* ===== 3. RENTAL ALAT PANCING ===== */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">
          3. Sewa Alat Pancing
        </h2>
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border p-4">
          <div className="space-y-0.5">
            <p className="font-semibold text-foreground">
              Sewa / Rental Stik Pancing
            </p>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(RENTAL_PRICE)} / stik
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={rentalQty <= 0}
              onClick={() => handleRentalQtyChange(-1)}
            >
              −
            </Button>
            <Input
              type="number"
              min="0"
              value={rentalQty}
              onChange={(e) => handleRentalQtyManualChange(e.target.value)}
              className="w-16 text-center h-8 px-1"
            />
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => handleRentalQtyChange(1)}
            >
              +
            </Button>
          </div>
          <div className="min-w-30 text-right">
            {rentalQty > 0 ? (
              <span className="font-semibold text-foreground">
                {formatCurrency(rentalQty * RENTAL_PRICE)}
              </span>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        </div>
      </section>

      {/* ===== 4. RINGKASAN & SUBMIT ===== */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">
          4. Ringkasan &amp; Simpan
        </h2>

        {hasItems && (
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <p className="text-sm text-foreground">
              Total Item Menu:{" "}
              <span className="font-semibold">{totalMenuQty} pcs</span>
            </p>
            <p className="text-sm text-foreground">
              Total Sewa Stik:{" "}
              <span className="font-semibold">{rentalQty} stik</span>
            </p>
            <div className="border-t border-border pt-2">
              <p className="font-semibold text-foreground">
                Total Estimasi:{" "}
                <span className="text-primary">
                  {formatCurrency(previewSubtotal)}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                * Total estimasi ini akan ditambah dengan ikan dan penalti saat
                checkout.
              </p>
            </div>
          </div>
        )}

        {!hasItems && (
          <p className="text-sm text-muted-foreground italic">
            Silakan tambahkan kuantitas pada jenis makanan / sewa alat di atas.
          </p>
        )}

        <Button
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          loading={submitLoading}
          fullWidth
        >
          Simpan Order Transaksi
        </Button>
      </section>
    </div>
  );
};

export default AddOrder;
