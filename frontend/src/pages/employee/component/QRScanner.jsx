import { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

const SCANNER_REGION_ID = "qr-reader";

export default function QRScanner({ onScanSuccess, onScanError }) {
  const scannerRef = useRef(null);
  const isRunningRef = useRef(false);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const scanner = new Html5Qrcode(SCANNER_REGION_ID);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (isRunningRef.current) {
            isRunningRef.current = false;
            scanner
              .stop()
              .then(() => onScanSuccess(decodedText))
              .catch(() => onScanSuccess(decodedText));
          }
        },
        () => {
          // Ignore continuous "no QR found" errors
        },
      )
      .then(() => {
        isRunningRef.current = true;
      })
      .catch((err) => {
        onScanError?.("Gagal mengakses kamera: " + err);
      });

    return () => {
      if (isRunningRef.current) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {})
          .finally(() => {
            isRunningRef.current = false;
          });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      id={SCANNER_REGION_ID}
      style={{ width: "100%", maxWidth: "400px", margin: "0 auto" }}
    />
  );
}
