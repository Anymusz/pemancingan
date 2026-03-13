// File: src/pages/owner/ownerDashboard.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MemberManagement from "./MemberManagement";
import OwnerLeaderboard from "./OwnerLeaderboard";
import MenuManagement from "./MenuManagement";
import FishTypeManagement from "./FishTypeManagement";
import EventManagement from "./event-management/EventManagement";
import VoucherManagement from "./VoucherManagement";
import FinancialReport from "./FinancialReport";
import { removeToken, getUser } from "@/utils/tokenManager";
import notificationService from "@/services/notificationService";
import DashboardLayout from "@/components/layout/DashboardLayout";
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
} from "lucide-react";

const OwnerDashboard = () => {
  const [activeMenu, setActiveMenu] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || "members";
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
        { key: "fish-types", label: "Fish Types", icon: Fish },
        { key: "events", label: "Events & Info", icon: CalendarDays },
      ],
    },
    {
      label: "Laporan & Sistem",
      items: [
        { key: "financial-report", label: "Financial Report", icon: BarChart3 },
        { key: "vouchers", label: "Voucher", icon: Ticket },
        { key: "leaderboard", label: "Leaderboard", icon: Trophy },
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
      {activeMenu === "members" && <MemberManagement />}
      {activeMenu === "leaderboard" && <OwnerLeaderboard />}
      {activeMenu === "menus" && <MenuManagement />}
      {activeMenu === "fish-types" && <FishTypeManagement />}
      {activeMenu === "events" && <EventManagement />}
      {activeMenu === "vouchers" && <VoucherManagement />}
      {activeMenu === "financial-report" && <FinancialReport />}
    </DashboardLayout>
  );
};

export default OwnerDashboard;
