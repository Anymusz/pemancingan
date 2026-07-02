// File: src/pages/owner/EmployeeManagement.jsx

import { useState, useEffect, useCallback } from "react";
import { UserPlus } from "lucide-react";
import ownerService from "@/services/ownerService";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import FormDialog from "@/components/common/FormDialog";
import { DataTable } from "@/components/common/DataTable";
import { TabsNav } from "@/components/common/TabsNav";
import { StatusBadge } from "@/components/common/StatusBadge";
// import FormInput from "@/components/common/FormInput";
import { Input } from "../../components/common/FormInput";
import { Textarea } from "@/components/common/FormTextarea";
import { useToast } from "@/hooks/useToast";
import { formatDate } from "@/utils/utils";
import { Button } from "@/components/common/Button";

// ── Helpers ──────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  address: "",
  password: "",
  password_confirmation: "",
};

const EMPTY_PW_FORM = {
  password: "",
  password_confirmation: "",
};

// ── Component ────────────────────────────────────────────────────

const EmployeeManagement = () => {
  const toast = useToast();

  // ── State ───────────────────────────────────────────────────────

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("active");

  // Create / Edit form
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create"); // 'create' | 'edit'
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Password form
  const [passwordFormOpen, setPasswordFormOpen] = useState(false);
  const [pwForm, setPwForm] = useState(EMPTY_PW_FORM);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwErrors, setPwErrors] = useState({});

  // Deactivate dialog
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  // Reactivate dialog
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const [reactivateLoading, setReactivateLoading] = useState(false);

  // ── Derived ─────────────────────────────────────────────────────

  const activeEmployees = employees.filter((e) => e.status === "active");
  const deactivatedEmployees = employees.filter(
    (e) => e.status === "deactivated",
  );

  // ── Fetch ────────────────────────────────────────────────────────

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ownerService.getEmployees();
      if (res.success) setEmployees(res.data.employees);
    } catch {
      toast.error("Gagal memuat data pegawai");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // ── Form Helpers ─────────────────────────────────────────────────

  const setFormField = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const setPwField = (field) => (e) =>
    setPwForm((prev) => ({ ...prev, [field]: e.target.value }));

  // ── Create / Edit ────────────────────────────────────────────────

  const openCreate = () => {
    setFormMode("create");
    setSelectedEmployee(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setFormOpen(true);
  };

  const openEdit = (employee) => {
    setFormMode("edit");
    setSelectedEmployee(employee);
    setForm({
      name: employee.name ?? "",
      email: employee.email ?? "",
      phone: employee.phone ?? "",
      address: employee.address ?? "",
      password: "",
      password_confirmation: "",
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Nama wajib diisi";
    if (!form.email.trim()) errors.email = "Email wajib diisi";
    if (!form.phone.trim()) errors.phone = "No. HP wajib diisi";
    if (!form.address.trim()) errors.address = "Alamat wajib diisi";
    if (formMode === "create") {
      if (!form.password) errors.password = "Password wajib diisi";
      else if (form.password.length < 8)
        errors.password = "Password minimal 8 karakter";
      if (form.password !== form.password_confirmation)
        errors.password_confirmation = "Konfirmasi password tidak cocok";
    }
    return errors;
  };

  const handleFormSubmit = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormLoading(true);
    try {
      if (formMode === "create") {
        await ownerService.createEmployee({
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
          password: form.password,
          password_confirmation: form.password_confirmation,
        });
        toast.success("Pegawai berhasil ditambahkan");
      } else {
        await ownerService.updateEmployee(selectedEmployee.id, {
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
        });
        toast.success("Data pegawai berhasil diperbarui");
      }
      setFormOpen(false);
      fetchEmployees();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Gagal menyimpan data pegawai",
      );
    } finally {
      setFormLoading(false);
    }
  };

  // ── Password ─────────────────────────────────────────────────────

  const openPasswordForm = (employee) => {
    setSelectedEmployee(employee);
    setPwForm(EMPTY_PW_FORM);
    setPwErrors({});
    setPasswordFormOpen(true);
  };

  const validatePw = () => {
    const errors = {};
    if (!pwForm.password) errors.password = "Password wajib diisi";
    else if (pwForm.password.length < 8)
      errors.password = "Password minimal 8 karakter";
    if (pwForm.password !== pwForm.password_confirmation)
      errors.password_confirmation = "Konfirmasi password tidak cocok";
    return errors;
  };

  const handlePasswordSubmit = async () => {
    const errors = validatePw();
    if (Object.keys(errors).length > 0) {
      setPwErrors(errors);
      return;
    }

    setPwLoading(true);
    try {
      await ownerService.updateEmployeePassword(selectedEmployee.id, {
        password: pwForm.password,
        password_confirmation: pwForm.password_confirmation,
      });
      toast.success("Password pegawai berhasil diubah");
      setPasswordFormOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal mengubah password");
    } finally {
      setPwLoading(false);
    }
  };

  // ── Deactivate ───────────────────────────────────────────────────

  const openDeactivate = (employee) => {
    setSelectedEmployee(employee);
    setDeactivateReason("");
    setDeactivateOpen(true);
  };

  const handleDeactivateConfirm = async () => {
    if (!deactivateReason.trim()) {
      toast.warning("Alasan penonaktifan wajib diisi");
      return;
    }
    setDeactivateLoading(true);
    try {
      await ownerService.deactivateEmployee(selectedEmployee.id, {
        reason: deactivateReason,
      });
      toast.success(`Pegawai ${selectedEmployee.name} berhasil dinonaktifkan`);
      setDeactivateOpen(false);
      fetchEmployees();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Gagal menonaktifkan pegawai",
      );
    } finally {
      setDeactivateLoading(false);
    }
  };

  // ── Reactivate ───────────────────────────────────────────────────

  const openReactivate = (employee) => {
    setSelectedEmployee(employee);
    setReactivateOpen(true);
  };

  const handleReactivateConfirm = async () => {
    setReactivateLoading(true);
    try {
      await ownerService.reactivateEmployee(selectedEmployee.id);
      toast.success(
        `Pegawai ${selectedEmployee.name} berhasil diaktifkan kembali`,
      );
      setReactivateOpen(false);
      fetchEmployees();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal mengaktifkan pegawai");
    } finally {
      setReactivateLoading(false);
    }
  };

  // ── Column Definitions ───────────────────────────────────────────

  const baseColumns = [
    { key: "name", header: "Nama" },
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
    { key: "phone", header: "No. HP" },
    {
      key: "created_at",
      header: "Bergabung",
      render: (row) => formatDate(row.created_at),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  const deactivatedColumns = [
    ...baseColumns,
    {
      key: "deactivated_reason",
      header: "Alasan",
      render: (row) => row.deactivated_reason || "-",
    },
  ];

  // ── Render ───────────────────────────────────────────────────────

  const currentData =
    activeTab === "active" ? activeEmployees : deactivatedEmployees;
  const currentColumns =
    activeTab === "active" ? baseColumns : deactivatedColumns;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Manajemen Pegawai
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola akun, status, dan data pegawai.
          </p>
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <UserPlus className="size-4" />
          {/* Tambah Pegawai */}
        </Button>
      </div>

      {/* Tabs */}
      <TabsNav
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-6"
        items={[
          { value: "active", label: "Aktif", badge: activeEmployees.length },
          {
            value: "deactivated",
            label: "Nonaktif",
            badge: deactivatedEmployees.length,
          },
        ]}
      />

      {/* Table */}
      <DataTable
        columns={currentColumns}
        data={currentData}
        loading={loading}
        emptyMessage={
          activeTab === "active"
            ? "Belum ada pegawai aktif"
            : "Tidak ada pegawai yang dinonaktifkan"
        }
        getRowActions={(row) => {
          if (activeTab === "active")
            return [
              { label: "Edit Data", onClick: () => openEdit(row) },
              {
                label: "Ubah Password",
                onClick: () => openPasswordForm(row),
              },
              {
                label: "Nonaktifkan",
                variant: "danger",
                onClick: () => openDeactivate(row),
              },
            ];
          if (activeTab === "deactivated")
            return [
              {
                label: "Aktifkan",
                onClick: () => openReactivate(row),
              },
            ];
          return [];
        }}
      />

      {/* ── Create / Edit Dialog ─────────────────────────────────── */}
      <FormDialog
        open={formOpen}
        onClose={() => !formLoading && setFormOpen(false)}
        title={formMode === "create" ? "Tambah Pegawai" : "Edit Data Pegawai"}
        description={
          formMode === "create"
            ? "Isi data berikut untuk membuat akun pegawai baru."
            : `Edit data untuk ${selectedEmployee?.name}.`
        }
        onSubmit={handleFormSubmit}
        submitLabel={formMode === "create" ? "Tambah" : "Simpan"}
        loading={formLoading}
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Nama</label>
            <Input
              value={form.name}
              onChange={setFormField("name")}
              placeholder="Nama lengkap"
              disabled={formLoading}
            />
            {formErrors.name && (
              <p className="mt-1 text-xs text-destructive">{formErrors.name}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <Input
              type="email"
              value={form.email}
              onChange={setFormField("email")}
              placeholder="nama@email.com"
              disabled={formLoading}
            />
            {formErrors.email && (
              <p className="mt-1 text-xs text-destructive">
                {formErrors.email}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">No. HP</label>
            <Input
              value={form.phone}
              onChange={setFormField("phone")}
              placeholder="08xxxxxxxxxx"
              disabled={formLoading}
            />
            {formErrors.phone && (
              <p className="mt-1 text-xs text-destructive">
                {formErrors.phone}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Alamat</label>
            <Textarea
              value={form.address}
              onChange={setFormField("address")}
              placeholder="Alamat lengkap"
              disabled={formLoading}
              rows={3}
            />
            {formErrors.address && (
              <p className="mt-1 text-xs text-destructive">
                {formErrors.address}
              </p>
            )}
          </div>

          {formMode === "create" && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Password
                </label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={setFormField("password")}
                  placeholder="Minimal 8 karakter"
                  disabled={formLoading}
                />
                {formErrors.password && (
                  <p className="mt-1 text-xs text-destructive">
                    {formErrors.password}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Konfirmasi Password
                </label>
                <Input
                  type="password"
                  value={form.password_confirmation}
                  onChange={setFormField("password_confirmation")}
                  placeholder="Ulangi password"
                  disabled={formLoading}
                />
                {formErrors.password_confirmation && (
                  <p className="mt-1 text-xs text-destructive">
                    {formErrors.password_confirmation}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </FormDialog>

      {/* ── Password Dialog ──────────────────────────────────────── */}
      <FormDialog
        open={passwordFormOpen}
        onClose={() => !pwLoading && setPasswordFormOpen(false)}
        title={`Ubah Password ${selectedEmployee?.name ?? ""}`}
        description="Password baru akan segera berlaku. Semua sesi aktif pegawai akan diakhiri."
        onSubmit={handlePasswordSubmit}
        submitLabel="Simpan"
        loading={pwLoading}
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Password Baru
            </label>
            <Input
              type="password"
              value={pwForm.password}
              onChange={setPwField("password")}
              placeholder="Minimal 8 karakter"
              disabled={pwLoading}
            />
            {pwErrors.password && (
              <p className="mt-1 text-xs text-destructive">
                {pwErrors.password}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Konfirmasi Password
            </label>
            <Input
              type="password"
              value={pwForm.password_confirmation}
              onChange={setPwField("password_confirmation")}
              placeholder="Ulangi password baru"
              disabled={pwLoading}
            />
            {pwErrors.password_confirmation && (
              <p className="mt-1 text-xs text-destructive">
                {pwErrors.password_confirmation}
              </p>
            )}
          </div>
        </div>
      </FormDialog>

      {/* ── Deactivate Dialog ────────────────────────────────────── */}
      <ConfirmDialog
        open={deactivateOpen}
        onClose={() => !deactivateLoading && setDeactivateOpen(false)}
        onConfirm={handleDeactivateConfirm}
        variant="destructive"
        title="Nonaktifkan Pegawai"
        description={`Akun ${selectedEmployee?.name} akan dinonaktifkan. Data tetap tersimpan dan dapat dipulihkan.`}
        confirmLabel="Nonaktifkan"
        cancelLabel="Batal"
        loading={deactivateLoading}
        inputLabel="Alasan Penonaktifan"
        inputValue={deactivateReason}
        onInputChange={(e) => setDeactivateReason(e.target.value)}
      />

      {/* ── Reactivate Dialog ────────────────────────────────────── */}
      <ConfirmDialog
        open={reactivateOpen}
        onClose={() => !reactivateLoading && setReactivateOpen(false)}
        onConfirm={handleReactivateConfirm}
        variant="default"
        title="Aktifkan Kembali"
        description={`Aktifkan kembali akun ${selectedEmployee?.name}?`}
        confirmLabel="Aktifkan"
        cancelLabel="Batal"
        loading={reactivateLoading}
      />
    </div>
  );
};

export default EmployeeManagement;
