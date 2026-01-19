<<<<<<< HEAD
<<<<<<< HEAD
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

export const uploadResume = async (file, payload = {}) => {
  const formData = new FormData();
  formData.append("file", file);
  if (payload.name) formData.append("name", payload.name);
  if (payload.location) formData.append("location", payload.location);

  const res = await fetch(`${API_BASE}/resumes`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Upload failed");
  }

  return res.json();
};

export const searchCandidates = async ({
  jobDescription,
  requiredSkills = [],
  topK = 5,
  location,
}) => {
  const res = await fetch(`${API_BASE}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      job_description: jobDescription,
      required_skills: requiredSkills,
      top_k: topK,
      location,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Search failed");
  }

  return res.json();
=======
export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("http://127.0.0.1:8000/upload_resume", {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error("Upload failed");
  }

  return response.json();
>>>>>>> bd3bed210af2ea99ac8470389e356018c97d1c83
};
=======
<<<<<<< HEAD
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";

export const uploadResume = async (file, payload = {}) => {
  const formData = new FormData();
  formData.append("file", file);
  if (payload.name) formData.append("name", payload.name);
  if (payload.location) formData.append("location", payload.location);

  const res = await fetch(`${API_BASE}/resumes`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Upload failed");
  }

  return res.json();
};

export const searchCandidates = async ({
  jobDescription,
  requiredSkills = [],
  topK = 5,
  location,
}) => {
  const res = await fetch(`${API_BASE}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      job_description: jobDescription,
      required_skills: requiredSkills,
      top_k: topK,
      location,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Search failed");
  }

  return res.json();
=======
export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("http://127.0.0.1:8000/upload_resume", {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error("Upload failed");
  }

  return response.json();
>>>>>>> bd3bed210af2ea99ac8470389e356018c97d1c83
};
>>>>>>> cffba6ef64ed296d8c4df653b6d3296f72cfa3da
