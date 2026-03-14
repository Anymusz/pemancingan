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
import { removeToken, removeUser, getUser } from "@/utils/tokenManager";
import notificationService from "@/services/notificationService";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  QrCode,
  CalendarCheck,
  PlusCircle,
  ClipboardList,
  ShoppingCart,
  UtensilsCrossed,
  History,
} from "lucide-react";

const EmployeeDashboard = () => {
  const initialTab = (() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || "checkin";
  })();
  const [activeMenu, setActiveMenu] = useState(initialTab);
  const [mountedTabs, setMountedTabs] = useState(new Set([initialTab]));
  const [preselectArrivalId, setPreselectArrivalId] = useState(null);
  const [preselectAddOrderArrivalId, setPreselectAddOrderArrivalId] = useState(null);
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

  const employeeNavGroups = [
    {
      label: "Kedatangan",
      items: [
        { key: "checkin", label: "Check In", icon: QrCode },
        { key: "arrivals", label: "Today Arrivals", icon: CalendarCheck },
      ],
    },
    {
      label: "Pesanan",
      items: [
        { key: "addorder", label: "Add Order", icon: PlusCircle },
        { key: "pendingorder", label: "Pending Orders", icon: ClipboardList },
        { key: "checkout", label: "Checkout", icon: ShoppingCart },
      ],
    },
    {
      label: "Operasional",
      items: [
        {
          key: "menuavailability",
          label: "Menu Availability",
          icon: UtensilsCrossed,
        },
        { key: "history", label: "Transactions", icon: History },
      ],
    },
  ];

  const currentUser = getUser();

  return (
    <DashboardLayout
      navGroups={employeeNavGroups}
      activeItem={activeMenu}
      onNavChange={handleMenuChange}
      title="Sistem Pemancingan"
      user={{ name: currentUser?.name, role: "Employee" }}
      unreadCount={unreadCount}
      onLogout={handleLogout}
    >
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
          <div key={menu} className={activeMenu === menu ? "block" : "hidden"}>
            {menu === "pendingorder" && <PendingOrder />}
            {menu === "addorder" && (
              <AddOrder
                preselectArrivalId={preselectAddOrderArrivalId}
                onPreselectConsumed={() => setPreselectAddOrderArrivalId(null)}
              />
            )}
            {menu === "checkin" && (
              <CheckIn
                onNavigateToAddOrder={(arrivalId) => {
                  setPreselectAddOrderArrivalId(arrivalId);
                  handleMenuChange("addorder");
                }}
              />
            )}
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
    </DashboardLayout>
  );
};

export default EmployeeDashboard;
