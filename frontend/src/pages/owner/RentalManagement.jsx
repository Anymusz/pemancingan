// File: src/pages/owner/RentalManagement.jsx

import { useState, useEffect, useCallback, useRef } from "react";
import rentalService from "../../services/rentalService";
import { useToast } from "@/hooks/useToast";
import { formatCurrency } from "@/utils/utils";
import FormDialog from "../../components/common/FormDialog";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { DataTable } from "../../components/common/DataTable";
import { StatusBadge } from "../../components/common/StatusBadge";
import { Input } from "../../components/common/FormInput";
import { Label } from "../../components/common/FormLabel";
import { Button } from "@/components/common/Button";
import { Textarea } from "../../components/common/FormTextarea";
import { ImageOff, Plus } from "lucide-react";
import { imageCell } from "@/components/common/ImageCell";

const RentalManagement = () => {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    active_count: 0,
    inactive_count: 0,
  });
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
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
    mode: "add",
    selectedItem: null,
  });

  const [form, setForm] = useState({
    name: "",
    price_per_unit: "",
    unit_label: "",
    description: "",
  });
  const [formErrors, setFormErrors] = useState({});

  // ---- Image state ----
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef(null);

  // ---- Fetch ----
  const fetchItems = useCallback(
    async (currentFilters) => {
      setLoading(true);
      try {
        const params = {};
        if (currentFilters.search) params.search = currentFilters.search;
        if (currentFilters.include_deleted) params.include_deleted = true;

        const res = await rentalService.getRentalItems(params);
        if (res.success) {
          setItems(res.data.rental_items);
          setSummary({
            total: res.data.total,
            active_count: res.data.active_count,
            inactive_count: res.data.inactive_count,
          });
        }
      } catch {
        toast.error("Gagal memuat data rental item");
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    fetchItems(filters);
  }, [filters, fetchItems]);

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

  // ---- Image Handlers ----
  const resetImageState = useCallback(() => {
    setImageFile(null);
    setImagePreview((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    setRemoveImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran gambar maksimal 5 MB");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ---- Modal Handlers ----
  const openAddModal = () => {
    setForm({ name: "", price_per_unit: "", unit_label: "", description: "" });
    setFormErrors({});
    resetImageState();
    setModalState({
      form: true,
      delete: false,
      mode: "add",
      selectedItem: null,
    });
  };

  const openEditModal = (item) => {
    setForm({
      name: item.name,
      price_per_unit: item.price_per_unit,
      unit_label: item.unit_label,
      description: item.description || "",
    });
    setFormErrors({});
    resetImageState();
    if (item.image_url) setImagePreview(item.image_url);
    setModalState({
      form: true,
      delete: false,
      mode: "edit",
      selectedItem: item,
    });
  };

  const openDeleteModal = (item) => {
    setModalState({
      form: false,
      delete: true,
      mode: "edit",
      selectedItem: item,
    });
  };

  const closeModals = () => {
    resetImageState();
    setModalState({
      form: false,
      delete: false,
      mode: "add",
      selectedItem: null,
    });
  };

  // ---- Validation ----
  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Nama wajib diisi";
    else if (form.name.length > 100) errors.name = "Nama maksimal 100 karakter";
    if (form.price_per_unit === "" || form.price_per_unit === null)
      errors.price_per_unit = "Harga wajib diisi";
    else if (Number(form.price_per_unit) < 1000)
      errors.price_per_unit = "Harga minimal Rp 1.000";
    if (!form.unit_label.trim()) errors.unit_label = "Satuan wajib diisi";
    else if (form.unit_label.length > 50)
      errors.unit_label = "Satuan maksimal 50 karakter";
    if (form.description && form.description.length > 1000)
      errors.description = "Maks 1000 karakter";
    return errors;
  };

  // ---- CRUD ----
  const handleSubmit = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("price_per_unit", form.price_per_unit);
    formData.append("unit_label", form.unit_label);
    formData.append("description", form.description || "");
    if (imageFile) {
      formData.append("image", imageFile);
    } else if (removeImage) {
      formData.append("remove_image", "1");
    }

    setSubmitLoading(true);
    try {
      if (modalState.mode === "edit") {
        await rentalService.updateRentalItem(
          modalState.selectedItem.id,
          formData,
        );
        toast.success("Rental item berhasil diperbarui");
      } else {
        await rentalService.createRentalItem(formData);
        toast.success("Rental item berhasil ditambahkan");
      }
      closeModals();
      fetchItems(filters);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Gagal menyimpan rental item",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async () => {
    setSubmitLoading(true);
    try {
      await rentalService.deleteRentalItem(modalState.selectedItem.id);
      toast.success("Rental item berhasil dihapus");
      closeModals();
      fetchItems(filters);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Gagal menghapus rental item",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleActive = async (item) => {
    const newActive = !item.is_active;
    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_active: newActive } : i)),
    );
    try {
      await rentalService.toggleRentalActive(item.id);
      toast.success(`Status "${item.name}" berhasil diubah`);
    } catch {
      // Revert
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, is_active: item.is_active } : i,
        ),
      );
      toast.error("Gagal mengubah status rental item");
    }
  };

  // ---- Column definitions ----
  const columns = [
    imageCell,
    { key: "name", header: "Nama", render: (row) => row.name },
    {
      key: "price_per_unit",
      header: "Harga",
      render: (row) => formatCurrency(row.price_per_unit),
    },
    {
      key: "unit_label",
      header: "Satuan",
      render: (row) => row.unit_label,
    },
    {
      key: "description",
      header: "Deskripsi",
      render: (row) => row.description || "-",
    },
    {
      key: "is_active",
      header: "Status",
      render: (row) =>
        row.deleted_at ? (
          "Dihapus"
        ) : (
          <StatusBadge status={row.is_active ? "active" : "deactivated"} />
        ),
    },
  ];

  // ==================== RENDER ====================
  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rental Item</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Total: <strong>{summary.total}</strong> · Aktif:{" "}
            <strong>{summary.active_count}</strong> · Nonaktif:{" "}
            <strong>{summary.inactive_count}</strong>
          </p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg border border-border bg-card">
        <Input
          type="text"
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Cari nama item..."
          className="w-full sm:w-48 text-sm"
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={filters.include_deleted}
            onChange={(e) =>
              handleFilterChange("include_deleted", e.target.checked)
            }
            className="rounded"
          />
          Tampilkan yang dihapus
        </label>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        emptyMessage="Belum ada rental item"
        getRowActions={(row) => {
          if (row.deleted_at) return [];
          return [
            {
              label: row.is_active ? "Nonaktifkan" : "Aktifkan",
              onClick: () => handleToggleActive(row),
            },
            { label: "Edit", onClick: () => openEditModal(row) },
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
          modalState.mode === "edit" ? "Edit Rental Item" : "Tambah Rental Item"
        }
        onSubmit={handleSubmit}
        loading={submitLoading}
        submitLabel={modalState.mode === "edit" ? "Simpan Perubahan" : "Tambah"}
        cancelLabel="Batal"
      >
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Nama *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              disabled={submitLoading}
            />
            {formErrors.name && (
              <p className="text-xs text-destructive">{formErrors.name}</p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label>Harga per Satuan *</Label>
            <Input
              type="number"
              min="1000"
              value={form.price_per_unit}
              onChange={(e) =>
                setForm((p) => ({ ...p, price_per_unit: e.target.value }))
              }
              disabled={submitLoading}
            />
            {formErrors.price_per_unit && (
              <p className="text-xs text-destructive">
                {formErrors.price_per_unit}
              </p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label>
              Satuan *{" "}
              <span className="text-muted-foreground font-normal">
                (cth: jam, hari, unit)
              </span>
            </Label>
            <Input
              value={form.unit_label}
              onChange={(e) =>
                setForm((p) => ({ ...p, unit_label: e.target.value }))
              }
              disabled={submitLoading}
              placeholder="contoh: jam"
            />
            {formErrors.unit_label && (
              <p className="text-xs text-destructive">
                {formErrors.unit_label}
              </p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label>
              Deskripsi{" "}
              <span className="text-muted-foreground font-normal">
                (opsional)
              </span>
            </Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              rows={3}
              disabled={submitLoading}
              placeholder="Contoh: Kapasitas 6 orang, sewa per hari..."
            />
            {formErrors.description && (
              <p className="text-xs text-destructive">
                {formErrors.description}
              </p>
            )}
          </div>

          {/* Image upload */}
          <div className="grid gap-1.5">
            <Label>
              Foto{" "}
              <span className="text-muted-foreground font-normal">
                (opsional, maks 5 MB)
              </span>
            </Label>
            {imagePreview ? (
              <div className="relative inline-block w-full max-w-xs">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-36 object-cover rounded-lg border border-border"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-1.5 right-1.5 bg-destructive text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:opacity-90"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center w-full max-w-xs h-24 rounded-lg border border-dashed border-border bg-muted/30">
                <ImageOff className="w-6 h-6 text-muted-foreground/40" />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={submitLoading}
              className="w-full text-sm text-muted-foreground file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors"
            />
          </div>
        </div>
      </FormDialog>

      {/* Delete Modal */}
      <ConfirmDialog
        open={modalState.delete && !!modalState.selectedItem}
        onClose={closeModals}
        onConfirm={handleDelete}
        title="Konfirmasi Hapus"
        description={`Hapus rental item "${modalState.selectedItem?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        variant="destructive"
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        loading={submitLoading}
      />
    </div>
  );
};

export default RentalManagement;
