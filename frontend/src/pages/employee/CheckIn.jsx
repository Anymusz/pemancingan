// File: src/pages/employee/CheckIn.jsx

import { useState, useEffect, useCallback } from "react";
import employeeService from "../../services/employeeService";
import QRScanner from "../../components/employee/QRScanner";
import FormDialog from "../../components/common/FormDialog";
import { formatDateTime } from "../../utils/utils";
import { useToast } from "@/hooks/useToast";
import { TabsNav } from "@/components/common/TabsNav";
import { SearchModal } from "@/components/common/SearchModal";
import { Button } from "@/components/common/Button";
import { Label } from "@/components/common/FormLabel";
import { Textarea } from "@/components/common/FormTextarea";

// ==================== HELPERS ====================

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

// ==================== COMPONENT ====================

const TAB_ITEMS = [
  { value: "manual", label: "🔍 Cari Manual" },
  { value: "scan", label: "📷 Scan QR" },
];

const CheckIn = ({ onNavigateToAddOrder }) => {
  // ==================== SHARED STATE ====================
  const [activeTab, setActiveTab] = useState("manual"); // 'manual' | 'scan'
  const [notes, setNotes] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const toast = useToast();

  // ==================== MANUAL TAB STATE ====================
  const [selectedMember, setSelectedMember] = useState(null);

  // ==================== SCAN TAB STATE ====================
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Reset scan state when switching to manual tab
  useEffect(() => {
    if (activeTab === "manual") {
      setScanResult(null);
      setScanError(null);
      setShowScanner(false);
      setNotes("");
    } else {
      // Switching to scan tab — activate scanner
      setShowScanner(true);
    }
  }, [activeTab]);

  // ==================== MANUAL HANDLERS ====================

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

  // ==================== SCAN HANDLERS ====================
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

  // ==================== CHECK-IN (shared for both tabs) ====================
  const handleCheckIn = async (memberId) => {
    setSubmitLoading(true);
    try {
      const res = await employeeService.checkInMember({
        member_id: memberId,
        notes: notes || null,
      });

      if (res.success) {
        setSuccessData({
          name: res.data.arrival.member.name,
          tier: res.data.arrival.member.tier,
          id: res.data.arrival.member.id,
          arrival_id: res.data.arrival.id,
        });

        // Reset based on active tab
        if (activeTab === "manual") {
          handleClearSelection();
        } else {
          // Reset scan state and reactivate scanner
          setScanResult(null);
          setScanError(null);
          setNotes("");
          setShowScanner(true);
        }
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal melakukan check-in");
    } finally {
      setSubmitLoading(false);
    }
  };

  // ==================== RENDER ====================
  return (
    <div className="space-y-6">
      {/* Success Dialog */}
      <FormDialog
        open={!!successData}
        onClose={() => setSuccessData(null)}
        title="Check-in Berhasil"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Member{" "}
            <span className="font-semibold text-foreground">
              {successData?.name}
            </span>{" "}
            ({successData?.tier}) telah berhasil check-in.
          </p>
          <div className="flex gap-2 justify-center sm:justify-end">
            <Button variant="outline" onClick={() => setSuccessData(null)}>
              Tutup
            </Button>
            <Button
              onClick={() => {
                setSuccessData(null);
                onNavigateToAddOrder?.(successData?.arrival_id);
              }}
            >
              Tambah Pesanan
            </Button>
          </div>
        </div>
      </FormDialog>

      <h1 className="text-2xl font-bold text-foreground">Check-in Member</h1>

      {/* Tab Navigation */}
      <TabsNav
        items={TAB_ITEMS}
        value={activeTab}
        onValueChange={setActiveTab}
      />

      {/* ===== MANUAL TAB ===== */}
      {activeTab === "manual" && (
        <div className="space-y-4">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Cari Member
            </h2>
            <SearchModal
              triggerLabel="Cari Member"
              placeholder="Cari nama / nomor HP / member ID..."
              title="Cari Member"
              emptyMessage="Member tidak ditemukan"
              onSearch={handleSearchMember}
              onSelect={handleSelectMember}
              getItemKey={(item) => item.id}
              disabled={!!selectedMember}
              renderItem={(item) => (
                <div>
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.member_id} · Tier {item.tier} · {item.phone}
                  </p>
                </div>
              )}
            />
            {selectedMember && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSelection}
              >
                Ganti Member
              </Button>
            )}
          </section>

          {/* Member Preview */}
          {selectedMember && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Data Member
              </h2>
              <MemberCard member={selectedMember} />
              <NotesField
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Button
                loading={submitLoading}
                fullWidth
                onClick={() => handleCheckIn(selectedMember.id)}
              >
                Check-in Sekarang
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
                🔄 Scan Ulang
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
                    ⚠️ Member sedang aktif, check-in pukul{" "}
                    {formatDateTime(scanResult.active_arrival.check_in_at)}
                  </p>
                  <div className="flex gap-2">
                    <Button disabled>Check-in (Tidak Tersedia)</Button>
                    <Button variant="outline" onClick={handleRescan}>
                      🔄 Scan Ulang
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
                      ✅ Konfirmasi Check-in
                    </Button>
                    <Button variant="outline" onClick={handleRescan}>
                      🔄 Scan Ulang
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default CheckIn;
