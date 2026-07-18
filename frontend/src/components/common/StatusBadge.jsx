// src/components/common/StatusBadge.jsx
import { useMemo } from "react";
import { cn } from "@/utils/utils";
import {
  CheckCircle,
  Clock,
  CookingPot,
  XCircle,
  MinusCircle,
  Info,
  Calendar,
  UserCheck,
  UserRound,
  UtensilsCrossed,
  Coffee,
  Package,
  Shield,
  Star,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ── Dotted circle SVG for unknown/fallback status ────────────────
function DotIcon({ className }) {
  return (
    <svg
      viewBox="0 0 12 12"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <circle cx="6" cy="6" r="4" />
    </svg>
  );
}

// ── Status → config mapping ──────────────────────────────────────
const STATUS_MAP = {
  // Hijau — CheckCircle
  active: {
    icon: CheckCircle,
    classNames:
      "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20",
    label: "Aktif",
  },
  done: {
    icon: CheckCircle,
    classNames:
      "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20",
    label: "Selesai",
  },
  used: {
    icon: CheckCircle,
    classNames:
      "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20",
    label: "Sudah Digunakan",
  },
  available: {
    icon: CheckCircle,
    classNames:
      "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20",
    label: "Tersedia",
  },
  paid: {
    icon: CheckCircle,
    classNames:
      "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20",
    label: "Lunas",
  },
  completed: {
    icon: CheckCircle,
    classNames:
      "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20",
    label: "Selesai",
  },
  published: {
    icon: CheckCircle,
    classNames:
      "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20",
    label: "Dipublikasi",
  },

  // Biru — Info
  ongoing: {
    icon: Info,
    classNames:
      "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20",
    label: "Berlangsung",
  },
  info: {
    icon: Info,
    classNames:
      "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20",
    label: "Pengumuman",
  },

  // Kuning — Clock
  pending: {
    icon: Clock,
    classNames:
      "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20",
    label: "Menunggu",
  },
  unused: {
    icon: Clock,
    classNames:
      "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20",
    label: "Belum Digunakan",
  },
  unpaid: {
    icon: Clock,
    classNames:
      "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20",
    label: "Belum Lunas",
  },
  upcoming: {
    icon: Clock,
    classNames:
      "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20",
    label: "Akan Datang",
  },
  low_stock: {
    icon: Clock,
    classNames:
      "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20",
    label: "Stok Rendah",
  },

  // Biru muda — CookingPot
  processing: {
    icon: CookingPot,
    classNames:
      "bg-sky-500/10 text-sky-600 border-sky-500/20 hover:bg-sky-500/20",
    label: "Sedang Diproses",
  },

  // Merah — XCircle
  cancelled: {
    icon: XCircle,
    classNames:
      "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20",
    label: "Batal",
  },
  rejected: {
    icon: XCircle,
    classNames:
      "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20",
    label: "Ditolak",
  },
  deactivated: {
    icon: XCircle,
    classNames:
      "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20",
    label: "Dinonaktifkan",
  },
  unavailable: {
    icon: XCircle,
    classNames:
      "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20",
    label: "Tidak Tersedia",
  },
  expired: {
    icon: XCircle,
    classNames:
      "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20",
    label: "Kadaluarsa",
  },

  // Abu — MinusCircle
  draft: {
    icon: MinusCircle,
    classNames:
      "bg-gray-500/10 text-gray-500 border-gray-500/20 hover:bg-gray-500/20",
    label: "Draft",
  },
  finished: {
    icon: MinusCircle,
    classNames:
      "bg-gray-500/10 text-gray-500 border-gray-500/20 hover:bg-gray-500/20",
    label: "Berakhir",
  },

  // Ungu — Purple
  event: {
    icon: Calendar,
    classNames:
      "bg-purple-500/10 text-purple-600 border-purple-500/20 hover:bg-purple-500/20",
    label: "Acara",
  },

  special: {
    icon: Star,
    classNames:
      "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20",
    label: "Spesial",
  },

  regular: {
    icon: Shield,
    classNames:
      "bg-slate-500/10 text-slate-600 border-slate-500/20 hover:bg-slate-500/20",
    label: "Regular",
  },
  bronze: {
    icon: Shield,
    classNames:
      "bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/20",
    label: "Bronze",
  },
  silver: {
    icon: Shield,
    classNames:
      "bg-blue-400/10 text-blue-500 border-blue-400/20 hover:bg-blue-400/20",
    label: "Silver",
  },
  gold: {
    icon: Shield,
    classNames:
      "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20",
    label: "Gold",
  },

  // Tipe kedatangan
  member: {
    icon: UserCheck,
    classNames:
      "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20",
    label: "Member",
  },
  guest: {
    icon: UserRound,
    classNames:
      "bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/20",
    label: "Tamu",
  },

  // Tipe item transaksi
  food: {
    icon: UtensilsCrossed,
    classNames:
      "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20",
    label: "Makanan",
  },
  beverage: {
    icon: Coffee,
    classNames:
      "bg-cyan-500/10 text-cyan-600 border-cyan-500/20 hover:bg-cyan-500/20",
    label: "Minuman",
  },
  rental: {
    icon: Package,
    classNames:
      "bg-teal-500/10 text-teal-600 border-teal-500/20 hover:bg-teal-500/20",
    label: "Rental",
  },
  menu: {
    icon: UtensilsCrossed,
    classNames:
      "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20",
    label: "Menu",
  },
};

// Fallback for unrecognized status values
const FALLBACK_CONFIG = {
  icon: DotIcon,
  classNames:
    "bg-gray-500/10 text-gray-500 border-gray-500/20 hover:bg-gray-500/20",
};

// ── Resolve boolean is_active to a string key ────────────────────
function resolveStatus(status) {
  if (typeof status === "boolean") return status ? "active" : "deactivated";
  if (typeof status === "string") return status.toLowerCase();
  return status;
}

// ── StatusBadge component ────────────────────────────────────────
export function StatusBadge({ status, className, hideIcon = false }) {
  const resolved = resolveStatus(status);

  const config = useMemo(
    () => STATUS_MAP[resolved] || FALLBACK_CONFIG,
    [resolved],
  );

  const IconComponent = config.icon;
  const label = config.label || resolved;

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1 font-medium text-xs h-5 px-2 py-0 border transition-colors duration-200 cursor-default",
        config.classNames,
        className,
      )}
    >
      {!hideIcon && (
        <IconComponent className="h-3 w-3 shrink-0" aria-hidden="true" />
      )}
      <span className="truncate">{label}</span>
    </Badge>
  );
}
