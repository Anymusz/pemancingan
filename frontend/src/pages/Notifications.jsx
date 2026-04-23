import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import notificationService from "@/services/notificationService";
import { getUser } from "@/utils/tokenManager";
import { useNotification } from "@/hooks/useNotification";
import { Button } from "@/components/common/Button";
import {
  Bell,
  ChevronLeft,
  UserPlus,
  Fish,
  TrendingUp,
  TrendingDown,
  Megaphone,
  Ticket,
} from "lucide-react";

const getRelativeTime = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) return "Baru saja";
  if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;
  if (diffHours < 24) return `${diffHours} jam yang lalu`;
  if (diffDays < 30) return `${diffDays} hari yang lalu`;
  return `${diffMonths} bulan yang lalu`;
};

const getNotificationIcon = (type) => {
  switch (type) {
    case "member_pending":
      return UserPlus;
    case "low_stock":
      return Fish;
    case "tier_upgraded":
      return TrendingUp;
    case "tier_downgraded":
      return TrendingDown;
    case "event_published":
      return Megaphone;
    case "voucher_issued":
      return Ticket;
    default:
      return Bell;
  }
};

const getRedirectPath = (notifType, role, data = null) => {
  switch (notifType) {
    case "member_pending":
      return "/owner/dashboard?tab=pending";
    case "low_stock":
      if (role === "owner") return "/owner/dashboard?tab=fish-types";
      if (role === "employee")
        return "/employee/dashboard?tab=menuavailability";
      return null;
    case "tier_upgraded":
    case "tier_downgraded":
      return "/member/dashboard";
    case "event_published":
      return data?.event_id ? `/events/${data.event_id}` : "/events";
    case "voucher_issued":
      return "/member/dashboard";
    default:
      return null;
  }
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const navigate = useNavigate();
  const role = getUser()?.role;
  const { refreshUnreadCount } = useNotification();
  const sentinelRef = useRef(null);
  const pageRef = useRef(1);
  const isFetchingRef = useRef(false);

  const fetchNotifications = useCallback(async (pageNum, append = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const res = await notificationService.getNotifications(pageNum);
      const data = res.data ?? [];
      const meta = res.meta;

      setNotifications((prev) => {
        if (!append) return data;

        const existingIds = new Set(prev.map((item) => item.id));
        const nextBatch = data.filter((item) => !existingIds.has(item.id));
        return [...prev, ...nextBatch];
      });

      if (meta) {
        setHasMore(meta.current_page < meta.last_page);
      } else {
        setHasMore(data.length > 0);
      }
    } catch (error) {
      console.error("Gagal memuat notifikasi", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    pageRef.current = 1;
    setHasMore(true);
    fetchNotifications(1, false);
  }, [fetchNotifications]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting || !hasMore || loading || loadingMore) return;

        const nextPage = pageRef.current + 1;
        pageRef.current = nextPage;
        fetchNotifications(nextPage, true);
      },
      {
        root: null,
        rootMargin: "240px 0px",
        threshold: 0,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.unobserve(sentinel);
      observer.disconnect();
    };
  }, [fetchNotifications, hasMore, loading, loadingMore]);

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await notificationService.markAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)),
        );
        refreshUnreadCount();
      } catch (error) {
        console.error("Gagal menandai notifikasi sebagai dibaca", error);
      }
    }

    const path = getRedirectPath(notif.type, role, notif.data);
    if (path) navigate(path);
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      refreshUnreadCount();
    } catch (error) {
      console.error("Gagal menandai semua notifikasi sebagai dibaca", error);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleBack = () => {
    if (role === "owner") navigate("/owner/dashboard");
    else if (role === "employee") navigate("/employee/dashboard");
    else if (role === "member") navigate("/member/dashboard");
    else navigate("/");
  };

  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ChevronLeft className="w-4 h-4" />
              Kembali
            </Button>
          </div>

          {hasUnread && (
            <Button
              size="sm"
              onClick={handleMarkAllAsRead}
              loading={markingAll}
              disabled={markingAll}
            >
              Tandai Semua Dibaca
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            Memuat notifikasi...
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p>Belum ada notifikasi</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {notifications.map((notif) => {
                const Icon = getNotificationIcon(notif.type);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-colors border border-border hover:bg-muted/30 bg-card ${
                      notif.is_read ? "" : "border-l-4 border-l-primary"
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center mt-0.5 ${
                        notif.is_read ? "bg-muted" : "bg-primary/10"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 ${notif.is_read ? "text-muted-foreground" : "text-primary"}`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-foreground text-sm">
                          {notif.title}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {notif.body}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {getRelativeTime(notif.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {loadingMore && (
              <div className="py-6 text-center">
                <span className="text-sm text-muted-foreground">
                  Memuat lebih banyak...
                </span>
              </div>
            )}

            {!hasMore && notifications.length > 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Semua notifikasi sudah ditampilkan
              </div>
            )}
          </>
        )}

        <div ref={sentinelRef} className="py-2" />
      </div>
    </div>
  );
}
