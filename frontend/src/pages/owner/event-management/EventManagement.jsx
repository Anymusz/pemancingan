// File: src/pages/owner/event-management/EventManagement.jsx

import { useState, useEffect, useCallback, useRef } from "react";
import ownerService from "@/services/ownerService";
import EventCard from "@/components/owner/EventCard";
import EventDetailDrawer from "@/components/owner/EventDetailDrawer";
import EventFormDialog from "./EventFormDialog";
import { useToast } from "@/hooks/useToast";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Input } from "@/components/common/FormInput";
import { FormSelect } from "@/components/common/FormSelect";
import { Button } from "@/components/common/Button";
import { TabsNav } from "@/components/common/TabsNav";

// ==================== CONSTANTS ====================

const CONFIRM_CONFIG = {
  publish: {
    variant: "default",
    confirmLabel: "Publikasikan",
    getDescription: (title) =>
      `Publikasikan event "${title}"? Event akan terlihat oleh semua pengguna.`,
  },
  unpublish: {
    variant: "warning",
    confirmLabel: "Unpublish",
    getDescription: (title) =>
      `Unpublish event "${title}"? Event tidak akan terlihat publik.`,
  },
  delete: {
    variant: "destructive",
    confirmLabel: "Hapus",
    getDescription: (title) =>
      `Hapus event "${title}"? Tindakan ini tidak dapat dibatalkan.`,
  },
};

const TAB_ITEMS = [
  { value: "all", label: "Semua" },
  { value: "event", label: "Acara" },
  { value: "info", label: "Pengumuman" },
];

// ==================== COMPONENT ====================

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    published_count: 0,
    draft_count: 0,
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const toast = useToast();

  const [filters, setFilters] = useState({
    status: "",
    category: "",
    search: "",
    include_deleted: false,
  });
  const [searchInput, setSearchInput] = useState("");
  const searchTimeout = useRef(null);

  // Form modal state (simplified — form logic lives in EventFormDialog)
  const [formModal, setFormModal] = useState({
    open: false,
    mode: "add",
    selectedEvent: null,
  });

  // Confirm modal state (publish / unpublish / delete)
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: null,
    selectedEvent: null,
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Detail drawer state
  const [drawerState, setDrawerState] = useState({ open: false, event: null });

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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFilters((prev) => ({ ...prev, category: tab === "all" ? "" : tab }));
  };

  // ---- Modal Handlers ----
  const openAddModal = () =>
    setFormModal({ open: true, mode: "add", selectedEvent: null });

  const openEditModal = (event) =>
    setFormModal({ open: true, mode: "edit", selectedEvent: event });

  const openPublishModal = (event) =>
    setConfirmModal({
      open: true,
      type: event.status === "published" ? "unpublish" : "publish",
      selectedEvent: event,
    });

  const openDeleteModal = (event) =>
    setConfirmModal({ open: true, type: "delete", selectedEvent: event });

  const closeConfirmModal = () =>
    setConfirmModal({ open: false, type: null, selectedEvent: null });

  // ---- Confirm action ----
  const handleConfirm = async () => {
    const { type, selectedEvent } = confirmModal;

    if (type === "delete") {
      setConfirmLoading(true);
      try {
        await ownerService.deleteEvent(selectedEvent.id);
        toast.success("Event berhasil dihapus");
        closeConfirmModal();
        fetchEvents(filters);
      } catch (err) {
        toast.error(err?.response?.data?.message || "Gagal menghapus event");
      } finally {
        setConfirmLoading(false);
      }
      return;
    }

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

    setConfirmLoading(true);
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
      setConfirmLoading(false);
    }
  };

  const confirmCfg = confirmModal.type
    ? CONFIRM_CONFIG[confirmModal.type]
    : null;

  // ==================== RENDER ====================
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Manajemen Acara &amp; Pengumuman
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {summary.total} total · {summary.published_count} published ·{" "}
            {summary.draft_count} draft
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open("/events", "_blank")}
          >
            🌐 Tampilan Publik
          </Button>
          <Button size="sm" onClick={openAddModal}>
            + Tambah Acara
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <TabsNav
        items={TAB_ITEMS}
        value={activeTab}
        onValueChange={handleTabChange}
        className="justify-start"
      />

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <Input
          type="text"
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Cari judul event..."
          className="w-52"
        />
        <FormSelect
          value={filters.status || "all"}
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
        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
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
        <p className="text-muted-foreground py-10 text-center text-sm">
          Memuat data...
        </p>
      ) : events.length === 0 ? (
        <p className="text-muted-foreground py-10 text-center text-sm">
          Belum ada event
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onClick={() => setDrawerState({ open: true, event })}
            />
          ))}
        </div>
      )}

      {/* Form Dialog (Add / Edit) */}
      <EventFormDialog
        open={formModal.open}
        mode={formModal.mode}
        selectedEvent={formModal.selectedEvent}
        onClose={() =>
          setFormModal({ open: false, mode: "add", selectedEvent: null })
        }
        onSuccess={() => fetchEvents(filters)}
      />

      {/* Confirm Dialog (publish / unpublish / delete) */}
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
          loading={confirmLoading}
        />
      )}

      {/* Detail Drawer */}
      <EventDetailDrawer
        open={drawerState.open}
        onClose={() => setDrawerState({ open: false, event: null })}
        event={drawerState.event}
        onEdit={(event) => {
          setDrawerState({ open: false, event: null });
          openEditModal(event);
        }}
        onPublish={(event) => {
          setDrawerState({ open: false, event: null });
          openPublishModal(event);
        }}
        onDelete={(event) => {
          setDrawerState({ open: false, event: null });
          openDeleteModal(event);
        }}
      />
    </div>
  );
};

export default EventManagement;
