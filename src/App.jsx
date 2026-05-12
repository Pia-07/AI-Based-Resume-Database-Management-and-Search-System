import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Landing from "./pages/Landing";
import Features from "./pages/Features";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Chatbot from "./pages/Chatbot";
import Upload from "./pages/Upload";
import SkillQuiz from "./pages/SkillQuiz";
import HRDashboard from "./pages/HRDashboard";
import StudentsDashboard from "./pages/StudentsDashboard";
import AppLayout from "./layouts/AppLayout";

function App() {
  // Global Theme Initialization
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
  }, []);

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID"}>
      <BrowserRouter>
        <Routes>
          {/* Public routes — no sidebar */}
          <Route path="/" element={<Landing />} />
          <Route path="/features" element={<Features />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/quiz/:quizId" element={<SkillQuiz />} />

          {/* Authenticated routes — persistent sidebar via AppLayout */}
          <Route element={<AppLayout />}>
            <Route path="/chatbot" element={<Chatbot />} />
            <Route path="/dashboard" element={<HRDashboard />} />
            <Route path="/students" element={<StudentsDashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
