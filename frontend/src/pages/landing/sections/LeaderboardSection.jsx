import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star, ArrowRight } from "lucide-react";
import memberService from "../../../services/memberService";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/common/Button";

// ── Helpers
const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "").concat(parts[1]?.[0] ?? "").toUpperCase();
};

/** Reorder top-3 into [rank2, rank1, rank3] for podium left-center-right */
const getPodiumOrder = (top3) => {
  const find = (r) => top3.find((m) => m.rank === r) ?? null;
  const slots = [find(2), find(1), find(3)];
  // If we have fewer than 3, filter nulls but keep meaningful order
  return slots.filter(Boolean);
};

// ── Podium slot config
const PODIUM_CONFIG = {
  1: {
    avatarBg: "bg-amber-400",
    avatarText: "text-amber-900",
    blockBg: "bg-amber-400",
    blockW: "w-24",
    blockH: "h-28",
    numText: "text-4xl font-bold text-amber-900",
  },
  2: {
    avatarBg: "bg-slate-300",
    avatarText: "text-slate-700",
    blockBg: "bg-slate-300",
    blockW: "w-20",
    blockH: "h-20",
    numText: "text-2xl font-bold text-slate-700",
  },
  3: {
    avatarBg: "bg-orange-700",
    avatarText: "text-white",
    blockBg: "bg-orange-700",
    blockW: "w-20",
    blockH: "h-14",
    numText: "text-2xl font-bold text-white",
  },
};

// ── Component
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
      const response = await memberService.getLeaderboard({
        page: 1,
        per_page: 5,
      });
      if (response.success) {
        setLeaderboard(response.data.leaderboard);
      }
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Loading state
  if (loading) {
    return (
      <section id="leaderboard" className="py-16 px-6">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-10">
          <div className="flex flex-col items-center gap-2">
            <div className="h-7 w-56 rounded-lg bg-muted animate-pulse" />
            <div className="h-4 w-72 rounded bg-muted animate-pulse mt-2" />
          </div>
          <div className="flex items-end justify-center gap-4">
            {[48, 64, 40].map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-muted animate-pulse" />
                <div className="w-16 h-3 rounded bg-muted animate-pulse" />
                <div
                  className="w-16 rounded-t-lg bg-muted animate-pulse"
                  style={{ height: h }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── Empty state
  if (leaderboard.length === 0) {
    return (
      <section id="leaderboard" className="py-16 px-6">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-10">
          <SectionHeader />
          <p className="text-sm text-muted-foreground">
            Belum ada data peringkat
          </p>
        </div>
      </section>
    );
  }

  const top3 = leaderboard.filter((m) => m.rank <= 3);
  const rest = leaderboard.filter((m) => m.rank > 3);
  const podiumOrder = getPodiumOrder(top3);

  return (
    <section id="leaderboard" className="py-16 px-6">
      <div className="max-w-3xl mx-auto flex flex-col items-center gap-10">
        {/* Header */}
        <SectionHeader />

        {/* Podium */}
        {leaderboard.length >= 1 && (
          <div className="flex items-end justify-center gap-4">
            {podiumOrder.map((member) => {
              const cfg = PODIUM_CONFIG[member.rank];
              return (
                <div
                  key={member.member_id}
                  className="flex flex-col items-center gap-2"
                >
                  {/* Avatar area */}
                  <div className="flex flex-col items-center gap-1">
                    {member.rank === 1 && (
                      <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    )}
                    <div
                      className={`${
                        member.rank === 1
                          ? "w-16 h-16 text-base ring-2 ring-amber-400 ring-offset-2"
                          : "w-14 h-14 text-sm"
                      } rounded-full flex items-center justify-center font-semibold ${cfg.avatarBg} ${cfg.avatarText}`}
                    >
                      {getInitials(member.name)}
                    </div>
                    <p className="text-xs font-medium text-foreground text-center max-w-[80px] truncate">
                      {member.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Number(member.total_fish_weight).toLocaleString("id-ID")}{" "}
                      kg
                    </p>
                    <StatusBadge status={member.tier.toLowerCase()} />
                  </div>

                  {/* Podium block */}
                  <div
                    className={`flex items-center justify-center rounded-t-lg ${cfg.blockBg} ${cfg.blockW} ${cfg.blockH}`}
                  >
                    <span className={cfg.numText}>{member.rank}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Rank 4–5 list */}
        {rest.length > 0 && (
          <div className="w-full max-w-xl flex flex-col gap-2">
            {rest.map((member) => (
              <div
                key={member.member_id}
                className="flex items-center gap-3 px-5 py-4 rounded-xl border border-border bg-card"
              >
                <span className="text-base font-semibold text-muted-foreground w-4 text-center">
                  {member.rank}
                </span>
                <span className="text-sm text-foreground flex-1">
                  {member.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {Number(member.total_fish_weight).toLocaleString("id-ID")} kg
                </span>
                <StatusBadge status={member.tier.toLowerCase()} />
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate("/leaderboard")}
          className="gap-2"
        >
          Lihat semua peringkat <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </section>
  );
};

// ── Sub-component
const SectionHeader = () => (
  <div className="flex flex-col items-center">
    <span className="inline-block px-4 py-1.5 text-sm font-medium rounded-full bg-primary/10 text-primary mb-3">
      Top 5 Pemancing Terbaik
    </span>
    <h1 className="text-4xl font-bold text-foreground text-center">
      Siapa Pemancing Terbaik?
    </h1>
    <p className="text-md text-muted-foreground text-center mt-2">
      Peringkat berdasarkan total berat ikan tangkapan. Masuk top 3 dan
      menangkan voucher eksklusif.
    </p>
  </div>
);

export default LeaderboardSection;
