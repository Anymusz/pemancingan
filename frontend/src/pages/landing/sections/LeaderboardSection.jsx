import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import memberService from "../../../services/memberService";

const LeaderboardSection = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await memberService.getLeaderboard(5);

      if (response.success) {
        setLeaderboard(response.data.leaderboard);
      }
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
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
    return (
      <section>
        <p>Loading leaderboard...</p>
      </section>
    );
  }

  return (
    <section>
      <h2>🏆 Leaderboard</h2>
      <p>Top pemancing berdasarkan total berat ikan</p>

      {leaderboard.length === 0 ? (
        <p>Belum ada member yang masuk peringkat</p>
      ) : (
        <div>
          {leaderboard.map((member) => (
            <div key={member.member_id} style={{ marginBottom: "10px" }}>
              <span>{getMedalEmoji(member.rank)}</span>
              <span> {member.name}</span>
              <span> - {member.total_fish_weight} kg</span>
              <span> ({member.tier})</span>
            </div>
          ))}
        </div>
      )}

      <button onClick={() => navigate("/leaderboard")}>
        Lihat Semua Peringkat
      </button>
    </section>
  );
};

export default LeaderboardSection;
