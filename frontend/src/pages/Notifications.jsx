import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import notificationService from "@/services/notificationService";
import { getUser } from "@/utils/tokenManager";

const getRelativeTime = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) return "Baru saja";
  if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;
  if (diffHours < 24) return `${diffHours} jam yang lalu`;
  if (diffDays < 7) return `${diffDays} hari yang lalu`;
  if (diffWeeks < 4) return `${diffWeeks} minggu yang lalu`;
  return `${diffMonths} bulan yang lalu`;
};

const getNotificationIcon = (type) => {
  switch (type) {
    case "member_pending":
      return "👤";
    case "low_stock":
      return "📦";
    case "tier_upgraded":
      return "⬆️";
    case "tier_downgraded":
      return "⬇️";
    case "event_published":
      return "📢";
    case "voucher_issued":
      return "🎟️";
    default:
      return "🔔";
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
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Kembali
          </button>
          <h1 className="text-xl font-semibold text-gray-800">Notifikasi</h1>
        </div>

        {hasUnread && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={markingAll}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {markingAll ? "Memproses..." : "Tandai Semua Dibaca"}
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          Memuat notifikasi...
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-3">🔔</div>
          <p>Belum ada notifikasi</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-colors border ${
                  notif.is_read
                    ? "bg-white border-gray-200 hover:bg-gray-50"
                    : "bg-blue-50 border-blue-200 hover:bg-blue-100"
                }`}
              >
                <div className="text-2xl flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-900 text-sm">
                      {notif.title}
                    </p>
                    {!notif.is_read && (
                      <span className="flex-shrink-0 w-2.5 h-2.5 bg-blue-500 rounded-full mt-1.5" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{notif.body}</p>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {getRelativeTime(notif.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {loadingMore && (
            <div className="py-6 text-center">
              <span className="text-sm text-gray-500">
                Memuat lebih banyak...
              </span>
            </div>
          )}

          {!hasMore && notifications.length > 0 && (
            <div className="py-6 text-center text-sm text-gray-400">
              Semua notifikasi sudah ditampilkan
            </div>
          )}
        </>
      )}

      <div ref={sentinelRef} className="py-2" />
    </div>
  );
}
