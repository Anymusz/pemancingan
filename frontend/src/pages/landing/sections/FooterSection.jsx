// src/pages/landing/sections/FooterSection.jsx

import React from "react";
import { Button } from "@/components/common/Button";
import { Facebook, MapPin, ArrowRight } from "lucide-react";

const FooterBlock = () => {
  // WhatsApp contact handler
  const handleWhatsAppClick = () => {
    const phoneNumber = "082179863253"; // Ganti dengan nomor WA Pemancingan S
    const message =
      "Halo Pemancingan S, saya ingin bertanya tentang layanan pemancingan.";
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  // Social media handlers
  const handleFacebookClick = () => {
    window.open("https://facebook.com/pemancingans", "_blank");
  };

  const handleGoogleMapsClick = () => {
    window.open("https://maps.app.goo.gl/ECZtJsCjkGz82cXW8", "_blank");
  };

  return (
    <footer className="relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 dark:from-primary/10 dark:to-background pointer-events-none" />

      <div className="container relative z-10 px-5 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 py-12 mx-8">
          {/* KOLOM 1 - Brand / Identitas */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-primary" />
              <span className="text-2xl font-bold">Pemancingan S</span>
            </div>
            <p className="text-muted-foreground">
              Jasa pemancingan dan penjualan ikan segar dengan sistem pencatatan
              digital.
            </p>
            <div className="flex space-x-4">
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full h-9 w-9"
                onClick={handleFacebookClick}
              >
                <Facebook className="h-4 w-4" />
                <span className="sr-only">Facebook</span>
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full h-9 w-9"
                onClick={handleGoogleMapsClick}
              >
                <MapPin className="h-4 w-4" />
                <span className="sr-only">Google Maps</span>
              </Button>
            </div>
          </div>

          {/* KOLOM 2 - Informasi Usaha */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="font-semibold">Informasi</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#tentang"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Tentang Pemancingan S
                </a>
              </li>
              <li>
                <a
                  href="#jam-operasional"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Jam Operasional
                </a>
              </li>
              <li>
                <a
                  href="#lokasi"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Lokasi
                </a>
              </li>
              <li>
                <a
                  href="#aturan"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Aturan & Ketentuan
                </a>
              </li>
            </ul>
          </div>

          {/* KOLOM 3 - Menu Penting */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="font-semibold">Menu</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="#leaderboard"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Leaderboard
                </a>
              </li>
              <li>
                <a
                  href="#informasi"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Informasi & Event
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  FAQ
                </a>
              </li>
              <li>
                <a
                  href="/register"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Daftar Member
                </a>
              </li>
            </ul>
          </div>

          {/* KOLOM 4 - Kontak / Bantuan */}
          <div className="md:col-span-4 space-y-4">
            <h3 className="font-semibold">Butuh Bantuan?</h3>
            <p className="text-muted-foreground">
              Hubungi kami melalui WhatsApp untuk pertanyaan seputar layanan dan
              operasional.
            </p>
            <Button onClick={handleWhatsAppClick} className="rounded-full">
              Hubungi via WhatsApp
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mx-8 border-t py-6 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Pemancingan S. All rights reserved.
          </div>
          <div className="flex space-x-6 text-sm">
            <a
              href="#privacy"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Kebijakan Privasi
            </a>
            <a
              href="#terms"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Syarat & Ketentuan
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterBlock;
