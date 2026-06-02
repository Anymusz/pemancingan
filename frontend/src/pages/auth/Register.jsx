import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Fish } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import authService from "@/services/authService";
import { ErrorAlert } from "@/components/feedback/inlineAlert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/common/FormInput";
import { Button } from "@/components/common/Button";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    password_confirmation: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const response = await authService.register(formData);

      if (response.success) {
        toast.success(
          "Registrasi Berhasil",
          "Akun Anda menunggu validasi owner.",
        );
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Registrasi gagal. Silakan coba lagi.";
      const errors = err.response?.data?.errors;

      if (errors) {
        const errorList = Object.values(errors).flat().join(", ");
        setError(errorList);
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="flex flex-col gap-6 w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 justify-center">
          <div className="flex items-center gap-2">
            <div className="bg-sky-500 rounded-lg p-2">
              <Fish className="text-white" size={24} />
            </div>
            <span className="font-semibold text-lg">Pemancingan Sutoyo</span>
          </div>
        </div>

        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Buat Akun Baru</CardTitle>
            <CardDescription>
              Daftarkan diri Anda untuk mulai menggunakan layanan pemancingan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                {error !== null && (
                  <ErrorAlert
                    description={error}
                    dismissible
                    onDismiss={() => setError(null)}
                  />
                )}

                <Field>
                  <FieldLabel htmlFor="name">Nama Lengkap</FieldLabel>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Masukkan nama lengkap"
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="phone">Nomor HP</FieldLabel>
                  <Input
                    id="phone"
                    name="phone"
                    type="text"
                    placeholder="08123456789"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Masukkan password"
                    required
                  />
                  <span className="text-sm text-muted-foreground">
                    Password minimal 8 karakter
                  </span>
                </Field>

                <Field>
                  <FieldLabel htmlFor="password_confirmation">
                    Konfirmasi Password
                  </FieldLabel>
                  <Input
                    id="password_confirmation"
                    name="password_confirmation"
                    type="password"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    placeholder="Ulangi password"
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="address">Alamat</FieldLabel>
                  <textarea
                    id="address"
                    name="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Masukkan alamat lengkap"
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </Field>

                <Field>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Memproses..." : "Daftar"}
                  </Button>
                  <FieldDescription className="text-center">
                    Sudah punya akun?{" "}
                    <Link to="/login" className="underline underline-offset-4">
                      Login
                    </Link>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        <FieldDescription className="px-6 text-center">
          Dengan melanjutkan, Anda menyetujui{" "}
          <a
            href="#"
            className="underline underline-offset-4 hover:text-primary"
          >
            Ketentuan Layanan
          </a>{" "}
          dan{" "}
          <a
            href="#"
            className="underline underline-offset-4 hover:text-primary"
          >
            Kebijakan Privasi
          </a>{" "}
          kami.
        </FieldDescription>
      </div>
    </div>
  );
};

export default Register;
