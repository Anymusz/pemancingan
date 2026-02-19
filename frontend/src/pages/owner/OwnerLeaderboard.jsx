import { useState, useEffect } from "react";
import ownerService from "../../services/ownerService";
import { useToast } from "../../hooks/useToast";

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

  const isTopThree = (rank) => rank >= 1 && rank <= 3;

  if (loading) {
    return <div>Loading leaderboard...</div>;
  }

  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={fetchLeaderboard}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <h2>🏆 Leaderboard (Owner View)</h2>
      <p>Monitoring posisi member untuk penentuan voucher bulanan</p>

      {meta && <p>Total ranked members: {meta.total_ranked_members}</p>}

      <button onClick={fetchLeaderboard}>Refresh</button>

      {leaderboard.length === 0 ? (
        <p>Belum ada member yang masuk peringkat.</p>
      ) : (
        <table border="1" cellPadding="10">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Nama Lengkap</th>
              <th>Member ID</th>
              <th>Tier</th>
              <th>Berat Ikan (kg)</th>
              <th>Total Poin</th>
              <th>Status Voucher</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((member) => (
              <tr
                key={member.member_id}
                style={{
                  backgroundColor: isTopThree(member.rank)
                    ? "#fff3cd"
                    : "transparent",
                  fontWeight: isTopThree(member.rank) ? "bold" : "normal",
                }}
              >
                <td>{getMedalEmoji(member.rank)}</td>
                <td>{member.name}</td>
                <td>{member.member_id}</td>
                <td>{member.tier}</td>
                <td>{member.total_fish_weight}</td>
                <td>-</td>
                <td>
                  {member.rank === 1 && "Voucher Rp100.000"}
                  {member.rank === 2 && "Voucher Rp50.000"}
                  {member.rank === 3 && "Voucher Rp20.000"}
                  {member.rank > 3 && "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default OwnerLeaderboard;
