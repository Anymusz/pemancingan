// FILE 5: src/pages/NotFound.jsx (EXAMPLE)
// ============================================
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-background">
      <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8">
        Halaman tidak ditemukan
      </p>
      <Link to="/">
        <Button size="lg">Kembali ke Beranda</Button>
      </Link>
    </div>
  );
}
