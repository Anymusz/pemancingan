import { useState, useEffect } from "react";
import ownerService from "@/services/ownerService";

const ValidationHistory = () => {
  const [history, setHistory] = useState({ approved: [], rejected: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("approved");
  const [selectedRejectedMember, setSelectedRejectedMember] = useState(null);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchValidationHistory();
  }, []);

  const fetchValidationHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ownerService.getValidationHistory();
      setHistory(data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Gagal memuat riwayat validasi");
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateClick = (member) => {
    setSelectedRejectedMember(member);
    setShowReactivateModal(true);
  };

  const handleReactivateConfirm = async () => {
    try {
      setActionLoading(true);

      await ownerService.reactivateRejectedMember(
        selectedRejectedMember.user_id,
      );

      alert("SUCCESS: Member direaktivasi. Silakan review di Pending Members");

      setShowReactivateModal(false);
      setSelectedRejectedMember(null);
      fetchValidationHistory();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Gagal reaktivasi member";
      alert(`ERROR: ${errorMsg}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelModal = () => {
    setShowReactivateModal(false);
    setSelectedRejectedMember(null);
  };

  if (loading) {
    return <div>Loading validation history...</div>;
  }

  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={fetchValidationHistory}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Validation History</h2>

      <div>
        <button
          onClick={() => setActiveTab("approved")}
          disabled={activeTab === "approved"}
        >
          Approved ({history.approved.length})
        </button>
        <button
          onClick={() => setActiveTab("rejected")}
          disabled={activeTab === "rejected"}
        >
          Rejected ({history.rejected.length})
        </button>
      </div>

      {activeTab === "approved" && (
        <div>
          <h3>Approved Members</h3>
          {history.approved.length === 0 ? (
            <p>Belum ada riwayat approved</p>
          ) : (
            <div>
              {history.approved.map((member, index) => (
                <div
                  key={index}
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
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "rejected" && (
        <div>
          <h3>Rejected Members</h3>
          {history.rejected.length === 0 ? (
            <p>Belum ada riwayat rejected</p>
          ) : (
            <div>
              {history.rejected.map((member, index) => (
                <div
                  key={index}
                  style={{
                    border: "1px solid #ccc",
                    padding: "10px",
                    marginBottom: "10px",
                  }}
                >
                  <p>
                    <strong>Nama:</strong> {member.name}
                  </p>
                  <p>
                    <strong>Phone:</strong> {member.phone}
                  </p>
                  <p>
                    <strong>Tanggal Reject:</strong> {member.rejected_at}
                  </p>
                  <p>
                    <strong>Alasan:</strong> {member.rejection_reason || "-"}
                  </p>
                  <button onClick={() => handleReactivateClick(member)}>
                    Reactivate
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showReactivateModal && selectedRejectedMember && (
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
          <h3>Konfirmasi Reactivate</h3>
          <p>
            Member <strong>{selectedRejectedMember.name}</strong> akan
            direaktivasi untuk review ulang. Lanjutkan?
          </p>
          <div>
            <button onClick={handleReactivateConfirm} disabled={actionLoading}>
              {actionLoading ? "Processing..." : "Reactivate"}
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

export default ValidationHistory;
