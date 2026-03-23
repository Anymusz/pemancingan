// File: src/pages/owner/event-management/EventManagement.jsx

import { useState, useEffect, useCallback, useRef } from "react";
import ownerService from "@/services/ownerService";
import EventListItem from "./EventListItem";
import { useToast } from "@/hooks/useToast";
import FormDialog from "@/components/common/FormDialog";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Input } from "@/components/common/FormInput";
import { Label } from "@/components/common/FormLabel";
import { FormSelect } from "@/components/common/FormSelect";
import { Textarea } from "@/components/common/FormTextarea";
import { Button } from "@/components/common/Button";

const EMPTY_FORM = {
  title: "",
  description: "",
  category: "event",
  start_date: "",
  end_date: "",
  status: "draft",
};

const CATEGORY_OPTIONS = [
  { value: "event", label: "Acara" },
  { value: "info", label: "Pengumuman" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
];

const CONFIRM_CONFIG = {
  publish: {
    variant: "default",
    confirmLabel: "Ya, Publikasikan",
    getDescription: (title) =>
      `Publikasikan event "${title}"? Event akan terlihat oleh semua pengguna.`,
  },
  unpublish: {
    variant: "warning",
    confirmLabel: "Ya, Unpublish",
    getDescription: (title) =>
      `Unpublish event "${title}"? Event tidak akan terlihat publik.`,
  },
  delete: {
    variant: "destructive",
    confirmLabel: "Ya, Hapus",
    getDescription: (title) =>
      `Hapus event "${title}"? Tindakan ini tidak dapat dibatalkan.`,
  },
};

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    published_count: 0,
    draft_count: 0,
  });
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const toast = useToast();

  const [filters, setFilters] = useState({
    status: "",
    category: "",
    search: "",
    include_deleted: false,
  });
  const [searchInput, setSearchInput] = useState("");
  const searchTimeout = useRef(null);

  // Form modal state
  const [formModal, setFormModal] = useState({
    open: false,
    mode: "add", // 'add' | 'edit'
    selectedEvent: null,
  });
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});

  // Confirm modal state (publish/unpublish/delete)
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: null, // 'publish' | 'unpublish' | 'delete'
    selectedEvent: null,
  });

  // Image upload state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef(null);

  // ---- Fetch ----
  const fetchEvents = useCallback(async (currentFilters) => {
    setLoading(true);
    try {
      const params = {};
      if (currentFilters.status) params.status = currentFilters.status;
      if (currentFilters.category) params.category = currentFilters.category;
      if (currentFilters.search) params.search = currentFilters.search;
      if (currentFilters.include_deleted) params.include_deleted = true;

      const res = await ownerService.getOwnerEvents(params);
      if (res.success) {
        setEvents(res.data.events);
        setSummary({
          total: res.data.total,
          published_count: res.data.published_count,
          draft_count: res.data.draft_count,
        });
      }
    } catch {
      toast.error("Gagal memuat data event");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(filters);
  }, [filters, fetchEvents]);

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
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetImageState = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setRemoveImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ---- Modal Handlers ----
  const openAddModal = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    resetImageState();
    setFormModal({ open: true, mode: "add", selectedEvent: null });
  };

  const openEditModal = (event) => {
    setForm({
      title: event.title,
      description: event.description,
      category: event.category,
      start_date: event.start_date ? event.start_date.substring(0, 10) : "",
      end_date: event.end_date ? event.end_date.substring(0, 10) : "",
      status: event.status,
    });
    setFormErrors({});
    resetImageState();
    if (event.image_url) {
      setImagePreview(event.image_url);
    }
    setFormModal({ open: true, mode: "edit", selectedEvent: event });
  };

  const openPublishModal = (event) => {
    setConfirmModal({
      open: true,
      type: event.status === "published" ? "unpublish" : "publish",
      selectedEvent: event,
    });
  };

  const openDeleteModal = (event) => {
    setConfirmModal({
      open: true,
      type: "delete",
      selectedEvent: event,
    });
  };

  const closeFormModal = () => {
    resetImageState();
    setFormModal({ open: false, mode: "add", selectedEvent: null });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ open: false, type: null, selectedEvent: null });
  };

  // ---- Validation ----
  const validateForm = () => {
    const errors = {};
    if (!form.title.trim()) errors.title = "Judul wajib diisi";
    else if (form.title.length > 200)
      errors.title = "Judul maksimal 200 karakter";
    if (!form.description.trim()) errors.description = "Deskripsi wajib diisi";
    if (!form.category) errors.category = "Kategori wajib dipilih";

    if (form.category === "event") {
      if (!form.start_date)
        errors.start_date = "Tanggal mulai wajib diisi untuk event";
      if (!form.end_date)
        errors.end_date = "Tanggal berakhir wajib diisi untuk event";
      if (form.start_date && form.end_date && form.end_date < form.start_date) {
        errors.end_date = "Tanggal berakhir tidak boleh sebelum tanggal mulai";
      }
    }
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
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("category", form.category);
    formData.append("status", form.status);

    if (form.category === "event") {
      formData.append("start_date", form.start_date);
      formData.append("end_date", form.end_date);
    } else {
      if (form.start_date) formData.append("start_date", form.start_date);
      if (form.end_date) formData.append("end_date", form.end_date);
    }

    if (form.category === "event") {
      if (imageFile) {
        formData.append("image", imageFile);
      } else if (removeImage) {
        formData.append("remove_image", "1");
      }
    }

    if (formModal.mode === "edit") {
      formData.append("_method", "PUT");
    }

    setSubmitLoading(true);
    try {
      if (formModal.mode === "edit") {
        await ownerService.updateEvent(formModal.selectedEvent.id, formData);
        toast.success("Event berhasil diperbarui");
      } else {
        await ownerService.createEvent(formData);
        toast.success("Event berhasil dibuat");
      }
      closeFormModal();
      fetchEvents(filters);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal menyimpan event");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleConfirm = async () => {
    const { type, selectedEvent } = confirmModal;

    if (type === "delete") {
      setSubmitLoading(true);
      try {
        await ownerService.deleteEvent(selectedEvent.id);
        toast.success("Event berhasil dihapus");
        closeConfirmModal();
        fetchEvents(filters);
      } catch (err) {
        toast.error(err?.response?.data?.message || "Gagal menghapus event");
      } finally {
        setSubmitLoading(false);
      }
      return;
    }

    // publish / unpublish
    const newStatus = type === "publish" ? "published" : "draft";

    if (newStatus === "published" && selectedEvent.category === "event") {
      if (!selectedEvent.start_date || !selectedEvent.end_date) {
        toast.error(
          "Event harus memiliki tanggal mulai dan berakhir sebelum dipublikasikan",
        );
        closeConfirmModal();
        return;
      }
    }

    setSubmitLoading(true);
    try {
      await ownerService.toggleEventPublish(selectedEvent.id, newStatus);
      toast.success(
        `Event berhasil di-${newStatus === "published" ? "publikasikan" : "unpublish"}`,
      );
      closeConfirmModal();
      fetchEvents(filters);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Gagal mengubah status publikasi",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  // Resolve confirm config
  const confirmCfg = confirmModal.type
    ? CONFIRM_CONFIG[confirmModal.type]
    : null;

  // ==================== RENDER ====================
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground">
          Manajemen Acara &amp; Pengumuman
        </h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open("/events", "_blank")}
        >
          🌐 Lihat Tampilan Publik
        </Button>
      </div>

      {/* Summary */}
      <div className="flex gap-4 mb-4">
        <div className="px-4 py-2 bg-muted rounded-lg text-sm border border-border">
          <span className="text-muted-foreground">Total:</span>{" "}
          <span className="font-semibold text-foreground">{summary.total}</span>
        </div>
        <div className="px-4 py-2 bg-green-500/10 rounded-lg text-sm border border-green-500/20">
          <span className="text-muted-foreground">Published:</span>{" "}
          <span className="font-semibold text-green-600">
            {summary.published_count}
          </span>
        </div>
        <div className="px-4 py-2 bg-yellow-500/10 rounded-lg text-sm border border-yellow-500/20">
          <span className="text-muted-foreground">Draft:</span>{" "}
          <span className="font-semibold text-yellow-600">
            {summary.draft_count}
          </span>
        </div>
      </div>

      <Button onClick={openAddModal} className="mb-4">
        + Tambah Acara/Pengumuman
      </Button>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <Input
          type="text"
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Cari judul event..."
          className="w-52"
        />
        <FormSelect
          value={filters.status}
          onValueChange={(val) =>
            handleFilterChange("status", val === "all" ? "" : val)
          }
          placeholder="Semua Status"
          options={[
            { value: "all", label: "Semua Status" },
            { value: "draft", label: "Draft" },
            { value: "published", label: "Published" },
          ]}
          className="w-40"
        />
        <FormSelect
          value={filters.category}
          onValueChange={(val) =>
            handleFilterChange("category", val === "all" ? "" : val)
          }
          placeholder="Semua Kategori"
          options={[
            { value: "all", label: "Semua Kategori" },
            { value: "event", label: "Acara" },
            { value: "info", label: "Pengumuman" },
          ]}
          className="w-44"
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

      {/* Event List */}
      {loading ? (
        <p className="text-muted-foreground py-8 text-center">Memuat data...</p>
      ) : events.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          Belum ada event
        </p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <EventListItem
              key={event.id}
              event={event}
              onEdit={openEditModal}
              onPublish={openPublishModal}
              onDelete={openDeleteModal}
            />
          ))}
        </div>
      )}

      {/* Form Dialog (Add / Edit) */}
      <FormDialog
        open={formModal.open}
        onClose={closeFormModal}
        title={
          formModal.mode === "edit"
            ? "Edit Acara/Pengumuman"
            : "Tambah Acara/Pengumuman"
        }
        size="lg"
        loading={submitLoading}
        onSubmit={handleSubmit}
        submitLabel={formModal.mode === "edit" ? "Simpan Perubahan" : "Buat"}
        cancelLabel="Batal"
      >
        <div className="grid gap-4">
          {/* Judul */}
          <div className="grid gap-1.5">
            <Label>Judul *</Label>
            <Input
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
              placeholder="Judul acara atau pengumuman"
            />
            {formErrors.title && (
              <p className="text-xs text-red-500">{formErrors.title}</p>
            )}
          </div>

          {/* Kategori */}
          <div className="grid gap-1.5">
            <Label>Kategori *</Label>
            <FormSelect
              value={form.category}
              onValueChange={(val) => {
                setForm((p) => ({ ...p, category: val }));
                if (val === "info") resetImageState();
              }}
              options={CATEGORY_OPTIONS}
              className="w-full"
            />
            {formErrors.category && (
              <p className="text-xs text-red-500">{formErrors.category}</p>
            )}
          </div>

          {/* Deskripsi */}
          <div className="grid gap-1.5">
            <Label>Deskripsi *</Label>
            <Textarea
              rows={5}
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Deskripsi lengkap..."
            />
            {formErrors.description && (
              <p className="text-xs text-red-500">{formErrors.description}</p>
            )}
          </div>

          {/* Tanggal — Event (required) */}
          {form.category === "event" && (
            <>
              <div className="grid gap-1.5">
                <Label>Tanggal Mulai *</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, start_date: e.target.value }))
                  }
                />
                {formErrors.start_date && (
                  <p className="text-xs text-red-500">
                    {formErrors.start_date}
                  </p>
                )}
              </div>
              <div className="grid gap-1.5">
                <Label>Tanggal Berakhir *</Label>
                <Input
                  type="date"
                  value={form.end_date}
                  min={form.start_date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, end_date: e.target.value }))
                  }
                />
                {formErrors.end_date && (
                  <p className="text-xs text-red-500">{formErrors.end_date}</p>
                )}
              </div>
            </>
          )}

          {/* Tanggal — Info (optional) */}
          {form.category === "info" && (
            <>
              <div className="grid gap-1.5">
                <Label>
                  Tanggal Mulai{" "}
                  <span className="text-muted-foreground font-normal">
                    (opsional)
                  </span>
                </Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, start_date: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-1.5">
                <Label>
                  Masa Berlaku{" "}
                  <span className="text-muted-foreground font-normal">
                    (opsional)
                  </span>
                </Label>
                <Input
                  type="date"
                  value={form.end_date}
                  min={form.start_date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, end_date: e.target.value }))
                  }
                />
              </div>
            </>
          )}

          {/* Gambar — hanya untuk event */}
          {form.category === "event" && (
            <div className="grid gap-1.5">
              <Label>
                Gambar{" "}
                <span className="text-muted-foreground font-normal">
                  (opsional, maks 5MB)
                </span>
              </Label>
              {imagePreview && (
                <div className="mb-1 relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-w-xs h-40 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          )}

          {/* Status */}
          <div className="grid gap-1.5">
            <Label>Status</Label>
            <FormSelect
              value={form.status}
              onValueChange={(val) => setForm((p) => ({ ...p, status: val }))}
              options={STATUS_OPTIONS}
              className="w-full"
            />
          </div>
        </div>
      </FormDialog>

      {/* Confirm Dialog (publish/unpublish/delete) */}
      {confirmCfg && (
        <ConfirmDialog
          open={confirmModal.open}
          onClose={closeConfirmModal}
          onConfirm={handleConfirm}
          variant={confirmCfg.variant}
          title={
            confirmModal.type === "delete"
              ? "Hapus Event"
              : confirmModal.type === "publish"
                ? "Publikasikan Event"
                : "Unpublish Event"
          }
          description={
            confirmModal.selectedEvent
              ? confirmCfg.getDescription(confirmModal.selectedEvent.title)
              : ""
          }
          confirmLabel={confirmCfg.confirmLabel}
          loading={submitLoading}
        />
      )}
    </div>
  );
};

export default EventManagement;
