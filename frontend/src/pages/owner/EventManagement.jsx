// File: src/pages/owner/EventManagement.jsx

import { useState, useEffect, useCallback, useRef } from "react";
import ownerService from "../../services/ownerService";

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

  const [modalState, setModalState] = useState({
    form: false,
    delete: false,
    publish: false,
    mode: "add", // 'add' | 'edit'
    selectedEvent: null,
  });

  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});

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

  // ---- Modal Handlers ----
  const openAddModal = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setModalState({
      form: true,
      delete: false,
      publish: false,
      mode: "add",
      selectedEvent: null,
    });
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
    setModalState({
      form: true,
      delete: false,
      publish: false,
      mode: "edit",
      selectedEvent: event,
    });
  };

  const openDeleteModal = (event) => {
    setModalState({
      form: false,
      delete: true,
      publish: false,
      mode: "edit",
      selectedEvent: event,
    });
  };

  const openPublishModal = (event) => {
    setModalState({
      form: false,
      delete: false,
      publish: true,
      mode: "edit",
      selectedEvent: event,
    });
  };

  const closeModals = () => {
    setModalState({
      form: false,
      delete: false,
      publish: false,
      mode: "add",
      selectedEvent: null,
    });
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

    const payload = {
      title: form.title,
      description: form.description,
      category: form.category,
      status: form.status,
      start_date: form.category === "event" ? form.start_date : null,
      end_date: form.category === "event" ? form.end_date : null,
    };

    setSubmitLoading(true);
    try {
      if (modalState.mode === "edit") {
        await ownerService.updateEvent(modalState.selectedEvent.id, payload);
        showToast("Event berhasil diperbarui");
      } else {
        await ownerService.createEvent(payload);
        showToast("Event berhasil dibuat");
      }
      closeModals();
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

  const handleDelete = async () => {
    setSubmitLoading(true);
    try {
      await ownerService.deleteEvent(modalState.selectedEvent.id);
      showToast("Event berhasil dihapus");
      closeModals();
      fetchEvents(filters);
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Gagal menghapus event",
        "error",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleTogglePublish = async () => {
    const event = modalState.selectedEvent;
    const newStatus = event.status === "published" ? "draft" : "published";

    // Validasi date untuk event category saat akan publish
    if (newStatus === "published" && event.category === "event") {
      if (!event.start_date || !event.end_date) {
        showToast(
          "Event harus memiliki tanggal mulai dan berakhir sebelum dipublikasikan",
          "error",
        );
        closeModals();
        return;
      }
    }

    setSubmitLoading(true);
    try {
      await ownerService.toggleEventPublish(event.id, newStatus);
      showToast(
        `Event berhasil di-${newStatus === "published" ? "publikasikan" : "unpublish"}`,
      );
      closeModals();
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
        <div>
          [{toast.type === "success" ? "OK" : "ERROR"}] {toast.message}
        </div>
      )}

      <h1>Manajemen Event & Informasi</h1>

      {/* Summary */}
      <div>
        <span>Total: {summary.total} | </span>
        <span>Published: {summary.published_count} | </span>
        <span>Draft: {summary.draft_count}</span>
      </div>

      <button onClick={openAddModal}>+ Tambah Event/Info</button>

      {/* Filters */}
      <div>
        <input
          type="text"
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Cari judul event..."
        />
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange("status", e.target.value)}
        >
          <option value="">Semua Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange("category", e.target.value)}
        >
          <option value="">Semua Kategori</option>
          <option value="event">Event</option>
          <option value="info">Info</option>
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

      {/* Event List */}
      {loading ? (
        <p>Memuat data...</p>
      ) : events.length === 0 ? (
        <p>Belum ada event</p>
      ) : (
        <div>
          {events.map((event) => (
            <div
              key={event.id}
              style={{
                border: "1px solid #ccc",
                padding: 12,
                marginTop: 8,
                opacity: event.deleted_at ? 0.5 : 1,
              }}
            >
              <div>
                <strong>{event.title}</strong>{" "}
                <span>[{event.category === "event" ? "Event" : "Info"}]</span>{" "}
                <span>
                  [{event.status === "published" ? "PUBLISHED" : "DRAFT"}]
                </span>
                {event.deleted_at && <span> [DIHAPUS]</span>}
              </div>

              {event.start_date && (
                <div>
                  Tanggal: {event.start_date} s/d {event.end_date}
                </div>
              )}

              <div>
                {event.description.length > 100
                  ? event.description.substring(0, 100) + "..."
                  : event.description}
              </div>

              {!event.deleted_at && (
                <div style={{ marginTop: 8 }}>
                  <button onClick={() => openEditModal(event)}>Edit</button>
                  {" | "}
                  <button onClick={() => openPublishModal(event)}>
                    {event.status === "published" ? "Unpublish" : "Publish"}
                  </button>
                  {" | "}
                  <button onClick={() => openDeleteModal(event)}>Hapus</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {modalState.form && (
        <div style={{ border: "1px solid #000", padding: 16, marginTop: 16 }}>
          <h2>
            {modalState.mode === "edit" ? "Edit Event" : "Tambah Event/Info"}
          </h2>
          <div>
            <label>Judul *</label>
            <br />
            <input
              style={{ width: "100%" }}
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
            />
            {formErrors.title && (
              <span style={{ color: "red" }}> {formErrors.title}</span>
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
              <option value="event">Event</option>
              <option value="info">Info</option>
            </select>
          </div>
          <div>
            <label>Deskripsi *</label>
            <br />
            <textarea
              style={{ width: "100%" }}
              rows={5}
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
            />
            {formErrors.description && (
              <span style={{ color: "red" }}> {formErrors.description}</span>
            )}
          </div>
          {/* Date fields — hanya tampil jika category=event */}
          {form.category === "event" && (
            <>
              <div>
                <label>Tanggal Mulai *</label>
                <br />
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, start_date: e.target.value }))
                  }
                />
                {formErrors.start_date && (
                  <span style={{ color: "red" }}> {formErrors.start_date}</span>
                )}
              </div>
              <div>
                <label>Tanggal Berakhir *</label>
                <br />
                <input
                  type="date"
                  value={form.end_date}
                  min={form.start_date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, end_date: e.target.value }))
                  }
                />
                {formErrors.end_date && (
                  <span style={{ color: "red" }}> {formErrors.end_date}</span>
                )}
              </div>
            </>
          )}
          <div>
            <label>Status</label>
            <br />
            <select
              value={form.status}
              onChange={(e) =>
                setForm((p) => ({ ...p, status: e.target.value }))
              }
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <br />
          <button onClick={handleSubmit} disabled={submitLoading}>
            {submitLoading
              ? "Menyimpan..."
              : modalState.mode === "edit"
                ? "Simpan Perubahan"
                : "Buat Event"}
          </button>{" "}
          <button onClick={closeModals}>Batal</button>
        </div>
      )}

      {/* Publish Confirmation Modal */}
      {modalState.publish && modalState.selectedEvent && (
        <div style={{ border: "1px solid #000", padding: 16, marginTop: 16 }}>
          {modalState.selectedEvent.status === "published" ? (
            <p>
              Unpublish event "{modalState.selectedEvent.title}"? Event tidak
              akan terlihat publik.
            </p>
          ) : (
            <p>
              Publikasikan event "{modalState.selectedEvent.title}"? Event akan
              terlihat oleh semua pengguna.
            </p>
          )}
          <button onClick={handleTogglePublish} disabled={submitLoading}>
            {submitLoading ? "Memproses..." : "Ya, Konfirmasi"}
          </button>{" "}
          <button onClick={closeModals}>Batal</button>
        </div>
      )}

      {/* Delete Modal */}
      {modalState.delete && modalState.selectedEvent && (
        <div style={{ border: "1px solid red", padding: 16, marginTop: 16 }}>
          <p>
            Hapus event "{modalState.selectedEvent.title}"? Tindakan ini tidak
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

export default EventManagement;
