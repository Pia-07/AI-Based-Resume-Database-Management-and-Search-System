import { useState } from "react";
import { uploadResume } from "../services/api";

const ResumeUpload = () => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");

  const handleUpload = async () => {
    if (!file) {
      setStatus("❌ Please select a PDF file");
      return;
    }

    setStatus("⏳ Uploading resume...");

    try {
      const response = await uploadResume(file);
      setStatus(`✅ ${response.message}`);
    } catch (error) {
      console.error(error);
      setStatus("❌ Upload failed. Check backend.");
    }
  };

  return (
    <div style={{ padding: "20px", border: "1px solid #ccc" }}>
      <h2>Upload Resume</h2>

      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <br /><br />

      <button onClick={handleUpload}>Upload</button>

      <p>{status}</p>
    </div>
  );
};

export default ResumeUpload;
