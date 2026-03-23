import { useState, useEffect } from "react";
import memberService from "../services/memberService";
import { useToast } from "../hooks/useToast";
import { getUser } from "../utils/tokenManager";
import { DataTable } from "../components/common/DataTable";

const LeaderboardPublic = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  const currentUser = getUser();
  const currentMemberId = currentUser?.member?.member_id || null;

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await memberService.getLeaderboard(50);

      if (response.success) {
        setLeaderboard(response.data.leaderboard);
        setMeta(response.data.meta);
      } else {
        setError(response.message);
        showToast(response.message, "error");
      }
    } catch (err) {
      const message = err.response?.data?.message || "Gagal memuat leaderboard";
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const getMedalEmoji = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return rank;
  };

  const columns = [
    {
      key: "rank",
      header: "Rank",
      align: "center",
      width: "80px",
      render: (row) => (
        <div className="w-full text-center">{getMedalEmoji(row.rank)}</div>
      ),
    },
    { key: "name", header: "Nama", flex: true, render: (row) => row.name },
    {
      key: "total_fish_weight",
      header: "Berat Ikan (kg)",
      align: "right",
      render: (row) => row.total_fish_weight,
    },
    { key: "tier", header: "Tier", align: "center", render: (row) => row.tier },
  ];

  return (
    <div>
      <h1>🏆 Leaderboard Pemancingan Sutoyo</h1>
      <p>Top pemancing berdasarkan total berat ikan tangkapan</p>

      {meta && (
        <p>
          Menampilkan {meta.showing} dari {meta.total_ranked_members} member
        </p>
      )}

      <button onClick={fetchLeaderboard}>Refresh</button>

      {error ? (
        <div className="text-red-500 my-4 text-sm font-medium">
          Error: {error}
        </div>
      ) : (
        <div className="mt-4">
          <DataTable
            className="bg-white/80 backdrop-blur-sm"
            columns={columns}
            data={leaderboard}
            loading={loading}
            emptyMessage="Belum ada member yang masuk peringkat. Jadilah yang pertama!"
            rowClassName={(row) =>
              row.member_id === currentMemberId
                ? "bg-yellow-500/10 font-medium"
                : ""
            }
          />
        </div>
      )}
    </div>
  );
};

export default LeaderboardPublic;
