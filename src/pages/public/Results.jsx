import React, { useEffect, useState } from "react";
import { FaArrowRight } from "react-icons/fa";
import PublicLayout from "../../components/PublicLayout";

const Results = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/public/results`)
      .then((response) => response.json())
      .then((response) => setResults(response.data || []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PublicLayout>
      <section className="page-banner"><div className="page-banner-inner"><h1>Student Results</h1><p>See the progress our students make through focused learning and practice.</p></div></section>
      <section className="content-section results-page-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? <p className="text-slate-400">Loading results...</p> : results.length ? <div className="results-grid">
            {results.map((result) => <article className="result-card" key={result._id}>
              <div className="result-card-heading">
                <div><p className="result-program">{result.programName}</p><h2>{result.studentName || "Student"}</h2></div>
                {result.academyName && <span className="result-academy">{result.academyName}</span>}
              </div>
              <div className="result-photos">
                <figure>{result.beforePhotoUrl ? <img src={result.beforePhotoUrl} alt={`${result.studentName || "Student"} before progress`} /> : <div className="result-photo-empty">Photo not provided</div>}<figcaption>Before</figcaption></figure>
                <figure>{result.afterPhotoUrl ? <img src={result.afterPhotoUrl} alt={`${result.studentName || "Student"} after progress`} /> : <div className="result-photo-empty">Photo not provided</div>}<figcaption>After</figcaption></figure>
              </div>
              <div className="result-score">
                <div><span>Before</span><strong>{result.marksBefore}</strong></div>
                <FaArrowRight aria-hidden="true" />
                <div><span>After</span><strong>{result.marksAfter}</strong></div>
              </div>
            </article>)}
          </div> : <div className="results-empty"><h2>Results will appear here soon.</h2><p>Our academy team will share student progress updates here.</p></div>}
        </div>
      </section>
    </PublicLayout>
  );
};

export default Results;