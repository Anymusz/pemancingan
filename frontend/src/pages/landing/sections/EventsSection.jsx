// File: src/pages/landing/sections/EventsSection.jsx

import { useState, useEffect } from "react";
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

export default function EventsSection() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await getEvents(1);
        // Take first 3 items (API already priorities ongoing & upcoming)
        setEvents((res.data ?? []).slice(0, 3));
      } catch (error) {
        console.error("Gagal memuat events", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="py-20 bg-background dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400">
          Memuat acara & pengumuman...
        </div>
      </div>
    );
  }

  if (events.length === 0) return null;

  return (
    <div className="py-20 bg-background dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary dark:text-foreground mb-3">
            Acara & Pengumuman
          </h2>
          <p className="text-text-body dark:text-muted-foreground max-w-2xl mx-auto md:text-xl">
            Info terbaru seputar acara dan pengumuman dari kami
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const placeholderImage =
              event.category === "event"
                ? "/images/placeholder-event.jpg"
                : "/images/placeholder-info.jpg";
            const categoryLabel = CATEGORY_LABELS[event.category];
            const statusLabel =
              event.category === "event"
                ? STATUS_LABELS[event.display_status]
                : null;

            return (
              <div
                key={event.id}
                onClick={() => navigate(`/events/${event.id}`)}
                className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  <img
                    src={event.image_url || placeholderImage}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
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
                        {event.end_date &&
                          ` — ${formatDate(event.end_date)}`}
                      </>
                    ) : (
                      <>📅 {formatDate(event.created_at)}</>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* See All Button */}
        <div className="text-center mt-10">
          <button
            onClick={() => navigate("/events")}
            className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            Lihat Semua Acara & Pengumuman →
          </button>
        </div>
      </div>
    </div>
  );
}
