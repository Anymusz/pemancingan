// File: src/pages/Unauthorized.jsx

import { useNavigate } from "react-router-dom";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/common/Button";

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center">
      <ShieldOff className="w-16 h-16 text-destructive" />
      <h1 className="text-2xl font-bold text-foreground">Akses Ditolak</h1>
      <p className="text-muted-foreground text-sm max-w-xs">
        Kamu tidak memiliki izin untuk mengakses halaman ini.
      </p>
      <Button variant="outline" onClick={() => navigate("/login")}>
        Kembali ke Login
      </Button>
    </div>
  );
}
