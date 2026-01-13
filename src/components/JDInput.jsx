<<<<<<< HEAD
import { useState } from "react";
import { searchCandidates } from "../services/api";

const JDInput = ({ onSearch, loading }) => {
  const [jd, setJd] = useState("");
  const [skills, setSkills] = useState("");
  const [topK, setTopK] = useState(5);
  const [location, setLocation] = useState("");

  const handleSubmit = async () => {
    if (!jd.trim()) return;
    await onSearch(() =>
      searchCandidates({
        jobDescription: jd,
        requiredSkills: skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        topK,
        location: location || undefined,
      })
    );
  };

  return (
    <div>
      <h2>Job Description</h2>

      <textarea
        rows="6"
        cols="50"
        placeholder="Paste Job Description here"
        value={jd}
        onChange={(e) => setJd(e.target.value)}
      />

      <div className="form-row">
        <input
          type="text"
          placeholder="Required skills (comma separated)"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
        />
        <input
          type="text"
          placeholder="Preferred location (optional)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <input
          type="number"
          min="1"
          max="20"
          value={topK}
          onChange={(e) => setTopK(Number(e.target.value))}
        />
      </div>

      <br />
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Searching..." : "Search Candidates"}
      </button>
    </div>
  );
};

export default JDInput;
=======
import { useState } from "react";
import { searchCandidates } from "../services/api";

const JDInput = ({ onSearch, loading }) => {
  const [jd, setJd] = useState("");
  const [skills, setSkills] = useState("");
  const [topK, setTopK] = useState(5);
  const [location, setLocation] = useState("");

  const handleSubmit = async () => {
    if (!jd.trim()) return;
    await onSearch(() =>
      searchCandidates({
        jobDescription: jd,
        requiredSkills: skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        topK,
        location: location || undefined,
      })
    );
  };

  return (
    <div>
      <h2>Job Description</h2>

      <textarea
        rows="6"
        cols="50"
        placeholder="Paste Job Description here"
        value={jd}
        onChange={(e) => setJd(e.target.value)}
      />

      <div className="form-row">
        <input
          type="text"
          placeholder="Required skills (comma separated)"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
        />
        <input
          type="text"
          placeholder="Preferred location (optional)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <input
          type="number"
          min="1"
          max="20"
          value={topK}
          onChange={(e) => setTopK(Number(e.target.value))}
        />
      </div>

      <br />
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Searching..." : "Search Candidates"}
      </button>
    </div>
  );
};

export default JDInput;
>>>>>>> cffba6ef64ed296d8c4df653b6d3296f72cfa3da
