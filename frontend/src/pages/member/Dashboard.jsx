// File: src/pages/member/Dashboard.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import memberService from "../../services/memberService";
import { useNotification } from "@/hooks/useNotification";
import { useToast } from "../../hooks/useToast";
import Order from "./Order";
import TransactionHistory from "./TransactionHistory";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  removeToken,
  removeUser,
  getUser,
  setUser,
} from "@/utils/tokenManager";
import { LayoutDashboard, ShoppingBag, History, Trophy } from "lucide-react";

import MemberDashboardHome from "./MemberDashboardHome";
import Leaderboard from "./Leaderboard";
import ProfilePage from "@/pages/profile/ProfilePage";

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { unreadCount } = useNotification();
  const [vouchers, setVouchers] = useState([]);
  const [vouchersLoading, setVouchersLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || "home";
  });

  useEffect(() => {
    fetchProfile();
    fetchVouchers();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await memberService.getProfile();

      if (response.success) {
        setProfile(response.data);
      } else {
        setError(response.message);
        toast.error(response.message);
      }
    } catch (err) {
      const message = err.response?.data?.message || "Gagal memuat profile";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchVouchers = async () => {
    try {
      setVouchersLoading(true);
      const res = await memberService.getVouchers();
      setVouchers(res.data?.vouchers ?? []);
    } catch {
      // silent fail
    } finally {
      setVouchersLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    removeUser();
    navigate("/login");
  };

  const memberNavGroups = [
    {
      label: "",
      items: [
        { key: "home", label: "Dashboard", icon: LayoutDashboard },
        { key: "order", label: "Pesanan", icon: ShoppingBag },
        { key: "history", label: "Riwayat Transaksi", icon: History },
        { key: "leaderboard", label: "Leaderboard", icon: Trophy },
      ],
    },
  ];

  const currentUser = getUser();

  return (
    <DashboardLayout
      navGroups={memberNavGroups}
      activeItem={activeTab}
      onNavChange={setActiveTab}
      title="Sistem Pemancingan"
      user={{ name: currentUser?.name, role: "Member" }}
      unreadCount={unreadCount}
      onLogout={handleLogout}
    >
      {loading && <div>Loading profile...</div>}

      {!loading && error && (
        <div>
          <p>Error: {error}</p>
          <button onClick={fetchProfile}>Retry</button>
        </div>
      )}

      {!loading && !error && !profile && <div>No profile data</div>}

      {!loading && !error && profile && (
        <>
          {activeTab === "home" && (
            <MemberDashboardHome
              profile={profile}
              vouchers={vouchers}
              vouchersLoading={vouchersLoading}
            />
          )}

          {activeTab === "order" && (
            <div>
              <Order />
            </div>
          )}

          {activeTab === "history" && (
            <div>
              <TransactionHistory />
            </div>
          )}

          {activeTab === "leaderboard" && <Leaderboard />}

          {activeTab === "profile" && (
            <ProfilePage
              user={currentUser}
              memberSince={profile?.member?.approved_at}
              onUserUpdate={(updatedUser) => {
                removeUser();
                setUser(updatedUser);
              }}
            />
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
