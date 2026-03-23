import { useEffect, useState } from "react";
import employeeService from "../../services/employeeService";
import { useToast } from "@/hooks/useToast";
import { formatCurrency } from "@/utils/utils";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";

// ==================== COLUMN DEFINITIONS ====================

const menuColumns = [
  {
    key: "name",
    header: "Nama",
    render: (row) => <span className="font-medium">{row.name}</span>,
  },
  {
    key: "category",
    header: "Kategori",
    render: (row) => <span className="capitalize">{row.category}</span>,
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

// ==================== COMPONENT ====================

export default function MenuAvailability() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [fishStocks, setFishStocks] = useState([]);
  const [fishStocksLoading, setFishStocksLoading] = useState(true);
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

    fetchMenus();
    fetchFishStocks();
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

  return (
    <div className="space-y-10 p-1">
      {/* ===== Menu Availability ===== */}
      <section className="space-y-4">
        <h1 className="text-2xl font-bold text-foreground">
          Ketersediaan Menu
        </h1>

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

      {/* ===== Stok Ikan ===== */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">📦 Stok Ikan</h2>

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
