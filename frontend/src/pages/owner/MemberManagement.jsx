import { useState, useEffect, useCallback } from "react";
import ownerService from "@/services/ownerService";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { DataTable } from "@/components/common/DataTable";
import { TabsNav } from "@/components/common/TabsNav";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useToast } from "@/hooks/useToast";
import { formatDateTime } from "@/utils/utils";

// ── Dialog Configuration ─────────────────────────────────────────

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

// ── Component ───────────────────────────────────────────────────

const MemberManagement = () => {
  const toast = useToast();

  // ── State ─────────────────────────────────────────────────────

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

  // ── Column Definitions ────────────────────────────────────────

  const pendingColumns = [
    { key: "name", header: "Nama" },
    { key: "phone", header: "No HP" },
    {
      key: "email",
      header: "Email",
      render: (row) =>
        row.email ? (
          <a
            href={`mailto:${row.email}`}
            className="text-blue-500 font-normal hover:text-blue-600 hover:underline transition"
          >
            {row.email}
          </a>
        ) : (
          "-"
        ),
    },
    { key: "address", header: "Alamat" },
    {
      key: "registered_at",
      header: "Tanggal Daftar",
      render: (row) => formatDateTime(row.registered_at),
    },
  ];

  const activeColumns = [
    { key: "name", header: "Nama" },
    { key: "phone", header: "No HP" },
    { key: "member_id", header: "Member ID" },
    {
      key: "tier",
      header: "Tier",
      render: (row) => <StatusBadge status={row.tier} />,
    },
    {
      key: "total_points",
      header: "Poin",
      render: (row) => row.total_points ?? "-",
    },
    {
      key: "total_fish_weight",
      header: "Berat Ikan (kg)",
      render: (row) => row.total_fish_weight ?? "-",
    },
    {
      key: "approved_at",
      header: "Tanggal Approve",
      render: (row) => formatDateTime(row.approved_at),
    },
  ];

  const rejectedColumns = [
    { key: "name", header: "Nama" },
    { key: "phone", header: "No HP" },
    {
      key: "rejected_at",
      header: "Tanggal Tolak",
      render: (row) => formatDateTime(row.rejected_at),
    },
    {
      key: "rejection_reason",
      header: "Alasan",
      render: (row) => row.rejection_reason || "-",
    },
  ];

  const deactivatedColumns = [
    { key: "name", header: "Nama" },
    { key: "phone", header: "No HP" },
    {
      key: "deactivated_at",
      header: "Tanggal Nonaktif",
      render: (row) => formatDateTime(row.deactivated_at),
    },
    {
      key: "deactivated_reason",
      header: "Alasan",
      render: (row) => row.deactivated_reason || "-",
    },
  ];

  // ── Dialog Props ──────────────────────────────────────────────

  const dialogConfig = dialog.type ? DIALOG_CONFIG[dialog.type] : null;

  // ── Derived ───────────────────────────────────────────────────

  const tabData = data[activeTab];
  const isTabLoading = loading[activeTab];

  // ── Render ────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Manajemen Member
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola pendaftaran, status, dan riwayat keanggotaan member.
        </p>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <TabsNav
        value={activeTab}
        onValueChange={handleTabChange}
        className="mb-6"
        items={[
          { value: "pending", label: "Pending", badge: counts.pending },
          { value: "active", label: "Active", badge: counts.active },
          { value: "rejected", label: "Rejected", badge: counts.rejected },
          {
            value: "deactivated",
            label: "Deactivated",
            badge: counts.deactivated,
          },
        ]}
      />

      {/* ── Table ───────────────────────────────────────────────── */}
      <DataTable
        columns={
          activeTab === "pending"
            ? pendingColumns
            : activeTab === "active"
              ? activeColumns
              : activeTab === "rejected"
                ? rejectedColumns
                : deactivatedColumns
        }
        data={tabData}
        loading={isTabLoading}
        emptyMessage={EMPTY_MESSAGES[activeTab]}
        getRowActions={(row) => {
          if (activeTab === "pending")
            return [
              { label: "Approve", onClick: () => openDialog("approve", row) },
              {
                label: "Reject",
                variant: "danger",
                onClick: () => openDialog("reject", row),
              },
            ];
          if (activeTab === "active")
            return [
              {
                label: "Deactivate",
                variant: "danger",
                onClick: () => openDialog("deactivate", row),
              },
            ];
          if (activeTab === "deactivated")
            return [
              {
                label: "Reactivate",
                onClick: () => openDialog("reactivate", row),
              },
            ];
          return [];
        }}
      />

      {/* ── Confirm Dialog ──────────────────────────────────────── */}
      {dialogConfig && (
        <ConfirmDialog
          open={dialog.open}
          onClose={closeDialog}
          onConfirm={handleDialogConfirm}
          title={dialogConfig.title}
          description={dialogConfig.description(dialog.member?.name)}
          variant={dialogConfig.variant}
          confirmLabel={dialogConfig.confirmLabel}
          cancelLabel="Batal"
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
