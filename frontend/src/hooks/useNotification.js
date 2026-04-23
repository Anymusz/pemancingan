// File: src/hooks/useNotification.js

import { createContext, useContext } from "react";

export const NotificationContext = createContext(null);

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error(
      "useNotification must be used within a NotificationProvider",
    );
  }
  return ctx;
}
