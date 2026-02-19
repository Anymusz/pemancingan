// // src/pages/landing/LandingPage.jsx

// import HeroSection from "./sections/HeroSection";
// import LeaderboardSection from "./sections/LeaderboardSection";
// import InformasiSection from "./sections/InformasiSection";
// import FAQSection from "./sections/FAQSection";

// export default function LandingPage() {
//   return (
//     <main>
//       <section id="hero">
//         <HeroSection />
//       </section>

//       <section id="leaderboard">
//         <LeaderboardSection />
//       </section>

//       <section id="informasi">
//         <InformasiSection />
//       </section>

//       <section id="faq">
//         <FAQSection />
//       </section>
//     </main>
//   );
// }

// File: src/pages/landing/LandingPage.jsx (MODIFIED)
import HeroSection from "./sections/HeroSection";
import FAQSection from "./sections/FAQSection";
import FooterSection from "./sections/FooterSection";
import LeaderboardSection from "./sections/LeaderboardSection";
import InformasiSection from "./sections/InformasiSection";

export default function LandingPage() {
  return (
    <main>
      {/* Hero Section */}
      <section id="hero">
        <HeroSection />
      </section>
      <section id="hero">
        <HeroSection />
      </section>

      {/* Leaderboard Section */}
      <section id="leaderboard">
        <LeaderboardSection />
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
  );
}
