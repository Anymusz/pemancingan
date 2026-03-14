import { useState, useEffect, useCallback, useRef } from "react";
import ownerService from "../../services/ownerService";
import { useToast } from "@/hooks/useToast";
import { formatDateTime } from "../../utils/utils";
import FormDialog from "../../components/common/FormDialog";
import ConfirmDialog from "../../components/common/ConfirmDialog";

const FishTypeManagement = () => {
  const [fishTypes, setFishTypes] = useState([]);
  const [fishStocks, setFishStocks] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [allHistoryData, setAllHistoryData] = useState([]);
  const [allHistoryLoading, setAllHistoryLoading] = useState(false);
  const [historyFishId, setHistoryFishId] = useState("");
  const toast = useToast();

  const [filters, setFilters] = useState({
    search: "",
    include_deleted: false,
  });
  const [searchInput, setSearchInput] = useState("");
  const searchTimeout = useRef(null);

  const [modalState, setModalState] = useState({
    form: false,
    delete: false,
    restock: false,
    mode: "add",
    selectedFishType: null,
  });

  const [form, setForm] = useState({
    name: "",
    price_per_kg: "",
    alert_threshold_kg: "",
  });
  const [restockForm, setRestockForm] = useState({
    quantity_kg: "",
    notes: "",
  });
  const [formErrors, setFormErrors] = useState({});

  // ---- Fetch Fish Types ----
  const fetchFishTypes = useCallback(
    async (currentFilters) => {
      setLoading(true);
      try {
        const params = {};
        if (currentFilters.search) params.search = currentFilters.search;
        if (currentFilters.include_deleted) params.include_deleted = true;

        const res = await ownerService.getOwnerFishTypes(params);
        if (res.success) setFishTypes(res.data.fish_types);
      } catch {
        toast.error("Gagal memuat data jenis ikan");
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  // ---- Fetch Fish Stocks ----
  const fetchFishStocks = useCallback(async () => {
    try {
      const res = await ownerService.getFishStocks();
      if (res.success) {
        const stockMap = {};
        res.data.fish_stocks.forEach((item) => {
          stockMap[item.id] = item.stock;
        });
        setFishStocks(stockMap);
      }
    } catch {
      toast.error("Gagal memuat data stok");
    }
  }, [toast]);

  // ---- Fetch All History ----
  const fetchAllHistory = useCallback(async () => {
    setAllHistoryLoading(true);
    try {
      const res = await ownerService.getAllFishRestockHistory();
      if (res.success) setAllHistoryData(res.data.logs);
    } catch {
      toast.error("Gagal memuat riwayat restock");
    } finally {
      setAllHistoryLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFishTypes(filters);
  }, [filters, fetchFishTypes]);

  useEffect(() => {
    fetchFishStocks();
  }, [fetchFishStocks]);

  useEffect(() => {
    fetchAllHistory();
  }, [fetchAllHistory]);

  // ---- Filter Handlers ----
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: val }));
    }, 500);
  };

  // ---- Modal Helpers ----
  const closeModals = () => {
    setModalState({
      form: false,
      delete: false,
      restock: false,
      mode: "add",
      selectedFishType: null,
    });
    setFormErrors({});
  };

  // ---- Form Modal ----
  const openAddModal = () => {
    setForm({ name: "", price_per_kg: "", alert_threshold_kg: "" });
    setFormErrors({});
    setModalState((prev) => ({
      ...prev,
      form: true,
      mode: "add",
      selectedFishType: null,
    }));
  };

  const openEditModal = (fishType) => {
    setForm({
      name: fishType.name,
      price_per_kg: fishType.price_per_kg,
      alert_threshold_kg: fishStocks[fishType.id]?.alert_threshold_kg ?? "",
    });
    setFormErrors({});
    setModalState((prev) => ({
      ...prev,
      form: true,
      mode: "edit",
      selectedFishType: fishType,
    }));
  };

  // ---- Delete Modal ----
  const openDeleteModal = (fishType) => {
    setModalState((prev) => ({
      ...prev,
      delete: true,
      selectedFishType: fishType,
    }));
  };

  // ---- Restock Modal ----
  const openRestockModal = (fishType) => {
    setRestockForm({ quantity_kg: "", notes: "" });
    setFormErrors({});
    setModalState((prev) => ({
      ...prev,
      restock: true,
      selectedFishType: fishType,
    }));
  };

  // ---- Validation ----
  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Nama wajib diisi";
    else if (form.name.length > 50) errors.name = "Nama maksimal 50 karakter";
    if (form.price_per_kg === "") errors.price_per_kg = "Harga wajib diisi";
    else if (Number(form.price_per_kg) < 1000)
      errors.price_per_kg = "Harga minimal Rp1.000";
    if (form.alert_threshold_kg !== "" && Number(form.alert_threshold_kg) < 0)
      errors.alert_threshold_kg = "Threshold tidak boleh negatif";
    return errors;
  };

  const validateRestockForm = () => {
    const errors = {};
    if (restockForm.quantity_kg === "")
      errors.quantity_kg = "Jumlah wajib diisi";
    else if (Number(restockForm.quantity_kg) < 0.1)
      errors.quantity_kg = "Minimal 0.1 Kg";
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
        await ownerService.updateFishType(modalState.selectedFishType.id, {
          name: form.name,
          price_per_kg: form.price_per_kg,
        });

        // Update threshold jika diisi
        if (form.alert_threshold_kg !== "") {
          await ownerService.updateFishThreshold(
            modalState.selectedFishType.id,
            {
              alert_threshold_kg: Number(form.alert_threshold_kg),
            },
          );
          fetchFishStocks();
        }

        toast.success("Jenis ikan berhasil diperbarui");
      } else {
        const res = await ownerService.createFishType({
          name: form.name,
          price_per_kg: form.price_per_kg,
        });
        if (form.alert_threshold_kg !== "") {
          await ownerService.updateFishThreshold(res.data.fish_type.id, {
            alert_threshold_kg: Number(form.alert_threshold_kg),
          });
        }
        toast.success("Jenis ikan berhasil ditambahkan");
        fetchFishStocks();
      }
      closeModals();
      fetchFishTypes(filters);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal menyimpan jenis ikan");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    setSubmitLoading(true);
    try {
      await ownerService.deleteFishType(modalState.selectedFishType.id);
      toast.success("Jenis ikan berhasil dihapus");
      closeModals();
      fetchFishTypes(filters);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal menghapus jenis ikan");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleActive = async (fishType) => {
    setFishTypes((prev) =>
      prev.map((ft) =>
        ft.id === fishType.id ? { ...ft, is_active: !ft.is_active } : ft,
      ),
    );
    try {
      await ownerService.toggleFishTypeActive(fishType.id);
      toast.success(`Status "${fishType.name}" berhasil diubah`);
    } catch {
      setFishTypes((prev) =>
        prev.map((ft) =>
          ft.id === fishType.id ? { ...ft, is_active: fishType.is_active } : ft,
        ),
      );
      toast.error("Gagal mengubah status ikan");
    }
  };

  const handleRestock = async () => {
    const errors = validateRestockForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitLoading(true);
    try {
      await ownerService.restockFish(modalState.selectedFishType.id, {
        quantity_kg: Number(restockForm.quantity_kg),
        notes: restockForm.notes || null,
      });
      toast.success("Restock berhasil");
      setRestockForm({ quantity_kg: "", notes: "" });
      closeModals();
      fetchFishStocks();
      fetchAllHistory();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal melakukan restock");
    } finally {
      setSubmitLoading(false);
    }
  };

  // ---- Format helpers ----

  const filteredHistory = historyFishId
    ? allHistoryData.filter(
        (log) => Number(log.fish_type_id) === Number(historyFishId),
      )
    : allHistoryData;

  // ==================== RENDER ====================
  return (
    <div>
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
              <th>Stok (Kg)</th>
              <th>Threshold (Kg)</th>
              <th>Ketersediaan</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {fishTypes.map((ft) => {
              const stock = fishStocks[ft.id];
              return (
                <tr key={ft.id} style={{ opacity: ft.deleted_at ? 0.5 : 1 }}>
                  <td>{ft.name}</td>
                  <td>Rp {Number(ft.price_per_kg).toLocaleString("id-ID")}</td>
                  <td
                    style={{
                      color: stock?.is_below_threshold ? "red" : "inherit",
                    }}
                  >
                    {stock
                      ? Number(stock.current_stock_kg).toLocaleString("id-ID")
                      : "-"}
                    {stock?.is_below_threshold && " ⚠️"}
                  </td>
                  <td>
                    {stock
                      ? Number(stock.alert_threshold_kg).toLocaleString("id-ID")
                      : "-"}
                  </td>
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
                        <button onClick={() => openRestockModal(ft)}>
                          Restock
                        </button>
                        {" | "}
                        <button onClick={() => openDeleteModal(ft)}>
                          Hapus
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Form Modal */}
      <FormDialog
        open={modalState.form}
        onClose={closeModals}
        title={modalState.mode === "edit" ? "Edit Jenis Ikan" : "Tambah Jenis Ikan"}
      >
        <div>
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
          <div style={{ marginTop: 8 }}>
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
          <div style={{ marginTop: 8 }}>
            <label>Alert Threshold (Kg)</label>
            <br />
            <input
              type="number"
              min="0"
              step="0.1"
              value={form.alert_threshold_kg}
              onChange={(e) =>
                setForm((p) => ({ ...p, alert_threshold_kg: e.target.value }))
              }
            />
            {formErrors.alert_threshold_kg && (
              <span style={{ color: "red" }}>
                {" "}
                {formErrors.alert_threshold_kg}
              </span>
            )}
          </div>
          <br />
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handleSubmit} disabled={submitLoading}>
              {submitLoading
                ? "Menyimpan..."
                : modalState.mode === "edit"
                  ? "Simpan Perubahan"
                  : "Tambah"}
            </button>
            <button onClick={closeModals}>Batal</button>
          </div>
        </div>
      </FormDialog>

      {/* Delete Modal */}
      <ConfirmDialog
        open={modalState.delete && !!modalState.selectedFishType}
        onClose={closeModals}
        onConfirm={handleDelete}
        title="Konfirmasi Hapus"
        description={`Hapus jenis ikan "${modalState.selectedFishType?.name}"? Data historis transaksi tetap tersimpan.`}
        variant="destructive"
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        loading={submitLoading}
      />

      {/* Restock Modal — include history */}
      <FormDialog
        open={modalState.restock && !!modalState.selectedFishType}
        onClose={closeModals}
        title={`Restock — ${modalState.selectedFishType?.name}`}
      >
        <div>
          <p>
            Stok saat ini:{" "}
            <strong>
              {modalState.selectedFishType && fishStocks[modalState.selectedFishType.id]
                ? Number(
                    fishStocks[modalState.selectedFishType.id].current_stock_kg,
                  ).toLocaleString("id-ID")
                : "-"}{" "}
              Kg
            </strong>
          </p>
          <div style={{ marginTop: 8 }}>
            <label>Jumlah Tambah (Kg) *</label>
            <br />
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={restockForm.quantity_kg}
              onChange={(e) =>
                setRestockForm((p) => ({ ...p, quantity_kg: e.target.value }))
              }
            />
            {formErrors.quantity_kg && (
              <span style={{ color: "red" }}> {formErrors.quantity_kg}</span>
            )}
          </div>
          <div style={{ marginTop: 8 }}>
            <label>Catatan (opsional)</label>
            <br />
            <input
              value={restockForm.notes}
              onChange={(e) =>
                setRestockForm((p) => ({ ...p, notes: e.target.value }))
              }
            />
          </div>
          <br />
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={handleRestock} disabled={submitLoading}>
              {submitLoading ? "Menyimpan..." : "Restock"}
            </button>
            <button onClick={closeModals}>Tutup</button>
          </div>
        </div>
      </FormDialog>

      {/* ======================= RIWAYAT RESTOCK SECTION ======================= */}
      <div
        style={{ marginTop: 32, paddingTop: 16, borderTop: "2px solid #ccc" }}
      >
        <h2>Riwayat Restock</h2>
        <div style={{ marginBottom: 16 }}>
          <label style={{ marginRight: 8 }}>Pilih Jenis Ikan: </label>
          <select
            value={historyFishId}
            onChange={(e) => setHistoryFishId(e.target.value)}
          >
            <option value="">Semua Jenis Ikan</option>
            {fishTypes.map((ft) => (
              <option key={ft.id} value={ft.id}>
                {ft.name}
              </option>
            ))}
          </select>
        </div>

        {allHistoryLoading ? (
          <p>Memuat riwayat...</p>
        ) : filteredHistory.length === 0 ? (
          <p>Belum ada riwayat restock</p>
        ) : (
          <table border="1" width="100%">
            <thead>
              <tr>
                <th>Jenis Ikan</th>
                <th>Tanggal</th>
                <th>Jumlah (Kg)</th>
                <th>Stok Sebelum</th>
                <th>Stok Sesudah</th>
                <th>Dicatat oleh</th>
                <th>Catatan</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((log) => (
                <tr key={log.id}>
                  <td>{log.fish_type?.name ?? "-"}</td>
                  <td>{formatDateTime(log.created_at)}</td>
                  <td>+{Number(log.quantity_kg).toLocaleString("id-ID")}</td>
                  <td>{Number(log.stock_before).toLocaleString("id-ID")}</td>
                  <td>{Number(log.stock_after).toLocaleString("id-ID")}</td>
                  <td>{log.restocked_by?.name ?? "-"}</td>
                  <td>{log.notes ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default FishTypeManagement;
