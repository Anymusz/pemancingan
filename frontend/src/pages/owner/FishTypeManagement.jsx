// File: src/pages/owner/FishTypeManagement.jsx

import { useState, useEffect, useCallback, useRef } from "react";
import ownerService from "../../services/ownerService";

const FishTypeManagement = () => {
  const [fishTypes, setFishTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    include_deleted: false,
  });
  const [searchInput, setSearchInput] = useState("");
  const searchTimeout = useRef(null);

  const [modalState, setModalState] = useState({
    form: false,
    delete: false,
    mode: "add",
    selectedFishType: null,
  });

  const [form, setForm] = useState({ name: "", price_per_kg: "" });
  const [formErrors, setFormErrors] = useState({});

  // ---- Toast ----
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ---- Fetch ----
  const fetchFishTypes = useCallback(async (currentFilters) => {
    setLoading(true);
    try {
      const params = {};
      if (currentFilters.search) params.search = currentFilters.search;
      if (currentFilters.include_deleted) params.include_deleted = true;

      const res = await ownerService.getOwnerFishTypes(params);
      if (res.success) {
        setFishTypes(res.data.fish_types);
      }
    } catch {
      showToast("Gagal memuat data jenis ikan", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFishTypes(filters);
  }, [filters, fetchFishTypes]);

  // ---- Filter Handlers ----
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
    setForm({ name: "", price_per_kg: "" });
    setFormErrors({});
    setModalState({
      form: true,
      delete: false,
      mode: "add",
      selectedFishType: null,
    });
  };

  const openEditModal = (fishType) => {
    setForm({ name: fishType.name, price_per_kg: fishType.price_per_kg });
    setFormErrors({});
    setModalState({
      form: true,
      delete: false,
      mode: "edit",
      selectedFishType: fishType,
    });
  };

  const openDeleteModal = (fishType) => {
    setModalState({
      form: false,
      delete: true,
      mode: "edit",
      selectedFishType: fishType,
    });
  };

  const closeModals = () => {
    setModalState({
      form: false,
      delete: false,
      mode: "add",
      selectedFishType: null,
    });
  };

  // ---- Validation ----
  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Nama wajib diisi";
    else if (form.name.length > 50) errors.name = "Nama maksimal 50 karakter";
    if (form.price_per_kg === "") errors.price_per_kg = "Harga wajib diisi";
    else if (Number(form.price_per_kg) < 1000)
      errors.price_per_kg = "Harga minimal Rp1.000";
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
        await ownerService.updateFishType(modalState.selectedFishType.id, form);
        showToast("Jenis ikan berhasil diperbarui");
      } else {
        await ownerService.createFishType(form);
        showToast("Jenis ikan berhasil ditambahkan");
      }
      closeModals();
      fetchFishTypes(filters);
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Gagal menyimpan jenis ikan",
        "error",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    setSubmitLoading(true);
    try {
      await ownerService.deleteFishType(modalState.selectedFishType.id);
      showToast("Jenis ikan berhasil dihapus");
      closeModals();
      fetchFishTypes(filters);
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Gagal menghapus jenis ikan",
        "error",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleActive = async (fishType) => {
    // Optimistic update
    setFishTypes((prev) =>
      prev.map((ft) =>
        ft.id === fishType.id ? { ...ft, is_active: !ft.is_active } : ft,
      ),
    );
    try {
      await ownerService.toggleFishTypeActive(fishType.id);
      showToast(`Status "${fishType.name}" berhasil diubah`);
    } catch {
      // Revert
      setFishTypes((prev) =>
        prev.map((ft) =>
          ft.id === fishType.id ? { ...ft, is_active: fishType.is_active } : ft,
        ),
      );
      showToast("Gagal mengubah status ikan", "error");
    }
  };

  // ==================== RENDER ====================
  return (
    <div>
      {/* Toast */}
      {toast && (
        <div>
          [{toast.type === "success" ? "OK" : "ERROR"}] {toast.message}
        </div>
      )}

      <h1>Manajemen Jenis Ikan</h1>

      <button onClick={openAddModal}>+ Tambah Jenis Ikan</button>

      {/* Filters */}
      <div>
        <input
          type="text"
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Cari nama ikan..."
        />
        <label>
          <input
            type="checkbox"
            checked={filters.include_deleted}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                include_deleted: e.target.checked,
              }))
            }
          />
          Tampilkan yang dihapus
        </label>
      </div>

      {/* Table */}
      {loading ? (
        <p>Memuat data...</p>
      ) : fishTypes.length === 0 ? (
        <p>Belum ada jenis ikan</p>
      ) : (
        <table border="1" width="100%">
          <thead>
            <tr>
              <th>Nama Ikan</th>
              <th>Harga/Kg</th>
              <th>Ketersediaan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {fishTypes.map((ft) => (
              <tr key={ft.id} style={{ opacity: ft.deleted_at ? 0.5 : 1 }}>
                <td>{ft.name}</td>
                <td>Rp {Number(ft.price_per_kg).toLocaleString("id-ID")}</td>
                <td>
                  {ft.deleted_at
                    ? "Dihapus"
                    : ft.is_active
                      ? "Tersedia"
                      : "Tidak Tersedia"}
                </td>
                <td>
                  {!ft.deleted_at && (
                    <>
                      <button onClick={() => handleToggleActive(ft)}>
                        {ft.is_active ? "Set Tidak Tersedia" : "Set Tersedia"}
                      </button>
                      {" | "}
                      <button onClick={() => openEditModal(ft)}>Edit</button>
                      {" | "}
                      <button onClick={() => openDeleteModal(ft)}>Hapus</button>
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
          <h2>
            {modalState.mode === "edit"
              ? "Edit Jenis Ikan"
              : "Tambah Jenis Ikan"}
          </h2>
          <div>
            <label>Nama Ikan *</label>
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
            <label>Harga per Kg (Rp) *</label>
            <br />
            <input
              type="number"
              min="1000"
              value={form.price_per_kg}
              onChange={(e) =>
                setForm((p) => ({ ...p, price_per_kg: e.target.value }))
              }
            />
            {formErrors.price_per_kg && (
              <span style={{ color: "red" }}> {formErrors.price_per_kg}</span>
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
      {modalState.delete && modalState.selectedFishType && (
        <div style={{ border: "1px solid red", padding: 16, marginTop: 16 }}>
          <p>
            Hapus jenis ikan "{modalState.selectedFishType.name}"? Data historis
            transaksi tetap tersimpan.
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

export default FishTypeManagement;
