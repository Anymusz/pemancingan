import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import LandingPage from "@/pages/landing/LandingPage";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import OwnerDashboard from "@/pages/owner/ownerDashboard";

import ProtectedRoute from "@/routes/ProtectedRoute";

import ClickSpark from "@/components/ui/ClickSpark";
import GradientBg from "@/components/layout/gradient-bg";
import { FloatingNav } from "@/components/layout/floating-navbar";
import { NAV_ITEMS } from "@/constants/navigation";
import { ToastProvider } from "@/contexts/ToastContext";

import MemberDashboard from "./pages/member/Dashboard";
import LeaderboardPublic from "./pages/LeaderboardPublic";
import EmployeeDashboard from "@/pages/employee/EmployeeDashboard";
import Notifications from "@/pages/Notifications";
import EventsPage from "@/pages/events/EventsPage";
import EventDetailPage from "@/pages/events/EventDetailPage";

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
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />

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

            {/* Notifications (all roles) */}
            <Route
              path="/notifications"
              element={
                <ProtectedRoute allowedRoles={["owner", "employee", "member"]}>
                  <Notifications />
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
