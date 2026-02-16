import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PendingMembersList from "./PendingMembersList";
import ActiveMembersList from "./ActiveMembersList";
import ValidationHistory from "./ValidationHistory";
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
          <button onClick={handleLogout}>Logout</button>
        </nav>
      </header>

      <main style={{ padding: "20px" }}>
        {activeMenu === "pending" && <PendingMembersList />}
        {activeMenu === "active" && <ActiveMembersList />}
        {activeMenu === "history" && <ValidationHistory />}
      </main>
    </div>
  );
};

export default OwnerDashboard;
