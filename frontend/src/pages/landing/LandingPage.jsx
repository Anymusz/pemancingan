// File: src/pages/landing/LandingPage.jsx
import GradientBg from "@/components/layout/gradient-bg";
import HeroSection from "./sections/HeroSection";
import FAQSection from "./sections/FAQSection";
import FooterSection from "./sections/FooterSection";
import LeaderboardSection from "./sections/LeaderboardSection";
import InformasiSection from "./sections/InformasiSection";
import EventsSection from "./sections/EventsSection";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-10">
        <GradientBg theme="light" />
      </div>
      <main>
        {/* Hero Section */}
        <section id="hero">
          <HeroSection />
        </section>

        {/* Leaderboard Section */}
        <section id="leaderboard">
          <LeaderboardSection />
        </section>

        {/* Events Section */}
        <section id="events">
          <EventsSection />
        </section>

        {/* Informasi Section */}
        <section id="informasi">
          <InformasiSection />
        </section>

        {/* FAQ Section */}
        <section id="faq">
          <FAQSection />
        </section>

        {/* Footer Section */}
        <section id="footer">
          <FooterSection />
        </section>
      </main>
    </div>
  );
}
