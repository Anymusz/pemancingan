// File: src/components/TesComponent.jsx
import { useToast } from "@/hooks/useToast";

const TesComponent = () => {
  const toast = useToast();

  const handleSuccess = () => {
    toast.success(
      "Berhasil menyimpan data",
      "Data Anda telah berhasil disimpan ke database. Perubahan akan terlihat dalam beberapa saat.",
    );
  };

  const handleError = () => {
    toast.error(
      "Gagal memuat data",
      "Terjadi kesalahan saat mengambil data dari server. Silakan periksa koneksi internet Anda dan coba lagi.",
    );
  };

  const handleWarning = () => {
    toast.warning(
      "Langganan akan berakhir",
      "Langganan Anda akan berakhir dalam 3 hari. Perpanjang sekarang untuk menghindari gangguan layanan.",
    );
  };

  const handleInfo = () => {
    toast.info(
      "Update tersedia",
      "Versi baru aplikasi telah tersedia. Silakan refresh halaman untuk mendapatkan update terbaru.",
    );
  };

  const handleSuccessShort = () => {
    toast.success("Data tersimpan");
  };

  const handleErrorShort = () => {
    toast.error("Koneksi terputus");
  };

  const handleMultiple = () => {
    toast.success(
      "Toast 1",
      "Ini toast pertama dengan deskripsi panjang untuk test expand collapse feature yang smooth",
    );

    setTimeout(() => {
      toast.info("Toast 2", "Ini toast kedua yang muncul setelah 500ms");
    }, 500);

    setTimeout(() => {
      toast.warning("Toast 3", "Ini toast ketiga untuk test stacking effect");
    }, 1000);

    setTimeout(() => {
      toast.error("Toast 4");
    }, 1500);
  };

  const handleCustomDuration = () => {
    toast.success(
      "Custom Timer",
      "Toast ini akan hilang dalam 10 detik",
      10000,
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-3">
            Toast Component Testing
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Test semua variant dan fitur toast notification
          </p>
        </div>

        {/* Test Sections */}
        <div className="space-y-8">
          {/* Toast dengan Deskripsi */}
          <section className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Toast dengan Deskripsi (Expandable)
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={handleSuccess}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
              >
                Success
              </button>
              <button
                onClick={handleError}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
              >
                Error
              </button>
              <button
                onClick={handleWarning}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-medium"
              >
                Warning
              </button>
              <button
                onClick={handleInfo}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
              >
                Info
              </button>
            </div>
          </section>

          {/* Toast Tanpa Deskripsi */}
          <section className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Toast Tanpa Deskripsi (No Expand Arrow)
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleSuccessShort}
                className="px-4 py-2 bg-green-500/80 hover:bg-green-500 text-white rounded-lg transition-colors font-medium"
              >
                Success Short
              </button>
              <button
                onClick={handleErrorShort}
                className="px-4 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-colors font-medium"
              >
                Error Short
              </button>
            </div>
          </section>

          {/* Special Features */}
          <section className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Special Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={handleMultiple}
                className="px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors font-medium"
              >
                Multiple Toasts (Stack Test)
              </button>
              <button
                onClick={handleCustomDuration}
                className="px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium"
              >
                Custom Duration (10s)
              </button>
            </div>
          </section>

          {/* Instructions */}
          <section className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
              📝 Fitur yang Bisa Ditest:
            </h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li>
                ✅ <strong>Expand/Collapse:</strong> Klik toast dengan deskripsi
                untuk toggle expand
              </li>
              <li>
                ✅ <strong>Hover to Pause:</strong> Hover mouse ke toast untuk
                pause timer
              </li>
              <li>
                ✅ <strong>Progress Bar:</strong> Perhatikan progress bar di
                bawah toast
              </li>
              <li>
                ✅ <strong>Stack Effect:</strong> Test multiple toasts untuk
                lihat stacking visual
              </li>
              <li>
                ✅ <strong>Close Button:</strong> Klik X dengan animasi rotate
                on hover
              </li>
              <li>
                ✅ <strong>Auto Close:</strong> Toast otomatis hilang sesuai
                duration
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TesComponent;
