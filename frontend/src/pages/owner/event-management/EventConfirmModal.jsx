// File: src/pages/owner/event-management/EventConfirmModal.jsx

const MODAL_CONFIG = {
  publish: {
    getMessage: (title) =>
      `Publikasikan event "${title}"? Event akan terlihat oleh semua pengguna.`,
    confirmLabel: "Ya, Publikasikan",
    confirmClass: "bg-blue-600 hover:bg-blue-700",
  },
  unpublish: {
    getMessage: (title) =>
      `Unpublish event "${title}"? Event tidak akan terlihat publik.`,
    confirmLabel: "Ya, Unpublish",
    confirmClass: "bg-yellow-600 hover:bg-yellow-700",
  },
  delete: {
    getMessage: (title) =>
      `Hapus event "${title}"? Tindakan ini tidak dapat dibatalkan.`,
    confirmLabel: "Ya, Hapus",
    confirmClass: "bg-red-600 hover:bg-red-700",
  },
};

export default function EventConfirmModal({
  type,
  event,
  onConfirm,
  onClose,
  submitLoading,
}) {
  if (!type || !event) return null;

  const config = MODAL_CONFIG[type];
  if (!config) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <p className="text-gray-700 mb-4">{config.getMessage(event.title)}</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={submitLoading}
            className={`flex-1 px-4 py-2 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors ${config.confirmClass}`}
          >
            {submitLoading ? "Memproses..." : config.confirmLabel}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
