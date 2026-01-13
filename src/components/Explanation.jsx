const Explanation = ({ candidate, onBack }) => {
  return (
    <div>
      <h2>Candidate Explanation</h2>

      <div style={{ border: "1px solid #aaa", padding: "15px" }}>
        <p>
          <strong>{candidate.name}</strong> — Score {candidate.score}
        </p>
        <p>Matched skills: {(candidate.matched_skills || []).join(", ") || "n/a"}</p>
        <p>Experience: {candidate.experience_years ?? "n/a"} years</p>
        <p>Location: {candidate.location || "n/a"}</p>
        <p>Semantic score: {candidate.semantic_score}</p>
        <p>Skill overlap: {candidate.skill_overlap}</p>
        <p style={{ whiteSpace: "pre-wrap" }}>{candidate.summary}</p>
      </div>

      <br />
      <button onClick={onBack}>Back to Results</button>
    </div>
  );
};

export default Explanation;
