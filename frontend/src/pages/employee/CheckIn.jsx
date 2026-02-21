// File: src/pages/employee/CheckIn.jsx

import { useState, useEffect, useRef } from "react";
import employeeService from "../../services/employeeService";

const CheckIn = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [notes, setNotes] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const searchTimeout = useRef(null);

  // ==================== TOAST ====================
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ==================== REALTIME SEARCH (DEBOUNCE 300ms) ====================
  useEffect(() => {
    // Jangan search jika sudah ada member terpilih atau query kosong
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

  // ==================== HANDLERS ====================
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

  // ==================== CHECK-IN ====================
  const handleCheckIn = async () => {
    if (!selectedMember) return;

    setSubmitLoading(true);
    try {
      const res = await employeeService.checkInMember({
        member_id: selectedMember.id,
        notes: notes || null,
      });

      if (res.success) {
        showToast(
          `Check-in berhasil! ${res.data.arrival.member.name} (${res.data.arrival.member.tier})`,
        );
        handleClearSelection();
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

      {/* ===== SEARCH FORM ===== */}
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

      {/* ===== MEMBER PREVIEW ===== */}
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

          <button onClick={handleCheckIn} disabled={submitLoading}>
            {submitLoading ? "Memproses..." : "Check-in Sekarang"}
          </button>
        </section>
      )}
    </div>
  );
};

export default CheckIn;
