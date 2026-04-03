// utils.js
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
};

export const formatNumber = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return Number(value).toLocaleString("id-ID");
};

export const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return `Rp ${Number(value).toLocaleString("id-ID")}`;
};

export const formatDateTime = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
};

export const formatShortDay = (dateStr) => {
  if (!dateStr) return "";
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const d = new Date(dateStr + "T00:00:00+07:00"); // explicit Jakarta offset
  return `${dayNames[d.getDay()]} ${d.getDate()}`;
};
