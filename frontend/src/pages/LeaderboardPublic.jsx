import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import memberService from "../services/memberService";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/common/Button";

// ── Helpers ─────────────────────────────────────────────────────────────────
const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "").concat(parts[1]?.[0] ?? "").toUpperCase();
};

const getPodiumOrder = (top3) => {
  const find = (r) => top3.find((m) => m.rank === r) ?? null;
  const slots = [find(2), find(1), find(3)];
  return slots.filter(Boolean);
};

// ── Podium slot config ───────────────────────────────────────────────────────
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

// ── Header Component ─────────────────────────────────────────────────────────
const SectionHeader = ({ meta }) => (
  // <div className="flex flex-col items-center text-center">
  //   <span className="inline-block px-4 py-1.5 text-sm font-medium rounded-full bg-primary/10 text-primary mb-3">
  //     Papan Peringkat
  //   </span>
  //   <h1 className="text-3xl font-bold text-foreground">Papan Peringkat</h1>
  //   <p className="text-sm text-muted-foreground mt-2">
  //     Peringkat berdasarkan total berat ikan tangkapan
  //   </p>
  //   {meta && (
  //     <p className="text-xs text-muted-foreground mt-1">
  //       Menampilkan {meta.showing} dari {meta.total_ranked_members} pemancing
  //     </p>
  //   )}
  // </div>

  <div className="flex flex-col items-center">
    <span className="inline-block px-4 py-1.5 text-sm font-medium rounded-full bg-primary/10 text-primary mb-3">
      Top Pemancing
    </span>
    <h1 className="text-4xl font-bold text-foreground text-center">
      Papan Peringkat
    </h1>
    <p className="text-md text-muted-foreground text-center mt-2">
      Semua pemancing diurutkan berdasarkan total berat ikan tangkapan.
    </p>
    {meta && (
      <p className="text-sm text-muted-foreground mt-1">
        Menampilkan {meta.showing} dari {meta.total_ranked_members} pemancing
      </p>
    )}
  </div>
);

// ── Main Page Component ──────────────────────────────────────────────────────
const LeaderboardPublic = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchLeaderboard(page);
  }, [page]);

  const fetchLeaderboard = async (currentPage) => {
    try {
      setLoading(true);
      setError(null);
      const response = await memberService.getLeaderboard({
        page: currentPage,
        per_page: 50,
      });

      if (response.success) {
        setLeaderboard(response.data.leaderboard);
        setMeta(response.data.meta);
      } else {
        setError(response.message);
      }
    } catch (err) {
      const message = err.response?.data?.message || "Gagal memuat leaderboard";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const top3 = leaderboard.filter((m) => m.rank <= 3);
  const podiumOrder = getPodiumOrder(top3);
  const listRows =
    page === 1 ? leaderboard.filter((m) => m.rank > 3) : leaderboard;

  return (
    <div className="max-w-2xl mx-auto py-12 px-6 flex flex-col gap-8">
      {/* Header */}
      <SectionHeader meta={meta} />

      {/* Error state */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center gap-2">
          <p className="text-sm text-destructive text-center">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLeaderboard(page)}
          >
            Coba Lagi
          </Button>
        </div>
      )}

      {/* Loading state skeleton */}
      {loading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-14 w-full rounded-xl bg-muted animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && leaderboard.length === 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Belum ada member yang masuk peringkat.
        </p>
      )}

      {/* Content */}
      {!loading && !error && leaderboard.length > 0 && (
        <>
          {/* Podium - only on page 1 and if we have any rank 1/2/3 */}
          {page === 1 && top3.length > 0 && (
            <div className="flex items-end justify-center gap-4 mt-2">
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
                        {Number(member.total_fish_weight).toLocaleString(
                          "id-ID",
                        )}{" "}
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

          {/* List Rows */}
          <div className="flex flex-col gap-2">
            {listRows.map((member) => (
              <div
                key={member.member_id}
                className="flex items-center gap-3 px-5 py-4 rounded-xl border border-border bg-card"
              >
                <span className="text-sm font-semibold text-muted-foreground w-6 text-center">
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

          {/* Pagination Controls */}
          {meta?.total_pages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-4">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => handlePageChange(page - 1)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Sebelumnya
              </Button>
              <span className="text-sm text-muted-foreground">
                Halaman {page} dari {meta.total_pages}
              </span>
              <Button
                variant="outline"
                disabled={page === meta.total_pages}
                onClick={() => handlePageChange(page + 1)}
              >
                Berikutnya
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LeaderboardPublic;
