// File: src/contexts/ToastContext.jsx
import { createContext, useState } from "react";
import ToastContainer from "@/components/feedback/ToastContainer";

// eslint-disable-next-line react-refresh/only-export-components
export const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = ({ variant = "info", title, description, duration }) => {
    const id = Date.now() + Math.random();

    const newToast = {
      id,
      variant,
      title,
      description,
      duration,
    };

    setToasts((prev) => [newToast, ...prev]);
    return id;
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const toast = {
    success: (title, description, duration) =>
      addToast({ variant: "success", title, description, duration }),
    error: (title, description, duration) =>
      addToast({ variant: "error", title, description, duration }),
    warning: (title, description, duration) =>
      addToast({ variant: "warning", title, description, duration }),
    info: (title, description, duration) =>
      addToast({ variant: "info", title, description, duration }),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
};
