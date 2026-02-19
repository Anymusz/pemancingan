import { useState, useEffect } from "react";
import memberService from "../services/memberService";
import { useToast } from "../hooks/useToast";
import { getUser } from "../utils/tokenManager";

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
      <h1>🏆 Leaderboard Pemancingan S</h1>
      <p>Top pemancing berdasarkan total berat ikan tangkapan</p>

      {meta && (
        <p>
          Menampilkan {meta.showing} dari {meta.total_ranked_members} member
        </p>
      )}

      <button onClick={fetchLeaderboard}>Refresh</button>

      {leaderboard.length === 0 ? (
        <p>Belum ada member yang masuk peringkat. Jadilah yang pertama!</p>
      ) : (
        <table border="1" cellPadding="10">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Nama</th>
              <th>Berat Ikan (kg)</th>
              <th>Tier</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((member) => {
              const isCurrentMember = currentMemberId === member.member_id;

              return (
                <tr
                  key={member.member_id}
                  style={{
                    backgroundColor: isCurrentMember
                      ? "#fffacd"
                      : "transparent",
                    fontWeight: isCurrentMember ? "bold" : "normal",
                  }}
                >
                  <td>{getMedalEmoji(member.rank)}</td>
                  <td>{member.name}</td>
                  <td>{member.total_fish_weight}</td>
                  <td>{member.tier}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default LeaderboardPublic;
