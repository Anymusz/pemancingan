// File: src/pages/employee/checkout/Checkout.jsx

import { useState, useEffect, useMemo, useCallback } from "react";
import { TrendingUp } from "lucide-react";
import employeeService from "../../../services/employeeService";
import { useToast } from "@/hooks/useToast";
import { formatCurrency } from "@/utils/utils";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ReceiptModal from "../../../components/common/ReceiptModal";
import { MemberSection } from "./MemberSection";
import { FishSection } from "./FishSection";
import { SummarySection } from "./SummarySection";
import { PaymentSection } from "./PaymentSection";
import { PendingOrderSection } from "./PendingOrderSection";
import { PenaltySection } from "./PenaltySection";

const TIER_DISCOUNT_FALLBACK = 0;

const Checkout = ({ preselectArrivalId, onPreselectConsumed }) => {
  // ===== STATE =====
  const [arrivals, setArrivals] = useState([]);
  const [fishTypes, setFishTypes] = useState([]);
  const [selectedArrival, setSelectedArrival] = useState(null);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [fishItems, setFishItems] = useState([]);
  const [penaltyItems, setPenaltyItems] = useState([]);
  const [tips, setTips] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentProof, setPaymentProof] = useState(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [tierUpgradeAlert, setTierUpgradeAlert] = useState(null);
  const [activeVoucher, setActiveVoucher] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [qrisImageUrl, setQrisImageUrl] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [memberPhoneForReceipt, setMemberPhoneForReceipt] = useState(null);
  const toast = useToast();

  // ===== KALKULASI =====
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

  const isGuest = selectedArrival?.is_guest ?? false;

  const discountTier = useMemo(() => {
    if (!selectedArrival || isGuest) return 0;
    const pct = selectedArrival.discount_percentage ?? TIER_DISCOUNT_FALLBACK;
    return Math.floor(subtotalFish * (pct / 100));
  }, [subtotalFish, selectedArrival, isGuest]);

  const totalAmount = useMemo(
    () => subtotalFish + subtotalPending + subtotalPenalty,
    [subtotalFish, subtotalPending, subtotalPenalty],
  );

  const discountVoucher = activeVoucher ? Number(activeVoucher.amount) : 0;

  const finalAmount = useMemo(
    () => Math.max(0, totalAmount - discountTier - discountVoucher),
    [totalAmount, discountTier, discountVoucher],
  );

  const depositAmount = isGuest ? (selectedArrival?.deposit_amount ?? 0) : 0;
  const depositChange = Math.max(0, depositAmount - finalAmount);
  const finalAmountAfterDeposit = Math.max(0, finalAmount - depositAmount);
  const isFullyCoveredByDeposit =
    depositAmount > 0 && finalAmountAfterDeposit === 0;

  // Poin: penalty tidak ikut; guest selalu 0
  const pointsPreview = useMemo(
    () => (isGuest ? 0 : Math.floor((totalAmount - subtotalPenalty) / 10000)),
    [totalAmount, subtotalPenalty, isGuest],
  );

  // ===== HELPERS =====
  const resetForm = () => {
    setSelectedArrival(null);
    setPendingOrders([]);
    setFishItems([]);
    setPenaltyItems([]);
    setTips(0);
    setPaymentMethod("");
    setPaymentProof(null);
    setNotes("");
    setActiveVoucher(null);
  };

  // ===== FETCH =====
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

  useEffect(() => {
    const init = async () => {
      setFetchLoading(true);
      try {
        const [arrivalsRes, fishRes, qrisRes] = await Promise.all([
          employeeService.getTodayArrivals(),
          employeeService.getFishTypes(),
          employeeService.getQrisConfig(),
        ]);
        if (arrivalsRes.success)
          setArrivals(
            arrivalsRes.data.arrivals.filter((a) => a.status === "active"),
          );
        if (fishRes.success) setFishTypes(fishRes.data);
        if (qrisRes.success) setQrisImageUrl(qrisRes.data?.image_url ?? null);
      } catch {
        toast.error("Gagal memuat data");
      } finally {
        setFetchLoading(false);
      }
    };
    init();
  }, [toast]);

  useEffect(() => {
    if (!preselectArrivalId || arrivals.length === 0) return;
    const match = arrivals.find((a) => a.arrival_id === preselectArrivalId);
    if (match) {
      handlePickArrival(match);
      onPreselectConsumed?.();
    }
  }, [preselectArrivalId, arrivals]);

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

  const handleCancelOrder = async (orderId) => {
    try {
      const res = await employeeService.updateOrderStatus(orderId, {
        status: 'cancelled',
        cancellation_reason: 'Dibatalkan saat checkout',
      });
      if (res.success) {
        setPendingOrders((prev) => prev.filter((o) => o.id !== orderId));
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal membatalkan pesanan");
    }
  };

  // ===== ARRIVAL HANDLER =====
  const handlePickArrival = (arrival) => {
    setSelectedArrival(arrival);
    setFishItems([]);
    setPenaltyItems([]);
    setActiveVoucher(null);
    fetchPendingOrders(arrival.arrival_id);
    if (!arrival.is_guest) {
      fetchMemberVoucher(arrival.member_id);
    }
  };

  const handleClearArrival = () => {
    setSelectedArrival(null);
    setPendingOrders([]);
    setFishItems([]);
    setPenaltyItems([]);
    setActiveVoucher(null);
  };

  // ===== FISH HANDLER =====
  const handleFishWeightChange = (fish, weightStr) => {
    const weight = parseFloat(weightStr);
    if (!weightStr || isNaN(weight) || weight <= 0) {
      setFishItems((prev) => prev.filter((i) => i.item_id !== fish.id));
      return;
    }
    setFishItems((prev) => {
      const existing = prev.find((i) => i.item_id === fish.id);
      const item = {
        item_type: "fish",
        item_id: fish.id,
        name: fish.name,
        quantity: weight,
        unit_price_snapshot: parseFloat(fish.price_per_kg),
        subtotal: weight * parseFloat(fish.price_per_kg),
      };
      if (existing) return prev.map((i) => (i.item_id === fish.id ? item : i));
      return [...prev, item];
    });
  };

  // ===== PENALTY HANDLERS =====
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

  const handleRemovePenalty = (name) =>
    setPenaltyItems((prev) =>
      prev
        .map((p) =>
          p.name === name
            ? {
                ...p,
                quantity: p.quantity - 1,
                subtotal: (p.quantity - 1) * p.unit_price,
              }
            : p,
        )
        .filter((p) => p.quantity > 0),
    );

  // ===== SUBMIT =====
  const handleSubmit = async () => {
    if (!selectedArrival || (!isFullyCoveredByDeposit && !paymentMethod))
      return;

    const hasAnyItem =
      fishItems.length > 0 ||
      pendingOrders.length > 0 ||
      penaltyItems.length > 0;
    if (!hasAnyItem) {
      toast.error("Tidak ada item");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("arrival_id", selectedArrival.arrival_id);
      fishItems.forEach((i, idx) => {
        formData.append(`fish_items[${idx}][item_id]`, i.item_id);
        formData.append(`fish_items[${idx}][quantity]`, i.quantity);
      });
      penaltyItems.forEach((p, idx) => {
        formData.append(`penalty_items[${idx}][name]`, p.name);
        formData.append(`penalty_items[${idx}][quantity]`, p.quantity);
        formData.append(`penalty_items[${idx}][unit_price]`, p.unit_price);
      });
      if (!isFullyCoveredByDeposit && paymentMethod) {
        formData.append("payment_method", paymentMethod);
      }
      formData.append("tips", Number(tips) || 0);
      if (notes) formData.append("notes", notes);
      if (paymentProof) formData.append("payment_proof", paymentProof);

      const res = await employeeService.checkout(formData);

      if (res.success) {
        const voucherInfo =
          res.data.transaction.discount_voucher > 0
            ? ` | Voucher digunakan: ${formatCurrency(res.data.transaction.discount_voucher)}`
            : "";
        toast.success(
          `Pembayaran berhasil! Kode: ${res.data.transaction.transaction_code}${voucherInfo}`,
        );

        const mapped = {
          ...res.data.transaction,
          customer:      res.data.customer,
          tier_upgraded: res.data.tier_upgraded,
          voucher_used:  res.data.voucher_used,
          total_points:  res.data.customer?.is_guest ? undefined : res.data.customer?.total_points,
          current_tier:  res.data.customer?.is_guest ? undefined : res.data.customer?.current_tier,
        };
        setReceiptData(mapped);
        setMemberPhoneForReceipt(res.data.customer?.phone ?? null);
        setShowReceipt(true);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gagal memproses pembayaran");
    } finally {
      setLoading(false);
    }
  };

  const handleReceiptClose = () => {
    const wasTierUpgraded = receiptData?.tier_upgraded;
    const newTierName     = receiptData?.current_tier;
    setShowReceipt(false);
    setReceiptData(null);
    setMemberPhoneForReceipt(null);
    if (wasTierUpgraded && newTierName) {
      setTierUpgradeAlert(`Selamat! Tier member naik ke ${newTierName}!`);
      setTimeout(() => setTierUpgradeAlert(null), 6000);
    }
    resetForm();
    fetchArrivals();
  };

  const hasAnyItem =
    fishItems.length > 0 || pendingOrders.length > 0 || penaltyItems.length > 0;
  const requiresProof =
    !isFullyCoveredByDeposit &&
    (paymentMethod === "transfer" || paymentMethod === "qris") &&
    finalAmountAfterDeposit > 0;

  const isSubmitDisabled =
    !selectedArrival ||
    (!isFullyCoveredByDeposit && !paymentMethod) ||
    !hasAnyItem ||
    (requiresProof && !paymentProof) ||
    loading;

  // ===== SHARED SECTION PROPS =====
  const summaryProps = {
    subtotalFish,
    subtotalPending,
    subtotalPenalty,
    discountTier,
    discountPercentage: selectedArrival?.discount_percentage,
    activeVoucher,
    finalAmount,
    pointsPreview,
    isGuest,
    depositAmount,
    depositChange,
    finalAmountAfterDeposit,
  };

  const paymentProps = {
    paymentMethod,
    onPaymentMethodChange: setPaymentMethod,
    tips,
    onTipsChange: (e) => setTips(e.target.value),
    notes,
    onNotesChange: (e) => setNotes(e.target.value),
    onSubmit: () => setConfirmOpen(true),
    loading,
    isSubmitDisabled,
    isFullyCoveredByDeposit,
    qrisImageUrl,
    paymentProof,
    onPaymentProofChange: setPaymentProof,
    finalAmountAfterDeposit,
  };

  // ===== RENDER =====
  return (
    <div className="space-y-6">
      {tierUpgradeAlert && (
        <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-600">
          <TrendingUp className="h-4 w-4 flex-shrink-0" />
          {tierUpgradeAlert}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left: main sections */}
        <div className="lg:col-span-2 space-y-6">
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
            onCancelOrder={handleCancelOrder}
          />

          <FishSection
            fishTypes={fishTypes}
            fishItems={fishItems}
            onWeightChange={handleFishWeightChange}
          />

          <PenaltySection
            penaltyItems={penaltyItems}
            onAdd={handleAddPenalty}
            onRemove={handleRemovePenalty}
          />
        </div>

        {/* Right: sticky sidebar — desktop only */}
        <div className="hidden lg:block">
          <div className="sticky top-6 space-y-4">
            <SummarySection {...summaryProps} />
            <PaymentSection {...paymentProps} />
          </div>
        </div>
      </div>

      {/* Mobile: summary + payment below sections */}
      <div className="lg:hidden space-y-4">
        <SummarySection {...summaryProps} />
        <PaymentSection {...paymentProps} />
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          handleSubmit();
        }}
        variant="default"
        title="Konfirmasi Pembayaran"
        description={`Proses pembayaran untuk ${selectedArrival?.name}? Total: ${formatCurrency(finalAmountAfterDeposit)} via ${isFullyCoveredByDeposit ? "Deposit" : paymentMethod ? paymentMethod.toUpperCase() : "-"}.`}
        confirmLabel="Ya, Proses"
        cancelLabel="Batal"
        loading={loading}
      />

      <ReceiptModal
        isOpen={showReceipt}
        onClose={handleReceiptClose}
        receipt={receiptData}
        memberPhone={memberPhoneForReceipt}
      />
    </div>
  );
};

export default Checkout;
