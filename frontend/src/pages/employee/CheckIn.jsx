// File: src/pages/employee/CheckIn.jsx

import { useState, useEffect, useCallback } from "react";
import { UserCircle, RefreshCw } from "lucide-react";
import employeeService from "../../services/employeeService";
import QRScanner from "../../components/employee/QRScanner";
import FormDialog from "../../components/common/FormDialog";
import { formatDateTime, formatCurrency } from "../../utils/utils";
import { useToast } from "@/hooks/useToast";
import { TabsNav } from "@/components/common/TabsNav";
import { SearchModal } from "@/components/common/SearchModal";
import { Button } from "@/components/common/Button";
import { Label } from "@/components/common/FormLabel";
import { Input } from "@/components/common/FormInput";
import { Textarea } from "@/components/common/FormTextarea";
import { StatusBadge } from "@/components/common/StatusBadge";

// ===== HELPERS =====

const MemberCard = ({ member }) => (
  <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1.5 text-sm">
    <p className="font-semibold text-foreground text-base">{member.name}</p>
    <p className="text-muted-foreground">
      Member ID: <span className="text-foreground">{member.member_id}</span>
    </p>
    <p className="text-muted-foreground">
      Tier: <span className="text-foreground">{member.tier}</span>
    </p>
    <p className="text-muted-foreground">
      Total Poin: <span className="text-foreground">{member.total_points}</span>
    </p>
    <p className="text-muted-foreground">
      No. HP: <span className="text-foreground">{member.phone}</span>
    </p>
  </div>
);

const NotesField = ({ value, onChange }) => (
  <div className="grid gap-1.5">
    <Label>Catatan (opsional)</Label>
    <Textarea
      rows={2}
      value={value}
      onChange={onChange}
      placeholder="Catatan tambahan..."
    />
  </div>
);

// ===== COMPONENT =====

const TAB_ITEMS = [
  { value: "manual", label: "Cari Manual" },
  { value: "scan", label: "Scan QR" },
  { value: "tamu", label: "Tamu" },
];

