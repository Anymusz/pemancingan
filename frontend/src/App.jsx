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

// File: src/App.jsx (tambahkan route untuk test)
// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import ClickSpark from "@/components/ui/ClickSpark";
// import LandingPage from "./pages/landing/LandingPage";
// import NotFound from "./pages/NotFound";
// import GradientBg from "@/components/ui/gradient-bg";
// import { FloatingNav } from "./components/ui/floating-navbar";
// import { NAV_ITEMS } from "./constants/navigation";
// import { ToastProvider } from "@/contexts/ToastContext";
// import OwnerDashboard from "@/pages/owner/OwnerDashboard";
// import { isAuthenticated } from "@/utils/tokenManager";
// import Login from "@/pages/Login";
// import Register from "@/pages/Register";
// import TesComponent from "./pages/landing/sections/TesComponent"; // Import test component

// // Protected Route Component
// const ProtectedRoute = ({ children }) => {
//   if (!isAuthenticated()) {
//     return <Navigate to="/login" replace />;
//   }
//   return children;
// };

// function App() {
//   return (
//     <BrowserRouter>
//       <ToastProvider>
//         {/* Global Gradient Background */}
//         <div className="fixed inset-0 -z-10">
//           <GradientBg theme="light" />
//         </div>

//         {/* Floating Navigation - Only show on landing page */}
//         <FloatingNav navItems={NAV_ITEMS} />

//         {/* Click Spark Effect */}
//         <ClickSpark
//           sparkColor="purple"
//           sparkSize={10}
//           sparkRadius={60}
//           sparkCount={10}
//           duration={500}
//         >
//           <div className="w-full min-h-screen">
//             <Routes>
//               {/* Landing Page Routes (Guest) */}
//               <Route path="/" element={<LandingPage />} />

//               {/* Test Component Route */}
//               <Route path="/test-toast" element={<TesComponent />} />

//               <Route path="/login" element={<Login />} />
//               <Route path="/register" element={<Register />} />

//               <Route
//                 path="/owner/dashboard"
//                 element={
//                   <ProtectedRoute>
//                     <OwnerDashboard />
//                   </ProtectedRoute>
//                 }
//               />

//               <Route path="/" element={<Navigate to="/login" replace />} />

//               {/* Member Routes */}
//               {/* <Route path="/member/dashboard" element={<MemberDashboard />} /> */}
//               {/* <Route path="/member/profile" element={<MemberProfile />} /> */}
//               {/* <Route path="/member/order" element={<MemberOrder />} /> */}

//               {/* 404 Not Found */}
//               <Route path="*" element={<NotFound />} />
//             </Routes>
//           </div>
//         </ClickSpark>
//       </ToastProvider>
//     </BrowserRouter>
//   );
// }

// export default App;

import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import LandingPage from "@/pages/landing/LandingPage";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import OwnerDashboard from "@/pages/owner/OwnerDashboard";

import ProtectedRoute from "@/routes/ProtectedRoute";

import ClickSpark from "@/components/ui/ClickSpark";
import GradientBg from "@/components/ui/gradient-bg";
import { FloatingNav } from "@/components/ui/floating-navbar";
import { NAV_ITEMS } from "@/constants/navigation";
import { ToastProvider } from "@/contexts/ToastContext";

import MemberDashboard from "./pages/member/Dashboard";
import LeaderboardPublic from "./pages/LeaderboardPublic";
import EmployeeDashboard from "@/pages/employee/EmployeeDashboard";

// ===============================
// Layout Wrapper
// ===============================
const AppLayout = ({ children }) => {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <>
      <div className="fixed inset-0 -z-10">
        <GradientBg theme="light" />
      </div>

      {isLanding && <FloatingNav navItems={NAV_ITEMS} />}

      <ClickSpark
        sparkColor="purple"
        sparkSize={10}
        sparkRadius={60}
        sparkCount={10}
        duration={500}
      >
        <div className="w-full min-h-screen">{children}</div>
      </ClickSpark>
    </>
  );
};

// ===============================
// MAIN APP
// ===============================
function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppLayout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/leaderboard" element={<LeaderboardPublic />} />

            {/* Owner */}
            <Route
              path="/owner/dashboard"
              element={
                <ProtectedRoute allowedRoles={["owner"]}>
                  <OwnerDashboard />
                </ProtectedRoute>
              }
            />

            {/* Member */}
            <Route
              path="/member/dashboard"
              element={
                <ProtectedRoute allowedRoles={["member"]}>
                  <MemberDashboard />
                </ProtectedRoute>
              }
            />

            {/* Employee */}
            <Route
              path="/employee/dashboard"
              element={
                <ProtectedRoute allowedRoles={["employee"]}>
                  <EmployeeDashboard />
                </ProtectedRoute>
              }
            />

            {/* Misc */}
            <Route
              path="/unauthorized"
              element={<div>Unauthorized Access</div>}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
