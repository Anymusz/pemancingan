import { useState, useEffect, useCallback } from "react";
import ownerService from "../../services/ownerService";
import { useToast } from "@/hooks/useToast";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { DataTable } from "../../components/common/DataTable";

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

const VoucherManagement = () => {
  // ==================== STATE ====================

  // Section 1 — Konfigurasi Voucher
  const [configs, setConfigs] = useState({
    rank_1: "",
    rank_2: "",
    rank_3: "",
  });
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Section 3 — Daftar Voucher
  const [vouchers, setVouchers] = useState([]);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("semua");
  const [filterYear, setFilterYear] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  // Toast
  const toast = useToast();

  // ==================== HELPERS ====================

  const formatCurrency = (val) => `Rp ${Number(val).toLocaleString("id-ID")}`;

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPeriod = (year, month) => {
    return `${MONTH_NAMES[month - 1]} ${year}`;
  };

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

  // Section 1 — Simpan Konfigurasi
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
      render: (row) => (
        <span
          className={`inline-block px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${
            row.status === "used"
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {row.status === "used" ? "Sudah Digunakan" : "Belum Digunakan"}
        </span>
      ),
    },
    {
      key: "issued_at",
      header: "Tanggal Terbit",
      render: (row) => formatDate(row.issued_at || row.created_at),
    },
    {
      key: "used_at",
      header: "Tanggal Digunakan",
      render: (row) => formatDate(row.used_at),
    },
  ];

  // ==================== RENDER ====================
  return (
    <div>
      <h1>Manajemen Voucher</h1>

      {/* ======================== SECTION 1 ======================== */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Konfigurasi Nilai Voucher</h2>

        {configLoading ? (
          <p>Memuat konfigurasi...</p>
        ) : (
          <>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {[1, 2, 3].map((rank) => (
                <div key={rank} style={{ minWidth: 180 }}>
                  <label>
                    <strong>Rank {rank}</strong> (Rp)
                  </label>
                  <br />
                  <input
                    type="number"
                    min="0"
                    style={{ width: "100%", padding: "6px 8px", marginTop: 4 }}
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

            <p style={{ color: "#6b7280", fontSize: 13, marginTop: 12 }}>
              <em>
                ⓘ Perubahan hanya berlaku untuk periode yang belum diterbitkan.
                Voucher yang sudah diterbitkan tidak dapat diubah
              </em>
            </p>

            <button
              onClick={() => setConfirmOpen(true)}
              disabled={configSaving}
              style={{
                marginTop: 8,
                padding: "8px 20px",
                backgroundColor: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: configSaving ? "not-allowed" : "pointer",
              }}
            >
              {configSaving ? "Menyimpan..." : "Simpan Konfigurasi"}
            </button>

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

      {/* ======================== SECTION 2 ======================== */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: 20,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Daftar Voucher</h2>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 16,
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <div>
            <label>Status</label>
            <br />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ padding: "6px 8px" }}
            >
              <option value="semua">Semua</option>
              <option value="unused">Belum Digunakan</option>
              <option value="used">Sudah Digunakan</option>
            </select>
          </div>
          <div>
            <label>Tahun</label>
            <br />
            <input
              type="number"
              min="2020"
              max="2099"
              placeholder="Semua"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              style={{ padding: "6px 8px", width: 100 }}
            />
          </div>
          <div>
            <label>Bulan</label>
            <br />
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              style={{ padding: "6px 8px" }}
            >
              <option value="">Semua</option>
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {name}
                </option>
              ))}
            </select>
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