const CheckIn = ({ onNavigateToAddOrder }) => {
  // ===== SHARED STATE =====
  const [activeTab, setActiveTab] = useState("manual"); // 'manual' | 'scan' | 'tamu'
  const [notes, setNotes] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const toast = useToast();

  // ===== MANUAL TAB STATE =====
  const [selectedMember, setSelectedMember] = useState(null);

  // ===== SCAN TAB STATE =====
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // ===== GUEST TAB STATE =====
  const [guestName, setGuestName] = useState("");
  const [guestNotes, setGuestNotes] = useState("");
  const [depositAmount, setDepositAmount] = useState(0);
  const [depositLoading, setDepositLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);

  // Reset scan state when switching tabs; fetch deposit on first tamu open
  useEffect(() => {
    if (activeTab === "manual") {
      setScanResult(null);
      setScanError(null);
      setShowScanner(false);
      setNotes("");
    } else if (activeTab === "scan") {
      setShowScanner(true);
    } else if (activeTab === "tamu" && depositAmount === 0) {
      setDepositLoading(true);
      employeeService
        .getGuestConfig()
        .then((res) => {
          if (res.success) setDepositAmount(res.data.deposit_amount);
        })
        .catch(() => toast.error("Gagal memuat konfigurasi deposit"))
        .finally(() => setDepositLoading(false));
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ===== MANUAL HANDLERS =====

  const handleSearchMember = useCallback(async (query) => {
    if (!query.trim()) return [];
    const res = await employeeService.searchMember(query);
    return res.data.members;
  }, []);

  const handleSelectMember = (member) => {
    setSelectedMember(member);
  };

  const handleClearSelection = () => {
    setSelectedMember(null);
    setNotes("");
  };

  // ===== SCAN HANDLERS =====
  const handleScanSuccess = async (decodedText) => {
    let parsed;
    try {
      parsed = JSON.parse(decodedText);
    } catch {
      setScanError("QR Code tidak valid — format JSON tidak dikenali.");
      setShowScanner(false);
      return;
    }

    if (parsed.type !== "member") {
      setScanError("QR Code bukan milik member.");
      setShowScanner(false);
      return;
    }

    // Valid QR — resolve via backend
    setShowScanner(false);
    setResolveLoading(true);
    setScanError(null);

    try {
      const res = await employeeService.resolveQR({
        qr_hash: parsed.qr_hash,
        member_id: parsed.member_id,
      });

      if (res.success) {
        setScanResult(res.data);
      } else {
        setScanError(res.message || "Gagal memverifikasi QR Code.");
      }
    } catch (err) {
      setScanError(
        err?.response?.data?.message || "Gagal memverifikasi QR Code.",
      );
    } finally {
      setResolveLoading(false);
    }
  };

  const handleScanError = (errorMsg) => {
    setScanError(errorMsg);
    setShowScanner(false);
  };

  const handleRescan = () => {
    setScanResult(null);
    setScanError(null);
    setNotes("");
    setShowScanner(true);
  };

  // ===== CHECK-IN (member — both tabs) =====
  const handleCheckIn = async (memberId) => {
    setSubmitLoading(true);
    try {
      const res = await employeeService.checkInMember({
        type: "member",
        member_id: memberId,
        notes: notes || null,
      });

      if (res.success) {
        setSuccessData({
          name: res.data.arrival.member.name,
          tier: res.data.arrival.member.tier,
          id: res.data.arrival.member.id,
          arrivalId: res.data.arrival.id,
          isGuest: false,
        });

        if (activeTab === "manual") {
          handleClearSelection();
        } else {
          setScanResult(null);
          setScanError(null);
          setNotes("");
          setShowScanner(true);
        }
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal melakukan registrasi");
    } finally {
      setSubmitLoading(false);
    }
  };

  // ===== CHECK-IN (guest) =====
  const handleGuestCheckIn = async () => {
    setGuestLoading(true);
    try {
      const res = await employeeService.checkInMember({
        type: "guest",
        guest_name: guestName.trim(),
        notes: guestNotes || null,
      });

      if (res.success) {
        setSuccessData({
          name: res.data.arrival.guest_name,
          deposit: res.data.arrival.deposit_amount,
          arrivalId: res.data.arrival.id,
          isGuest: true,
        });
        setGuestName("");
        setGuestNotes("");
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Gagal melakukan registrasi tamu",
      );
    } finally {
      setGuestLoading(false);
    }
  };

  // ===== RENDER =====
  return (
    <div className="space-y-6">
      {/* Success Dialog */}
      <FormDialog
        open={!!successData}
        onClose={() => setSuccessData(null)}
        title="Registrasi Berhasil"
        size="sm"
      >
        <div className="space-y-4">
          {successData?.isGuest ? (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Tamu{" "}
                <span className="font-semibold text-foreground">
                  {successData?.name}
                </span>{" "}
                telah berhasil registrasi.
              </p>
              <p className="text-sm text-muted-foreground">
                Deposit:{" "}
                <span className="font-semibold text-foreground">
                  {formatCurrency(successData?.deposit)}
                </span>
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Member{" "}
              <span className="font-semibold text-foreground">
                {successData?.name}
              </span>{" "}
              ({successData?.tier}) telah berhasil registrasi.
            </p>
          )}
          <div className="flex gap-2 justify-center sm:justify-end">
            <Button variant="outline" onClick={() => setSuccessData(null)}>
              Tutup
            </Button>
            <Button
              onClick={() => {
                setSuccessData(null);
                onNavigateToAddOrder?.(successData?.arrivalId);
              }}
            >
              Tambah Pesanan
            </Button>
          </div>
        </div>
      </FormDialog>

      {/* Tab Navigation */}
      <TabsNav
        items={TAB_ITEMS}
        value={activeTab}
        onValueChange={setActiveTab}
      />

      {/* ===== MANUAL TAB ===== */}
      {activeTab === "manual" && (
        <div className="space-y-4">
          {/* Member Picker — empty state */}
          {!selectedMember && (
            <SearchModal
              triggerContent={
                <button className="w-full rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-colors p-6 flex flex-col items-center gap-2 text-muted-foreground">
                  <UserCircle className="w-8 h-8" />
                  <span className="text-sm font-medium">
                    Cari member yang belum registrasi
                  </span>
                  <span className="text-xs">Klik untuk mencari</span>
                </button>
              }
              placeholder="Cari nama / nomor HP / member ID..."
              title="Cari Member"
              emptyMessage="Member tidak ditemukan"
              onSearch={handleSearchMember}
              onSelect={handleSelectMember}
              getItemKey={(item) => item.id}
              renderItem={(item) => (
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {item.name}
                    </span>
                    <StatusBadge status={item.tier?.toLowerCase()} />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {item.member_id} · {item.phone} · {item.total_points} poin
                  </span>
                </div>
              )}
            />
          )}

          {/* Member Picker — filled state */}
          {selectedMember && (
            <div className="rounded-lg border border-border border-l-4 border-l-primary bg-muted/30 p-4">
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{selectedMember.name}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={handleClearSelection}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Member ID
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {selectedMember.member_id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tier</span>
                    <StatusBadge status={selectedMember.tier?.toLowerCase()} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total Poin
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {selectedMember.total_points}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      No. HP
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {selectedMember.phone}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notes + submit — only when member selected */}
          {selectedMember && (
            <section className="space-y-4">
              <NotesField
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Button
                loading={submitLoading}
                fullWidth
                onClick={() => handleCheckIn(selectedMember.id)}
              >
                Registrasi Sekarang
              </Button>
            </section>
          )}
        </div>
      )}

      {/* ===== SCAN TAB ===== */}
      {activeTab === "scan" && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Scan QR Code Member
          </h2>

          {/* Scanner active */}
          {showScanner && !scanResult && !scanError && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Arahkan kamera ke QR Code member...
              </p>
              <QRScanner
                onScanSuccess={handleScanSuccess}
                onScanError={handleScanError}
              />
            </div>
          )}

          {/* Resolving loading */}
          {resolveLoading && (
            <p className="text-sm text-muted-foreground">
              Memverifikasi QR Code...
            </p>
          )}

          {/* Scan Error */}
          {scanError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 space-y-2">
              <p className="text-destructive font-medium text-sm">
                {scanError}
              </p>
              <Button variant="outline" size="sm" onClick={handleRescan}>
                Scan Ulang
              </Button>
            </div>
          )}

          {/* Scan Result — Member Preview */}
          {scanResult && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-foreground">
                Data Member
              </h3>
              <MemberCard member={scanResult} />

              {scanResult.active_arrival?.exists ? (
                <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 space-y-2">
                  <p className="text-yellow-600 font-medium text-sm">
                    Member sedang aktif, registrasi pukul{" "}
                    {formatDateTime(scanResult.active_arrival.check_in_at)}
                  </p>
                  <div className="flex gap-2">
                    <Button disabled>Registrasi (Tidak Tersedia)</Button>
                    <Button variant="outline" onClick={handleRescan}>
                      Scan Ulang
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <NotesField
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      loading={submitLoading}
                      onClick={() => handleCheckIn(scanResult.id)}
                    >
                      Konfirmasi Registrasi
                    </Button>
                    <Button variant="outline" onClick={handleRescan}>
                      Scan Ulang
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ===== TAMU TAB ===== */}
      {activeTab === "tamu" && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Registrasi Tamu
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Isi nama pengunjung dan konfirmasi deposit sebelum registrasi
            </p>
          </div>

          {/* Guest Name */}
          <div className="grid gap-1.5">
            <Label>Nama Tamu</Label>
            <Input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Masukkan nama pengunjung..."
            />
          </div>

          {/* Deposit */}
          <div className="grid gap-1.5">
            <Label>Deposit</Label>
            {depositLoading ? (
              <div className="h-9 animate-pulse rounded-md bg-muted/40" />
            ) : (
              <Input
                value={formatCurrency(depositAmount)}
                readOnly
                disabled
                className="cursor-not-allowed"
              />
            )}
            <p className="text-xs text-muted-foreground">
              Nominal sesuai konfigurasi owner
            </p>
          </div>

          {/* Notes */}
          <div className="grid gap-1.5">
            <Label>Catatan (opsional)</Label>
            <Textarea
              rows={2}
              value={guestNotes}
              onChange={(e) => setGuestNotes(e.target.value)}
              placeholder="Catatan tambahan..."
            />
          </div>

          <Button
            fullWidth
            loading={guestLoading}
            disabled={!guestName.trim() || guestLoading}
            onClick={handleGuestCheckIn}
          >
            Registrasi Tamu
          </Button>
        </div>
      )}
    </div>
  );
};

export default CheckIn;
