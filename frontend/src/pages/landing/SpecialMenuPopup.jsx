// File: src/pages/landing/SpecialMenuPopup.jsx

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import menuService from "@/services/menuService";
import { isAuthenticated, getUser } from "@/utils/tokenManager";
import { formatCurrency, formatMenuCategory } from "@/utils/utils";
import { Button } from "@/components/common/Button";
import { ImageOff, X } from "lucide-react";

const SESSION_KEY = "specialMenuShownFor";

export default function SpecialMenuPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(false);
  const idKeyRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAndMaybeShow = async () => {
      try {
        setLoading(true);
        const res = await menuService.getSpecialMenus();
        const result = res?.data ?? [];
        if (!Array.isArray(result) || result.length === 0) return;

        const idKey = [...result]
          .map((m) => m.id)
          .sort((a, b) => a - b)
          .join("-");

        let shownFor = null;
        try {
          shownFor = sessionStorage.getItem(SESSION_KEY);
        } catch {
          // private mode — treat as not shown
        }

        if (shownFor === idKey) return;

        idKeyRef.current = idKey;
        setMenus(result);
        setIsOpen(true);
      } catch {
        // silent fail — do not show popup on error
      } finally {
        setLoading(false);
      }
    };

    fetchAndMaybeShow();
  }, []);

  const handleClose = () => {
    try {
      if (idKeyRef.current) {
        sessionStorage.setItem(SESSION_KEY, idKeyRef.current);
      }
    } catch {
      // private mode — ignore
    }
    setIsOpen(false);
  };

  const handleCTA = () => {
    if (!isAuthenticated()) {
      navigate("/login");
      handleClose();
      return;
    }
    const role = getUser()?.role;
    if (role === "member") {
      navigate("/member/dashboard?tab=order");
    }
    handleClose();
  };

  if (!isOpen || menus.length === 0 || loading) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={handleClose}
    >
      <div
        className="bg-background rounded-2xl p-5 max-w-sm w-full mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <p className="font-semibold text-foreground">Menu Spesial Hari Ini</p>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Tutup"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Menu list */}
        <div className="flex flex-col gap-3 mb-5">
          {menus.slice(0, 3).map((menu) => (
            <div key={menu.id} className="flex gap-3 items-start">
              {/* Image or placeholder */}
              {menu.image_url ? (
                <img
                  src={menu.image_url}
                  alt={menu.name}
                  className="size-16 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="size-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <ImageOff className="size-6 text-muted-foreground" />
                </div>
              )}

              {/* Text */}
              <div className="min-w-0">
                <p className="font-medium text-sm text-foreground leading-snug">
                  {menu.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatMenuCategory(menu.category)}
                </p>
                <p className="text-sm font-semibold text-foreground mt-0.5">
                  {formatCurrency(menu.price)}
                </p>
                {menu.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {menu.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Button className="w-full" onClick={handleCTA}>
          Pesan Sekarang
        </Button>
      </div>
    </div>,
    document.body,
  );
}
