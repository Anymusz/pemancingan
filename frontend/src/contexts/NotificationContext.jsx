// File: src/contexts/NotificationContext.jsx

import { useEffect, useState, useCallback } from "react";
import notificationService from "@/services/notificationService";
import { getToken } from "@/utils/tokenManager";
import { NotificationContext } from "@/hooks/useNotification";

export function NotificationProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!getToken()) return;
    try {
      const res = await notificationService.getUnreadCount();
      setUnreadCount(res.data?.unread_count ?? 0);
    } catch {
      // silent fail
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}
