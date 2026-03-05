// File: src/pages/employee/EmployeeDashboard.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CheckIn from "./CheckIn";
import TodayArrivals from "./TodayArrivals";
import Checkout from "./Checkout";
import TransactionHistory from "./TransactionHistory";
import AddOrder from "./AddOrder";
import PendingOrder from "./PendingOrder";
import MenuAvailability from "./MenuAvailability";
import { removeToken, removeUser } from "@/utils/tokenManager";
import notificationService from "@/services/notificationService";

const EmployeeDashboard = () => {
  const initialTab = (() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || "checkin";
  })();
  const [activeMenu, setActiveMenu] = useState(initialTab);
  const [mountedTabs, setMountedTabs] = useState(new Set([initialTab]));
  const [preselectArrivalId, setPreselectArrivalId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  // Fetch unread count on mount + polling every 30s
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await notificationService.getUnreadCount();
        setUnreadCount(res.data?.unread_count ?? 0);
      } catch (err) {
        console.error("Gagal memuat stok ikan:", err);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    removeToken();
    removeUser();
    navigate("/login");
  };

  const handleMenuChange = (menu) => {
    setMountedTabs((prev) => new Set([...prev, menu]));
    setActiveMenu(menu);
  };

  const handleGoToCheckout = (arrivalId) => {
    setPreselectArrivalId(arrivalId);
    handleMenuChange("checkout");
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
          <h1>Employee Dashboard</h1>

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
          <button
            onClick={() => handleMenuChange("pendingorder")}
            disabled={activeMenu === "pendingorder"}
          >
            Pesanan Masuk
          </button>
          <button
            onClick={() => handleMenuChange("addorder")}
            disabled={activeMenu === "addorder"}
          >
            Tambah Order
          </button>
          <button
            onClick={() => handleMenuChange("checkin")}
            disabled={activeMenu === "checkin"}
          >
            Check-in Member
          </button>
          <button
            onClick={() => handleMenuChange("arrivals")}
            disabled={activeMenu === "arrivals"}
          >
            Kedatangan Hari Ini
          </button>
          <button
            onClick={() => handleMenuChange("checkout")}
            disabled={activeMenu === "checkout"}
          >
            Checkout Transaksi
          </button>
          <button
            onClick={() => handleMenuChange("menuavailability")}
            disabled={activeMenu === "menuavailability"}
          >
            Ketersediaan Menu
          </button>
          <button
            onClick={() => handleMenuChange("history")}
            disabled={activeMenu === "history"}
          >
            Riwayat Transaksi
          </button>
        </nav>
      </header>

      <main style={{ padding: "20px" }}>
        {[
          "pendingorder",
          "addorder",
          "checkin",
          "arrivals",
          "checkout",
          "history",
          "menuavailability",
        ].map((menu) => {
          if (activeMenu !== menu && !mountedTabs.has(menu)) return null;

          return (
            <div
              key={menu}
              style={{ display: activeMenu === menu ? "block" : "none" }}
            >
              {menu === "pendingorder" && <PendingOrder />}
              {menu === "addorder" && <AddOrder />}
              {menu === "checkin" && <CheckIn />}
              {menu === "arrivals" && (
                <TodayArrivals onGoToCheckout={handleGoToCheckout} />
              )}
              {menu === "menuavailability" && <MenuAvailability />}
              {menu === "checkout" && (
                <Checkout
                  preselectArrivalId={preselectArrivalId}
                  onPreselectConsumed={() => setPreselectArrivalId(null)}
                />
              )}
              {menu === "history" && <TransactionHistory />}
            </div>
          );
        })}
      </main>
    </div>
  );
};

export default EmployeeDashboard;
