// File: src/components/feedback/ToastContainer.jsx
import { createPortal } from "react-dom";
import Toast from "./Toast";
import { cn } from "@/lib/utils";

export const ToastContainer = ({ toasts, onClose }) => {
  return createPortal(
    <div className="fixed top-6 right-6 z-[9999] pointer-events-none">
      {/* STACK CONTAINER */}
      <div className="relative w-[340px]">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className="absolute top-0 right-0 pointer-events-auto transition-all duration-300"
            style={{
              zIndex: 100 - index,
              transform: `translateY(${index * 8}px)`,
            }}
          >
            <Toast {...toast} index={index} onClose={onClose} />
          </div>
        ))}
      </div>
    </div>,
    document.body,
  );
};

export default ToastContainer;
