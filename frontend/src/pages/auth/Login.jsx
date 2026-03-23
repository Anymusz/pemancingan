import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Fish } from "lucide-react";
import { setToken, setUser } from "@/utils/tokenManager";
import api from "@/services/api";
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

const Login = () => {
  const [formData, setFormData] = useState({
    login: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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

      const response = await api.post("/login", {
        login: formData.login,
        password: formData.password,
      });

      const { user, token } = response.data.data;

      setToken(token);
      setUser(user);

      if (user.role === "owner") {
        navigate("/owner/dashboard");
      } else if (user.role === "employee") {
        navigate("/employee/dashboard");
      } else if (user.role === "member") {
        navigate("/member/dashboard");
      } else {
        navigate("/");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Login gagal";
      setError(errorMessage);
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

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Selamat Datang</CardTitle>
            <CardDescription>
              Kelola transaksi, member, dan aktivitas pemancingan secara
              digital.
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
                  <FieldLabel htmlFor="login">No. HP / Email</FieldLabel>
                  <Input
                    id="login"
                    name="login"
                    type="text"
                    value={formData.login}
                    onChange={handleChange}
                    placeholder="08123456789 atau email@example.com"
                    required
                  />
                </Field>

                <Field>
                  <div className="flex items-center">
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Link
                      to="/forgot-password"
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                      Lupa password?
                    </Link>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p>Testing Accounts:</p>
                    <small>Owner: 081234567890 / password</small>
                    <br />
                    <small>Employee: 081234567891 / password</small>
                    <br />
                    <small>Member: 081234567892 / password</small>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </Field>

                <Field>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Memproses..." : "Login"}
                  </Button>
                  <FieldDescription className="text-center">
                    Belum punya akun?{" "}
                    <Link
                      to="/register"
                      className="underline underline-offset-4"
                    >
                      Daftar di sini
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

export default Login;
