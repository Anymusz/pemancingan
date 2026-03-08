// File: src/pages/owner/event-management/EventFormModal.jsx

export default function EventFormModal({
  mode,
  form,
  setForm,
  formErrors,
  imagePreview,
  fileInputRef,
  onImageChange,
  onRemoveImage,
  onResetImage,
  onSubmit,
  onClose,
  submitLoading,
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            {mode === "edit" ? "Edit Acara/Pengumuman" : "Tambah Acara/Pengumuman"}
          </h2>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Judul *
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
            />
            {formErrors.title && (
              <span className="text-xs text-red-500 mt-1">
                {formErrors.title}
              </span>
            )}
          </div>

          {/* Category */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategori *
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.category}
              onChange={(e) => {
                const newCat = e.target.value;
                setForm((p) => ({ ...p, category: newCat }));
                // Reset image when switching to info
                if (newCat === "info") {
                  onResetImage();
                }
              }}
            >
              <option value="event">Acara</option>
              <option value="info">Pengumuman</option>
            </select>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deskripsi *
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={5}
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
            />
            {formErrors.description && (
              <span className="text-xs text-red-500 mt-1">
                {formErrors.description}
              </span>
            )}
          </div>

          {/* Date fields — event: both required */}
          {form.category === "event" && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Mulai *
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.start_date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, start_date: e.target.value }))
                  }
                />
                {formErrors.start_date && (
                  <span className="text-xs text-red-500 mt-1">
                    {formErrors.start_date}
                  </span>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Berakhir *
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.end_date}
                  min={form.start_date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, end_date: e.target.value }))
                  }
                />
                {formErrors.end_date && (
                  <span className="text-xs text-red-500 mt-1">
                    {formErrors.end_date}
                  </span>
                )}
              </div>
            </>
          )}

          {/* Date fields — info: both optional */}
          {form.category === "info" && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Mulai{" "}
                  <span className="text-gray-400">(opsional)</span>
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.start_date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, start_date: e.target.value }))
                  }
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Masa Berlaku{" "}
                  <span className="text-gray-400">(opsional)</span>
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.end_date}
                  min={form.start_date}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, end_date: e.target.value }))
                  }
                />
              </div>
            </>
          )}

          {/* Image Upload — only for event category */}
          {form.category === "event" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gambar{" "}
                <span className="text-gray-400">(opsional, maks 5MB)</span>
              </label>

              {imagePreview && (
                <div className="mb-2 relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-w-xs h-40 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={onRemoveImage}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ✕
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={onImageChange}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          )}

          {/* Status */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.status}
              onChange={(e) =>
                setForm((p) => ({ ...p, status: e.target.value }))
              }
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onSubmit}
              disabled={submitLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitLoading
                ? "Menyimpan..."
                : mode === "edit"
                  ? "Simpan Perubahan"
                  : "Buat"}
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
    </div>
  );
}
