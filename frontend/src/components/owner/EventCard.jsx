// File: src/components/owner/EventCard.jsx

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { motion } from "framer-motion";
import { ImageOff, Megaphone, Calendar, Eye, ArrowRight } from "lucide-react";
import { formatDate } from "@/utils/utils";
import ImageLightbox from "@/components/common/ImageLightbox";

export default function EventCard({ event, onClick }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full"
      >
        <Card
          className={`group relative h-full flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border-border/50 bg-card/30 backdrop-blur-md transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 cursor-pointer ${
            event.deleted_at ? "opacity-60" : ""
          }`}
          onClick={onClick}
        >
          {/* ── Image zone ── */}
          <div className="relative aspect-video overflow-hidden">
            {event.category === "event" ? (
              event.image_url ? (
                <>
                  <motion.img
                    src={event.image_url}
                    alt={event.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxOpen(true);
                    }}
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-background/80 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-40 pointer-events-none" />
                  <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-[2px] opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none">
                    <motion.span className="flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 pointer-events-none">
                      <Eye className="h-4 w-4" />
                      Lihat Gambar
                    </motion.span>
                  </div>
                </>
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-sky-400 to-sky-500">
                  <Calendar className="w-10 h-10 text-white/40" />
                </div>
              )
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-500">
                <Megaphone className="w-10 h-10 text-white/40" />
              </div>
            )}
          </div>

          {/* ── Content zone ── */}
          <div className="flex flex-1 flex-col p-4">
            <div className="flex flex-wrap gap-1.5 mb-2">
              <StatusBadge status={event.display_status} />
              <StatusBadge status={event.category} />
              {event.deleted_at && <StatusBadge status="deactivated" />}
            </div>
            <h3 className="mb-1 text-base font-semibold leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary line-clamp-2">
              {event.title}
            </h3>
            <p className="line-clamp-2 text-sm text-muted-foreground mb-3">
              {event.description}
            </p>
            <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-3">
              {event.start_date ? (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(event.start_date)}</span>
                </div>
              ) : (
                <StatusBadge status={event.status} />
              )}
              <ArrowRight className="w-4 h-4 text-primary" />
            </div>
          </div>
        </Card>
      </motion.div>

      <ImageLightbox
        open={lightboxOpen}
        src={event.image_url}
        alt={event.title}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
