import { useState, useEffect } from "react";
import ownerService from "@/services/ownerService";
import { useToast } from "@/hooks/useToast";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/common/Button";
import { RefreshCw } from "lucide-react";
import { formatCurrency } from "@/utils/utils";
import { StatusBadge } from "@/components/common/StatusBadge";

const OwnerLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [voucherConfigs, setVoucherConfigs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [leaderboardRes, voucherRes] = await Promise.all([
        ownerService.getLeaderboard(100),
        ownerService.getVoucherConfigs(),
      ]);

      if (leaderboardRes.success) {
        setLeaderboard(leaderboardRes.data?.leaderboard || []);
        setMeta(leaderboardRes.data?.meta || null);
      } else {
        setError(leaderboardRes.message);
        toast.error(leaderboardRes.message);
      }

      if (voucherRes.success) {
        setVoucherConfigs(voucherRes.data || []);
      }
    } catch (err) {
      const message = err.response?.data?.message || "Gagal memuat leaderboard";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getMedalIcon = (rank) => {
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
  };

  const voucherConfigMap = voucherConfigs.reduce((acc, config) => {
    acc[config.rank] = config.amount;
    return acc;
  }, {});

  const columns = [
    {
      key: "rank",
      header: "Rank",
      align: "center",
      width: "50px",
      render: (row) => getMedalIcon(row.rank),
    },
    { key: "name", header: "Nama Lengkap", render: (row) => row.name },
    { key: "member_id", header: "Member ID", render: (row) => row.member_id },
    {
      key: "tier",
      header: "Tier",
      render: (row) => <StatusBadge status={row.tier?.toLowerCase()} />,
    },
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
        if (row.rank <= 3) {
          const amt = voucherConfigMap[row.rank];
          return amt ? formatCurrency(amt) : "-";
        }
        return "-";
      },
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Leaderboard</h2>
          <p className="text-sm text-muted-foreground">
            Monitoring posisi member untuk penentuan voucher bulanan
          </p>
        </div>
        <Button
          onClick={fetchData}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {meta && (
        <p className="text-sm text-muted-foreground mb-4">
          Total member peringkat: {meta.total_ranked_members}
        </p>
      )}

      {error ? (
        <div className="text-destructive my-4 text-sm font-medium">
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
