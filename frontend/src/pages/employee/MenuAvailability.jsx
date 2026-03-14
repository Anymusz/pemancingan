import { useEffect, useState } from "react";
import employeeService from "../../services/employeeService";
import { useToast } from "@/hooks/useToast";

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
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-800 mb-6">
        Ketersediaan Menu
      </h1>

      {loading ? (
        <p className="text-gray-500 text-sm">Memuat menu...</p>
      ) : menus.length === 0 ? (
        <p className="text-gray-500 text-sm">Semua menu aktif</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Nama</th>
                <th className="px-4 py-3 text-left">Kategori</th>
                <th className="px-4 py-3 text-left">Harga</th>
                <th className="px-4 py-3 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {menus.map((menu) => (
                <tr key={menu.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {menu.name}
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-600">
                    {menu.category}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    Rp {Number(menu.price).toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(menu.id)}
                      disabled={actionLoading[menu.id]}
                      className={`px-3 py-1.5 text-xs font-medium rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                        menu.availability === "available"
                          ? "bg-red-100 text-red-700 hover:bg-red-200"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                    >
                      {actionLoading[menu.id]
                        ? "Memproses..."
                        : menu.availability === "available"
                          ? "Nonaktifkan"
                          : "Aktifkan"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Stok Ikan Section */}
      <div className="mt-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          📦 Stok Ikan
        </h2>

        {fishStocksLoading ? (
          <p className="text-gray-500 text-sm">Memuat data stok ikan...</p>
        ) : fishStocks.length === 0 ? (
          <p className="text-gray-500 text-sm">Tidak ada data stok ikan.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Nama Ikan</th>
                  <th className="px-4 py-3 text-left">Stok Saat Ini (kg)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {fishStocks.map((fish) => (
                  <tr key={fish.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {fish.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {Number(fish.current_stock_kg).toLocaleString("id-ID", {
                        minimumFractionDigits: 1,
                      })}{" "}
                      kg
                      {fish.is_below_threshold && (
                        <span className="ml-2 text-red-600 font-semibold text-xs">
                          Stok Rendah
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
