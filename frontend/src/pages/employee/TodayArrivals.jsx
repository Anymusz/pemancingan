// File: src/pages/employee/TodayArrivals.jsx

import { useState, useEffect, useCallback } from "react";
import employeeService from "../../services/employeeService";
import { useToast } from "@/hooks/useToast";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { formatDateTime } from "@/utils/utils";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/FormInput";
import { FormSelect } from "@/components/common/FormSelect";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TabsNav } from "@/components/common/TabsNav";

const TYPE_FILTERS = [
  { value: "all", label: "Semua" },
  { value: "member", label: "Member" },
  { value: "guest", label: "Tamu" },
];

const TodayArrivals = () => {
  const [arrivals, setArrivals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [checkoutModal, setCheckoutModal] = useState({
    open: false,
    arrival: null,
    notes: "",
  });
  const toast = useToast();

  const fetchArrivals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await employeeService.getTodayArrivals();
      if (res.success) setArrivals(res.data.arrivals);
    } catch {
      toast.error("Gagal memuat data kedatangan");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchArrivals();
  }, [fetchArrivals]);

  const filteredArrivals = arrivals.filter((a) => {
    const q = searchQuery.toLowerCase();
    const matchStatus = statusFilter ? a.status === statusFilter : true;
    const matchType =
      typeFilter === "all"
        ? true
        : typeFilter === "guest"
          ? a.is_guest
          : !a.is_guest;
    const matchSearch = searchQuery
      ? a.name?.toLowerCase().includes(q) ||
        a.member_code?.toLowerCase()?.includes(q)
      : true;
    return matchStatus && matchType && matchSearch;
  });

  const openCheckoutModal = (arrival) => {
    setCheckoutModal({ open: true, arrival, notes: "" });
  };

  const closeCheckoutModal = () => {
    setCheckoutModal({ open: false, arrival: null, notes: "" });
  };

  const handleManualCheckout = async () => {
    if (!checkoutModal.arrival) return;
    setSubmitLoading(true);
    try {
      const res = await employeeService.checkOutMember(
        checkoutModal.arrival.arrival_id,
        checkoutModal.notes || null,
      );
      if (res.success) {
        toast.success(`${res.data.arrival.display_name} berhasil check-out`);
        closeCheckoutModal();
        fetchArrivals();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal melakukan check-out");
    } finally {
      setSubmitLoading(false);
    }
  };

  const arrivalColumns = [
    { key: "name", header: "Nama", render: (row) => row.name },
    {
      key: "is_guest",
      header: "Tipe",
      render: (row) => (
        <StatusBadge status={row.is_guest ? "guest" : "member"} />
      ),
    },
    {
      key: "member_code",
      header: "Member ID",
      render: (row) => row.member_code ?? "-",
    },
    {
      key: "tier",
      header: "Tier",
      render: (row) =>
        row.tier ? <StatusBadge status={row.tier.toLowerCase()} /> : "-",
    },
    {
      key: "check_in_at",
      header: "Registrasi",
      render: (row) => formatDateTime(row.check_in_at),
    },
    {
      key: "duration",
      header: "Durasi",
      render: (row) => row.duration ?? "-",
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Total: {filteredArrivals.length} kedatangan
        </p>
      </div>

      {/* Type filter */}
      <TabsNav
        value={typeFilter}
        onValueChange={setTypeFilter}
        items={TYPE_FILTERS}
      />

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama / member ID..."
          className="max-w-xs"
        />
        <FormSelect
          value={statusFilter || "__all__"}
          onValueChange={(val) => setStatusFilter(val === "__all__" ? "" : val)}
          placeholder="Semua Status"
          options={[
            { value: "__all__", label: "Semua Status" },
            { value: "active", label: "Aktif" },
            { value: "completed", label: "Selesai" },
          ]}
          className="w-44"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={fetchArrivals}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Table */}
      <DataTable
        columns={arrivalColumns}
        data={filteredArrivals}
        loading={loading}
        emptyMessage="Tidak ada data kedatangan"
        getRowActions={(row) => {
          if (row.status !== "active") return [];
          return [
            {
              label: "Manual Check-out",
              onClick: () => openCheckoutModal(row),
            },
          ];
        }}
      />

      {/* Checkout Confirm Dialog */}
      {checkoutModal.arrival && (
        <ConfirmDialog
          open={checkoutModal.open}
          onClose={closeCheckoutModal}
          onConfirm={handleManualCheckout}
          variant="warning"
          title="Konfirmasi Check-out"
          description={`Check-out ${checkoutModal.arrival.is_guest ? "tamu" : "member"} ${checkoutModal.arrival.name} tanpa transaksi?`}
          inputLabel="Catatan (opsional)"
          inputValue={checkoutModal.notes}
          onInputChange={(e) =>
            setCheckoutModal((p) => ({ ...p, notes: e.target.value }))
          }
          confirmLabel="Ya, Check-out"
          loading={submitLoading}
        />
      )}
    </div>
  );
};

export default TodayArrivals;
