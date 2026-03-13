import { useState, useEffect, useCallback } from "react";
import ownerService from "@/services/ownerService";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useToast } from "@/hooks/useToast";
import { formatDateTime } from "@/utils/utils";

// ── Tab & Dialog Configuration ──────────────────────────────────────

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "active", label: "Active" },
  { key: "rejected", label: "Rejected" },
  { key: "deactivated", label: "Deactivated" },
];

const EMPTY_MESSAGES = {
  pending: "Tidak ada member yang menunggu validasi",
  active: "Belum ada member aktif",
  rejected: "Tidak ada member yang pernah ditolak",
  deactivated: "Tidak ada member yang dinonaktifkan",
};

const DIALOG_CONFIG = {
  approve: {
    variant: "default",
    title: "Konfirmasi Approve",
    description: (name) => `Apakah Anda yakin ingin menyetujui member ${name}?`,
    confirmLabel: "Approve",
    inputLabel: null,
  },
  reject: {
    variant: "warning",
    title: "Konfirmasi Reject",
    description: (name) => `Apakah Anda yakin ingin menolak member ${name}?`,
    confirmLabel: "Reject",
    inputLabel: "Alasan Penolakan",
  },
  deactivate: {
    variant: "destructive",
    title: "Konfirmasi Deactivate",
    description: (name) =>
      `Member ${name} akan dinonaktifkan. Data keanggotaan tetap tersimpan dan dapat dipulihkan.`,
    confirmLabel: "Deactivate",
    inputLabel: "Alasan Penonaktifan",
  },
  reactivate: {
    variant: "default",
    title: "Konfirmasi Reactivate",
    description: (name) =>
      `Member ${name} akan direaktivasi untuk review ulang. Lanjutkan?`,
    confirmLabel: "Reactivate",
    inputLabel: null,
  },
};

// ── Component ───────────────────────────────────────────────────────

