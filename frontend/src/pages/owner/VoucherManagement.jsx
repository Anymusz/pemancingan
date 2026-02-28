import { useState, useEffect, useCallback } from "react";
import ownerService from "../../services/ownerService";

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

  // Section 3 — Daftar Voucher
  const [vouchers, setVouchers] = useState([]);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("semua");
  const [filterYear, setFilterYear] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  // Toast
  const [toast, setToast] = useState(null);

  // ==================== HELPERS ====================

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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
      showToast("Gagal memuat konfigurasi voucher", "error");
    } finally {
      setConfigLoading(false);
    }
  }, []);

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
      showToast("Gagal memuat daftar voucher", "error");
    } finally {
      setVoucherLoading(false);
    }
  }, [filterStatus, filterYear, filterMonth]);

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
      showToast("Konfigurasi voucher berhasil disimpan");
      fetchConfigs();
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Gagal menyimpan konfigurasi",
        "error",
      );
    } finally {
      setConfigSaving(false);
    }
  };

  // ==================== RENDER ====================
  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 16,
            right: 16,
            padding: "12px 20px",
            borderRadius: 8,
            color: "#fff",
            backgroundColor: toast.type === "success" ? "#16a34a" : "#dc2626",
            zIndex: 9999,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            fontSize: 14,
          }}
        >
          {toast.message}
        </div>
      )}

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
              onClick={handleSaveConfig}
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
        {voucherLoading ? (
          <p>Memuat daftar voucher...</p>
        ) : vouchers.length === 0 ? (
          <p>Belum ada data voucher.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              border="1"
              width="100%"
              style={{ borderCollapse: "collapse" }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f9fafb" }}>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>
                    Nama Member
                  </th>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>
                    Periode
                  </th>
                  <th style={{ padding: "8px 12px", textAlign: "center" }}>
                    Rank
                  </th>
                  <th style={{ padding: "8px 12px", textAlign: "right" }}>
                    Nilai
                  </th>
                  <th style={{ padding: "8px 12px", textAlign: "center" }}>
                    Status
                  </th>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>
                    Tanggal Terbit
                  </th>
                  <th style={{ padding: "8px 12px", textAlign: "left" }}>
                    Tanggal Digunakan
                  </th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map((v) => (
                  <tr key={v.id}>
                    <td style={{ padding: "8px 12px" }}>
                      {v.member?.user?.name || "-"}
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      {v.period_year && v.period_month
                        ? formatPeriod(v.period_year, v.period_month)
                        : "-"}
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                      {v.rank ?? "-"}
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "right" }}>
                      {v.amount != null ? formatCurrency(v.amount) : "-"}
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 10px",
                          borderRadius: 12,
                          fontSize: 13,
                          fontWeight: 600,
                          backgroundColor:
                            v.status === "used" ? "#dcfce7" : "#fef9c3",
                          color: v.status === "used" ? "#166534" : "#854d0e",
                        }}
                      >
                        {v.status === "used"
                          ? "Sudah Digunakan"
                          : "Belum Digunakan"}
                      </span>
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      {formatDate(v.issued_at || v.created_at)}
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      {formatDate(v.used_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoucherManagement;
