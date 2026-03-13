import { createPortal } from "react-dom";
import Toast from "./Toast";

export const ToastContainer = ({ toasts, onClose }) => {
  return createPortal(
    <div className="fixed top-4 right-4 left-4 z-[9999] pointer-events-none sm:left-auto sm:w-[340px]">
      <div className="relative w-full">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            className="absolute top-0 right-0 w-full pointer-events-auto transition-all duration-300"
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
