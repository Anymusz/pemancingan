// File: src/pages/employee/checkout/Checkout.jsx

import { useState, useEffect, useMemo, useCallback } from "react";
import employeeService from "../../../services/employeeService";
import { useToast } from "@/hooks/useToast";
import { formatCurrency } from "@/utils/utils";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { MemberSection } from "./MemberSection";
import { PendingOrderSection } from "./PendingOrderSection";
import { FishSection } from "./FishSection";
import { PenaltySection } from "./PenaltySection";
import { SummarySection } from "./SummarySection";
import { PaymentSection } from "./PaymentSection";

const TIER_DISCOUNT_FALLBACK = 0;

const Checkout = () => {
  // ==================== STATE ====================
  const [arrivals, setArrivals] = useState([]);
  const [fishTypes, setFishTypes] = useState([]);
  const [selectedArrival, setSelectedArrival] = useState(null);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [fishItems, setFishItems] = useState([]);
  const [penaltyItems, setPenaltyItems] = useState([]);
  const [tips, setTips] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [tierUpgradeAlert, setTierUpgradeAlert] = useState(null);
  const [activeVoucher, setActiveVoucher] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const toast = useToast();

  // ==================== KALKULASI ====================
  const subtotalFish = useMemo(
    () => fishItems.reduce((sum, i) => sum + i.subtotal, 0),
    [fishItems],
  );

  const subtotalPending = useMemo(
    () => pendingOrders.reduce((sum, o) => sum + Number(o.subtotal), 0),
    [pendingOrders],
  );

  const subtotalPenalty = useMemo(
    () => penaltyItems.reduce((sum, p) => sum + p.subtotal, 0),
    [penaltyItems],
  );

  const discountTier = useMemo(() => {
    if (!selectedArrival) return 0;
    const pct = selectedArrival.discount_percentage ?? TIER_DISCOUNT_FALLBACK;
    return Math.floor(subtotalFish * (pct / 100));
  }, [subtotalFish, selectedArrival]);

  const totalAmount = useMemo(
    () => subtotalFish + subtotalPending + subtotalPenalty,
    [subtotalFish, subtotalPending, subtotalPenalty],
  );

  const discountVoucher = activeVoucher ? Number(activeVoucher.amount) : 0;

  const finalAmount = useMemo(
    () => Math.max(0, totalAmount - discountTier - discountVoucher),
    [totalAmount, discountTier, discountVoucher],
  );

  // Poin: penalty tidak ikut
  const pointsPreview = useMemo(
    () => Math.floor((totalAmount - subtotalPenalty) / 10000),
    [totalAmount, subtotalPenalty],
  );

  // ==================== HELPERS ====================
  const resetForm = () => {
    setSelectedArrival(null);
    setPendingOrders([]);
    setFishItems([]);
    setPenaltyItems([]);
    setTips(0);
    setPaymentMethod("");
    setNotes("");
    setActiveVoucher(null);
  };

  // ==================== FETCH ====================
  const fetchArrivals = useCallback(async () => {
    setFetchLoading(true);
    try {
      const res = await employeeService.getTodayArrivals();
      if (res.success) {
        setArrivals(res.data.arrivals.filter((a) => a.status === "active"));
      }
    } catch {
      toast.error("Gagal memuat data kedatangan");
    } finally {
      setFetchLoading(false);
    }
  }, [toast]);

  const fetchFishTypes = useCallback(async () => {
    try {
      const res = await employeeService.getFishTypes();
      if (res.success) setFishTypes(res.data);
    } catch {
      toast.error("Gagal memuat data jenis ikan");
    }
  }, [toast]);

  useEffect(() => {
    fetchArrivals();
    fetchFishTypes();
  }, [fetchArrivals, fetchFishTypes]);

  const fetchPendingOrders = async (arrivalId) => {
    setPendingLoading(true);
    try {
      const res = await employeeService.getPendingOrders(arrivalId);
      if (res.success) setPendingOrders(res.data.orders);
    } catch {
      toast.error("Gagal memuat pending orders");
    } finally {
      setPendingLoading(false);
    }
  };

  const fetchMemberVoucher = async (memberId) => {
    try {
      const res = await employeeService.getMemberVoucher(memberId);
      if (res.success) setActiveVoucher(res.data.voucher);
    } catch {
      setActiveVoucher(null);
    }
  };

  // ==================== ARRIVAL HANDLER ====================
  const handlePickArrival = (arrival) => {
    setSelectedArrival(arrival);
    setFishItems([]);
    setPenaltyItems([]);
    setActiveVoucher(null);
    fetchPendingOrders(arrival.arrival_id);
    fetchMemberVoucher(arrival.member_id);
  };

  const handleClearArrival = () => {
    setSelectedArrival(null);
    setPendingOrders([]);
    setFishItems([]);
    setPenaltyItems([]);
    setActiveVoucher(null);
  };

  // ==================== FISH ITEM HANDLERS ====================
  const handleAddFish = ({ fish, quantity }) => {
    const existing = fishItems.find((i) => i.item_id === fish.id);
    if (existing) {
      setFishItems((prev) =>
        prev.map((i) => {
          if (i.item_id === fish.id) {
            const newQty = parseFloat(i.quantity) + quantity;
            return {
              ...i,
              quantity: newQty,
              subtotal: newQty * i.unit_price_snapshot,
            };
          }
          return i;
        }),
      );
    } else {
      setFishItems((prev) => [
        ...prev,
        {
          item_type: "fish",
          item_id: fish.id,
          name: fish.name,
          quantity,
          unit_price_snapshot: parseFloat(fish.price_per_kg),
          subtotal: quantity * parseFloat(fish.price_per_kg),
        },
      ]);
    }
  };

  // ✅ Fixed: id-based instead of index-based
  const handleRemoveFish = (itemId) =>
    setFishItems((prev) => prev.filter((i) => i.item_id !== itemId));

  // ==================== PENALTY HANDLERS ====================
  const handleAddPenalty = (penaltyType) => {
    setPenaltyItems((prev) => {
      const existing = prev.find((p) => p.name === penaltyType.label);
      if (existing) {
        return prev.map((p) =>
          p.name === penaltyType.label
            ? {
                ...p,
                quantity: p.quantity + 1,
                subtotal: (p.quantity + 1) * p.unit_price,
              }
            : p,
        );
      }
      return [
        ...prev,
        {
          name: penaltyType.label,
          quantity: 1,
          unit_price: penaltyType.price,
          subtotal: penaltyType.price,
        },
      ];
    });
  };

  // ✅ Fixed: name-based instead of index-based
  const handleRemovePenalty = (name) =>
    setPenaltyItems((prev) => prev.filter((p) => p.name !== name));

  // ==================== SUBMIT ====================
  const handleSubmit = async () => {
    if (!selectedArrival || !paymentMethod) return;

    const hasAnyItem =
      fishItems.length > 0 ||
      pendingOrders.length > 0 ||
      penaltyItems.length > 0;
    if (!hasAnyItem) {
      toast.error("Tidak ada item untuk di-checkout");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        arrival_id: selectedArrival.arrival_id,
        fish_items: fishItems.map((i) => ({
          item_id: i.item_id,
          quantity: i.quantity,
        })),
        penalty_items: penaltyItems.map((p) => ({
          name: p.name,
          quantity: p.quantity,
          unit_price: p.unit_price,
        })),
        payment_method: paymentMethod,
        tips: Number(tips) || 0,
        notes: notes || null,
      };

      const res = await employeeService.checkout(payload);

      if (res.success) {
        const voucherInfo =
          res.data.transaction.discount_voucher > 0
            ? ` | Voucher digunakan: ${formatCurrency(res.data.transaction.discount_voucher)}`
            : "";
        toast.success(
          `Checkout berhasil! Kode: ${res.data.transaction.transaction_code}${voucherInfo}`,
        );

        if (res.data.tier_upgraded) {
          setTierUpgradeAlert(
            `Selamat! Tier member naik ke ${res.data.new_tier}!`,
          );
          setTimeout(() => setTierUpgradeAlert(null), 6000);
        }
        resetForm();
        fetchArrivals();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal memproses checkout");
    } finally {
      setLoading(false);
    }
  };

  const hasAnyItem =
    fishItems.length > 0 || pendingOrders.length > 0 || penaltyItems.length > 0;
  const isSubmitDisabled =
    !selectedArrival || !paymentMethod || !hasAnyItem || loading;

  // ==================== RENDER ====================
  return (
    <div className="space-y-6 p-1">
      {tierUpgradeAlert && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-600">
          🎉 {tierUpgradeAlert}
        </div>
      )}

      <h1 className="text-2xl font-bold">Checkout Transaksi</h1>

      <MemberSection
        fetchLoading={fetchLoading}
        selectedArrival={selectedArrival}
        arrivals={arrivals}
        onSelect={handlePickArrival}
        onClear={handleClearArrival}
      />

      <PendingOrderSection
        pendingLoading={pendingLoading}
        selectedArrival={selectedArrival}
        pendingOrders={pendingOrders}
      />

      <FishSection
        fishTypes={fishTypes}
        fishItems={fishItems}
        onAdd={handleAddFish}
        onRemove={handleRemoveFish}
      />

      <PenaltySection
        penaltyItems={penaltyItems}
        onAdd={handleAddPenalty}
        onRemove={handleRemovePenalty}
      />

      <SummarySection
        subtotalFish={subtotalFish}
        subtotalPending={subtotalPending}
        subtotalPenalty={subtotalPenalty}
        discountTier={discountTier}
        discountPercentage={selectedArrival?.discount_percentage}
        activeVoucher={activeVoucher}
        finalAmount={finalAmount}
        pointsPreview={pointsPreview}
      />

      <PaymentSection
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        tips={tips}
        onTipsChange={(e) => setTips(e.target.value)}
        notes={notes}
        onNotesChange={(e) => setNotes(e.target.value)}
        onSubmit={() => setConfirmOpen(true)}
        loading={loading}
        isSubmitDisabled={isSubmitDisabled}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          handleSubmit();
        }}
        variant="default"
        title="Konfirmasi Checkout"
        description={`Proses checkout untuk ${selectedArrival?.name}? Total: ${formatCurrency(finalAmount)} via ${paymentMethod ? paymentMethod.toUpperCase() : "-"}.`}
        confirmLabel="Ya, Proses"
        cancelLabel="Batal"
        loading={loading}
      />
    </div>
  );
};

export default Checkout;
