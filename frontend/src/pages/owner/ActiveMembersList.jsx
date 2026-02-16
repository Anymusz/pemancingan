import { useState, useEffect } from "react";
import ownerService from "@/services/ownerService";

const ActiveMembersList = () => {
  const [activeMembers, setActiveMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchActiveMembers();
  }, []);

  const fetchActiveMembers = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await ownerService.getValidationHistory();

      // ✅ Add validation
      if (!data?.data?.approved || !Array.isArray(data.data.approved)) {
        throw new Error("Invalid response format");
      }

      setActiveMembers(data.data.approved);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Gagal memuat data active members",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateClick = (member) => {
    setSelectedMember(member);
    setDeactivateReason("");
    setShowDeactivateModal(true);
  };

  const handleDeactivateConfirm = async () => {
    if (!deactivateReason.trim()) {
      alert("ERROR: Alasan deaktivasi wajib diisi");
      return;
    }

    try {
      setActionLoading(true);

      await ownerService.deactivateMember(
        selectedMember.user_id,
        deactivateReason,
      );

      alert(`SUCCESS: Member ${selectedMember.name} berhasil dinonaktifkan`);

      setShowDeactivateModal(false);
      setSelectedMember(null);
      setDeactivateReason("");
      fetchActiveMembers();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Gagal deactivate member";
      alert(`ERROR: ${errorMsg}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelModal = () => {
    setShowDeactivateModal(false);
    setSelectedMember(null);
    setDeactivateReason("");
  };

  if (loading) {
    return <div>Loading active members...</div>;
  }

  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={fetchActiveMembers}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Active Members</h2>

      {activeMembers.length === 0 ? (
        <p>Belum ada member aktif</p>
      ) : (
        <div>
          {activeMembers.map((member) => (
            <div
              key={member.user_id}
              style={{
                border: "1px solid #ccc",
                padding: "10px",
                marginBottom: "10px",
              }}
            >
              <p>
                <strong>Member ID:</strong> {member.member_id}
              </p>
              <p>
                <strong>Nama:</strong> {member.name}
              </p>
              <p>
                <strong>Phone:</strong> {member.phone}
              </p>
              <p>
                <strong>Tier:</strong> {member.tier}
              </p>
              <p>
                <strong>Tanggal Approve:</strong> {member.approved_at}
              </p>
              <button
                onClick={() => handleDeactivateClick(member)}
                disabled={actionLoading}
                style={{ background: "red", color: "white" }}
              >
                Deactivate
              </button>
            </div>
          ))}
        </div>
      )}

      {showDeactivateModal && selectedMember && (
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "white",
            padding: "20px",
            border: "2px solid black",
          }}
        >
          <h3>Konfirmasi Deactivate</h3>
          <p style={{ color: "red", fontWeight: "bold" }}>
            PERHATIAN: Tindakan ini akan menonaktifkan member dan menghapus data
            keanggotaannya
          </p>
          <p>
            Member: <strong>{selectedMember.name}</strong> (
            {selectedMember.member_id})
          </p>
          <div>
            <label>
              Alasan deaktivasi (wajib):
              <textarea
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                rows="4"
                style={{ width: "100%", display: "block", marginTop: "5px" }}
                placeholder="Masukkan alasan deaktivasi..."
              />
            </label>
          </div>
          <div style={{ marginTop: "10px" }}>
            <button
              onClick={handleDeactivateConfirm}
              disabled={actionLoading}
              style={{ background: "red", color: "white" }}
            >
              {actionLoading ? "Processing..." : "Deactivate"}
            </button>
            <button onClick={handleCancelModal} disabled={actionLoading}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveMembersList;
