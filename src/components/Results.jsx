const Results = ({ candidates, onSelect }) => {
  return (
    <div>
      <h2>Candidate Results</h2>

      {candidates.map((c, i) => (
        <div
          key={i}
          style={{
            border: "1px solid #ccc",
            margin: "10px",
            padding: "10px"
          }}
        >
          <h3>{c.name}</h3>
          <p>Score: {c.score}</p>

          <button onClick={() => onSelect(c)}>
            View Explanation
          </button>
        </div>
      ))}
    </div>
  );
};

export default Results;
