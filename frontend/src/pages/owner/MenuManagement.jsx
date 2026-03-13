// File: src/pages/owner/MenuManagement.jsx

import { useState, useEffect, useCallback, useRef } from "react";
import ownerService from "../../services/ownerService";
import { useToast } from "@/hooks/useToast";

const MenuManagement = () => {
  const [menus, setMenus] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    available_count: 0,
    unavailable_count: 0,
  });
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const toast = useToast();

  const [filters, setFilters] = useState({
    category: "",
    availability: "",
    search: "",
    include_deleted: false,
  });
  const [searchInput, setSearchInput] = useState("");
  const searchTimeout = useRef(null);

  const [modalState, setModalState] = useState({
    form: false,
    delete: false,
    mode: "add", // 'add' | 'edit'
    selectedMenu: null,
  });

  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "food",
    availability: "available",
    description: "",
  });
  const [formErrors, setFormErrors] = useState({});

  // ---- Fetch ----
  const fetchMenus = useCallback(async (currentFilters) => {
    setLoading(true);
    try {
      const params = {};
      if (currentFilters.category) params.category = currentFilters.category;
      if (currentFilters.availability)
        params.availability = currentFilters.availability;
      if (currentFilters.search) params.search = currentFilters.search;
      if (currentFilters.include_deleted) params.include_deleted = true;

      const res = await ownerService.getMenus(params);
      if (res.success) {
        setMenus(res.data.menus);
        setSummary({
          total: res.data.total,
          available_count: res.data.available_count,
          unavailable_count: res.data.unavailable_count,
        });
      }
    } catch {
      toast.error("Gagal memuat data menu");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMenus(filters);
  }, [filters, fetchMenus]);

  // ---- Filter Handlers ----
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: val }));
    }, 500);
  };

  // ---- Modal Handlers ----
  const openAddModal = () => {
    setForm({
      name: "",
      price: "",
      category: "food",
      availability: "available",
      description: "",
    });
    setFormErrors({});
    setModalState({
      form: true,
      delete: false,
      mode: "add",
      selectedMenu: null,
    });
  };

  const openEditModal = (menu) => {
    setForm({
      name: menu.name,
      price: menu.price,
      category: menu.category,
      availability: menu.availability,
      description: menu.description || "",
    });
    setFormErrors({});
    setModalState({
      form: true,
      delete: false,
      mode: "edit",
      selectedMenu: menu,
    });
  };

  const openDeleteModal = (menu) => {
    setModalState({
      form: false,
      delete: true,
      mode: "edit",
      selectedMenu: menu,
    });
  };

  const closeModals = () => {
    setModalState({
      form: false,
      delete: false,
      mode: "add",
      selectedMenu: null,
    });
  };

  // ---- Validation ----
  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Nama wajib diisi";
    else if (form.name.length > 100) errors.name = "Nama maksimal 100 karakter";
    if (form.price === "" || form.price === null)
      errors.price = "Harga wajib diisi";
    else if (Number(form.price) < 0) errors.price = "Harga tidak boleh negatif";
    if (!form.category) errors.category = "Kategori wajib dipilih";
    if (form.description && form.description.length > 500)
      errors.description = "Maks 500 karakter";
    return errors;
  };

  // ---- CRUD ----
  const handleSubmit = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitLoading(true);
    try {
      if (modalState.mode === "edit") {
        await ownerService.updateMenu(modalState.selectedMenu.id, form);
        toast.success("Menu berhasil diperbarui");
      } else {
        await ownerService.createMenu(form);
        toast.success("Menu berhasil ditambahkan");
      }
      closeModals();
      fetchMenus(filters);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal menyimpan menu");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    setSubmitLoading(true);
    try {
      await ownerService.deleteMenu(modalState.selectedMenu.id);
      toast.success("Menu berhasil dihapus");
      closeModals();
      fetchMenus(filters);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Gagal menghapus menu",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleAvailability = async (menu) => {
    const newAvailability =
      menu.availability === "available" ? "unavailable" : "available";
    // Optimistic update
    setMenus((prev) =>
      prev.map((m) =>
        m.id === menu.id ? { ...m, availability: newAvailability } : m,
      ),
    );
    try {
      await ownerService.toggleMenuAvailability(menu.id, newAvailability);
      toast.success(`Status "${menu.name}" berhasil diubah`);
    } catch {
      // Revert
      setMenus((prev) =>
        prev.map((m) =>
          m.id === menu.id ? { ...m, availability: menu.availability } : m,
        ),
      );
      toast.error("Gagal mengubah status ketersediaan");
    }
  };

  // ==================== RENDER ====================
  return (
    <div>
      <h1>Manajemen Menu</h1>

      {/* Summary */}
      <div>
        <span>Total: {summary.total} | </span>
        <span>Tersedia: {summary.available_count} | </span>
        <span>Tidak Tersedia: {summary.unavailable_count}</span>
      </div>

      {/* Actions */}
      <button onClick={openAddModal}>+ Tambah Menu</button>

      {/* Filters */}
      <div>
        <input
          type="text"
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Cari nama menu..."
        />
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange("category", e.target.value)}
        >
          <option value="">Semua Kategori</option>
          <option value="food">Makanan</option>
          <option value="beverage">Minuman</option>
        </select>
        <select
          value={filters.availability}
          onChange={(e) => handleFilterChange("availability", e.target.value)}
        >
          <option value="">Semua Status</option>
          <option value="available">Tersedia</option>
          <option value="unavailable">Tidak Tersedia</option>
        </select>
        <label>
          <input
            type="checkbox"
            checked={filters.include_deleted}
            onChange={(e) =>
              handleFilterChange("include_deleted", e.target.checked)
            }
          />
          Tampilkan yang dihapus
        </label>
      </div>

      {/* Table */}
      {loading ? (
        <p>Memuat data...</p>
      ) : menus.length === 0 ? (
        <p>Belum ada menu</p>
      ) : (
        <table border="1" width="100%">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Kategori</th>
              <th>Harga</th>
              <th>Ketersediaan</th>
              <th>Deskripsi</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {menus.map((menu) => (
              <tr key={menu.id} style={{ opacity: menu.deleted_at ? 0.5 : 1 }}>
                <td>{menu.name}</td>
                <td>{menu.category === "food" ? "Makanan" : "Minuman"}</td>
                <td>Rp {Number(menu.price).toLocaleString("id-ID")}</td>
                <td>
                  {!menu.deleted_at ? (
                    <button onClick={() => handleToggleAvailability(menu)}>
                      {menu.availability === "available"
                        ? "Tersedia"
                        : "Tidak Tersedia"}
                    </button>
                  ) : (
                    <span>Dihapus</span>
                  )}
                </td>
                <td>{menu.description || "-"}</td>
                <td>
                  {!menu.deleted_at && (
                    <>
                      <button onClick={() => openEditModal(menu)}>Edit</button>
                      {" | "}
                      <button onClick={() => openDeleteModal(menu)}>
                        Hapus
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Form Modal */}
      {modalState.form && (
        <div style={{ border: "1px solid #000", padding: 16, marginTop: 16 }}>
          <h2>{modalState.mode === "edit" ? "Edit Menu" : "Tambah Menu"}</h2>
          <div>
            <label>Nama *</label>
            <br />
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
            {formErrors.name && (
              <span style={{ color: "red" }}> {formErrors.name}</span>
            )}
          </div>
          <div>
            <label>Harga *</label>
            <br />
            <input
              type="number"
              min="0"
              value={form.price}
              onChange={(e) =>
                setForm((p) => ({ ...p, price: e.target.value }))
              }
            />
            {formErrors.price && (
              <span style={{ color: "red" }}> {formErrors.price}</span>
            )}
          </div>
          <div>
            <label>Kategori *</label>
            <br />
            <select
              value={form.category}
              onChange={(e) =>
                setForm((p) => ({ ...p, category: e.target.value }))
              }
            >
              <option value="food">Makanan</option>
              <option value="beverage">Minuman</option>
            </select>
          </div>
          <div>
            <label>Ketersediaan</label>
            <br />
            <select
              value={form.availability}
              onChange={(e) =>
                setForm((p) => ({ ...p, availability: e.target.value }))
              }
            >
              <option value="available">Tersedia</option>
              <option value="unavailable">Tidak Tersedia</option>
            </select>
          </div>
          <div>
            <label>Deskripsi</label>
            <br />
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              rows={3}
            />
            {formErrors.description && (
              <span style={{ color: "red" }}> {formErrors.description}</span>
            )}
          </div>
          <br />
          <button onClick={handleSubmit} disabled={submitLoading}>
            {submitLoading
              ? "Menyimpan..."
              : modalState.mode === "edit"
                ? "Simpan Perubahan"
                : "Tambah"}
          </button>{" "}
          <button onClick={closeModals}>Batal</button>
        </div>
      )}

      {/* Delete Modal */}
      {modalState.delete && modalState.selectedMenu && (
        <div style={{ border: "1px solid red", padding: 16, marginTop: 16 }}>
          <p>
            Hapus menu "{modalState.selectedMenu.name}"? Tindakan ini tidak
            dapat dibatalkan.
          </p>
          <button onClick={handleDelete} disabled={submitLoading}>
            {submitLoading ? "Menghapus..." : "Ya, Hapus"}
          </button>{" "}
          <button onClick={closeModals}>Batal</button>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
