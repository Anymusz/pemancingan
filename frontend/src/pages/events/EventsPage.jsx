// File: src/pages/events/EventsPage.jsx

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getEvents } from "@/services/eventService";
import { formatDate } from "@/utils/utils";

const STATUS_LABELS = {
  ongoing: { text: "Berlangsung", color: "bg-green-100 text-green-700" },
  upcoming: { text: "Akan Datang", color: "bg-blue-100 text-blue-700" },
  finished: { text: "Selesai", color: "bg-gray-100 text-gray-600" },
};

const CATEGORY_LABELS = {
  event: { text: "Acara", color: "bg-purple-100 text-purple-700" },
  info: { text: "Pengumuman", color: "bg-amber-100 text-amber-700" },
};

const FILTERS = [
  { key: "all", label: "Semua" },
  { key: "event", label: "Acara" },
  { key: "info", label: "Pengumuman" },
];

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all"); // 'all' | 'event' | 'info'
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const navigate = useNavigate();
  const sentinelRef = useRef(null);
  const isFetchingRef = useRef(false);

  // Close lightbox on ESC
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") setLightboxSrc(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const fetchEvents = useCallback(
    async (pageNum, append = false, category = "all") => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      if (!append) setInitialLoading(true);
      setLoading(true);

      try {
        const categoryParam = category !== "all" ? category : null;
        const res = await getEvents(pageNum, categoryParam);
        const data = res.data ?? [];
        const meta = res.meta;

        setEvents((prev) => {
          if (!append) return data;
          const existingIds = new Set(prev.map((item) => item.id));
          const newItems = data.filter((item) => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });

        if (meta) {
          setHasMore(!!meta.has_more);
        } else {
          setHasMore(data.length > 0);
        }
      } catch (error) {
        console.error("Gagal memuat events", error);
      } finally {
        setLoading(false);
        setInitialLoading(false);
        isFetchingRef.current = false;
      }
    },
    [],
  );

  // When filter changes, reset and re-fetch
  useEffect(() => {
    setEvents([]);
    setPage(1);
    setHasMore(true);
    fetchEvents(1, false, activeFilter);
  }, [activeFilter, fetchEvents]);

  // Fetch more on page change (infinite scroll)
  useEffect(() => {
    if (page > 1) {
      fetchEvents(page, true, activeFilter);
    }
  }, [page, fetchEvents, activeFilter]);

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting || !hasMore || loading) return;
        setPage((prev) => prev + 1);
      },
      {
        root: null,
        rootMargin: "300px 0px",
        threshold: 0,
      },
    );

    observer.observe(sentinel);
    return () => {
      observer.unobserve(sentinel);
      observer.disconnect();
    };
  }, [hasMore, loading]);

  // Data already filtered by backend
  const filteredEvents = events;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Acara & Pengumuman
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            Informasi terbaru seputar acara dan pengumuman dari pemancingan kami
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-gray-100 rounded-xl p-1 gap-1">
            {FILTERS.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeFilter === filter.key
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading state */}
        {initialLoading ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">📡</div>
            <p>Memuat data...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">📭</div>
            <p>
              Belum ada{" "}
              {activeFilter === "event"
                ? "acara"
                : activeFilter === "info"
                  ? "pengumuman"
                  : "acara & pengumuman"}
            </p>
          </div>
        ) : (
          <>
            {/* Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() => navigate(`/events/${event.id}`)}
                  onImageClick={(src) => setLightboxSrc(src)}
                />
              ))}
            </div>

            {/* Loading more */}
            {loading && (
              <div className="py-8 text-center">
                <span className="text-sm text-gray-400">
                  Memuat lebih banyak...
                </span>
              </div>
            )}

            {/* No more */}
            {!hasMore && filteredEvents.length > 0 && (
              <div className="py-8 text-center text-sm text-gray-400">
                Semua data sudah ditampilkan
              </div>
            )}
          </>
        )}

        {/* Sentinel for infinite scroll */}
        <div ref={sentinelRef} className="py-2" />
      </div>

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 cursor-zoom-out"
          onClick={() => setLightboxSrc(null)}
        >
          <img
            src={lightboxSrc}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}

function EventCard({ event, onClick, onImageClick }) {
  const placeholderImage =
    event.category === "event"
      ? "/images/placeholder-event.jpg"
      : "/images/placeholder-info.jpg";

  const categoryLabel = CATEGORY_LABELS[event.category];
  const statusLabel =
    event.category === "event" ? STATUS_LABELS[event.display_status] : null;

  return (
    <div
      onClick={onClick}
      className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <img
          src={event.image_url || placeholderImage}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-zoom-in"
          onClick={(e) => {
            e.stopPropagation();
            onImageClick(event.image_url || placeholderImage);
          }}
        />
        {/* Badges overlay */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {categoryLabel && (
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${categoryLabel.color}`}
            >
              {categoryLabel.text}
            </span>
          )}
          {statusLabel && (
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusLabel.color}`}
            >
              {statusLabel.text}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-base font-semibold text-gray-800 mb-1.5 line-clamp-1">
          {event.title}
        </h3>
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">
          {event.description}
        </p>
        <div className="text-xs text-gray-400">
          {event.category === "event" && event.start_date ? (
            <>
              📅 {formatDate(event.start_date)}
              {event.end_date && ` — ${formatDate(event.end_date)}`}
            </>
          ) : (
            <>📅 {formatDate(event.created_at)}</>
          )}
        </div>
      </div>
    </div>
  );
}
