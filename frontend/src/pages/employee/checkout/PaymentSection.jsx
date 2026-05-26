// File: src/pages/employee/checkout/PaymentSection.jsx

import {
  Banknote,
  ArrowLeftRight,
  Smartphone,
  Upload,
  X,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/FormInput";
import { Label } from "@/components/common/FormLabel";
import { Textarea } from "@/components/common/FormTextarea";
import ImageLightbox from "@/components/common/ImageLightbox";
import { formatCurrency } from "@/utils/utils";
import { useState, useEffect, useRef } from "react";

const PAYMENT_OPTIONS = [
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "transfer", label: "Transfer", icon: ArrowLeftRight },
  { value: "qris", label: "QRIS", icon: Smartphone },
];

/**
 * Props:
 *   paymentMethod
 *   onPaymentMethodChange
 *   tips
 *   onTipsChange
 *   notes
 *   onNotesChange
 *   onSubmit
 *   loading
 *   isSubmitDisabled
 *   isFullyCoveredByDeposit
 *   qrisImageUrl
 *   paymentProof           — File | null
 *   onPaymentProofChange   — (file: File | null) => void
 *   finalAmountAfterDeposit — number
 */
export function PaymentSection({
  paymentMethod,
  onPaymentMethodChange,
  tips,
  onTipsChange,
  notes,
  onNotesChange,
  onSubmit,
  loading,
  isSubmitDisabled,
  isFullyCoveredByDeposit = false,
  qrisImageUrl = null,
  paymentProof = null,
  onPaymentProofChange,
  finalAmountAfterDeposit = 0,
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [proofLightboxOpen, setProofLightboxOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!paymentProof) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(paymentProof);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [paymentProof]);

  const showProofUpload =
    !isFullyCoveredByDeposit &&
    (paymentMethod === "transfer" || paymentMethod === "qris");

  return (
    <>
      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
        <h2 className="text-sm font-semibold text-foreground mb-4">
          Pembayaran
        </h2>

        {/* Payment Method Cards */}
        <div className="flex flex-col gap-1.5">
          <Label>Metode Pembayaran {!isFullyCoveredByDeposit && "*"}</Label>
          {isFullyCoveredByDeposit ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700">
              Total telah tertutup oleh deposit. Tidak ada pembayaran tambahan.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_OPTIONS.map((method) => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.value;
                return (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => onPaymentMethodChange(method.value)}
                    className={`rounded-lg border p-3 cursor-pointer text-center transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/40"
                    }`}
                  >
                    <Icon className="h-5 w-5 mx-auto mb-1" />
                    <span className="text-sm font-medium">{method.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* QRIS Image */}
        {!isFullyCoveredByDeposit && paymentMethod === "qris" && (
          <div className="space-y-1.5">
            {qrisImageUrl ? (
              <>
                <img
                  src={qrisImageUrl}
                  alt="QRIS"
                  className="max-h-32 object-contain rounded-lg border border-border cursor-zoom-in"
                  onClick={() => setLightboxOpen(true)}
                />
                <p className="text-xs text-muted-foreground">
                  Tunjukkan QR ini ke member
                </p>
              </>
            ) : (
              <p className="text-xs text-amber-600">
                QRIS belum dikonfigurasi. Hubungi owner.
              </p>
            )}
          </div>
        )}

        {/* Payment Proof Upload */}
        {showProofUpload && (
          <div className="flex flex-col gap-1.5">
            <Label>Bukti Pembayaran *</Label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                onPaymentProofChange(e.target.files?.[0] ?? null)
              }
            />

            {!paymentProof ? (
              <div
                className="rounded-lg border-2 border-dashed border-border p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-6 h-6 mx-auto mb-1 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Klik untuk upload bukti pembayaran
                </p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, WebP — maks. 5MB
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <img
                  src={previewUrl}
                  alt="Bukti pembayaran"
                  className="w-full max-h-48 object-contain rounded-lg border border-border cursor-zoom-in"
                  onClick={() => setProofLightboxOpen(true)}
                />

                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Ganti
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-destructive hover:text-destructive"
                    onClick={() => {
                      onPaymentProofChange(null);
                      fileInputRef.current.value = "";
                    }}
                  >
                    <X className="w-3.5 h-3.5" />
                    Hapus
                  </Button>
                </div>

                <div className="rounded-lg bg-muted/50 border border-border p-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Metode</span>
                    <span className="font-medium text-foreground">
                      {paymentMethod.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Total Tagihan</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(finalAmountAfterDeposit)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium text-success">
                      Bukti terlampir
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tips */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tips">Tips (Rp) — Opsional</Label>
          <Input
            id="tips"
            type="number"
            min="0"
            value={tips}
            onChange={onTipsChange}
            placeholder="0"
          />
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes">Catatan — Opsional</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={onNotesChange}
            rows={2}
          />
        </div>
      </div>

      {/* Lightbox QRIS */}
      <ImageLightbox
        open={lightboxOpen}
        src={qrisImageUrl}
        alt="QRIS"
        onClose={() => setLightboxOpen(false)}
      />

      {/* Lightbox Bukti Pembayaran */}
      <ImageLightbox
        open={proofLightboxOpen}
        src={previewUrl}
        alt="Bukti pembayaran"
        onClose={() => setProofLightboxOpen(false)}
      />

      {/* Submit */}
      <Button
        onClick={onSubmit}
        disabled={isSubmitDisabled}
        loading={loading}
        fullWidth
      >
        {loading ? "Memproses..." : "Proses Pembayaran"}
      </Button>
    </>
  );
}
