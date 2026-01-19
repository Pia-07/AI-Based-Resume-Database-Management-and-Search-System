<<<<<<< HEAD
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <div style={{ textAlign: "center", marginTop: "120px" }}>
        <h1>SmartHire</h1>
        <p>AI‑Powered Hiring Assistant for HR</p>

        <div style={{ marginTop: "30px" }}>
          <button onClick={() => navigate("/login")} style={{ marginRight: "12px" }}>
            Login
          </button>
          <button
            onClick={() => navigate("/signup")}
            style={{ backgroundColor: "#22C55E" }}
          >
            Sign Up
          </button>
        </div>
      </div>
    </>
  );
};

export default Landing;
=======
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <div style={{ textAlign: "center", marginTop: "120px" }}>
        <h1>SmartHire</h1>
        <p>AI‑Powered Hiring Assistant for HR</p>

        <div style={{ marginTop: "30px" }}>
          <button onClick={() => navigate("/login")} style={{ marginRight: "12px" }}>
            Login
          </button>
          <button
            onClick={() => navigate("/signup")}
            style={{ backgroundColor: "#22C55E" }}
          >
            Sign Up
          </button>
        </div>
      </div>
    </>
  );
};

export default Landing;
>>>>>>> cffba6ef64ed296d8c4df653b6d3296f72cfa3da
