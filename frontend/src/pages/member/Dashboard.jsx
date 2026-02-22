import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import memberService from "../../services/memberService";
import { useToast } from "../../hooks/useToast";

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
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

  if (loading) return <div>Loading profile...</div>;

  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={fetchProfile}>Retry</button>
      </div>
    );
  }

  if (!profile) return <div>No profile data</div>;

  // next_tier langsung dari backend — tidak hardcode
  const nextTier = profile.next_tier;

  return (
    <div style={{ padding: "20px" }}>
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
              style={{ width: "200px", height: "200px", cursor: "pointer" }}
              onClick={() => window.open(profile.member.qr_code_url, "_blank")}
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
          <strong>Total Poin:</strong> {profile.member.total_points} poin
        </p>

        {nextTier ? (
          <p>
            <strong>Tier Berikutnya:</strong> {nextTier.name} (
            {nextTier.points_needed} poin lagi)
          </p>
        ) : (
          <p>
            <strong>Tier Maksimal:</strong> Anda sudah mencapai tier tertinggi!
          </p>
        )}

        <p>
          <strong>Total Berat Ikan:</strong> {profile.member.total_fish_weight}{" "}
          kg
        </p>

        <p>
          <strong>Posisi Leaderboard:</strong>{" "}
          {profile.leaderboard.rank
            ? `#${profile.leaderboard.rank}`
            : "Belum masuk peringkat"}
        </p>
      </div>

      {/* Quick Links */}
      <div>
        <h2>Menu</h2>
        <button
          onClick={() => navigate("/member/order")}
          style={{ marginRight: "10px" }}
        >
          Pesan Makanan / Sewa Alat
        </button>
        <button
          onClick={() => navigate("/leaderboard")}
          style={{ marginRight: "10px" }}
        >
          Lihat Leaderboard
        </button>
        <button disabled style={{ marginRight: "10px" }}>
          Riwayat Transaksi (Coming Soon)
        </button>
        <button onClick={fetchProfile}>Refresh Profile</button>
      </div>
    </div>
  );
};

export default Dashboard;
