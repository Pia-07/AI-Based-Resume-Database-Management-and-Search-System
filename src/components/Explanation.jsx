const Explanation = ({ candidate, onBack }) => {
  return (
    <div>
      <h2>Candidate Explanation</h2>

      <div style={{ border: "1px solid #aaa", padding: "15px" }}>
        <p>
          <strong>{candidate.name}</strong> was selected because:
        </p>
        <p>{candidate.justification}</p>
      </div>

      <br />
      <button onClick={onBack}>Back to Results</button>
    </div>
  );
};

export default Explanation;
