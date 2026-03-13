import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Fish, KeyRound } from "lucide-react";
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    password: "",
    password_confirmation: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

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
      await authService.resetPassword({
        token,
        email,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
      });
      toast.success(
        "Password Berhasil Direset",
        "Silakan login dengan password baru Anda.",
      );
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        "Terjadi kesalahan saat mereset password. Silakan coba lagi.";
      const errors = err.response?.data?.errors;

      if (errors) {
        // If there are specific validation errors (e.g. password mismatch), combine them
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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="flex flex-col gap-6 w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center">
          <div className="bg-sky-500 rounded-lg p-2">
            <Fish className="text-white" size={24} />
          </div>
          <span className="font-semibold text-lg">Pemancingan Sutoyo</span>
        </div>

        <Card className="w-full">
          {!token || !email ? (
            <>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-gray-100/50 rounded-full p-4">
                    <KeyRound className="text-muted-foreground" size={28} />
                  </div>
                </div>
                <CardTitle className="text-xl">Link Tidak Valid</CardTitle>
                <CardDescription>
                  Link reset password tidak valid atau sudah expired.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/forgot-password">
                  <Button className="w-full">Minta Link Baru</Button>
                </Link>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-xl">Reset Password</CardTitle>
                <CardDescription>Masukkan password baru Anda.</CardDescription>
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
                      <FieldLabel htmlFor="password">Password Baru</FieldLabel>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
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
                        required
                      />
                    </Field>

                    <Field>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full"
                      >
                        {loading ? "Memproses..." : "Reset Password"}
                      </Button>
                    </Field>
                  </FieldGroup>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
