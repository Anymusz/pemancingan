// File: src/pages/owner/ownerDashboard.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PendingMembersList from "./PendingMembersList";
import ActiveMembersList from "./ActiveMembersList";
import ValidationHistory from "./ValidationHistory";
import OwnerLeaderboard from "./OwnerLeaderboard";
import MenuManagement from "./MenuManagement";
import FishTypeManagement from "./FishTypeManagement";
import EventManagement from "./EventManagement";
import VoucherManagement from "./VoucherManagement";
import FinancialReport from "./FinancialReport";
import { removeToken } from "@/utils/tokenManager";
import notificationService from "@/services/notificationService";

const OwnerDashboard = () => {
  const [activeMenu, setActiveMenu] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || "pending";
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  // Fetch unread count on mount + polling every 30s
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await notificationService.getUnreadCount();
        setUnreadCount(res.data?.unread_count ?? 0);
      } catch {
        // silent fail
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    removeToken();
    navigate("/login");
  };

  return (
    <div>
      <header
        style={{
          borderBottom: "2px solid #000",
          padding: "10px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h1>Owner Dashboard</h1>

          {/* Notification Bell */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => navigate("/notifications")}
              style={{
                position: "relative",
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                padding: "4px",
              }}
              title="Notifikasi"
            >
              🔔
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-4px",
                    background: "#EF4444",
                    color: "white",
                    fontSize: "11px",
                    fontWeight: "bold",
                    borderRadius: "9999px",
                    minWidth: "20px",
                    height: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 5px",
                    lineHeight: "1",
                  }}
                >
                  {unreadCount < 100 ? unreadCount : "99+"}
                </span>
              )}
            </button>
            <button onClick={handleLogout}>Logout</button>
          </div>
        </div>

        <nav>
          {/* Kelola Member */}
          <span>Kelola Member: </span>
          <button
            onClick={() => setActiveMenu("pending")}
            disabled={activeMenu === "pending"}
          >
            Pending Members
          </button>
          <button
            onClick={() => setActiveMenu("active")}
            disabled={activeMenu === "active"}
          >
            Active Members
          </button>
          <button
            onClick={() => setActiveMenu("history")}
            disabled={activeMenu === "history"}
          >
            Validation History
          </button>

          {" | "}

          {/* Kelola Produk */}
          <span>Kelola Produk: </span>
          <button
            onClick={() => setActiveMenu("menus")}
            disabled={activeMenu === "menus"}
          >
            Menu Makanan & Minuman
          </button>
          <button
            onClick={() => setActiveMenu("fish-types")}
            disabled={activeMenu === "fish-types"}
          >
            Jenis Ikan
          </button>
          <button
            onClick={() => setActiveMenu("events")}
            disabled={activeMenu === "events"}
          >
            Event & Informasi
          </button>
          <button
            onClick={() => setActiveMenu("vouchers")}
            disabled={activeMenu === "vouchers"}
          >
            Voucher
          </button>
          <button
            onClick={() => setActiveMenu("financial-report")}
            disabled={activeMenu === "financial-report"}
          >
            Laporan Keuangan
          </button>

          {" | "}

          <button
            onClick={() => setActiveMenu("leaderboard")}
            disabled={activeMenu === "leaderboard"}
          >
            Leaderboard
          </button>
        </nav>
      </header>

      <main style={{ padding: "20px" }}>
        {activeMenu === "pending" && <PendingMembersList />}
        {activeMenu === "active" && <ActiveMembersList />}
        {activeMenu === "history" && <ValidationHistory />}
        {activeMenu === "leaderboard" && <OwnerLeaderboard />}
        {activeMenu === "menus" && <MenuManagement />}
        {activeMenu === "fish-types" && <FishTypeManagement />}
        {activeMenu === "events" && <EventManagement />}
        {activeMenu === "vouchers" && <VoucherManagement />}
        {activeMenu === "financial-report" && <FinancialReport />}
      </main>
    </div>
  );
};

export default OwnerDashboard;
