// File: src/pages/employee/AddOrder.jsx

import { useState, useEffect, useMemo } from "react";
import { Minus, Plus } from "lucide-react";
import employeeService from "../../services/employeeService";
import rentalService from "../../services/rentalService";
import { useToast } from "@/hooks/useToast";
import { formatCurrency } from "@/utils/utils";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/common/Button";
import { imageCell } from "@/components/common/ImageCell";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ArrivalPicker } from "@/components/common/ArrivalPicker";

const AddOrder = ({ preselectArrivalId, onPreselectConsumed }) => {
  const [menus, setMenus] = useState([]);
  const [rentalItems, setRentalItems] = useState([]);
  const [arrivals, setArrivals] = useState([]);
  const [selectedArrival, setSelectedArrival] = useState(null);

  const [quantities, setQuantities] = useState({});
  const [rentalQuantities, setRentalQuantities] = useState({});

  const [fetchLoading, setFetchLoading] = useState(false);
  const [rentalLoading, setRentalLoading] = useState(false);
  const [arrivalsLoading, setArrivalsLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const toast = useToast();

  // ===== FETCH MENUS & RENTAL ITEMS =====
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

    const fetchRentalItems = async () => {
      setRentalLoading(true);
      try {
        const res = await rentalService.getActiveRentalItems();
        if (res.success) setRentalItems(res.data.rental_items ?? []);
      } catch {
        toast.error("Gagal memuat rental item");
      } finally {
        setRentalLoading(false);
      }
    };

    const fetchArrivals = async () => {
      setArrivalsLoading(true);
      try {
        const res = await employeeService.getTodayArrivals();
        if (res.success) {
          setArrivals(res.data.arrivals.filter((a) => a.status === "active"));
        }
      } catch {
        toast.error("Gagal memuat data kedatangan");
      } finally {
        setArrivalsLoading(false);
      }
    };

    Promise.all([fetchMenus(), fetchRentalItems(), fetchArrivals()]);
  }, [toast]);

  // ===== PRESELECT ARRIVAL (FROM PROPS) =====
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectArrivalId]);

  const handleClearArrival = () => {
    setSelectedArrival(null);
    setQuantities({});
    setRentalQuantities({});
  };

  // ===== BULK ITEM HANDLERS =====
  const handleMenuQtyChange = (menuId, change) => {
    setQuantities((prev) => {
      const currentQty = prev[menuId] || 0;
      const newQty = Math.max(0, currentQty + change);
      return { ...prev, [menuId]: newQty };
    });
  };

  const handleRentalQtyChange = (itemId, change) => {
    setRentalQuantities((prev) => {
      const current = prev[itemId] || 0;
      return { ...prev, [itemId]: Math.max(0, current + change) };
    });
  };

  // ===== PREVIEW & HAS ITEMS =====
  const totalMenuQty = Object.values(quantities).reduce(
    (acc, qty) => acc + qty,
    0,
  );
  const totalRentalQty = Object.values(rentalQuantities).reduce(
    (acc, qty) => acc + qty,
    0,
  );
  const totalItemQty = totalMenuQty + totalRentalQty;
  const hasItems = totalItemQty > 0;

  const previewSubtotal = useMemo(() => {
    let total = 0;
    Object.entries(quantities).forEach(([menuId, qty]) => {
      if (qty > 0) {
        const menu = menus.find((m) => m.id === Number(menuId));
        if (menu) total += menu.price * qty;
      }
    });
    Object.entries(rentalQuantities).forEach(([itemId, qty]) => {
      if (qty > 0) {
        const item = rentalItems.find((r) => r.id === Number(itemId));
        if (item) total += item.price_per_unit * qty;
      }
    });
    return total;
  }, [quantities, rentalQuantities, menus, rentalItems]);

  // ===== SUBMIT =====
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

      Object.entries(rentalQuantities).forEach(([itemId, qty]) => {
        if (qty > 0) {
          items.push({
            item_type: "rental",
            item_id: Number(itemId),
            quantity: qty,
          });
        }
      });

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
        setRentalQuantities({});
        setSelectedArrival(null);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal menambahkan order");
    } finally {
      setSubmitLoading(false);
    }
  };

  const isSubmitDisabled = !selectedArrival || !hasItems || submitLoading;

  // ===== STEPPER RENDERER =====
  const renderStepper = (qty, onDecrement, onIncrement) => (
    <div className="flex items-center gap-2">
      <button
        className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40"
        onClick={onDecrement}
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
        onClick={onIncrement}
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  // ===== MENU COLUMNS =====
  const menuColumns = useMemo(
    () => [
      imageCell,
      {
        key: "name",
        header: "Nama Menu",
        render: (row) => <span className="font-medium">{row.name}</span>,
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
          return renderStepper(
            qty,
            () => handleMenuQtyChange(row.id, -1),
            () => handleMenuQtyChange(row.id, 1),
          );
        },
      },
      {
        key: "subtotal",
        header: "Subtotal",
        render: (row) => {
          const qty = quantities[row.id] || 0;
          return qty > 0 ? (
            formatCurrency(qty * row.price)
          ) : (
            <span className="text-muted-foreground">Rp 0</span>
          );
        },
      },
    ],
    [quantities],
  );

  // ===== RENTAL COLUMNS =====
  const rentalColumns = useMemo(
    () => [
      imageCell,
      {
        key: "name",
        header: "Item Rental",
        render: (row) => <span className="font-medium">{row.name}</span>,
      },
      {
        key: "unit_label",
        header: "Satuan",
        render: (row) => row.unit_label,
      },
      {
        key: "price_per_unit",
        header: "Harga",
        render: (row) => formatCurrency(row.price_per_unit),
      },
      {
        key: "qty",
        header: "Qty",
        render: (row) => {
          const qty = rentalQuantities[row.id] || 0;
          return renderStepper(
            qty,
            () => handleRentalQtyChange(row.id, -1),
            () => handleRentalQtyChange(row.id, 1),
          );
        },
      },
      {
        key: "subtotal",
        header: "Subtotal",
        render: (row) => {
          const qty = rentalQuantities[row.id] || 0;
          return qty > 0 ? (
            formatCurrency(qty * row.price_per_unit)
          ) : (
            <span className="text-muted-foreground">Rp 0</span>
          );
        },
      },
    ],
    [rentalQuantities],
  );

  // ===== SECTION HEADER HELPER =====
  const SectionHeader = ({ n, label, chip }) => (
    <div className="flex items-center gap-2">
      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground shrink-0">
        {n}
      </span>
      <span className="text-sm font-medium text-foreground">{label}</span>
      {chip}
    </div>
  );

  // ===== RENDER =====
  return (
    <div className="space-y-8">
      {/* ===== 1. PILIH ARRIVAL ===== */}
      <section className="space-y-3">
        <SectionHeader n={1} label="Pilih Member (Kedatangan Hari Ini)" />

        <ArrivalPicker
          arrivals={arrivals}
          selectedArrival={selectedArrival}
          onSelect={(arrival) => setSelectedArrival(arrival)}
          onClear={handleClearArrival}
          fetchLoading={arrivalsLoading}
        />
      </section>

      {/* ===== 2. MENU ===== */}
      <section className="space-y-3">
        <SectionHeader n={2} label="Makanan & Minuman" />
        <DataTable
          columns={menuColumns}
          data={menus}
          loading={fetchLoading}
          emptyMessage="Tidak ada menu aktif saat ini."
          rowClassName={(row) => {
            const qty = quantities[row.id] || 0;
            return qty > 0 ? "bg-primary/5 border-l-2 border-l-primary" : "";
          }}
        />
      </section>

      {/* ===== 3. RENTAL ===== */}
      <section className="space-y-3">
        <SectionHeader n={3} label="Sewa Alat" />
        <DataTable
          columns={rentalColumns}
          data={rentalItems}
          loading={rentalLoading}
          emptyMessage="Tidak ada rental item aktif saat ini."
          rowClassName={(row) => {
            const qty = rentalQuantities[row.id] || 0;
            return qty > 0 ? "bg-primary/5 border-l-2 border-l-primary" : "";
          }}
        />
      </section>

      {/* ===== 4. RINGKASAN & SUBMIT ===== */}
      <section className="space-y-4">
        <SectionHeader n={4} label="Ringkasan & Simpan" />

        {hasItems && (
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <p className="text-sm text-foreground">
              Total Item Menu:{" "}
              <span className="font-semibold">{totalMenuQty} pcs</span>
            </p>
            <p className="text-sm text-foreground">
              Total Sewa:{" "}
              <span className="font-semibold">{totalRentalQty} unit</span>
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
                pembayaran.
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
          Order Transaksi
        </Button>
      </section>
    </div>
  );
};

export default AddOrder;
