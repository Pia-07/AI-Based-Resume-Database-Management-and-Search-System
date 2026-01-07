import { useState } from "react";
import { uploadResume } from "../services/api";

const ResumeUpload = () => {
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      setStatus("Please select a PDF file");
      return;
    }
    setLoading(true);
    setStatus("Uploading...");
    try {
      const res = await uploadResume(file, { name, location });
      setStatus(
        `Uploaded ${res.parsed.name} (${res.parsed.skills.join(", ") || "skills not detected"})`
      );
      setFile(null);
    } catch (err) {
      setStatus(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Upload Resume</h2>

      <div className="form-row">
        <input
          type="text"
          placeholder="Candidate name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Location (optional)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setFile(e.target.files[0])}
      />

      <br />
      <br />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Uploading..." : "Upload"}
      </button>

      <p>{status}</p>
    </div>
  );
};

export default ResumeUpload;
