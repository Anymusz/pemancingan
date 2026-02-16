import { useState, useEffect } from "react";
import ownerService from "@/services/ownerService";

const PendingMembersList = () => {
  const [pendingMembers, setPendingMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPendingMembers();
  }, []);

  const fetchPendingMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ownerService.getPendingMembers();
      setPendingMembers(data.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Gagal memuat data pending members",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (member) => {
    setSelectedMember(member);
    setShowApproveModal(true);
  };

  const handleRejectClick = (member) => {
    setSelectedMember(member);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const handleApproveConfirm = async () => {
    try {
      setActionLoading(true);
      const result = await ownerService.approveMember(selectedMember.id);

      alert(
        `SUCCESS: Member ${result.data.name} berhasil divalidasi. Member ID: ${result.data.member_id}`,
      );

      setShowApproveModal(false);
      setSelectedMember(null);
      fetchPendingMembers();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Gagal approve member";
      alert(`ERROR: ${errorMsg}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    try {
      setActionLoading(true);
      const result = await ownerService.rejectMember(
        selectedMember.id,
        rejectionReason || null,
      );

      alert(`SUCCESS: Member ${result.data.name} berhasil ditolak`);

      setShowRejectModal(false);
      setSelectedMember(null);
      setRejectionReason("");
      fetchPendingMembers();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Gagal reject member";
      alert(`ERROR: ${errorMsg}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelModal = () => {
    setShowApproveModal(false);
    setShowRejectModal(false);
    setSelectedMember(null);
    setRejectionReason("");
  };

  if (loading) {
    return <div>Loading pending members...</div>;
  }

  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={fetchPendingMembers}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Pending Members</h2>

      {pendingMembers.length === 0 ? (
        <p>Tidak ada member yang menunggu validasi</p>
      ) : (
        <div>
          {pendingMembers.map((member) => (
            <div
              key={member.id}
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
                <strong>Email:</strong> {member.email || "-"}
              </p>
              <p>
                <strong>Alamat:</strong> {member.address}
              </p>
              <p>
                <strong>Tanggal Daftar:</strong> {member.registered_at}
              </p>
              <div>
                <button
                  onClick={() => handleApproveClick(member)}
                  disabled={actionLoading}
                >
                  Approve
                </button>
                <button
                  onClick={() => handleRejectClick(member)}
                  disabled={actionLoading}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showApproveModal && selectedMember && (
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
          <h3>Konfirmasi Approve</h3>
          <p>
            Apakah Anda yakin ingin menyetujui member{" "}
            <strong>{selectedMember.name}</strong>?
          </p>
          <div>
            <button onClick={handleApproveConfirm} disabled={actionLoading}>
              {actionLoading ? "Processing..." : "Approve"}
            </button>
            <button onClick={handleCancelModal} disabled={actionLoading}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {showRejectModal && selectedMember && (
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
          <h3>Konfirmasi Reject</h3>
          <p>
            Apakah Anda yakin ingin menolak member{" "}
            <strong>{selectedMember.name}</strong>?
          </p>
          <div>
            <label>
              Alasan penolakan (opsional):
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows="4"
                style={{ width: "100%", display: "block", marginTop: "5px" }}
              />
            </label>
          </div>
          <div style={{ marginTop: "10px" }}>
            <button onClick={handleRejectConfirm} disabled={actionLoading}>
              {actionLoading ? "Processing..." : "Reject"}
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

export default PendingMembersList;
