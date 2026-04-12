// File: src/pages/owner/ownerDashboard.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OwnerDashboardHome from "./OwnerDashboardHome";
import MemberManagement from "./MemberManagement";
import OwnerLeaderboard from "./OwnerLeaderboard";
import MenuManagement from "./MenuManagement";
import FishTypeManagement from "./FishTypeManagement";
import RentalManagement from "./RentalManagement";
import EventManagement from "./event-management/EventManagement";
import VoucherManagement from "./VoucherManagement";
import FinancialReport from "./FinancialReport";
import Settings from "./Settings";
import { removeToken, getUser, setUser } from "@/utils/tokenManager";
import notificationService from "@/services/notificationService";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProfilePage from "@/pages/profile/ProfilePage";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  ClipboardList,
  UtensilsCrossed,
  Fish,
  CalendarDays,
  BarChart3,
  Ticket,
  Trophy,
  Package,
  SlidersHorizontal,
} from "lucide-react";

const OwnerDashboard = () => {
  const [activeMenu, setActiveMenu] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || "dashboard";
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

  const ownerNavGroups = [
    {
      // label: "Dashboard",
      items: [{ key: "dashboard", label: "Dashboard", icon: LayoutDashboard }],
    },
    {
      label: "Kelola Member",
      items: [{ key: "members", label: "Kelola Member", icon: Users }],
    },
    {
      label: "Kelola Produk",
      items: [
        { key: "menus", label: "Menu", icon: UtensilsCrossed },
        { key: "fish-types", label: "Jenis Ikan", icon: Fish },
        { key: "rental-items", label: "Rental Item", icon: Package },
        { key: "events", label: "Acara & Info", icon: CalendarDays },
      ],
    },
    {
      label: "Laporan & Sistem",
      items: [
        { key: "financial-report", label: "Laporan Keuangan", icon: BarChart3 },
        { key: "vouchers", label: "Voucher", icon: Ticket },
        { key: "leaderboard", label: "Leaderboard", icon: Trophy },
        { key: "settings", label: "Pengaturan", icon: SlidersHorizontal },
      ],
    },
  ];

  const currentUser = getUser();

  return (
    <DashboardLayout
      navGroups={ownerNavGroups}
      activeItem={activeMenu}
      onNavChange={setActiveMenu}
      title="Sistem Pemancingan"
      user={{ name: currentUser?.name, role: "Owner" }}
      unreadCount={unreadCount}
      onLogout={handleLogout}
    >
      {activeMenu === "dashboard" && <OwnerDashboardHome onNavigate={setActiveMenu} />}
      {activeMenu === "members" && <MemberManagement />}
      {activeMenu === "leaderboard" && <OwnerLeaderboard />}
      {activeMenu === "menus" && <MenuManagement />}
      {activeMenu === "fish-types" && <FishTypeManagement />}
      {activeMenu === "rental-items" && <RentalManagement />}
      {activeMenu === "events" && <EventManagement />}
      {activeMenu === "vouchers" && <VoucherManagement />}
      {activeMenu === "financial-report" && <FinancialReport />}
      {activeMenu === "settings" && <Settings />}
      {activeMenu === "profile" && (
        <ProfilePage
          user={currentUser}
          onUserUpdate={(updatedUser) => {
            setUser(updatedUser);
          }}
        />
      )}
    </DashboardLayout>
  );
};

export default OwnerDashboard;
