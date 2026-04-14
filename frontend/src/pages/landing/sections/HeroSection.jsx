// src/pages/landing/sections/HeroSection.jsx
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/common/Button";
import {
  ArrowRight,
  ChevronDown,
  Award,
  TrendingUp,
  Gift,
  ClipboardList,
} from "lucide-react";

// ── QR decorative pattern (8×8, true = dark cell)
const QR_PATTERN = [
  [1, 1, 1, 0, 1, 0, 1, 1],
  [1, 0, 1, 0, 1, 1, 0, 0],
  [1, 1, 1, 0, 0, 1, 1, 0],
  [0, 1, 0, 1, 1, 0, 1, 1],
  [1, 0, 1, 1, 0, 1, 0, 0],
  [1, 1, 0, 0, 1, 0, 1, 1],
  [1, 0, 1, 0, 1, 1, 1, 0],
  [0, 1, 1, 1, 0, 0, 1, 0],
];

// ── Benefit items
const BENEFITS = [
  {
    icon: Award,
    iconBg: "bg-sky-100",
    iconColor: "text-sky-700",
    title: "Poin Setiap Mancing",
    desc: "Dapatkan poin otomatis setiap transaksi",
  },
  {
    icon: TrendingUp,
    iconBg: "bg-green-100",
    iconColor: "text-green-700",
    title: "Diskon Naik per Tier",
    desc: "Semakin tinggi tier, semakin besar diskon",
  },
  {
    icon: Gift,
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-700",
    title: "Voucher Bulanan Otomatis",
    desc: "Voucher dikirim setiap bulan ke akun member",
  },
  {
    icon: ClipboardList,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-700",
    title: "Pantau Semua Riwayat",
    desc: "Cek transaksi & poin kapan saja lewat akun",
  },
];

function HeroSection() {
  const navigate = useNavigate();

  const handleLearnMore = () => {
    const el = document.getElementById("informasi");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* Content */}
      <div className="container relative z-10 px-6 mx-auto max-w-7xl sm:px-8 lg:px-12">
        <div className="grid min-h-screen grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          {/* ── LEFT: Text content ────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col justify-center py-12 lg:py-20"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-4"
            >
              <span className="inline-block px-4 py-1.5 text-sm font-medium rounded-full bg-primary/10 text-primary">
                Pemancingan Sutoyo
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-tight"
            >
              <span className="text-foreground whitespace-normal sm:whitespace-nowrap">
                Mancing Lebih Seru
              </span>
              <span className="block text-primary">Reward Lebih Nyata</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mb-8 text-sm text-muted-foreground sm:text-base lg:text-lg max-w-xl"
            >
              Setiap kunjungan menghasilkan poin. Naik tier dan nikmati diskon
              serta voucher bulanan otomatis, semua bisa dipantau lewat
              aplikasi.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex gap-3"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  className="gap-2 text-sm sm:text-base"
                  onClick={() => navigate("/register")}
                >
                  Daftar Sekarang <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="text-sm sm:text-base"
                  onClick={handleLearnMore}
                >
                  Pelajari Lebih Lanjut
                </Button>
              </motion.div>
            </motion.div>

            {/* Benefits grid */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="grid grid-cols-2 gap-4 mt-12"
            >
              {BENEFITS.map((b, i) => {
                const Icon = b.icon;
                return (
                  <motion.div
                    key={b.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.8 + i * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div
                      className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${b.iconBg}`}
                    >
                      <Icon className={`w-4 h-4 ${b.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {b.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {b.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>

          {/* ── RIGHT: Decorative cards ───────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex items-center justify-center py-12 lg:py-20"
          >
            <div className="relative w-full max-w-sm min-h-[430px]">
              {/* Card 1 — Membership card (behind) */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                whileHover={{ y: -4 }}
                className="absolute inset-x-0 -top-1 mx-auto w-[280px] z-10"
              >
                <div className="rounded-2xl bg-gradient-to-br from-sky-700 via-sky-500 to-sky-400 text-white p-4 space-y-3 shadow-lg">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-white font-semibold tracking-widest uppercase opacity-80">
                        Pemancingan Sutoyo
                      </p>
                      <p className="text-sm text-white opacity-70">
                        Membership Card
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-900 text-[9px] font-bold uppercase">
                        Gold
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-white/15 text-white/90 border border-white/25 text-[9px]">
                        Diskon 5%
                      </span>
                    </div>
                  </div>

                  {/* Member info */}
                  <div>
                    <p className="text-lg font-medium leading-tight text-white">
                      Budi Santoso
                    </p>
                    <p className="text-white font-mono text-xs opacity-65 mt-0.5">
                      MBR-A7K2X9P4
                    </p>
                  </div>

                  {/* QR decorative grid */}
                  <div className="flex justify-start">
                    <div className="bg-white rounded-lg p-1.5">
                      <div
                        className="grid gap-px"
                        style={{
                          gridTemplateColumns: "repeat(8, 10px)",
                          gridTemplateRows: "repeat(8, 10px)",
                        }}
                      >
                        {QR_PATTERN.flat().map((cell, idx) => (
                          <div
                            key={idx}
                            className={`w-[10px] h-[10px] ${cell ? "bg-slate-800" : "bg-white"}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Points progress */}
                  <div className="bg-white/10 rounded-xl px-3 py-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">2.450 poin</span>
                    </div>
                    <div className="h-[5px] rounded-full bg-white/20">
                      <div className="h-full w-3/4 rounded-full bg-amber-400" />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[9px] opacity-80">GOLD</span>
                      <span className="text-[9px] opacity-50">PLATINUM</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Card 2 — Active order card (front) */}
              <motion.div
                initial={{ opacity: 0, y: 50, rotate: 5 }}
                animate={{ opacity: 1, y: 0, rotate: 5 }}
                transition={{
                  duration: 0.6,
                  delay: 0.75,
                  type: "spring",
                  stiffness: 200,
                }}
                whileHover={{ y: -4 }}
                className="absolute bottom-0 right-0 z-20 w-[200px]"
              >
                <div className="bg-card border border-border rounded-xl shadow-sm px-3.5 py-3 space-y-2.5">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      Pesanan Aktif
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-[10px] font-medium">
                      Diproses
                    </span>
                  </div>

                  {/* Items */}
                  <div className="space-y-1.5">
                    {[
                      { dot: "bg-sky-400", name: "Es Teh Manis", qty: "x2" },
                      { dot: "bg-green-400", name: "Nasi Goreng", qty: "x1" },
                      { dot: "bg-amber-400", name: "Sewa Kursi", qty: "x1" },
                    ].map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <span
                          className={`rounded-full w-1.5 h-1.5 flex-shrink-0 ${item.dot}`}
                        />
                        <span className="text-xs text-foreground flex-1 truncate">
                          {item.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.qty}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Footer progress */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-primary font-medium">
                      2/3 selesai
                    </span>
                    <div className="h-1 rounded-full bg-muted">
                      <div className="h-full w-2/3 rounded-full bg-primary" />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Decorative blobs */}
              <motion.div
                className="absolute -z-10 -top-10 w-24 h-24 rounded-lg bg-primary/10"
                animate={{ rotate: [0, 20, 0], scale: [1, 1.05, 1] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute -z-10 -bottom-10 -right-6 w-24 h-24 rounded-lg bg-sky-500/10"
                animate={{ rotate: [0, -10, 0], scale: [1, 1.05, 1] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5,
                }}
              />
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute transform -translate-x-1/2 bottom-8 left-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-6 h-6 text-muted-foreground" />
        </motion.div>
      </div>
    </div>
  );
}

export default HeroSection;
