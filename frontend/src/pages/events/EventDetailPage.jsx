// File: src/pages/events/EventDetailPage.jsx

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Calendar,
  Megaphone,
  AlertTriangle,
  Loader2,
  Clock,
} from "lucide-react";
import { getEventDetail } from "@/services/eventService";
import ImageLightbox from "@/components/common/ImageLightbox";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/common/Button";
import { formatDate } from "@/utils/utils";
import { WarningAlert } from "@/components/feedback/inlineAlert";

const CATEGORY_FALLBACK = {
  event: {
    gradient: "from-sky-400 to-sky-500",
    Icon: Calendar,
  },
  info: {
    gradient: "from-amber-400 to-amber-500",
    Icon: Megaphone,
  },
};

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <AlertTriangle className="w-10 h-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            onClick={() => navigate("/events")}
            className="gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
            Kembali ke Daftar
          </Button>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const fallback = CATEGORY_FALLBACK[event.category] ?? CATEGORY_FALLBACK.info;
  const { gradient, Icon: FallbackIcon } = fallback;

  // Duration calculation
  let duration = "—";
  if (event.start_date && event.end_date) {
    const diff =
      Math.ceil(
        (new Date(event.end_date) - new Date(event.start_date)) /
          (1000 * 60 * 60 * 24),
      ) + 1;
    duration = `${diff} hari`;
  }

  return (
    <>
      <div className="min-h-screen bg-background py-10 px-4">
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          {/* Back button */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 w-fit"
            onClick={() => navigate("/events")}
          >
            <ChevronLeft className="w-4 h-4" />
            Kembali
          </Button>

          {/* Expired banner */}
          {event.display_status === "finished" && (
            <WarningAlert description="Acara ini telah selesai diselenggarakan." />
          )}

          {/* Title block */}
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {event.title}
            </h1>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Dipublikasikan {formatDate(event.created_at)}</span>
            </div>
          </div>

          {/* Image */}
          <div className="w-full h-64 md:h-90 rounded-2xl overflow-hidden border border-border">
            {event.image_url ? (
              <img
                src={event.image_url}
                alt={event.title}
                className="object-cover w-full h-full cursor-zoom-in"
                onClick={() => setLightboxOpen(true)}
              />
            ) : (
              <div
                className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${gradient}`}
              >
                <FallbackIcon className="w-12 h-12 text-white/30" />
              </div>
            )}
          </div>

          {/* Badges + date grid block */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={event.category} />
              {event.category === "event" && (
                <StatusBadge status={event.display_status} />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-muted/50 border border-border">
              {/* Start date */}
              <div className="flex sm:flex-col items-center sm:items-start justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  Tanggal mulai
                </span>
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-foreground">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{formatDate(event.start_date)}</span>
                </div>
              </div>

              {/* End date */}
              <div className="flex sm:flex-col items-center sm:items-start justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  Tanggal berakhir
                </span>
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-foreground">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>
                    {event.end_date ? formatDate(event.end_date) : "—"}
                  </span>
                </div>
              </div>

              {/* Duration */}
              <div className="flex sm:flex-col items-center sm:items-start justify-between gap-2">
                <span className="text-xs text-muted-foreground">Durasi</span>
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-foreground">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{duration}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
            {event.description}
          </p>
        </div>
      </div>

      {/* Lightbox — only if image exists */}
      {event.image_url && (
        <ImageLightbox
          open={lightboxOpen}
          src={event.image_url}
          alt={event.title}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
