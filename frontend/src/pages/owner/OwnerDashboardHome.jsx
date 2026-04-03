// File: src/pages/owner/OwnerDashboardHome.jsx

import { useState, useEffect, useCallback } from "react";
import ownerService from "@/services/ownerService";
import { useToast } from "@/hooks/useToast";
import StatCards from "./dashboard/StatCards";
import RevenueChart from "./dashboard/RevenueChart";
import CategoryBreakdown from "./dashboard/CategoryBreakdown";
import PaymentBreakdown from "./dashboard/PaymentBreakdown";
import FishStockStatus from "@/components/common/FishStockStatus";
import MemberSummary from "./dashboard/MemberSummary";

const PERIOD_OPTIONS = [
  { value: "daily",   label: "Hari Ini" },
  { value: "weekly",  label: "Minggu Ini" },
  { value: "monthly", label: "Bulan Ini" },
];

// ============================================================
// OwnerDashboardHome
// Orchestrator: all data fetching lives here, sub-components
// are display-only.
// ============================================================
export default function OwnerDashboardHome({ onNavigate }) {
  const toast = useToast();

  // ------------- period-controlled data -------------------
  const [period, setPeriod] = useState("daily");
  const [summary, setSummary]       = useState(null);
  const [breakdown, setBreakdown]   = useState(null);
  const [periodLoading, setPeriodLoading] = useState(true);

  // ------------- static data (fetched once on mount) -----
  const [trendData, setTrendData]         = useState([]);
  const [fishStocks, setFishStocks]       = useState([]);
  const [memberCounts, setMemberCounts]   = useState(null);
  const [staticLoading, setStaticLoading] = useState(true);

  // ---- Fetch period-dependent: summary + breakdown ----
  const fetchPeriodData = useCallback(
    async (currentPeriod) => {
      setPeriodLoading(true);
      try {
        const params = { period: currentPeriod };
        const [summaryRes, breakdownRes] = await Promise.all([
          ownerService.getReportSummary(params),
          ownerService.getReportBreakdown(params),
        ]);
        if (summaryRes.success)  setSummary(summaryRes.data);
        if (breakdownRes.success) setBreakdown(breakdownRes.data);
      } catch {
        toast.error("Gagal memuat data ringkasan laporan");
      } finally {
        setPeriodLoading(false);
      }
    },
    [],
  );

  // ---- Fetch static: trend + fish stocks + member counts ----
  const fetchStaticData = useCallback(async () => {
    setStaticLoading(true);
    try {
      const [trendRes, fishRes, memberRes] = await Promise.all([
        ownerService.getDailyTrend(),
        ownerService.getFishStocks(),
        ownerService.getMemberCounts(),
      ]);
      if (trendRes.success)  setTrendData(trendRes.data);
      if (fishRes.success)   setFishStocks(fishRes.data?.fish_stocks ?? fishRes.data ?? []);
      if (memberRes.success) setMemberCounts(memberRes.data);
    } catch {
      toast.error("Gagal memuat data dashboard");
    } finally {
      setStaticLoading(false);
    }
  }, []);

  // Fetch static data once on mount
  useEffect(() => {
    fetchStaticData();
  }, [fetchStaticData]);

  // Re-fetch period data whenever period changes (and on mount)
  useEffect(() => {
    fetchPeriodData(period);
  }, [period, fetchPeriodData]);

  return (
    <div className="flex flex-col gap-6">
      {/* ── Row 0: Header + Period Toggle ─────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={[
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                period === opt.value
                  ? "bg-card shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Row 1: KPI Stat Cards (period-controlled) ─────── */}
      <StatCards data={summary} loading={periodLoading} />

      {/* ── Row 2: Revenue Chart (static 7-day trend) ──────── */}
      <RevenueChart data={trendData} loading={staticLoading} />

      {/* ── Row 3: Category + Payment breakdown (period) ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CategoryBreakdown
          data={breakdown?.by_category}
          loading={periodLoading}
        />
        <PaymentBreakdown
          data={breakdown?.by_payment_method}
          loading={periodLoading}
        />
      </div>

      {/* ── Row 4: Fish Stock + Member Summary (static) ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FishStockStatus data={fishStocks} loading={staticLoading} onNavigate={onNavigate} />
        <MemberSummary
          data={memberCounts}
          loading={staticLoading}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}
