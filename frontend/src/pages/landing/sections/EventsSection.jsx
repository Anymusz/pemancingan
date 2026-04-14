// File: src/pages/landing/sections/EventsSection.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Megaphone, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/StatusBadge";
import { getEvents } from "@/services/eventService";
import { formatDate } from "@/utils/utils";
import { Button } from "@/components/common/Button";

const CATEGORY_CONFIG = {
  event: {
    gradient: "from-sky-400 to-sky-500",
    PlaceholderIcon: Calendar,
  },
  info: {
    gradient: "from-amber-400 to-amber-500",
    PlaceholderIcon: Megaphone,
  },
};

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border overflow-hidden">
      <div className="aspect-video bg-muted animate-pulse" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-muted animate-pulse rounded" />
        <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
      </div>
    </div>
  );
}

export default function EventsSection() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await getEvents(1);
        setEvents((res.data ?? []).slice(0, 3));
      } catch (error) {
        console.error("Gagal memuat events", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (!loading && events.length === 0) return null;

  return (
    <div className="py-20">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 text-sm font-medium rounded-full bg-primary/10 text-primary mb-3">
            Terbaru dari Kami
          </span>
          <h1 className="text-4xl font-bold text-foreground">
            Acara &amp; Pengumuman
          </h1>
          <p className="text-md text-muted-foreground mt-2">
            Info terkini seputar acara dan pengumuman dari Pemancingan Sutoyo
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading
            ? [1, 2, 3].map((i) => <SkeletonCard key={i} />)
            : events.map((event) => {
                const catConfig =
                  CATEGORY_CONFIG[event.category] ?? CATEGORY_CONFIG.info;
                const { PlaceholderIcon, gradient } = catConfig;

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="w-full"
                  >
                    <Card
                      className="group relative h-full flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border-border/50 bg-card/30 backdrop-blur-md transition-all duration-300 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 cursor-pointer"
                      onClick={() => navigate(`/events/${event.id}`)}
                    >
                      {/* Image zone */}
                      <div className="relative aspect-video overflow-hidden">
                        {event.image_url ? (
                          <>
                            <motion.img
                              src={event.image_url}
                              alt={event.title}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-background/80 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-40 pointer-events-none" />
                          </>
                        ) : (
                          <div
                            className={`h-full w-full flex items-center justify-center bg-gradient-to-br ${gradient}`}
                          >
                            <PlaceholderIcon className="w-10 h-10 text-white/40" />
                          </div>
                        )}
                      </div>

                      {/* Content zone */}
                      <div className="flex flex-1 flex-col p-4">
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {event.category === "event" && (
                            <StatusBadge status={event.display_status} />
                          )}
                          <StatusBadge status={event.category} />
                        </div>
                        <h3 className="mb-1 text-base font-semibold leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary line-clamp-2">
                          {event.title}
                        </h3>
                        <p className="line-clamp-2 text-sm text-muted-foreground mb-3">
                          {event.description}
                        </p>
                        <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-3">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {event.category === "event" && event.start_date
                                ? `${formatDate(event.start_date)}${event.end_date ? ` - ${formatDate(event.end_date)}` : ""}`
                                : formatDate(event.created_at)}
                            </span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Button
            variant="outline"
            size="lg"
            className="gap-2"
            onClick={() => navigate("/events")}
          >
            Lihat Semua
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
