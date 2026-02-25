// File: src/pages/employee/EmployeeDashboard.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CheckIn from "./CheckIn";
import TodayArrivals from "./TodayArrivals";
import Checkout from "./Checkout";
import TransactionHistory from "./TransactionHistory";
import AddOrder from "./AddOrder";
import PendingOrder from "./PendingOrder";
import MenuAvailability from "./MenuAvailability";
import { removeToken, removeUser } from "@/utils/tokenManager";

const EmployeeDashboard = () => {
  const [activeMenu, setActiveMenu] = useState("checkin");
  const [mountedTabs, setMountedTabs] = useState(new Set(["checkin"]));
  const [preselectArrivalId, setPreselectArrivalId] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    removeToken();
    removeUser();
    navigate("/login");
  };

  const handleMenuChange = (menu) => {
    setMountedTabs((prev) => new Set([...prev, menu]));
    setActiveMenu(menu);
  };

  const handleGoToCheckout = (arrivalId) => {
    setPreselectArrivalId(arrivalId);
    handleMenuChange("checkout");
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
            onClick={() => handleMenuChange("pendingorder")}
            disabled={activeMenu === "pendingorder"}
          >
            Pesanan Masuk
          </button>
          <button
            onClick={() => handleMenuChange("addorder")}
            disabled={activeMenu === "addorder"}
          >
            Tambah Order
          </button>
          <button
            onClick={() => handleMenuChange("checkin")}
            disabled={activeMenu === "checkin"}
          >
            Check-in Member
          </button>
          <button
            onClick={() => handleMenuChange("arrivals")}
            disabled={activeMenu === "arrivals"}
          >
            Kedatangan Hari Ini
          </button>
          <button
            onClick={() => handleMenuChange("checkout")}
            disabled={activeMenu === "checkout"}
          >
            Checkout Transaksi
          </button>
          <button
            onClick={() => handleMenuChange("menuavailability")}
            disabled={activeMenu === "menuavailability"}
          >
            Ketersediaan Menu
          </button>
          <button
            onClick={() => handleMenuChange("history")}
            disabled={activeMenu === "history"}
          >
            Riwayat Transaksi
          </button>
          {" | "}
          <button onClick={handleLogout}>Logout</button>
        </nav>
      </header>

      <main style={{ padding: "20px" }}>
        {[
          "pendingorder",
          "addorder",
          "checkin",
          "arrivals",
          "checkout",
          "history",
          "menuavailability",
        ].map((menu) => {
          if (activeMenu !== menu && !mountedTabs.has(menu)) return null;

          return (
            <div
              key={menu}
              style={{ display: activeMenu === menu ? "block" : "none" }}
            >
              {menu === "pendingorder" && <PendingOrder />}
              {menu === "addorder" && <AddOrder />}
              {menu === "checkin" && <CheckIn />}
              {menu === "arrivals" && (
                <TodayArrivals onGoToCheckout={handleGoToCheckout} />
              )}
              {menu === "menuavailability" && <MenuAvailability />}
              {menu === "checkout" && (
                <Checkout
                  preselectArrivalId={preselectArrivalId}
                  onPreselectConsumed={() => setPreselectArrivalId(null)}
                />
              )}
              {menu === "history" && <TransactionHistory />}
            </div>
          );
        })}
      </main>
    </div>
  );
};

export default EmployeeDashboard;
