// File: src/pages/owner/MenuManagement.jsx

import { useState, useEffect, useCallback, useRef } from "react";
import ownerService from "../../services/ownerService";
import { useToast } from "@/hooks/useToast";
import { formatCurrency } from "@/utils/utils";
import FormDialog from "../../components/common/FormDialog";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { DataTable } from "../../components/common/DataTable";
import { StatusBadge } from "../../components/common/StatusBadge";
import { Input } from "../../components/common/FormInput";
import { Label } from "../../components/common/FormLabel";
import { FormSelect } from "@/components/common/FormSelect";
import { Textarea } from "../../components/common/FormTextarea";
import { Button } from "@/components/common/Button";

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

  // ---- Column & Action definitions ----
  const menuColumns = [
    { key: "name", header: "Nama", render: (row) => row.name },
    {
      key: "category",
      header: "Kategori",
      render: (row) => (row.category === "food" ? "Makanan" : "Minuman"),
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
    <div>
      <h1>Manajemen Menu</h1>

      {/* Summary */}
      <div className="flex gap-4 text-sm text-muted-foreground mb-2">
        <span>
          Total: <strong>{summary.total}</strong>
        </span>
        <span>
          Tersedia: <strong>{summary.available_count}</strong>
        </span>
        <span>
          Tidak Tersedia: <strong>{summary.unavailable_count}</strong>
        </span>
      </div>

      {/* Actions */}
      <Button onClick={openAddModal} className="mb-4">
        + Tambah Menu
      </Button>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Input
          type="text"
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Cari nama menu..."
          className="w-48"
        />
        <FormSelect
          value={filters.category || "all"}
          onValueChange={(val) =>
            handleFilterChange("category", val === "all" ? "" : val)
          }
          className="w-40"
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
          className="w-40"
          placeholder="Semua Status"
          options={[
            { value: "all", label: "Semua Status" },
            ...AVAILABILITY_OPTIONS,
          ]}
        />
        <label className="flex items-center gap-2 text-sm">
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
              <p className="text-xs text-red-500">{formErrors.name}</p>
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
              <p className="text-xs text-red-500">{formErrors.price}</p>
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
              <p className="text-xs text-red-500">{formErrors.category}</p>
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
              <p className="text-xs text-red-500">{formErrors.description}</p>
            )}
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
