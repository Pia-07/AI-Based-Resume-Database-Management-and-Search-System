import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { signupUser } from "../services/api";

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password) {
      alert("Fill all fields");
      return;
    }

    try {
      setLoading(true);
      const response = await signupUser(email, password);

      if (response.error) {
        alert(response.error);
      } else {
        alert("Signup successful");
        navigate("/chatbot");
      }
    } catch (err) {
      console.error(err);
      alert("Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="card"
      style={{
        maxWidth: "400px",
        margin: "120px auto",
        padding: "25px",
        boxSizing: "border-box"
      }}
    >
      <h2>Sign Up</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "12px",
          boxSizing: "border-box"
        }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "12px",
          boxSizing: "border-box"
        }}
      />

      <button
        onClick={handleSignup}
        style={{ width: "100%" }}
        disabled={loading}
      >
        {loading ? "Creating account..." : "Create Account"}
      </button>
    </div>
  );
};

export default Signup;
