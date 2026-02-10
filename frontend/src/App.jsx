// // frontend / src / App.jsx;
// import { useState } from "react";
// import reactLogo from "./assets/react.svg";
// import viteLogo from "/vite.svg";
// import "./App.css";

// function App() {
//   const [count, setCount] = useState(0);

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1 className="text-emerald-500">Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   );
// }
// export default App;

import { BrowserRouter, Routes, Route } from "react-router-dom";
import ClickSpark from "@/components/ui/ClickSpark";
import LandingPage from "./pages/landing/LandingPage";
import NotFound from "./pages/NotFound";
import GradientBg from "@/components/ui/gradient-bg";
import { FloatingNav } from "./components/ui/floating-navbar";
import { NAV_ITEMS } from "./constants/navigation";

function App() {
  return (
    <BrowserRouter>
      {/* Global Gradient Background */}
      <div className="fixed inset-0 -z-10">
        <GradientBg theme="light" />
      </div>

      {/* Floating Navigation - Only show on landing page */}
      <FloatingNav navItems={NAV_ITEMS} />

      {/* Click Spark Effect */}
      <ClickSpark
        sparkColor="purple"
        sparkSize={10}
        sparkRadius={60}
        sparkCount={10}
        duration={500}
      >
        <div className="w-full min-h-screen">
          <Routes>
            {/* Landing Page Routes (Guest) */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth Routes */}
            {/* <Route path="/login" element={<Login />} /> */}
            {/* <Route path="/register" element={<Register />} /> */}

            {/* Member Routes */}
            {/* <Route path="/member/dashboard" element={<MemberDashboard />} /> */}
            {/* <Route path="/member/profile" element={<MemberProfile />} /> */}
            {/* <Route path="/member/order" element={<MemberOrder />} /> */}

            {/* 404 Not Found */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </ClickSpark>
    </BrowserRouter>
  );
}

export default App;
