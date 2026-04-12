// File: src/pages/owner/MenuManagement.jsx

import { useState, useEffect, useCallback, useRef } from "react";
import menuService from "../../services/menuService";
import { useToast } from "@/hooks/useToast";
import { formatCurrency, formatMenuCategory } from "@/utils/utils";
import FormDialog from "../../components/common/FormDialog";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { DataTable } from "../../components/common/DataTable";
import { StatusBadge } from "../../components/common/StatusBadge";
import { Input } from "../../components/common/FormInput";
import { Label } from "../../components/common/FormLabel";
import { FormSelect } from "@/components/common/FormSelect";
import { Textarea } from "../../components/common/FormTextarea";
import { Button } from "@/components/common/Button";
import { ImageOff, Plus } from "lucide-react";
import { imageCell } from "@/components/common/ImageCell";

const CATEGORY_OPTIONS = [
  { value: "food", label: "Makanan" },
  { value: "beverage", label: "Minuman" },
];

const AVAILABILITY_OPTIONS = [
  { value: "available", label: "Tersedia" },
  { value: "unavailable", label: "Tidak Tersedia" },
];

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

  // ---- Image state ----
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef(null);

  // ---- Fetch ----
  const fetchMenus = useCallback(
    async (currentFilters) => {
      setLoading(true);
      try {
        const params = {};
        if (currentFilters.category) params.category = currentFilters.category;
        if (currentFilters.availability)
          params.availability = currentFilters.availability;
        if (currentFilters.search) params.search = currentFilters.search;
        if (currentFilters.include_deleted) params.include_deleted = true;

        const res = await menuService.getMenus(params);
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
    },
    [toast],
  );

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
      toast.error("Ukuran gambar maksimal 5MB");
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
    setForm({
      name: "",
      price: "",
      category: "food",
      availability: "available",
      description: "",
    });
    setFormErrors({});
    resetImageState();
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
    resetImageState();
    if (menu.image_url) setImagePreview(menu.image_url);
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
    resetImageState();
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

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("price", form.price);
    formData.append("category", form.category);
    formData.append("availability", form.availability);
    formData.append("description", form.description || "");
    if (imageFile) {
      formData.append("image", imageFile);
    } else if (removeImage) {
      formData.append("remove_image", "1");
    }

    setSubmitLoading(true);
    try {
      if (modalState.mode === "edit") {
        await menuService.updateMenu(modalState.selectedMenu.id, formData);
        toast.success("Menu berhasil diperbarui");
      } else {
        await menuService.createMenu(formData);
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
      await menuService.deleteMenu(modalState.selectedMenu.id);
      toast.success("Menu berhasil dihapus");
      closeModals();
      fetchMenus(filters);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal menghapus menu");
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
      await menuService.toggleMenuAvailability(menu.id, newAvailability);
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

  // ---- Column & Action definitions ----
  const menuColumns = [
    imageCell,
    { key: "name", header: "Nama", render: (row) => row.name },
    {
      key: "category",
      header: "Kategori",
      render: (row) => formatMenuCategory(row.category),
    },
    {
      key: "price",
      header: "Harga",
      render: (row) => formatCurrency(row.price),
    },
    {
      key: "availability",
      header: "Ketersediaan",
      render: (row) =>
        row.deleted_at ? "Dihapus" : <StatusBadge status={row.availability} />,
    },
    {
      key: "description",
      header: "Deskripsi",
      render: (row) => row.description || "-",
    },
  ];

  // ==================== RENDER ====================
  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manajemen Menu</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Total: <strong>{summary.total}</strong> · Tersedia:{" "}
            <strong>{summary.available_count}</strong> · Tidak Tersedia:{" "}
            <strong>{summary.unavailable_count}</strong>
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
          placeholder="Cari nama menu..."
          className="w-full sm:w-48"
        />
        <div className="grid grid-cols-2 gap-3 w-full sm:w-auto sm:flex sm:gap-3 text-sm">
          <FormSelect
            value={filters.category || "all"}
            onValueChange={(val) =>
              handleFilterChange("category", val === "all" ? "" : val)
            }
            placeholder="Semua Kategori"
            options={[
              { value: "all", label: "Semua Kategori" },
              ...CATEGORY_OPTIONS,
            ]}
          />
          <FormSelect
            value={filters.availability || "all"}
            onValueChange={(val) =>
              handleFilterChange("availability", val === "all" ? "" : val)
            }
            placeholder="Semua Status"
            options={[
              { value: "all", label: "Semua Status" },
              ...AVAILABILITY_OPTIONS,
            ]}
          />
        </div>
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
        columns={menuColumns}
        data={menus}
        loading={loading}
        emptyMessage="Belum ada menu"
        getRowActions={(row) => {
          if (row.deleted_at) return [];
          return [
            {
              label: "Ubah Ketersediaan",
              onClick: () => handleToggleAvailability(row),
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
        title={modalState.mode === "edit" ? "Edit Menu" : "Tambah Menu"}
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
            <Label>Harga *</Label>
            <Input
              type="number"
              min="0"
              value={form.price}
              onChange={(e) =>
                setForm((p) => ({ ...p, price: e.target.value }))
              }
              disabled={submitLoading}
            />
            {formErrors.price && (
              <p className="text-xs text-destructive">{formErrors.price}</p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label>Kategori *</Label>
            <FormSelect
              value={form.category}
              onValueChange={(val) => setForm((p) => ({ ...p, category: val }))}
              placeholder="Pilih Kategori"
              options={CATEGORY_OPTIONS}
              disabled={submitLoading}
            />
            {formErrors.category && (
              <p className="text-xs text-destructive">{formErrors.category}</p>
            )}
          </div>
          <div className="grid gap-1.5">
            <Label>Ketersediaan</Label>
            <FormSelect
              value={form.availability}
              onValueChange={(val) =>
                setForm((p) => ({ ...p, availability: val }))
              }
              placeholder="Pilih Ketersediaan"
              options={AVAILABILITY_OPTIONS}
              disabled={submitLoading}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Deskripsi</Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              rows={3}
              disabled={submitLoading}
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
        open={modalState.delete && !!modalState.selectedMenu}
        onClose={closeModals}
        onConfirm={handleDelete}
        title="Konfirmasi Hapus"
        description={`Hapus menu "${modalState.selectedMenu?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        variant="destructive"
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        loading={submitLoading}
      />
    </div>
  );
};

export default MenuManagement;
