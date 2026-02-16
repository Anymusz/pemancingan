import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setToken } from "@/utils/tokenManager";
import api from "@/services/api";

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

      // Simpan token
      setToken(token);

      // Simpan user data ke localStorage
      localStorage.setItem("user", JSON.stringify(user));

      // Role-based redirect
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
    <div
      style={{
        maxWidth: "400px",
        margin: "100px auto",
        padding: "20px",
        border: "1px solid #ccc",
      }}
    >
      <h2>Login</h2>

      {error && (
        <div
          style={{
            padding: "10px",
            background: "#ffebee",
            color: "#c62828",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>
            Phone / Email:
          </label>
          <input
            type="text"
            name="login"
            value={formData.login}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px", fontSize: "14px" }}
            placeholder="08123456789 atau email@example.com"
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>
            Password:
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px", fontSize: "14px" }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px",
            fontSize: "16px",
            background: loading ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Loading..." : "Login"}
        </button>
      </form>

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <p>Testing Accounts:</p>
        <small>Owner: 081234567890 / password</small>
        <br />
        <small>Employee: 081234567891 / password</small>
        <br />
        <small>Member: 081234567892 / password</small>
      </div>
    </div>
  );
};

export default Login;
