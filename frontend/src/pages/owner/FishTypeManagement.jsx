import { useState, useEffect, useCallback, useRef } from "react";
import ownerService from "../../services/ownerService";
import { useToast } from "@/hooks/useToast";
import {
  formatDateTime,
  formatNumber,
  formatCurrency,
} from "../../utils/utils";
import FormDialog from "../../components/common/FormDialog";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { DataTable } from "../../components/common/DataTable";
import { StatusBadge } from "../../components/common/StatusBadge";
import { Input } from "@/components/common/FormInput";
import { Label } from "@/components/common/FormLabel";
import { Button } from "@/components/common/Button";
import { FormSelect } from "@/components/common/FormSelect";

const FishTypeManagement = () => {
  const [fishTypes, setFishTypes] = useState([]);
  const [fishStocks, setFishStocks] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [allHistoryData, setAllHistoryData] = useState([]);
  const [allHistoryLoading, setAllHistoryLoading] = useState(false);
  const [historyFishId, setHistoryFishId] = useState("all");
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

  const filteredHistory =
    historyFishId === "all"
      ? allHistoryData
      : allHistoryData.filter(
          (log) => Number(log.fish_type_id) === Number(historyFishId),
        );

  // ---- Column & Action definitions ----
  const fishTypeColumns = [
    { key: "name", header: "Nama Ikan", render: (row) => row.name },
    {
      key: "price_per_kg",
      header: "Harga/Kg",
      render: (row) => formatCurrency(row.price_per_kg),
    },
    {
      key: "stock",
      header: "Stok (Kg)",
      render: (row) => {
        const stock = fishStocks[row.id];
        const value = stock ? formatNumber(stock.current_stock_kg) : "-";
        return (
          <div className="flex items-center gap-2">
            <span>{value}</span>
            {stock?.is_below_threshold && <StatusBadge status="low_stock" />}
          </div>
        );
      },
    },
    {
      key: "threshold",
      header: "Threshold (Kg)",
      render: (row) =>
        fishStocks[row.id]
          ? formatNumber(fishStocks[row.id].alert_threshold_kg)
          : "-",
    },
    {
      key: "availability",
      header: "Ketersediaan",
      render: (row) =>
        row.deleted_at ? "Dihapus" : <StatusBadge status={row.is_active} />,
    },
  ];

  const historyColumns = [
    {
      key: "fish_type",
      header: "Jenis Ikan",
      render: (row) => row.fish_type?.name ?? "-",
    },
    {
      key: "created_at",
      header: "Tanggal & Waktu",
      render: (row) => formatDateTime(row.created_at),
    },
    {
      key: "quantity_kg",
      header: "Jumlah (Kg)",
      render: (row) => `+${formatNumber(row.quantity_kg)}`,
    },
    {
      key: "stock_before",
      header: "Stok Sebelum",
      render: (row) => formatNumber(row.stock_before),
    },
    {
      key: "stock_after",
      header: "Stok Sesudah",
      render: (row) => formatNumber(row.stock_after),
    },
    {
      key: "restocked_by",
      header: "Dicatat Oleh",
      render: (row) => row.restocked_by?.name ?? "-",
    },
    { key: "notes", header: "Catatan", render: (row) => row.notes ?? "-" },
  ];

  // ==================== RENDER ====================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          Manajemen Jenis Ikan
        </h1>
        <Button onClick={openAddModal}>+ Tambah Jenis Ikan</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="text"
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Cari nama ikan..."
          className="max-w-xs"
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
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

      {/* Fish Type Table */}
      <DataTable
        columns={fishTypeColumns}
        data={fishTypes}
        loading={loading}
        emptyMessage="Belum ada jenis ikan"
        getRowActions={(row) => {
          if (row.deleted_at) return [];
          return [
            { label: "Ubah Status", onClick: () => handleToggleActive(row) },
            { label: "Edit", onClick: () => openEditModal(row) },
            { label: "Restock", onClick: () => openRestockModal(row) },
            {
              label: "Hapus",
              variant: "danger",
              onClick: () => openDeleteModal(row),
            },
          ];
        }}
        rowClassName={(row) => (row.deleted_at ? "opacity-50" : "")}
      />

      {/* Form Modal */}
      <FormDialog
        open={modalState.form}
        onClose={closeModals}
        title={
          modalState.mode === "edit" ? "Edit Jenis Ikan" : "Tambah Jenis Ikan"
        }
        onSubmit={handleSubmit}
        loading={submitLoading}
        submitLabel={modalState.mode === "edit" ? "Simpan Perubahan" : "Tambah"}
        cancelLabel="Batal"
      >
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Nama Ikan *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              disabled={submitLoading}
            />
            {formErrors.name && (
              <p className="text-xs text-red-500">{formErrors.name}</p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label>Harga per Kg (Rp) *</Label>
            <Input
              type="number"
              min="1000"
              value={form.price_per_kg}
              onChange={(e) =>
                setForm((p) => ({ ...p, price_per_kg: e.target.value }))
              }
              disabled={submitLoading}
            />
            {formErrors.price_per_kg && (
              <p className="text-xs text-red-500">{formErrors.price_per_kg}</p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label>Alert Threshold (Kg)</Label>
            <Input
              type="number"
              min="0"
              step="0.1"
              value={form.alert_threshold_kg}
              onChange={(e) =>
                setForm((p) => ({ ...p, alert_threshold_kg: e.target.value }))
              }
              disabled={submitLoading}
            />
            {formErrors.alert_threshold_kg && (
              <p className="text-xs text-red-500">
                {formErrors.alert_threshold_kg}
              </p>
            )}
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

      {/* Restock Modal */}
      <FormDialog
        open={modalState.restock && !!modalState.selectedFishType}
        onClose={closeModals}
        title={`Restock — ${modalState.selectedFishType?.name}`}
        onSubmit={handleRestock}
        loading={submitLoading}
        submitLabel="Restock"
        cancelLabel="Tutup"
      >
        <div className="grid gap-4">
          <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
            Stok saat ini:{" "}
            <span className="font-semibold">
              {modalState.selectedFishType &&
              fishStocks[modalState.selectedFishType.id]
                ? formatNumber(
                    fishStocks[modalState.selectedFishType.id].current_stock_kg,
                  )
                : "-"}{" "}
              Kg
            </span>
          </div>
          <div className="grid gap-1.5">
            <Label>Jumlah Tambah (Kg) *</Label>
            <Input
              type="number"
              min="0.1"
              step="0.1"
              value={restockForm.quantity_kg}
              onChange={(e) =>
                setRestockForm((p) => ({ ...p, quantity_kg: e.target.value }))
              }
              disabled={submitLoading}
            />
            {formErrors.quantity_kg && (
              <p className="text-xs text-red-500">{formErrors.quantity_kg}</p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label>Catatan (opsional)</Label>
            <Input
              value={restockForm.notes}
              onChange={(e) =>
                setRestockForm((p) => ({ ...p, notes: e.target.value }))
              }
              disabled={submitLoading}
            />
          </div>
        </div>
      </FormDialog>

      {/* ======================= RIWAYAT RESTOCK SECTION ======================= */}
      <div className="mt-8 pt-4 border-t border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Riwayat Restock
        </h2>
        <div className="flex items-center gap-3 mb-4">
          <Label>Pilih Jenis Ikan</Label>
          <FormSelect
            value={historyFishId}
            onValueChange={setHistoryFishId}
            placeholder="Semua Jenis Ikan"
            options={[
              { value: "all", label: "Semua Jenis Ikan" },
              ...fishTypes.map((ft) => ({
                value: String(ft.id),
                label: ft.name,
              })),
            ]}
            className="w-48"
          />
        </div>

        <DataTable
          columns={historyColumns}
          data={filteredHistory}
          loading={allHistoryLoading}
          emptyMessage="Belum ada riwayat restock"
        />
      </div>
    </div>
  );
};

export default FishTypeManagement;
