// File: src/pages/member/Leaderboard.jsx

import { useState, useEffect } from "react";
import memberService from "../../services/memberService";
import { useToast } from "@/hooks/useToast";
import { formatNumber } from "@/utils/utils";
import { DataTable } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";

// ── Helpers

function getInitials(name) {
  if (!name) return "?";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0][0].toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function getMedalDisplay(rank) {
  if (rank === null || rank === undefined)
    return <span className="text-muted-foreground">-</span>;
  if (rank === 1)
    return (
      <span className="text-amber-500 font-bold whitespace-nowrap">#1</span>
    );
  if (rank === 2)
    return (
      <span className="text-slate-400 font-bold whitespace-nowrap">#2</span>
    );
  if (rank === 3)
    return (
      <span className="text-orange-500 font-bold whitespace-nowrap">#3</span>
    );
  return (
    <span className="text-muted-foreground whitespace-nowrap">#{rank}</span>
  );
}

// ── Component

export default function Leaderboard() {
  const [profileData, setProfileData] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 25;
  const toast = useToast();

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [profileRes, lbRes] = await Promise.all([
          memberService.getProfile(),
          memberService.getLeaderboard(50),
        ]);
        if (profileRes.success) setProfileData(profileRes.data);
        if (lbRes.success) setLeaderboard(lbRes.data?.leaderboard ?? []);
      } catch {
        toast.error("Gagal memuat data leaderboard");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [toast]);

  // ── Derived values
  const member = profileData?.member;
  const tier = profileData?.tier;
  const nextTier = profileData?.next_tier ?? null;
  const lbInfo = profileData?.leaderboard;

  let progressPercent = 0;
  if (nextTier && tier) {
    const base = tier.min_points;
    const target = nextTier.min_points;
    const current = member?.total_points ?? 0;
    progressPercent =
      target > base
        ? Math.min(100, Math.max(0, ((current - base) / (target - base)) * 100))
        : 100;
  }

  const totalPages = Math.max(1, Math.ceil(leaderboard.length / PAGE_SIZE));
  const pagedData = leaderboard.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  // ── Columns
  const columns = [
    {
      key: "rank",
      header: "Rank",
      width: "60px",
      render: (row) => getMedalDisplay(row.rank),
    },
    {
      key: "name",
      header: "Nama",
      render: (row) => (
        <div className="flex items-center gap-2">
          <span>{row.name}</span>
        </div>
      ),
    },
    {
      key: "total_fish_weight",
      header: "Berat (kg)",
      render: (row) => (
        <span className="text-right block">{row.total_fish_weight ?? "-"}</span>
      ),
    },
    {
      key: "tier",
      header: "Tier",
      render: (row) => <StatusBadge status={row.tier?.toLowerCase()} />,
    },
  ];

  // ── Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-card p-5 animate-pulse space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-3 w-20 bg-muted rounded" />
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-muted" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-muted rounded-md" />
            ))}
          </div>
          <div className="h-12 bg-muted rounded" />
        </div>
        <div className="h-64 bg-muted/40 rounded-xl animate-pulse border border-border" />
      </div>
    );
  }

  // ── Render
  return (
    <div className="space-y-6">
      {/* ── Personal Summary Card ── */}
      {profileData && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary">
                  {getInitials(profileData.user?.name)}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 leading-tight">
                  <p className="font-semibold text-sm text-foreground">
                    {profileData.user?.name}
                  </p>
                  <StatusBadge status={tier?.name?.toLowerCase()} />
                </div>
                <span className="text-xs text-muted-foreground font-mono mt-0.5 block">
                  {member?.member_id ?? "-"}
                </span>
              </div>
            </div>

            {/* Rank badge */}
            <div className="flex flex-col items-center shrink-0">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <span className="text-xs font-bold text-foreground">
                  {lbInfo?.rank != null ? `#${lbInfo.rank}` : "-"}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                Rank
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-secondary rounded-md px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground mb-0.5">Poin</p>
              <p className="text-sm font-bold text-foreground">
                {formatNumber(member?.total_points ?? 0)}
              </p>
            </div>
            <div className="bg-secondary rounded-md px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground mb-0.5">Berat</p>
              <p className="text-sm font-bold text-foreground">
                {formatNumber(member?.total_fish_weight ?? 0)} kg
              </p>
            </div>
            <div className="bg-secondary rounded-md px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground mb-0.5">Diskon</p>
              <p className="text-sm font-bold text-foreground">
                {tier?.discount_percentage ?? 0}%
              </p>
            </div>
          </div>

          {/* Tier progress */}
          {!nextTier ? (
            <p className="text-xs text-muted-foreground text-center py-1">
              Tier tertinggi
            </p>
          ) : (
            <div className="space-y-1.5">
              {/* Label row */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium uppercase">
                  {tier?.name} → {nextTier.name}
                </span>
                <span className="text-muted-foreground">
                  {formatNumber(member?.total_points)} /{" "}
                  {formatNumber(nextTier.min_points)} poin
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Below bar */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  {formatNumber(tier?.min_points)}
                </span>
                <span className="text-emerald-600 font-medium">
                  {formatNumber(nextTier.points_needed)} poin lagi untuk{" "}
                  {nextTier.name}
                </span>
                <span className="text-muted-foreground">
                  {formatNumber(nextTier.min_points)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Leaderboard Table ── */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground">Klasemen</h2>
          <span className="text-xs text-muted-foreground">
            Top 100 member teratas
          </span>
        </div>

        <DataTable
          columns={columns}
          data={pagedData}
          loading={loading}
          emptyMessage="Belum ada data leaderboard"
          rowClassName={(row) => {
            const isMe = member && row.member_id === member.member_id;
            return isMe
              ? "border-l-2 border-l-primary bg-primary/5 font-medium"
              : "";
          }}
          pagination={{
            currentPage,
            totalPages,
            onPageChange: setCurrentPage,
          }}
        />
      </div>
    </div>
  );
}