const MemberManagement = () => {
  const toast = useToast();

  // ── State ───────────────────────────────────────────────────────

  const [activeTab, setActiveTab] = useState("pending");

  const [counts, setCounts] = useState({
    pending: 0,
    active: 0,
    rejected: 0,
    deactivated: 0,
  });

  const [data, setData] = useState({
    pending: [],
    active: [],
    rejected: [],
    deactivated: [],
  });

  const [loading, setLoading] = useState({
    pending: false,
    active: false,
    rejected: false,
    deactivated: false,
    counts: false,
  });

  const [dialog, setDialog] = useState({
    open: false,
    type: null,
    member: null,
    inputValue: "",
  });

  const [actionLoading, setActionLoading] = useState(false);

  // ── Data Fetching ─────────────────────────────────────────────

  const fetchCounts = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, counts: true }));
      const result = await ownerService.getMemberCounts();
      setCounts(result.data);
    } catch {
      // counts are non-critical, silently fail
    } finally {
      setLoading((prev) => ({ ...prev, counts: false }));
    }
  }, []);

  const fetchTabData = useCallback(
    async (tab) => {
      try {
        setLoading((prev) => ({ ...prev, [tab]: true }));

        let result;
        switch (tab) {
          case "pending":
            result = await ownerService.getPendingMembers();
            setData((prev) => ({ ...prev, pending: result.data }));
            break;
          case "active":
            result = await ownerService.getActiveMembers();
            setData((prev) => ({ ...prev, active: result.data }));
            break;
          case "rejected":
            result = await ownerService.getValidationHistory();
            setData((prev) => ({ ...prev, rejected: result.data.rejected }));
            break;
          case "deactivated":
            result = await ownerService.getDeactivatedMembers();
            setData((prev) => ({ ...prev, deactivated: result.data }));
            break;
        }
      } catch {
        toast.error("Gagal memuat data", "Silakan coba lagi");
      } finally {
        setLoading((prev) => ({ ...prev, [tab]: false }));
      }
    },
    [toast],
  );

  // Mount: fetch counts + default tab
  useEffect(() => {
    fetchCounts();
    fetchTabData("pending");
  }, [fetchCounts, fetchTabData]);

  // Tab change: fetch that tab's data
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    fetchTabData(tab);
  };

  // ── Dialog Handlers ───────────────────────────────────────────

  const openDialog = (type, member) => {
    setDialog({ open: true, type, member, inputValue: "" });
  };

  const closeDialog = () => {
    if (actionLoading) return;
    setDialog({ open: false, type: null, member: null, inputValue: "" });
  };

  const handleDialogConfirm = async () => {
    const { type, member, inputValue } = dialog;

    // Validate required input
    if ((type === "reject" || type === "deactivate") && !inputValue.trim()) {
      toast.warning(
        "Input wajib diisi",
        type === "reject"
          ? "Masukkan alasan penolakan"
          : "Masukkan alasan penonaktifan",
      );
      return;
    }

    try {
      setActionLoading(true);

      const userId = member.user_id ?? member.id;

      switch (type) {
        case "approve":
          await ownerService.approveMember(userId);
          toast.success("Berhasil", `Member ${member.name} berhasil disetujui`);
          break;
        case "reject":
          await ownerService.rejectMember(userId, inputValue);
          toast.success("Berhasil", `Member ${member.name} berhasil ditolak`);
          break;
        case "deactivate":
          await ownerService.deactivateMember(userId, inputValue);
          toast.success(
            "Berhasil",
            `Member ${member.name} berhasil dinonaktifkan`,
          );
          break;
        case "reactivate":
          await ownerService.reactivateMember(userId);
          toast.success(
            "Berhasil",
            `Member ${member.name} direaktivasi untuk review ulang`,
          );
          break;
      }

      closeDialog();
      fetchTabData(activeTab);
      fetchCounts();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Terjadi kesalahan";
      toast.error("Gagal", errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Tab Renderers ─────────────────────────────────────────────

  const renderPendingTable = () =>
    data.pending.map((m) => (
      <tr key={m.id}>
        <td>{m.name}</td>
        <td>{m.phone}</td>
        <td>{m.email || "-"}</td>
        <td>{m.address}</td>
        <td>{formatDateTime(m.registered_at)}</td>
        <td>
          <button onClick={() => openDialog("approve", m)}>Approve</button>{" "}
          <button onClick={() => openDialog("reject", m)}>Reject</button>
        </td>
      </tr>
    ));

  const renderActiveTable = () =>
    data.active.map((m) => (
      <tr key={m.user_id}>
        <td>{m.name}</td>
        <td>{m.phone}</td>
        <td>{m.member_id}</td>
        <td>{m.tier}</td>
        <td>{m.total_points ?? "-"}</td>
        <td>{m.total_fish_weight != null ? `${m.total_fish_weight}` : "-"}</td>
        <td>{m.approved_at}</td>
        <td>
          <button onClick={() => openDialog("deactivate", m)}>
            Deactivate
          </button>
        </td>
      </tr>
    ));

  const renderRejectedTable = () =>
    data.rejected.map((m, i) => (
      <tr key={i}>
        <td>{m.name}</td>
        <td>{m.phone}</td>
        <td>{m.rejected_at}</td>
        <td>{m.rejection_reason || "-"}</td>
      </tr>
    ));

  const renderDeactivatedTable = () =>
    data.deactivated.map((m, i) => (
      <tr key={m.user_id ?? i}>
        <td>{m.name}</td>
        <td>{m.phone}</td>
        <td>{m.deactivated_at}</td>
        <td>{m.deactivated_reason || "-"}</td>
        <td>
          <button onClick={() => openDialog("reactivate", m)}>
            Reactivate
          </button>
        </td>
      </tr>
    ));

  const TABLE_HEADERS = {
    pending: ["Nama", "No HP", "Email", "Alamat", "Tanggal Daftar", "Aksi"],
    active: [
      "Nama",
      "No HP",
      "Member ID",
      "Tier",
      "Poin",
      "Berat Ikan (kg)",
      "Tanggal Approve",
      "Aksi",
    ],
    rejected: ["Nama", "No HP", "Tanggal Tolak", "Alasan"],
    deactivated: ["Nama", "No HP", "Tanggal Nonaktif", "Alasan", "Aksi"],
  };

  const TABLE_RENDERERS = {
    pending: renderPendingTable,
    active: renderActiveTable,
    rejected: renderRejectedTable,
    deactivated: renderDeactivatedTable,
  };

  // ── Dialog Props ──────────────────────────────────────────────

  const dialogConfig = dialog.type ? DIALOG_CONFIG[dialog.type] : null;

  // ── Render ────────────────────────────────────────────────────

  const tabData = data[activeTab];
  const isTabLoading = loading[activeTab];

  return (
    <div>
      <h2>Manajemen Member</h2>

      {/* ── Status Tabs ────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            disabled={activeTab === tab.key}
            style={{
              fontWeight: activeTab === tab.key ? "bold" : "normal",
            }}
          >
            {tab.label} ({counts[tab.key] ?? 0})
          </button>
        ))}
      </div>

      {/* ── Tab Content ────────────────────────────────────────── */}
      {isTabLoading ? (
        <p>Memuat data...</p>
      ) : tabData.length === 0 ? (
        <p>{EMPTY_MESSAGES[activeTab]}</p>
      ) : (
        <table
          border="1"
          cellPadding="8"
          cellSpacing="0"
          style={{ width: "100%", borderCollapse: "collapse" }}
        >
          <thead>
            <tr>
              {TABLE_HEADERS[activeTab].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>{TABLE_RENDERERS[activeTab]()}</tbody>
        </table>
      )}

      {/* ── Confirm Dialog ─────────────────────────────────────── */}
      {dialogConfig && (
        <ConfirmDialog
          open={dialog.open}
          onClose={closeDialog}
          onConfirm={handleDialogConfirm}
          title={dialogConfig.title}
          description={dialogConfig.description(dialog.member?.name)}
          variant={dialogConfig.variant}
          confirmLabel={dialogConfig.confirmLabel}
          loading={actionLoading}
          inputLabel={dialogConfig.inputLabel}
          inputValue={dialog.inputValue}
          onInputChange={(e) =>
            setDialog((prev) => ({ ...prev, inputValue: e.target.value }))
          }
        />
      )}
    </div>
  );
};

export default MemberManagement;
