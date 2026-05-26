// File: src/pages/employee/EmployeeDashboard.jsx

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import EmployeeDashboardHome from "./EmployeeDashboardHome";
import CheckIn from "./CheckIn";
import TodayArrivals from "./TodayArrivals";
import Checkout from "./checkout/Checkout";
import TransactionHistory from "./TransactionHistory";
import AddOrder from "./AddOrder";
import PendingOrder from "./PendingOrder";
import MenuAvailability from "./MenuAvailability";
import {
  removeToken,
  removeUser,
  getUser,
  setUser,
} from "@/utils/tokenManager";
import { useNotification } from "@/hooks/useNotification";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProfilePage from "@/pages/profile/ProfilePage";
import {
  QrCode,
  CalendarCheck,
  PlusCircle,
  ClipboardList,
  ShoppingCart,
  UtensilsCrossed,
  History,
  LayoutDashboard,
} from "lucide-react";

const EmployeeDashboard = () => {
  const initialTab = (() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || "dashboard";
  })();
  const [activeMenu, setActiveMenu] = useState(initialTab);
  const [mountedTabs, setMountedTabs] = useState(new Set([initialTab]));
  const [preselectArrivalId, setPreselectArrivalId] = useState(null);
  const [preselectAddOrderArrivalId, setPreselectAddOrderArrivalId] =
    useState(null);
  const { unreadCount } = useNotification();
  const [, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const handleLogout = () => {
    removeToken();
    removeUser();
    navigate("/login");
  };

  const handleMenuChange = (menu) => {
    setMountedTabs((prev) => new Set([...prev, menu]));
    setActiveMenu(menu);
    setSearchParams({ tab: menu }, { replace: true });
  };

  const handleGoToCheckout = (arrivalId) => {
    setPreselectArrivalId(arrivalId);
    handleMenuChange("checkout");
  };

  const employeeNavGroups = [
    {
      items: [{ key: "dashboard", label: "Dashboard", icon: LayoutDashboard }],
    },
    {
      label: "Kedatangan",
      items: [
        { key: "checkin", label: "Registrasi Kedatangan", icon: QrCode },
        { key: "arrivals", label: "Kedatangan Hari Ini", icon: CalendarCheck },
      ],
    },
    {
      label: "Pesanan",
      items: [
        { key: "addorder", label: "Tambah Pesanan", icon: PlusCircle },
        { key: "pendingorder", label: "Pesanan Masuk", icon: ClipboardList },
        { key: "checkout", label: "Pembayaran", icon: ShoppingCart },
      ],
    },
    {
      label: "Operasional",
      items: [
        {
          key: "menuavailability",
          label: "Ketersediaan Menu",
          icon: UtensilsCrossed,
        },
        { key: "history", label: "Riwayat Transaksi", icon: History },
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
        "dashboard",
        "pendingorder",
        "addorder",
        "checkin",
        "arrivals",
        "checkout",
        "history",
        "menuavailability",
        "profile",
      ].map((menu) => {
        if (activeMenu !== menu && !mountedTabs.has(menu)) return null;

        return (
          <div key={menu} className={activeMenu === menu ? "block" : "hidden"}>
            {menu === "dashboard" && (
              <EmployeeDashboardHome
                onGoToCheckout={handleGoToCheckout}
                onNavigate={handleMenuChange}
              />
            )}
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
            {menu === "profile" && (
              <ProfilePage
                user={currentUser}
                onUserUpdate={(updatedUser) => {
                  setUser(updatedUser);
                }}
              />
            )}
          </div>
        );
      })}
    </DashboardLayout>
  );
};

export default EmployeeDashboard;
