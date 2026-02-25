import { useEffect, useState } from "react";
import employeeService from "../../services/employeeService";

export default function MenuAvailability() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const res = await employeeService.getAllMenus();
        setMenus(res.data ?? []);
      } catch {
        showToast("Gagal memuat data menu");
      } finally {
        setLoading(false);
      }
    };
    fetchMenus();
  }, []);

  const handleToggle = async (menuId) => {
    setActionLoading((prev) => ({ ...prev, [menuId]: true }));
    try {
      const res = await employeeService.updateMenuAvailability(menuId);
      setMenus((prev) =>
        prev.map((m) =>
          m.id === menuId ? { ...m, availability: res.data.availability } : m,
        ),
      );
      showToast("Status menu berhasil diubah", "success");
    } catch {
      showToast("Gagal mengubah status menu");
    } finally {
      setActionLoading((prev) => ({ ...prev, [menuId]: false }));
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-800 mb-6">
        Ketersediaan Menu
      </h1>

      {toast && (
        <div
          className={`mb-4 px-4 py-3 rounded text-sm font-medium ${
            toast.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {toast.message}
        </div>
      )}

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
    </div>
  );
}
