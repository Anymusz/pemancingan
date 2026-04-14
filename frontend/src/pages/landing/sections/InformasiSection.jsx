// File: src/pages/landing/sections/InformasiSection.jsx
import { cn } from "@/utils/utils";
import { MapPin, Fish, Wallet, Crown, CreditCard, Coffee } from "lucide-react";
import { useEffect, useState } from "react";
import { getFishTypes } from "@/services/fishService";
import { LoaderOne } from "@/components/ui/loader";
import { ErrorAlert } from "@/components/feedback/inlineAlert";
import { formatCurrency } from "@/utils/utils";

const InformationSection = () => {
  // State untuk fish types
  const [fishTypes, setFishTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch fish types saat component mount
  useEffect(() => {
    const fetchFishTypes = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getFishTypes();

        // Safe data access dengan optional chaining
        const fishData = response?.data || [];
        setFishTypes(fishData);
      } catch (err) {
        console.error("Failed to fetch fish types:", err);
        setError("Gagal memuat data harga ikan");
      } finally {
        setLoading(false);
      }
    };

    fetchFishTypes();
  }, []);

  // Format harga ikan untuk description
  const formatFishPrices = () => {
    if (loading) return <LoaderOne />;

    if (error) {
      return (
        <ErrorAlert
          description={error}
          dismissible
          onDismiss={() => setError(null)}
        />
      );
    }

    if (fishTypes.length === 0) {
      return "Belum ada data harga ikan.";
    }

    // Format: "Ikan Patin Rp25.000, Nila Rp35.000, ..."
    const formattedPrices = fishTypes
      .map((fish) => {
        const price = formatCurrency(fish.price_per_kg);

        return `${fish.name} ${price}`;
      })
      .join(", ");

    return `Ikan ${formattedPrices}. Harga sudah termasuk jasa pemancingan.`;
  };

  const features = [
    {
      title: "Informasi Umum",
      description:
        "Jl. R. Wijaya Lorong Akimar No. 271, The Hok, Jambi Selatan. Buka setiap hari kecuali Jumat, pukul 08.00 - 18.00 WIB.",
      icon: <MapPin />,
    },
    {
      title: "Harga Ikan Per Kilogram",
      description: formatFishPrices(),
      icon: <Fish />,
      isDynamic: true,
    },
    {
      title: "Deposit & Pengunjung",
      description:
        "Pengunjung non-member dikenakan deposit sebesar Rp50.000 sebelum memulai aktivitas. Member terverifikasi dapat menikmati layanan tanpa deposit.",
      icon: <Wallet />,
    },
    {
      title: "Benefit Member Eksklusif",
      description:
        "Gratis deposit, dapat poin setiap transaksi, diskon spesial, voucher gratis, dan kesempatan menang hadiah di leaderboard!",
      icon: <Crown />,
    },
    {
      title: "Pembayaran Mudah & Aman",
      description:
        "Terima Cash, Transfer Bank (BCA, Mandiri, BRI), dan QRIS (GoPay, OVO, DANA, ShopeePay, LinkAja).",
      icon: <CreditCard />,
    },
    {
      title: "Sewa Alat & Fasilitas",
      description:
        "Sewa alat pancing Rp10.000/stik sepuasnya. Tersedia area parkir luas, spot memancing nyaman, musholla dan toilet bersih.",
      icon: <Coffee />,
    },
  ];

  return (
    <div className="py-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header Section */}
        <div className="text-center mb-12 flex flex-col items-center gap-2">
          <span className="inline-block px-4 py-1.5 text-sm font-medium rounded-full bg-primary/10 text-primary">
            Informasi Pemancingan
          </span>
          <h1 className="text-4xl font-bold text-foreground">
            Semua yang Perlu Kamu Tahu
          </h1>
          <p className="text-md text-muted-foreground max-w-2xl mx-auto">
            Segala yang perlu diketahui sebelum berkunjung ke Pemancingan Sutoyo
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 relative z-10">
          {features.map((feature, index) => (
            <Feature key={feature.title} {...feature} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
};

const Feature = ({ title, description, icon, index, isDynamic }) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-10 relative group/feature border-border",
        (index === 0 || index === 3) && "lg:border-l border-border",
        index < 3 && "lg:border-b border-border",
      )}
    >
      {/* Hover gradient effect - top */}
      {index < 3 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-secondary/50 to-transparent pointer-events-none" />
      )}

      {/* Hover gradient effect - bottom */}
      {index >= 3 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-secondary/50 to-transparent pointer-events-none" />
      )}

      {/* Icon */}
      <div className="mb-4 relative z-10 px-10 text-text-body group-hover/feature:text-primary transition-colors duration-200">
        {icon}
      </div>

      {/* Title */}
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        {/* Animated left border */}
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-border group-hover/feature:bg-primary transition-all duration-200 origin-center" />

        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-text-primary">
          {title}
        </span>
      </div>

      {/* Description */}
      <div
        className={cn(
          "text-sm text-text-body max-w-md relative z-10 px-10",
          isDynamic && "min-h-[60px] flex items-center",
        )}
      >
        {description}
      </div>
    </div>
  );
};

export default InformationSection;
