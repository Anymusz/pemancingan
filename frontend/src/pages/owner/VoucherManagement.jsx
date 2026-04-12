import { useState, useEffect, useCallback } from "react";
import ownerService from "../../services/ownerService";
import { useToast } from "@/hooks/useToast";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { DataTable } from "../../components/common/DataTable";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/FormInput";
import { Label } from "@/components/common/FormLabel";
import { FormSelect } from "@/components/common/FormSelect";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatCurrency, formatDateTime } from "@/utils/utils";

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const MONTH_OPTIONS = [
  { value: "all", label: "Semua" },
  ...MONTH_NAMES.map((name, idx) => ({ value: String(idx + 1), label: name })),
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = [
  { value: "all", label: "Semua" },
  ...Array.from({ length: 5 }, (_, i) => {
    const year = String(currentYear - i);
    return { value: year, label: year };
  }),
];

const STATUS_OPTIONS = [
  { value: "semua", label: "Semua" },
  { value: "unused", label: "Belum Digunakan" },
  { value: "used", label: "Sudah Digunakan" },
];

const VoucherManagement = () => {
  // ==================== STATE ====================

  const [configs, setConfigs] = useState({
    rank_1: "",
    rank_2: "",
    rank_3: "",
  });
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [vouchers, setVouchers] = useState([]);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("semua");
  const [filterYear, setFilterYear] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  const toast = useToast();

  // ==================== HELPERS ====================

  const formatPeriod = (year, month) => `${MONTH_NAMES[month - 1]} ${year}`;

  // ==================== FETCH ====================

  const fetchConfigs = useCallback(async () => {
    setConfigLoading(true);
    try {
      const res = await ownerService.getVoucherConfigs();
      if (res.success && res.data) {
        const configData = res.data.configs || res.data;
        const mapped = { rank_1: "", rank_2: "", rank_3: "" };
        if (Array.isArray(configData)) {
          configData.forEach((c) => {
            if (c.rank === 1) mapped.rank_1 = c.amount;
            if (c.rank === 2) mapped.rank_2 = c.amount;
            if (c.rank === 3) mapped.rank_3 = c.amount;
          });
        } else {
          mapped.rank_1 = configData.rank_1 ?? "";
          mapped.rank_2 = configData.rank_2 ?? "";
          mapped.rank_3 = configData.rank_3 ?? "";
        }
        setConfigs(mapped);
      }
    } catch {
      toast.error("Gagal memuat konfigurasi voucher");
    } finally {
      setConfigLoading(false);
    }
  }, [toast]);

  const fetchVouchers = useCallback(async () => {
    setVoucherLoading(true);
    try {
      const params = {};
      if (filterStatus && filterStatus !== "semua")
        params.status = filterStatus;
      if (filterYear) params.period_year = filterYear;
      if (filterMonth) params.period_month = filterMonth;

      const res = await ownerService.getVouchers(params);
      if (res.success) {
        setVouchers(Array.isArray(res.data) ? res.data : []);
      }
    } catch {
      toast.error("Gagal memuat daftar voucher");
    } finally {
      setVoucherLoading(false);
    }
  }, [filterStatus, filterYear, filterMonth, toast]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  // ==================== HANDLERS ====================

  const handleSaveConfig = async () => {
    setConfigSaving(true);
    try {
      await ownerService.updateVoucherConfigs({
        configs: [
          { rank: 1, amount: Number(configs.rank_1) },
          { rank: 2, amount: Number(configs.rank_2) },
          { rank: 3, amount: Number(configs.rank_3) },
        ],
      });
      toast.success("Konfigurasi voucher berhasil disimpan");
      fetchConfigs();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Gagal menyimpan konfigurasi",
      );
    } finally {
      setConfigSaving(false);
      setConfirmOpen(false);
    }
  };

  // ==================== COLUMNS ====================
  const columns = [
    {
      key: "member",
      header: "Nama Member",
      render: (row) => row.member?.user?.name || "-",
    },
    {
      key: "period",
      header: "Periode",
      render: (row) =>
        row.period_year && row.period_month
          ? formatPeriod(row.period_year, row.period_month)
          : "-",
    },
    {
      key: "rank",
      header: "Rank",
      align: "center",
      width: "100px",
      render: (row) => row.rank ?? "-",
    },
    {
      key: "amount",
      header: "Nilai",
      render: (row) => (row.amount != null ? formatCurrency(row.amount) : "-"),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "issued_at",
      header: "Tanggal Terbit",
      render: (row) => formatDateTime(row.issued_at || row.created_at),
    },
    {
      key: "used_at",
      header: "Tanggal Digunakan",
      render: (row) => formatDateTime(row.used_at),
    },
  ];

  // ==================== RENDER ====================
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Manajemen Voucher</h1>

      {/* ===== SECTION 1: Konfigurasi Voucher ===== */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">
          Konfigurasi Nilai Voucher
        </h2>

        {configLoading ? (
          <p className="text-sm text-muted-foreground">Memuat konfigurasi...</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-4">
              {[1, 2, 3].map((rank) => (
                <div key={rank} className="grid gap-1.5 min-w-[180px]">
                  <Label>Rank {rank} (Rp)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={configs[`rank_${rank}`]}
                    onChange={(e) =>
                      setConfigs((prev) => ({
                        ...prev,
                        [`rank_${rank}`]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground italic">
              ⓘ Perubahan hanya berlaku untuk periode yang belum diterbitkan.
              Voucher yang sudah diterbitkan tidak dapat diubah.
            </p>

            <Button
              onClick={() => setConfirmOpen(true)}
              loading={configSaving}
              disabled={configSaving}
            >
              Simpan Konfigurasi
            </Button>

            <ConfirmDialog
              open={confirmOpen}
              onClose={() => setConfirmOpen(false)}
              onConfirm={handleSaveConfig}
              title="Konfirmasi Simpan Konfigurasi"
              description="Perubahan ini hanya berlaku untuk voucher yang diterbitkan di masa depan. Voucher yang sudah terbit tidak akan berubah. Lanjutkan?"
              confirmLabel="Ya, Simpan"
              cancelLabel="Batal"
              loading={configSaving}
            />
          </>
        )}
      </div>

      {/* ===== SECTION 2 (Deposit Tamu) — moved to Pengaturan page ===== */}

      {/* ===== SECTION 3: Daftar Voucher ===== */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">
          Daftar Voucher
        </h2>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1.5">
            <Label>Status</Label>
            <FormSelect
              options={STATUS_OPTIONS}
              value={filterStatus}
              onValueChange={setFilterStatus}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Bulan</Label>
            <FormSelect
              options={MONTH_OPTIONS}
              value={filterMonth || "all"}
              onValueChange={(val) => setFilterMonth(val === "all" ? "" : val)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Tahun</Label>
            <FormSelect
              options={YEAR_OPTIONS}
              value={filterYear || "all"}
              onValueChange={(val) => setFilterYear(val === "all" ? "" : val)}
            />
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={vouchers}
          loading={voucherLoading}
          emptyMessage="Belum ada data voucher"
        />
      </div>
    </div>
  );
};

export default VoucherManagement;
