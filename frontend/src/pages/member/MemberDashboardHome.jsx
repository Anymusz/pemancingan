// File: src/pages/member/MemberDashboardHome.jsx
import { useState } from "react";
import { Star, Weight, Trophy, Ticket, ImageOff } from "lucide-react";
import ImageLightbox from "@/components/common/ImageLightbox";
import { formatNumber, formatCurrency } from "@/utils/utils";
import { StatusBadge } from "@/components/common/StatusBadge";

export default function MemberDashboardHome({
  profile,
  vouchers,
  vouchersLoading,
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const nextTier = profile?.next_tier;
  const qrCodeUrl = profile?.member?.qr_code_url;

  let progressPercent = 0;
  if (nextTier) {
    const currentPoints = profile.member.total_points;
    const base = profile.tier.min_points;
    const target = nextTier.min_points;
    progressPercent =
      target > base
        ? Math.min(
            100,
            Math.max(0, ((currentPoints - base) / (target - base)) * 100),
          )
        : 100;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Row 1: Card & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Membership Card */}
        <div className="rounded-xl border border-border bg-card p-5 relative">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-base font-bold text-foreground">
                {profile?.user?.name}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Member ID</p>
              <p className="text-sm font-mono text-foreground font-semibold">
                {profile?.member?.member_id || "-"}
              </p>
            </div>
            <StatusBadge status={profile?.tier?.name?.toLowerCase()} />
          </div>

          <div className="mb-4">
            <p className="text-xs text-muted-foreground">
              Diskon Kategori Menu
            </p>
            <p className="text-sm font-semibold">
              {profile?.tier?.discount_percentage}%
            </p>
          </div>

          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">QR Code Status</p>
            {qrCodeUrl ? (
              <>
                <img
                  src={qrCodeUrl}
                  alt="Member QR Code"
                  className="w-32 h-32 rounded-lg cursor-zoom-in border border-border/50 object-cover shadow-sm bg-white"
                  onClick={() => setLightboxOpen(true)}
                />
                <ImageLightbox
                  open={lightboxOpen}
                  src={qrCodeUrl}
                  alt="Member QR Code"
                  onClose={() => setLightboxOpen(false)}
                />
              </>
            ) : (
              <div className="w-32 h-32 rounded-lg bg-muted flex flex-col justify-center items-center gap-2 border border-border border-dashed">
                <ImageOff className="w-6 h-6 text-muted-foreground/40" />
                <span className="text-[10px] text-muted-foreground">
                  Tanpa QR
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Stats */}
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Star className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-medium text-foreground">
                Total Poin
              </span>
            </div>
            <span className="text-sm font-semibold">
              {formatNumber(profile?.member?.total_points)} poin
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Weight className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-foreground">
                Total Berat Ikan
              </span>
            </div>
            <span className="text-sm font-semibold">
              {formatNumber(profile?.member?.total_fish_weight)} kg
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Trophy className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-medium text-foreground">
                Posisi Leaderboard
              </span>
            </div>
            <span className="text-sm font-semibold">
              {profile?.leaderboard?.rank
                ? `#${profile.leaderboard.rank}`
                : "Belum masuk peringkat"}
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Progress Tier */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">
          Progress Tier
        </h2>
        {!nextTier ? (
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-500/10 p-3 rounded-lg">
            <Trophy className="w-4 h-4" />
            <span className="font-medium">
              Anda sudah mencapai tier tertinggi!
            </span>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-2 font-medium">
              <span className="text-muted-foreground uppercase text-sm">
                {profile?.tier?.name}
              </span>
              <span className="text-amber-600 uppercase text-sm font-bold">
                {nextTier.name}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted overflow-hidden mb-2">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>
                {formatNumber(profile?.member?.total_points)} /{" "}
                {formatNumber(nextTier.min_points)} poin
              </span>
              <span>{formatNumber(nextTier.points_needed)} poin lagi</span>
            </div>
          </div>
        )}
      </div>

      {/* Row 3: Voucher Aktif */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Ticket className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-semibold text-foreground">
            Voucher Aktif
          </h2>
          {!vouchersLoading && vouchers.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
              {vouchers.length}
            </span>
          )}
        </div>

        {vouchersLoading ? (
          <div className="flex overflow-x-auto gap-3 pb-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-56 shrink-0 h-24 rounded-lg bg-muted/40 animate-pulse border border-border"
              />
            ))}
          </div>
        ) : vouchers.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg border-border">
            Belum ada voucher aktif.
          </p>
        ) : (
          <div className="flex overflow-x-auto gap-3 pb-2">
            {vouchers.map((v) => (
              <div
                key={v.id}
                className="w-56 shrink-0 rounded-lg border border-border bg-muted/40 p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="text-lg font-bold text-emerald-600">
                    {formatCurrency(v.amount)}
                  </p>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-500/10 text-amber-600">
                    Peringkat {v.rank}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Periode:{" "}
                  {new Date(
                    v.period_year,
                    v.period_month - 1,
                  ).toLocaleDateString("id-ID", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
