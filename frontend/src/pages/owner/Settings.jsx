// File: src/pages/owner/Settings.jsx

import { useState, useEffect, useCallback, useRef } from "react";
import ownerService from "../../services/ownerService";
import { useToast } from "@/hooks/useToast";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import ImageLightbox from "@/components/common/ImageLightbox";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/FormInput";
import { Label } from "@/components/common/FormLabel";
import { ImageOff } from "lucide-react";
import { formatCurrency } from "@/utils/utils";

const Settings = () => {
  // ==================== QRIS STATE ====================
  const [qrisImageUrl, setQrisImageUrl] = useState(null);
  const [qrisFile, setQrisFile] = useState(null);
  const [qrisPreview, setQrisPreview] = useState(null);
  const [qrisLoading, setQrisLoading] = useState(false);
  const [qrisSaving, setQrisSaving] = useState(false);
  const [qrisConfirmOpen, setQrisConfirmOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const qrisFileInputRef = useRef(null);

  // ==================== DEPOSIT STATE ====================
  const [depositAmount, setDepositAmount] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositSaving, setDepositSaving] = useState(false);
  const [depositConfirmOpen, setDepositConfirmOpen] = useState(false);

  const toast = useToast();

  // ==================== FETCH ====================

  const fetchQrisConfig = useCallback(async () => {
    setQrisLoading(true);
    try {
      const res = await ownerService.getQrisConfig();
      if (res.success && res.data) {
        setQrisImageUrl(res.data.image_url ?? null);
      }
    } catch {
      toast.error("Gagal memuat konfigurasi QRIS");
    } finally {
      setQrisLoading(false);
    }
  }, [toast]);

  const fetchGuestConfig = useCallback(async () => {
    setDepositLoading(true);
    try {
      const res = await ownerService.getGuestConfig();
      if (res.success && res.data) {
        setDepositAmount(res.data.deposit_amount ?? "");
      }
    } catch {
      toast.error("Gagal memuat konfigurasi deposit tamu");
    } finally {
      setDepositLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchQrisConfig();
    fetchGuestConfig();
  }, [fetchQrisConfig, fetchGuestConfig]);

  // Revoke blob URL on unmount
  useEffect(() => {
    return () => {
      if (qrisPreview && qrisPreview.startsWith("blob:")) {
        URL.revokeObjectURL(qrisPreview);
      }
    };
  }, [qrisPreview]);

  // ==================== QRIS HANDLERS ====================

  const handleQrisFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran gambar maksimal 2 MB");
      return;
    }
    // Revoke previous preview
    if (qrisPreview && qrisPreview.startsWith("blob:")) {
      URL.revokeObjectURL(qrisPreview);
    }
    setQrisFile(file);
    setQrisPreview(URL.createObjectURL(file));
  };

  const handleSaveQris = async () => {
    if (!qrisFile) return;
    setQrisSaving(true);
    try {
      const formData = new FormData();
      formData.append("image", qrisFile);
      const res = await ownerService.updateQrisConfig(formData);
      if (res.success) {
        toast.success("QRIS berhasil diperbarui");
        setQrisImageUrl(res.data.image_url ?? null);
        // Revoke preview and reset file selection
        if (qrisPreview && qrisPreview.startsWith("blob:")) {
          URL.revokeObjectURL(qrisPreview);
        }
        setQrisPreview(null);
        setQrisFile(null);
        if (qrisFileInputRef.current) qrisFileInputRef.current.value = "";
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal menyimpan QRIS");
    } finally {
      setQrisSaving(false);
      setQrisConfirmOpen(false);
    }
  };

  // ==================== DEPOSIT HANDLERS ====================

  const handleSaveDeposit = async () => {
    setDepositSaving(true);
    try {
      await ownerService.updateGuestConfig({
        deposit_amount: Number(depositAmount),
      });
      toast.success("Konfigurasi deposit tamu berhasil disimpan");
      fetchGuestConfig();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Gagal menyimpan konfigurasi deposit",
      );
    } finally {
      setDepositSaving(false);
      setDepositConfirmOpen(false);
    }
  };

  // The image to display in the QRIS preview area
  const displaySrc = qrisPreview ?? qrisImageUrl;

  // ==================== RENDER ====================
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Pengaturan Sistem</h1>

      {/* ===== SECTION 1: Konfigurasi QRIS ===== */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">
          Konfigurasi QRIS
        </h2>

        {qrisLoading ? (
          <p className="text-sm text-muted-foreground">Memuat konfigurasi...</p>
        ) : (
          <>
            {/* Image preview */}
            {displaySrc ? (
              <div className="relative inline-block">
                <img
                  src={displaySrc}
                  alt="QRIS"
                  className="w-48 h-48 object-contain rounded-lg border border-border cursor-zoom-in"
                  onClick={() => setLightboxOpen(true)}
                />
                {qrisPreview && (
                  <span className="absolute top-1.5 left-1.5 rounded bg-yellow-500/90 px-1.5 py-0.5 text-[11px] font-medium text-white">
                    Pratinjau
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center w-48 h-48 rounded-lg border border-dashed border-border bg-muted/30">
                <ImageOff className="w-8 h-8 text-muted-foreground/40" />
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Format: JPG, JPEG, PNG · Maks 2 MB
            </p>

            {/* Hidden file input */}
            <input
              ref={qrisFileInputRef}
              type="file"
              accept="image/jpg,image/jpeg,image/png"
              className="hidden"
              onChange={handleQrisFileChange}
            />

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => qrisFileInputRef.current?.click()}
                disabled={qrisSaving}
              >
                Pilih Gambar
              </Button>

              {qrisFile && (
                <Button
                  onClick={() => setQrisConfirmOpen(true)}
                  loading={qrisSaving}
                  disabled={qrisSaving}
                >
                  Simpan QRIS
                </Button>
              )}
            </div>

            <ConfirmDialog
              open={qrisConfirmOpen}
              onClose={() => setQrisConfirmOpen(false)}
              onConfirm={handleSaveQris}
              title="Konfirmasi Simpan QRIS"
              description="Gambar QRIS akan diperbarui. Gambar lama akan dihapus secara permanen. Lanjutkan?"
              confirmLabel="Ya, Simpan"
              cancelLabel="Batal"
              loading={qrisSaving}
            />
          </>
        )}
      </div>

      {/* ===== SECTION 2: Konfigurasi Deposit Tamu ===== */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">
          Konfigurasi Deposit Tamu
        </h2>

        {depositLoading ? (
          <p className="text-sm text-muted-foreground">Memuat konfigurasi...</p>
        ) : (
          <>
            <div className="grid gap-1.5 max-w-xs">
              <Label htmlFor="deposit_amount">Nominal Deposit (Rp)</Label>
              <Input
                id="deposit_amount"
                type="number"
                min="0"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Nominal deposit berlaku untuk semua tamu yang telah registrasi
              </p>
            </div>

            <Button
              onClick={() => setDepositConfirmOpen(true)}
              loading={depositSaving}
              disabled={depositSaving}
            >
              Simpan Deposit
            </Button>

            <ConfirmDialog
              open={depositConfirmOpen}
              onClose={() => setDepositConfirmOpen(false)}
              onConfirm={handleSaveDeposit}
              title="Konfirmasi Simpan Deposit"
              description={`Nominal deposit tamu akan diubah menjadi ${formatCurrency(Number(depositAmount) || 0)}. Perubahan berlaku untuk registrasi berikutnya. Lanjutkan?`}
              confirmLabel="Ya, Simpan"
              cancelLabel="Batal"
              loading={depositSaving}
            />
          </>
        )}
      </div>

      {/* Lightbox */}
      <ImageLightbox
        open={lightboxOpen}
        src={displaySrc}
        alt="QRIS"
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
};

export default Settings;
