// File: src/pages/employee/CheckIn.jsx

import { useState, useEffect, useRef } from "react";
import employeeService from "../../services/employeeService";
import QRScanner from "./component/QRScanner";

const CheckIn = () => {
  // ==================== SHARED STATE ====================
  const [activeTab, setActiveTab] = useState("manual"); // 'manual' | 'scan'
  const [notes, setNotes] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // ==================== MANUAL TAB STATE ====================
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeout = useRef(null);

  // ==================== SCAN TAB STATE ====================
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // ==================== TOAST ====================
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Reset scan state when switching to manual tab
  useEffect(() => {
    if (activeTab === "manual") {
      setScanResult(null);
      setScanError(null);
      setShowScanner(false);
      setNotes("");
    } else {
      // Switching to scan tab — activate scanner
      setShowScanner(true);
    }
  }, [activeTab]);

  // ==================== MANUAL: REALTIME SEARCH (DEBOUNCE 300ms) ====================
  useEffect(() => {
    if (selectedMember || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await employeeService.searchMember(searchQuery);
        if (res.success) {
          setSearchResults(res.data.members);
        }
      } catch (err) {
        showToast(
          err?.response?.data?.message || "Gagal mencari member",
          "error",
        );
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout.current);
  }, [searchQuery, selectedMember]);

  // ==================== MANUAL HANDLERS ====================
  const handleSelectMember = (member) => {
    setSelectedMember(member);
    setSearchResults([]);
    setSearchQuery(member.name);
  };

  const handleClearSelection = () => {
    setSelectedMember(null);
    setSearchQuery("");
    setSearchResults([]);
    setNotes("");
  };

  // ==================== SCAN HANDLERS ====================
  const handleScanSuccess = async (decodedText) => {
    let parsed;
    try {
      parsed = JSON.parse(decodedText);
    } catch {
      setScanError("QR Code tidak valid — format JSON tidak dikenali.");
      setShowScanner(false);
      return;
    }

    if (parsed.type !== "member") {
      setScanError("QR Code bukan milik member.");
      setShowScanner(false);
      return;
    }

    // Valid QR — resolve via backend
    setShowScanner(false);
    setResolveLoading(true);
    setScanError(null);

    try {
      const res = await employeeService.resolveQR({
        qr_hash: parsed.qr_hash,
        member_id: parsed.member_id,
      });

      if (res.success) {
        setScanResult(res.data);
      } else {
        setScanError(res.message || "Gagal memverifikasi QR Code.");
      }
    } catch (err) {
      setScanError(
        err?.response?.data?.message || "Gagal memverifikasi QR Code.",
      );
    } finally {
      setResolveLoading(false);
    }
  };

  const handleScanError = (errorMsg) => {
    setScanError(errorMsg);
    setShowScanner(false);
  };

  const handleRescan = () => {
    setScanResult(null);
    setScanError(null);
    setNotes("");
    setShowScanner(true);
  };

  // ==================== CHECK-IN (shared for both tabs) ====================
  const handleCheckIn = async (memberId) => {
    setSubmitLoading(true);
    try {
      const res = await employeeService.checkInMember({
        member_id: memberId,
        notes: notes || null,
      });

      if (res.success) {
        showToast(
          `Check-in berhasil! ${res.data.arrival.member.name} (${res.data.arrival.member.tier})`,
        );

        // Reset based on active tab
        if (activeTab === "manual") {
          handleClearSelection();
        } else {
          // Reset scan state and reactivate scanner
          setScanResult(null);
          setScanError(null);
          setNotes("");
          setShowScanner(true);
        }
      }
    } catch (err) {
      showToast(
        err?.response?.data?.message || "Gagal melakukan check-in",
        "error",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  // ==================== RENDER ====================
  return (
    <div>
      {/* Toast */}
      {toast && (
        <div>
          [{toast.type === "success" ? "OK" : "ERROR"}] {toast.message}
        </div>
      )}

      <h1>Check-in Member</h1>

      {/* Tab Buttons */}
      <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <button
          onClick={() => setActiveTab("manual")}
          disabled={activeTab === "manual"}
          style={{
            padding: "8px 16px",
            fontWeight: activeTab === "manual" ? "bold" : "normal",
            background: activeTab === "manual" ? "#2563EB" : "#e5e7eb",
            color: activeTab === "manual" ? "white" : "#374151",
            border: "none",
            borderRadius: 6,
            cursor: activeTab === "manual" ? "default" : "pointer",
          }}
        >
          🔍 Cari Manual
        </button>
        <button
          onClick={() => setActiveTab("scan")}
          disabled={activeTab === "scan"}
          style={{
            padding: "8px 16px",
            fontWeight: activeTab === "scan" ? "bold" : "normal",
            background: activeTab === "scan" ? "#2563EB" : "#e5e7eb",
            color: activeTab === "scan" ? "white" : "#374151",
            border: "none",
            borderRadius: 6,
            cursor: activeTab === "scan" ? "default" : "pointer",
          }}
        >
          📷 Scan QR
        </button>
      </div>

      {/* ===== MANUAL TAB ===== */}
      {activeTab === "manual" && (
        <>
          <section>
            <h2>Cari Member</h2>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (selectedMember) setSelectedMember(null);
              }}
              placeholder="Cari nama / nomor HP / member ID..."
              disabled={!!selectedMember}
            />
            {searchLoading && <span> Mencari...</span>}
            {selectedMember && (
              <button onClick={handleClearSelection}>Ganti Member</button>
            )}

            {/* Autocomplete Dropdown */}
            {searchResults.length > 0 && !selectedMember && (
              <div style={{ border: "1px solid #ccc", marginTop: 4 }}>
                {searchResults.map((member) => (
                  <div
                    key={member.id}
                    onClick={() => handleSelectMember(member)}
                    style={{
                      padding: 8,
                      cursor: "pointer",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <strong>{member.name}</strong> | {member.member_id} | Tier:{" "}
                    {member.tier} | HP: {member.phone}
                  </div>
                ))}
              </div>
            )}

            {/* Tidak ditemukan */}
            {!searchLoading &&
              searchQuery.trim() &&
              !selectedMember &&
              searchResults.length === 0 && <p>Member tidak ditemukan</p>}
          </section>

          {/* Member Preview (manual) */}
          {selectedMember && (
            <section>
              <h2>Data Member</h2>
              <div style={{ border: "1px solid #000", padding: 12 }}>
                <p>
                  <strong>Nama:</strong> {selectedMember.name}
                </p>
                <p>
                  <strong>Member ID:</strong> {selectedMember.member_id}
                </p>
                <p>
                  <strong>Tier:</strong> {selectedMember.tier}
                </p>
                <p>
                  <strong>Total Poin:</strong> {selectedMember.total_points}
                </p>
                <p>
                  <strong>No. HP:</strong> {selectedMember.phone}
                </p>
              </div>

              <div style={{ marginTop: 12 }}>
                <label>Catatan (opsional)</label>
                <br />
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Catatan tambahan..."
                />
              </div>

              <button
                onClick={() => handleCheckIn(selectedMember.id)}
                disabled={submitLoading}
              >
                {submitLoading ? "Memproses..." : "Check-in Sekarang"}
              </button>
            </section>
          )}
        </>
      )}

      {/* ===== SCAN TAB ===== */}
      {activeTab === "scan" && (
        <section>
          <h2>Scan QR Code Member</h2>

          {/* Scanner active */}
          {showScanner && !scanResult && !scanError && (
            <div>
              <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 12 }}>
                Arahkan kamera ke QR Code member...
              </p>
              <QRScanner
                onScanSuccess={handleScanSuccess}
                onScanError={handleScanError}
              />
            </div>
          )}

          {/* Resolving loading */}
          {resolveLoading && (
            <p style={{ color: "#6b7280" }}>Memverifikasi QR Code...</p>
          )}

          {/* Scan Error */}
          {scanError && (
            <div
              style={{
                border: "1px solid #f87171",
                background: "#fef2f2",
                padding: 12,
                borderRadius: 8,
                marginBottom: 12,
              }}
            >
              <p style={{ color: "#dc2626", fontWeight: 500 }}>{scanError}</p>
              <button onClick={handleRescan} style={{ marginTop: 8 }}>
                🔄 Scan Ulang
              </button>
            </div>
          )}

          {/* Scan Result — Member Preview */}
          {scanResult && (
            <div>
              <div style={{ border: "1px solid #000", padding: 12 }}>
                <h3>Data Member</h3>
                <p>
                  <strong>Nama:</strong> {scanResult.name}
                </p>
                <p>
                  <strong>Member ID:</strong> {scanResult.member_id}
                </p>
                <p>
                  <strong>Tier:</strong> {scanResult.tier}
                </p>
                <p>
                  <strong>Total Poin:</strong> {scanResult.total_points}
                </p>
                <p>
                  <strong>No. HP:</strong> {scanResult.phone}
                </p>
              </div>

              {scanResult.active_arrival?.exists ? (
                <div
                  style={{
                    marginTop: 12,
                    padding: 12,
                    background: "#fefce8",
                    border: "1px solid #facc15",
                    borderRadius: 8,
                  }}
                >
                  <p style={{ color: "#a16207", fontWeight: 500 }}>
                    ⚠️ Member sedang aktif, check-in pukul{" "}
                    {new Date(
                      scanResult.active_arrival.check_in_at,
                    ).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <button disabled style={{ marginTop: 8, opacity: 0.5 }}>
                    Check-in (Tidak Tersedia)
                  </button>
                  <button
                    onClick={handleRescan}
                    style={{ marginTop: 8, marginLeft: 8 }}
                  >
                    🔄 Scan Ulang
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: 12 }}>
                  <label>Catatan (opsional)</label>
                  <br />
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Catatan tambahan..."
                  />
                  <br />
                  <button
                    onClick={() => handleCheckIn(scanResult.id)}
                    disabled={submitLoading}
                    style={{ marginTop: 8 }}
                  >
                    {submitLoading ? "Memproses..." : "✅ Konfirmasi Check-in"}
                  </button>
                  <button
                    onClick={handleRescan}
                    style={{ marginTop: 8, marginLeft: 8 }}
                  >
                    🔄 Scan Ulang
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default CheckIn;
