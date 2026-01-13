<<<<<<< HEAD
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = () => {
    // 🔐 Dummy signup
    if (email && password) {
      navigate("/chatbot");
    } else {
      alert("Fill all fields");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "120px auto" }} className="card">
      <h2>Sign Up</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", padding: "10px", marginBottom: "12px" }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", padding: "10px", marginBottom: "12px" }}
      />

      <button onClick={handleSignup} style={{ width: "100%" }}>
        Create Account
      </button>
    </div>
  );
};

export default Signup;
=======
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Signup = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = () => {
    // 🔐 Dummy signup
    if (email && password) {
      navigate("/chatbot");
    } else {
      alert("Fill all fields");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "120px auto" }} className="card">
      <h2>Sign Up</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", padding: "10px", marginBottom: "12px" }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: "100%", padding: "10px", marginBottom: "12px" }}
      />

      <button onClick={handleSignup} style={{ width: "100%" }}>
        Create Account
      </button>
    </div>
  );
};

export default Signup;
>>>>>>> cffba6ef64ed296d8c4df653b6d3296f72cfa3da
