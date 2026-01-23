import { useState } from "react";
import { uploadResume } from "../services/api";

const ResumeUpload = () => {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("");

  const handleUpload = async () => {
    if (files.length === 0) {
      setStatus("❌ Please select at least one PDF");
      return;
    }

    try {
      setStatus("⏳ Uploading...");
      const res = await uploadResume(files);
      setStatus(`✅ ${res.resumes.length} resumes uploaded successfully`);
      setFiles([]);
    } catch (err) {
      setStatus("❌ Upload failed");
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px" }}>
      <h2>Upload Resumes</h2>

      <input
        type="file"
        accept=".pdf"
        multiple
        onChange={(e) => setFiles([...e.target.files])}
      />

      <br /><br />

      <button onClick={handleUpload}>Upload</button>

      <p>{status}</p>
    </div>
  );
};

export default ResumeUpload;
