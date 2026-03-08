import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getEventDetail } from "@/services/eventService";

const STATUS_LABELS = {
  ongoing: { text: "Berlangsung", color: "bg-green-100 text-green-700" },
  upcoming: { text: "Akan Datang", color: "bg-blue-100 text-blue-700" },
  finished: { text: "Selesai", color: "bg-gray-100 text-gray-600" },
  expired: { text: "Kedaluwarsa", color: "bg-red-100 text-red-600" },
};

const CATEGORY_LABELS = {
  event: { text: "Acara", color: "bg-purple-100 text-purple-700" },
  info: { text: "Pengumuman", color: "bg-amber-100 text-amber-700" },
};

const formatDateLong = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Close lightbox on ESC
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getEventDetail(id);
        setEvent(res.data);
      } catch (err) {
        console.error("Gagal memuat detail event", err);
        setError(
          err?.response?.status === 404
            ? "Event tidak ditemukan"
            : "Gagal memuat data event",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-3">📡</div>
          <p>Memuat detail event...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">😕</div>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => navigate("/events")}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            ← Kembali ke Daftar
          </button>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const placeholderImage =
    event.category === "event"
      ? "/images/placeholder-event.jpg"
      : "/images/placeholder-info.jpg";

  const categoryLabel = CATEGORY_LABELS[event.category];
  const statusLabel = STATUS_LABELS[event.display_status];

  return (
    <>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Back button */}
          <button
            onClick={() => navigate("/events")}
            className="mb-6 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            ← Kembali ke Daftar
          </button>

          {/* Expired Banner */}
          {event.display_status === "expired" && (
            <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700 font-medium">
                ⚠️ Pengumuman ini sudah tidak berlaku
              </p>
            </div>
          )}

          {/* Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 overflow-hidden">
            {/* Image */}
            <div className="w-full h-64 md:h-80 bg-gray-100 overflow-hidden">
              <img
                src={event.image_url || placeholderImage}
                alt={event.title}
                className="w-full h-full object-cover cursor-zoom-in"
                onClick={() => setLightboxOpen(true)}
              />
            </div>

            {/* Content */}
            <div className="p-6 md:p-8">
              {/* Badges */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {categoryLabel && (
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${categoryLabel.color}`}
                  >
                    {categoryLabel.text}
                  </span>
                )}
                {statusLabel && (
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${statusLabel.color}`}
                  >
                    {statusLabel.text}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                {event.title}
              </h1>

              {/* Date */}
              <div className="mb-6 text-sm text-gray-500">
                {event.category === "event" && event.start_date ? (
                  <>
                    📅 {formatDateLong(event.start_date)}
                    {event.end_date && ` — ${formatDateLong(event.end_date)}`}
                  </>
                ) : (
                  <>📅 {formatDateLong(event.created_at)}</>
                )}
              </div>

              {/* Description */}
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox — di luar semua container */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 cursor-zoom-out"
          onClick={() => setLightboxOpen(false)}
        >
          <img
            src={event.image_url || placeholderImage}
            alt={event.title}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
