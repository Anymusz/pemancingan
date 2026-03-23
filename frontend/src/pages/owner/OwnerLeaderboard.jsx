import { useState, useEffect } from "react";
import ownerService from "../../services/ownerService";
import { useToast } from "../../hooks/useToast";
import { DataTable } from "../../components/common/DataTable";

const OwnerLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ownerService.getLeaderboard(100);

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
      width: "50px",
      render: (row) => getMedalEmoji(row.rank),
    },
    { key: "name", header: "Nama Lengkap", render: (row) => row.name },
    { key: "member_id", header: "Member ID", render: (row) => row.member_id },
    { key: "tier", header: "Tier", render: (row) => row.tier },
    {
      key: "total_fish_weight",
      header: "Berat Ikan (kg)",
      align: "right",
      render: (row) => row.total_fish_weight,
    },
    {
      key: "total_points",
      header: "Total Poin",
      align: "right",
      render: (row) => row.total_points || "-",
    },
    {
      key: "voucher",
      header: "Status Voucher",
      render: (row) => {
        if (row.rank === 1) return "Voucher Rp100.000";
        if (row.rank === 2) return "Voucher Rp50.000";
        if (row.rank === 3) return "Voucher Rp20.000";
        return "-";
      },
    },
  ];

  return (
    <div>
      <h2>🏆 Leaderboard (Owner View)</h2>
      <p>Monitoring posisi member untuk penentuan voucher bulanan</p>

      {meta && <p>Total ranked members: {meta.total_ranked_members}</p>}

      <button onClick={fetchLeaderboard}>Refresh</button>

      {error ? (
        <div className="text-red-500 my-4 text-sm font-medium">
          Error: {error}
        </div>
      ) : (
        <div className="mt-4">
          <DataTable
            columns={columns}
            data={leaderboard}
            loading={loading}
            emptyMessage="Belum ada member yang masuk peringkat"
            rowClassName={(row) =>
              row.rank <= 3 ? "bg-yellow-500/10 font-medium" : ""
            }
          />
        </div>
      )}
    </div>
  );
};

export default OwnerLeaderboard;
