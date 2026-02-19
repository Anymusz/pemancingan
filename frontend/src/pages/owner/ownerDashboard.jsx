// File: src/pages/owner/ownerDashboard.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PendingMembersList from "./PendingMembersList";
import ActiveMembersList from "./ActiveMembersList";
import ValidationHistory from "./ValidationHistory";
import OwnerLeaderboard from "./OwnerLeaderboard";
import MenuManagement from "./MenuManagement";
import FishTypeManagement from "./FishTypeManagement";
import EventManagement from "./EventManagement";
import { removeToken } from "@/utils/tokenManager";

const OwnerDashboard = () => {
  const [activeMenu, setActiveMenu] = useState("pending");
  const navigate = useNavigate();

  const handleLogout = () => {
    removeToken();
    navigate("/login");
  };

  return (
    <div>
      <header
        style={{
          borderBottom: "2px solid #000",
          padding: "10px",
          marginBottom: "20px",
        }}
      >
        <h1>Owner Dashboard</h1>
        <nav>
          {/* Kelola Member */}
          <span>Kelola Member: </span>
          <button
            onClick={() => setActiveMenu("pending")}
            disabled={activeMenu === "pending"}
          >
            Pending Members
          </button>
          <button
            onClick={() => setActiveMenu("active")}
            disabled={activeMenu === "active"}
          >
            Active Members
          </button>
          <button
            onClick={() => setActiveMenu("history")}
            disabled={activeMenu === "history"}
          >
            Validation History
          </button>

          {" | "}

          {/* Kelola Produk */}
          <span>Kelola Produk: </span>
          <button
            onClick={() => setActiveMenu("menus")}
            disabled={activeMenu === "menus"}
          >
            Menu Makanan & Minuman
          </button>
          <button
            onClick={() => setActiveMenu("fish-types")}
            disabled={activeMenu === "fish-types"}
          >
            Jenis Ikan
          </button>
          <button
            onClick={() => setActiveMenu("events")}
            disabled={activeMenu === "events"}
          >
            Event & Informasi
          </button>

          {" | "}

          <button
            onClick={() => setActiveMenu("leaderboard")}
            disabled={activeMenu === "leaderboard"}
          >
            Leaderboard
          </button>

          {" | "}

          <button onClick={handleLogout}>Logout</button>
        </nav>
      </header>

      <main style={{ padding: "20px" }}>
        {activeMenu === "pending" && <PendingMembersList />}
        {activeMenu === "active" && <ActiveMembersList />}
        {activeMenu === "history" && <ValidationHistory />}
        {activeMenu === "leaderboard" && <OwnerLeaderboard />}
        {activeMenu === "menus" && <MenuManagement />}
        {activeMenu === "fish-types" && <FishTypeManagement />}
        {activeMenu === "events" && <EventManagement />}
      </main>
    </div>
  );
};

export default OwnerDashboard;
