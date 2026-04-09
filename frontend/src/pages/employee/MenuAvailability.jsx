import { useEffect, useState } from "react";
import employeeService from "../../services/employeeService";
import rentalService from "../../services/rentalService";
import { useToast } from "@/hooks/useToast";
import { formatCurrency } from "@/utils/utils";
import { Package, Fish, UtensilsCrossed } from "lucide-react";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { imageCell } from "@/components/common/ImageCell";

// ==================== COLUMN DEFINITIONS ====================

const menuColumns = [
  imageCell,
  {
    key: "name",
    header: "Nama",
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
    key: "availability",
    header: "Status",
    render: (row) => <StatusBadge status={row.availability} />,
  },
];

const fishStockColumns = [
  { key: "name", header: "Nama Ikan" },
  {
    key: "current_stock_kg",
    header: "Stok Saat Ini",
    render: (row) => (
      <div className="flex items-center gap-2">
        <span>{Number(row.current_stock_kg).toFixed(1)} kg</span>
        {row.is_below_threshold && <StatusBadge status="low_stock" />}
      </div>
    ),
  },
];

const rentalColumns = [
  imageCell,
  {
    key: "name",
    header: "Nama Item",
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
    key: "is_active",
    header: "Status",
    render: (row) => (
      <StatusBadge status={row.is_active ? "active" : "deactivated"} />
    ),
  },
];

// ==================== COMPONENT ====================

export default function MenuAvailability() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [fishStocks, setFishStocks] = useState([]);
  const [fishStocksLoading, setFishStocksLoading] = useState(true);
  const [rentalItems, setRentalItems] = useState([]);
  const [rentalLoading, setRentalLoading] = useState(true);
  const [rentalActionLoading, setRentalActionLoading] = useState({});
  const toast = useToast();

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const res = await employeeService.getAllMenus();
        setMenus(res.data ?? []);
      } catch {
        toast.error("Gagal memuat data menu");
      } finally {
        setLoading(false);
      }
    };

    const fetchFishStocks = async () => {
      try {
        const res = await employeeService.getFishStocks();
        setFishStocks(res.data?.fish_stocks ?? []);
      } catch (err) {
        console.error("Gagal memuat stok ikan:", err);
      } finally {
        setFishStocksLoading(false);
      }
    };

    const fetchRentalItems = async () => {
      try {
        const res = await rentalService.getActiveRentalItems();
        setRentalItems(res.data?.rental_items ?? []);
      } catch {
        toast.error("Gagal memuat data rental item");
      } finally {
        setRentalLoading(false);
      }
    };

    Promise.all([fetchMenus(), fetchRentalItems(), fetchFishStocks()]);
  }, [toast]);

  const handleToggle = async (menuId) => {
    setActionLoading((prev) => ({ ...prev, [menuId]: true }));
    try {
      const res = await employeeService.updateMenuAvailability(menuId);
      setMenus((prev) =>
        prev.map((m) =>
          m.id === menuId ? { ...m, availability: res.data.availability } : m,
        ),
      );
      toast.success("Status menu berhasil diubah");
    } catch {
      toast.error("Gagal mengubah status menu");
    } finally {
      setActionLoading((prev) => ({ ...prev, [menuId]: false }));
    }
  };

  const handleToggleRental = async (itemId) => {
    setRentalActionLoading((prev) => ({ ...prev, [itemId]: true }));
    try {
      await rentalService.employeeToggleRentalActive(itemId);
      setRentalItems((prev) =>
        prev.map((i) =>
          i.id === itemId ? { ...i, is_active: !i.is_active } : i,
        ),
      );
      toast.success("Status rental item berhasil diubah");
    } catch {
      toast.error("Gagal mengubah status rental item");
    } finally {
      setRentalActionLoading((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  return (
    <div className="space-y-10 p-1">
      {/* ===== Menu Availability ===== */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5" />
          <h2 className="text-lg font-semibold text-foreground">
            Ketersediaan Menu
          </h2>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Memuat menu...</p>
        ) : menus.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tidak ada data menu.</p>
        ) : (
          <DataTable
            columns={menuColumns}
            data={menus}
            getRowActions={(row) => [
              {
                label:
                  row.availability === "available" ? "Nonaktifkan" : "Aktifkan",
                variant:
                  row.availability === "available" ? "danger" : "default",
                onClick: () => handleToggle(row.id),
                loading: actionLoading[row.id],
              },
            ]}
          />
        )}
      </section>

      {/* ===== Rental Items ===== */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          <h2 className="text-lg font-semibold text-foreground">
            Ketersediaan Rental
          </h2>
        </div>
        {rentalLoading ? (
          <p className="text-sm text-muted-foreground">Memuat rental item...</p>
        ) : rentalItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Tidak ada data rental item.
          </p>
        ) : (
          <DataTable
            columns={rentalColumns}
            data={rentalItems}
            getRowActions={(row) => [
              {
                label: row.is_active ? "Nonaktifkan" : "Aktifkan",
                variant: row.is_active ? "danger" : "default",
                onClick: () => handleToggleRental(row.id),
                loading: rentalActionLoading[row.id],
              },
            ]}
          />
        )}
      </section>

      {/* ===== Stok Ikan ===== */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Fish className="w-5 h-5" />
          <h2 className="text-lg font-semibold text-foreground">Stok Ikan</h2>
        </div>

        {fishStocksLoading ? (
          <p className="text-sm text-muted-foreground">
            Memuat data stok ikan...
          </p>
        ) : fishStocks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Tidak ada data stok ikan.
          </p>
        ) : (
          <DataTable columns={fishStockColumns} data={fishStocks} />
        )}
      </section>
    </div>
  );
}
