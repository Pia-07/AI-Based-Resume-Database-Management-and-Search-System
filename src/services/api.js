const BASE_URL = "http://127.0.0.1:8000";

/* ===========================
   RESUME UPLOAD API
=========================== */
export const uploadResume = async (files) => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file); // ✅ must match backend
  });

  const response = await fetch("http://127.0.0.1:8000/upload_resume", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(err);
  }

  return await response.json();
};


/* ===========================
   CHATBOT (RAG / REAL-TIME)
=========================== */
export const sendChatMessage = async (message) => {
  const response = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: message,
    }),
  });

  if (!response.ok) {
    throw new Error("Chat request failed");
  }

  return await response.json();
};

/* ===========================
   AUTH APIs (LOGIN / SIGNUP)
=========================== */
export const signupUser = async (email, password) => {
  const response = await fetch(`${BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return await response.json();
};

export const loginUser = async (email, password) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return await response.json();
};
