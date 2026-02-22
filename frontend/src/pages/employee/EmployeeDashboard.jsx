// File: src/pages/employee/EmployeeDashboard.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CheckIn from "./CheckIn";
import TodayArrivals from "./TodayArrivals";
import Checkout from "./Checkout";
import TransactionHistory from "./TransactionHistory";
import { removeToken, removeUser } from "@/utils/tokenManager";
import AddOrder from "./AddOrder";

const EmployeeDashboard = () => {
  const [activeMenu, setActiveMenu] = useState("checkin");
  const navigate = useNavigate();

  const handleLogout = () => {
    removeToken();
    removeUser();
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
        <h1>Employee Dashboard</h1>
        <nav>
          <button
            onClick={() => setActiveMenu("addorder")}
            disabled={activeMenu === "addorder"}
          >
            Tambah Order
          </button>
          <button
            onClick={() => setActiveMenu("checkin")}
            disabled={activeMenu === "checkin"}
          >
            Check-in Member
          </button>
          <button
            onClick={() => setActiveMenu("arrivals")}
            disabled={activeMenu === "arrivals"}
          >
            Kedatangan Hari Ini
          </button>
          <button
            onClick={() => setActiveMenu("checkout")}
            disabled={activeMenu === "checkout"}
          >
            Checkout Transaksi
          </button>
          <button
            onClick={() => setActiveMenu("history")}
            disabled={activeMenu === "history"}
          >
            Riwayat Transaksi
          </button>
          {" | "}
          <button onClick={handleLogout}>Logout</button>
        </nav>
      </header>

      <main style={{ padding: "20px" }}>
        {activeMenu === "checkin" && <CheckIn />}
        {activeMenu === "arrivals" && <TodayArrivals />}
        {activeMenu === "checkout" && <Checkout />}
        {activeMenu === "history" && <TransactionHistory />}
        {activeMenu === "addorder" && <AddOrder />}
      </main>
    </div>
  );
};

export default EmployeeDashboard;
