// src/App.jsx
import { useState } from "react";
import { getDeckBoosterMatches } from "./ScryfallService";

export default function App() {
  const [deckText, setDeckText] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setDeckText(ev.target.result);
    };
    reader.readAsText(file);
  };

  const extractCardNames = (text) => {
    // Match lines like: "2 Llanowar Elves" or "1 Forest"
    return text
      .split("\n")
      .map((line) => line.replace(/^\d+x?\s*/, "").trim())
      .filter((line) => line && !line.startsWith("//"));
  };

  const analyzeDeck = async () => {
    setLoading(true);
    try {
      const names = extractCardNames(deckText);
      console.log("Extracted card names:", names);
      const boosters = await getDeckBoosterMatches(names);
      console.log("Booster results:", boosters);
      setResults(boosters);
    } catch (err) {
      console.error("Analysis failed:", err);
      alert("Something went wrong while fetching card data. Check console for details.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{ maxWidth: 800, margin: "2rem auto", padding: "1rem" }}>
      <img
        src="./icon.png"
        alt="MTG Best Pull Icon"
        width={120}
        height={120}
        style={{ display: "block", margin: "0 auto 1rem" }}
      />
      <h1>MTG Arena Booster Analyzer</h1>
      <h2>Let's find out which boosters are the best to pull from to lock in your new deck!</h2>
      <p>Paste or upload your MTG Arena deck list below:</p>

      <textarea
        value={deckText}
        onChange={(e) => setDeckText(e.target.value)}
        rows={10}
        style={{ width: "100%", marginBottom: "1rem" }}
        placeholder={`Example:
4 Llanowar Elves
2 Shivan Dragon
...`}
      />

      <div style={{ marginBottom: "1rem" }}>
        <input type="file" accept=".txt" onChange={handleFileUpload} />
      </div>

      <button onClick={analyzeDeck} disabled={loading || !deckText}>
        {loading ? "Analyzing..." : "Analyze Deck"}
      </button>

      {results.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h2>Recommended Booster Packs</h2>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {results.map((set) => (
              <li
                key={set.code}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "1rem",
                  padding: "1rem",
                  border: "1px solid #ccc",
                  borderRadius: 8,
                }}
              >
                {(set.booster_image || set.icon_svg_uri) && (
                  <img
                    src={set.booster_image || set.icon_svg_uri}
                    alt={set.name}
                    width={72}
                    height={72}
                    style={{
                      marginRight: 16,
                      borderRadius: 6,
                      objectFit: "cover",
                      border: "1px solid #aaa",
                    }}
                  />
                )}

                <div>
                  <strong>{set.name}</strong> <br />
                  {set.count} cards from your deck out of {set.card_count || "?"} in set <br />
                  <small>Released: {set.released_at}</small><br />
                  {set.booster_uri && (
                    <a
                      href={set.booster_uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#007bff" }}
                    >
                      View booster details →
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}