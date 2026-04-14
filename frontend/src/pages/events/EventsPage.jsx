// File: src/pages/events/EventsPage.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getEvents } from "@/services/eventService";
import EventCard from "@/components/owner/EventCard";
import { TabsNav } from "@/components/common/TabsNav";
import { Button } from "@/components/common/Button";

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

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const navigate = useNavigate();

  const fetchEvents = async (currentPage, category, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const categoryParam = category === "all" ? undefined : category;
      const res = await getEvents(currentPage, categoryParam);
      const data = res.data ?? [];

      if (append) {
        setEvents((prev) => [...prev, ...data]);
      } else {
        setEvents(data);
      }

      setHasMore(res.meta?.has_more ?? false);
      setPage(currentPage);
    } catch (error) {
      console.error("Gagal memuat events", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchEvents(1, activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setEvents([]);
    setPage(1);
    setHasMore(true);
    fetchEvents(1, tab);
  };

  const handleLoadMore = () => {
    fetchEvents(page + 1, activeTab, true);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-12 flex flex-col gap-8">
        {/* Header */}
        <div className="text-center flex flex-col items-center gap-2">
          <span className="inline-block px-4 py-1.5 text-sm font-medium rounded-full bg-primary/10 text-primary">
            Acara &amp; Pengumuman
          </span>
          <h1 className="text-3xl font-bold text-foreground">
            Acara &amp; Pengumuman
          </h1>
          <p className="text-sm text-muted-foreground">
            Info terkini seputar acara dan pengumuman dari Pemancingan Sutoyo
          </p>
        </div>

        {/* Filter Tabs */}
        <TabsNav
          value={activeTab}
          onValueChange={handleTabChange}
          className="justify-center"
          items={[
            { value: "all", label: "Semua" },
            { value: "event", label: "Acara" },
            { value: "info", label: "Pengumuman" },
          ]}
        />

        {/* Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-12">
            Belum ada acara atau pengumuman.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onClick={() => navigate(`/events/${event.id}`)}
              />
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && !loading && (
          <div className="text-center mt-8">
            <Button
              variant="outline"
              size="lg"
              onClick={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? "Memuat..." : "Muat lebih banyak"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
