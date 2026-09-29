import React, { useEffect, useState } from "react";
import { FaAtom, FaBookOpen, FaCheckCircle, FaFlask, FaGraduationCap } from "react-icons/fa";
import PublicLayout from "../../components/PublicLayout";

const fallbackIcons = [FaBookOpen, FaAtom, FaGraduationCap, FaFlask];

const Programs = () => {
  const [programs, setPrograms] = useState([]);
  const [activeId, setActiveId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/public/programs`)
      .then((response) => response.json())
      .then((response) => { const items = response.data || []; setPrograms(items); setActiveId(items[0]?._id || ""); })
      .catch(() => setPrograms([]))
      .finally(() => setLoading(false));
  }, []);

  const active = programs.find((program) => program._id === activeId) || programs[0];
  const Icon = active ? fallbackIcons[programs.indexOf(active) % fallbackIcons.length] : FaBookOpen;

  return (
    <PublicLayout>
      <section className="page-banner"><div className="page-banner-inner"><h1>Our Academic Programs</h1><p>Personalised learning pathways for stronger concepts, focused practice and academic growth.</p></div></section>
      <section className="content-section programs-page-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-header programs-intro"><p className="eyebrow">Our academic programmes</p><h2>Tailored Coaching Pathways</h2><p>Explore the programs created by our academy team for clear learning, regular practice and confident progress.</p></div>
          <div className="program-tabs" role="tablist" aria-label="Academic programs">
            {programs.map((program, index) => { const TabIcon = fallbackIcons[index % fallbackIcons.length]; return <button key={program._id} type="button" role="tab" aria-selected={activeId === program._id} className={activeId === program._id ? "program-tab active" : "program-tab"} onClick={() => setActiveId(program._id)}><TabIcon /><span>{program.level || program.name}</span><small>{program.badge}</small></button>; })}
          </div>
          {loading ? <p className="text-slate-400">Loading programs...</p> : active ? <article className="featured-program">
            <div className="featured-program-copy"><p className="program-grade">{active.level ? `GRADE ${active.level.replace(/^grade\s*/i, "")}` : "ACADEMIC PROGRAM"}</p><h2>{active.name}</h2><p>{active.description}</p>{active.monthlyFee && <p className="program-fee">₹ Monthly Tuition Fee: ₹{Number(active.monthlyFee).toLocaleString("en-IN")}</p>}<ul>{(active.features || []).map((feature) => <li key={feature}><FaCheckCircle /> <span>{feature}</span></li>)}</ul><a href="/#enquire" className="primary-button">Request Admission Details</a></div>
            <div className="featured-program-art">{active.imageUrl ? <img src={active.imageUrl} alt={active.name} /> : <><Icon /><span>CONCEPT<br />CLARITY</span></>}</div>
          </article> : <div className="program-empty-state"><h2>Programs will appear here soon.</h2><p>Our academy team is preparing the current learning pathways. Please check back soon or enquire directly.</p><a href="/#enquire" className="primary-button">Enquire now</a></div>}
        </div>
      </section>
    </PublicLayout>
  );
};

export default Programs;
