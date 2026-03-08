// File: src/pages/owner/event-management/EventManagement.jsx

import { useState, useEffect, useCallback, useRef } from "react";
import ownerService from "@/services/ownerService";
import EventListItem from "./EventListItem";
import EventFormModal from "./EventFormModal";
import EventConfirmModal from "./EventConfirmModal";

const EMPTY_FORM = {
  title: "",
  description: "",
  category: "event",
  start_date: "",
  end_date: "",
  status: "draft",
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
  const [toast, setToast] = useState(null);

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

  // ---- Toast ----
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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
      showToast("Gagal memuat data event", "error");
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
      showToast("File harus berupa gambar", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Ukuran gambar maksimal 5MB", "error");
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
        showToast("Event berhasil diperbarui");
      } else {
        await ownerService.createEvent(formData);
        showToast("Event berhasil dibuat");
      }
      closeFormModal();
      fetchEvents(filters);
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Gagal menyimpan event",
        "error",
      );
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
        showToast("Event berhasil dihapus");
        closeConfirmModal();
        fetchEvents(filters);
      } catch (err) {
        showToast(
          err?.response?.data?.message || "Gagal menghapus event",
          "error",
        );
      } finally {
        setSubmitLoading(false);
      }
      return;
    }

    // publish / unpublish
    const newStatus = type === "publish" ? "published" : "draft";

    if (newStatus === "published" && selectedEvent.category === "event") {
      if (!selectedEvent.start_date || !selectedEvent.end_date) {
        showToast(
          "Event harus memiliki tanggal mulai dan berakhir sebelum dipublikasikan",
          "error",
        );
        closeConfirmModal();
        return;
      }
    }

    setSubmitLoading(true);
    try {
      await ownerService.toggleEventPublish(selectedEvent.id, newStatus);
      showToast(
        `Event berhasil di-${newStatus === "published" ? "publikasikan" : "unpublish"}`,
      );
      closeConfirmModal();
      fetchEvents(filters);
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Gagal mengubah status publikasi",
        "error",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  // ==================== RENDER ====================
  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all ${
            toast.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">
          Manajemen Acara & Pengumuman
        </h1>
        <button
          onClick={() => window.open("/events", "_blank")}
          className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
        >
          🌐 Lihat Tampilan Publik
        </button>
      </div>

      {/* Summary */}
      <div className="flex gap-4 mb-4">
        <div className="px-4 py-2 bg-gray-50 rounded-lg text-sm">
          <span className="text-gray-500">Total:</span>{" "}
          <span className="font-semibold">{summary.total}</span>
        </div>
        <div className="px-4 py-2 bg-green-50 rounded-lg text-sm">
          <span className="text-gray-500">Published:</span>{" "}
          <span className="font-semibold text-green-600">
            {summary.published_count}
          </span>
        </div>
        <div className="px-4 py-2 bg-yellow-50 rounded-lg text-sm">
          <span className="text-gray-500">Draft:</span>{" "}
          <span className="font-semibold text-yellow-600">
            {summary.draft_count}
          </span>
        </div>
      </div>

      <button
        onClick={openAddModal}
        className="mb-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        + Tambah Acara/Pengumuman
      </button>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <input
          type="text"
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Cari judul event..."
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange("status", e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Semua Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange("category", e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Semua Kategori</option>
          <option value="event">Acara</option>
          <option value="info">Pengumuman</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600">
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
        <p className="text-gray-500 py-8 text-center">Memuat data...</p>
      ) : events.length === 0 ? (
        <p className="text-gray-500 py-8 text-center">Belum ada event</p>
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

      {/* Form Modal */}
      {formModal.open && (
        <EventFormModal
          mode={formModal.mode}
          form={form}
          setForm={setForm}
          formErrors={formErrors}
          imagePreview={imagePreview}
          fileInputRef={fileInputRef}
          onImageChange={handleImageChange}
          onRemoveImage={handleRemoveImage}
          onResetImage={resetImageState}
          onSubmit={handleSubmit}
          onClose={closeFormModal}
          submitLoading={submitLoading}
        />
      )}

      {/* Confirm Modal (publish/unpublish/delete) */}
      {confirmModal.open && (
        <EventConfirmModal
          type={confirmModal.type}
          event={confirmModal.selectedEvent}
          onConfirm={handleConfirm}
          onClose={closeConfirmModal}
          submitLoading={submitLoading}
        />
      )}
    </div>
  );
};

export default EventManagement;
