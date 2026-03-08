// File: src/pages/member/Dashboard.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import memberService from "../../services/memberService";
import notificationService from "../../services/notificationService";
import { useToast } from "../../hooks/useToast";
import Order from "./Order";
import TransactionHistory from "./TransactionHistory";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { removeToken, removeUser, getUser } from "@/utils/tokenManager";
import { LayoutDashboard, ShoppingBag, History } from "lucide-react";

const MONTHS = [
  "",
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [vouchers, setVouchers] = useState([]);
  const [vouchersLoading, setVouchersLoading] = useState(true);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || "home";
  });

  useEffect(() => {
    fetchProfile();
    fetchVouchers();
  }, []);

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

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await memberService.getProfile();

      if (response.success) {
        setProfile(response.data);
      } else {
        setError(response.message);
        showToast(response.message, "error");
      }
    } catch (err) {
      const message = err.response?.data?.message || "Gagal memuat profile";
      setError(message);
      showToast(message, "error");
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
        { key: "order", label: "Pesan", icon: ShoppingBag },
        { key: "history", label: "Riwayat", icon: History },
      ],
    },
  ];

  const currentUser = getUser();
  const nextTier = profile?.next_tier;

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
            <div>
              <h1>Selamat datang, {profile.user.name}</h1>

              {/* Membership Card */}
              <div
                style={{
                  border: "1px solid #ccc",
                  padding: "20px",
                  marginBottom: "20px",
                }}
              >
                <h2>Member Card</h2>
                <p>
                  <strong>Member ID:</strong> {profile.member.member_id}
                </p>
                <p>
                  <strong>Tier:</strong> {profile.tier.name}
                </p>
                <p>
                  <strong>Diskon:</strong> {profile.tier.discount_percentage}%
                </p>

                {profile.member.qr_code_url && (
                  <div>
                    <p>QR Code:</p>
                    <img
                      src={profile.member.qr_code_url}
                      alt="Member QR Code"
                      style={{
                        width: "200px",
                        height: "200px",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        window.open(profile.member.qr_code_url, "_blank")
                      }
                    />
                  </div>
                )}
              </div>

              {/* Stats Section */}
              <div
                style={{
                  border: "1px solid #ccc",
                  padding: "20px",
                  marginBottom: "20px",
                }}
              >
                <h2>Statistik</h2>
                <p>
                  <strong>Total Poin:</strong> {profile.member.total_points}{" "}
                  poin
                </p>

                {nextTier ? (
                  <p>
                    <strong>Tier Berikutnya:</strong> {nextTier.name} (
                    {nextTier.points_needed} poin lagi)
                  </p>
                ) : (
                  <p>
                    <strong>Tier Maksimal:</strong> Anda sudah mencapai tier
                    tertinggi!
                  </p>
                )}

                <p>
                  <strong>Total Berat Ikan:</strong>{" "}
                  {profile.member.total_fish_weight} kg
                </p>

                <p>
                  <strong>Posisi Leaderboard:</strong>{" "}
                  {profile.leaderboard.rank
                    ? `#${profile.leaderboard.rank}`
                    : "Belum masuk peringkat"}
                </p>
              </div>

              {/* Voucher Aktif Section */}
              <div
                style={{
                  border: "1px solid #ccc",
                  padding: "20px",
                  marginBottom: "20px",
                }}
              >
                <h2>🎟️ Voucher Aktif</h2>
                {vouchersLoading ? (
                  <p style={{ color: "#888", fontSize: "14px" }}>
                    Memuat voucher...
                  </p>
                ) : vouchers.length === 0 ? (
                  <p style={{ color: "#888", fontSize: "14px" }}>
                    Anda belum memiliki voucher aktif.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(220px, 1fr))",
                      gap: "12px",
                    }}
                  >
                    {vouchers.map((voucher) => (
                      <div
                        key={voucher.id}
                        style={{
                          border: "1px solid #d1d5db",
                          borderRadius: "8px",
                          padding: "16px",
                          background: "#f9fafb",
                        }}
                      >
                        <p
                          style={{
                            fontWeight: "bold",
                            fontSize: "18px",
                            color: "#059669",
                            marginBottom: "4px",
                          }}
                        >
                          Rp {Number(voucher.amount).toLocaleString("id-ID")}
                        </p>
                        <p style={{ fontSize: "13px", color: "#6b7280" }}>
                          Periode: {MONTHS[voucher.period_month]}{" "}
                          {voucher.period_year}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
        </>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
