import { useState } from "react";
import { Link } from "react-router-dom";
import { Fish, MailCheck, KeyRound } from "lucide-react";
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
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/common/FormInput";
import { Button } from "@/components/common/Button";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const [emailError, setEmailError] = useState("");

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (emailError) setEmailError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Silakan masukkan alamat email yang valid.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setEmailError("");
      await authService.forgotPassword(email);
      setSubmitted(true);
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
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
          {submitted ? (
            <>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <MailCheck className="text-sky-500" size={48} />
                </div>
                <CardTitle className="text-xl">Periksa Email Anda</CardTitle>
                <CardDescription>
                  Jika email terdaftar, kami telah mengirimkan link reset
                  password. Silakan cek inbox atau folder spam Anda.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/login">
                  <Button variant="outline" className="w-full">
                    Kembali ke Login
                  </Button>
                </Link>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-gray-100/50 rounded-full p-4">
                    <KeyRound className="text-muted-foreground" size={28} />
                  </div>
                </div>
                <CardTitle className="text-xl">Reset Password</CardTitle>
                <CardDescription>
                  Masukkan email akun Anda untuk menerima link reset password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} noValidate>
                  <FieldGroup>
                    {error !== null && (
                      <ErrorAlert
                        description={error}
                        dismissible
                        onDismiss={() => setError(null)}
                      />
                    )}

                    <Field>
                      <FieldLabel
                        htmlFor="email"
                        className={emailError ? "text-destructive" : ""}
                      >
                        Email <span className="text-destructive">*</span>
                      </FieldLabel>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={handleEmailChange}
                        className={
                          emailError
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }
                        required
                      />
                      {emailError && <FieldError>{emailError}</FieldError>}
                    </Field>

                    <Field>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full"
                      >
                        {loading ? "Memproses..." : "Kirim Link Reset"}
                      </Button>
                    </Field>

                    <div className="text-sm text-center text-muted-foreground">
                      Kami akan mengirimkan email berisi link untuk mereset
                      password Anda.
                    </div>
                  </FieldGroup>
                </form>

                <div className="text-sm text-center text-muted-foreground mt-4 pt-4 border-t">
                  Ingat password Anda?{" "}
                  <Link
                    to="/login"
                    className="font-medium text-foreground hover:underline underline-offset-4"
                  >
                    Login
                  </Link>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
