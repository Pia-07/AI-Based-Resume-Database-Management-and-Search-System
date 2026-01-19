<<<<<<< HEAD
const Results = ({ candidates, onSelect, loading, error }) => {
  return (
    <div>
      <h2>Candidate Results</h2>

      {loading && <p>Searching...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !candidates.length && !error && (
        <p>No results yet. Upload resumes and search with a JD.</p>
      )}

      {candidates.map((c, i) => (
        <div
          key={c.resume_id || i}
          style={{
            border: "1px solid #ccc",
            margin: "10px",
            padding: "10px"
          }}
        >
          <h3>{c.name || "Unnamed candidate"}</h3>
          <p>Score: {Math.round((c.score || 0) * 100) / 100}</p>
          <p>Matched skills: {(c.matched_skills || []).join(", ") || "n/a"}</p>
          <p>Experience: {c.experience_years ?? "n/a"} years</p>

          <button onClick={() => onSelect(c)}>
            View Explanation
          </button>
        </div>
      ))}
    </div>
  );
};

export default Results;
=======
const Results = ({ candidates, onSelect, loading, error }) => {
  return (
    <div>
      <h2>Candidate Results</h2>

      {loading && <p>Searching...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !candidates.length && !error && (
        <p>No results yet. Upload resumes and search with a JD.</p>
      )}

      {candidates.map((c, i) => (
        <div
          key={c.resume_id || i}
          style={{
            border: "1px solid #ccc",
            margin: "10px",
            padding: "10px"
          }}
        >
          <h3>{c.name || "Unnamed candidate"}</h3>
          <p>Score: {Math.round((c.score || 0) * 100) / 100}</p>
          <p>Matched skills: {(c.matched_skills || []).join(", ") || "n/a"}</p>
          <p>Experience: {c.experience_years ?? "n/a"} years</p>

          <button onClick={() => onSelect(c)}>
            View Explanation
          </button>
        </div>
      ))}
    </div>
  );
};

export default Results;
>>>>>>> cffba6ef64ed296d8c4df653b6d3296f72cfa3da
