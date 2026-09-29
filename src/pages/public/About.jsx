import React, { useEffect, useState } from "react";
import { FaQuoteLeft } from "react-icons/fa";
import PublicLayout from "../../components/PublicLayout";
import { PLATFORM_NAME, PLATFORM_TAGLINE } from "../../config/branding";

const About = () => {
  const [story, setStory] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/public/story`)
      .then((response) => response.json())
      .then((response) => setStory(response.data))
      .catch(() => setStory(null));
  }, []);

  const fallback = [
    `${PLATFORM_NAME} was created to make learning more meaningful for students and more reassuring for parents. We believe academic growth starts with clarity, consistency, and confidence — not pressure.`,
    "Our approach focuses on strong fundamentals, individual attention, regular practice, and guided support so students can understand concepts deeply and improve steadily over time.",
    `With a teaching style that values patience, consistent feedback, and real progress, we help students become more confident in class and more prepared for what comes next. ${PLATFORM_TAGLINE}`,
  ];

  return <PublicLayout>
    <section className="page-inner-section">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="story-editorial-grid">
          <div className="story-portrait-column">
            {story?.leaderPhotoUrl ? <img src={story.leaderPhotoUrl} alt={story.leaderName || "Academy principal or mentor"} className="story-leader-photo" /> : <div className="story-photo-placeholder story-leader-photo">NGA</div>}
            {story?.leaderName && <div className="story-portrait-caption"><p>— {story.leaderName.toUpperCase()}, {story.leaderRole?.toUpperCase() || "PRINCIPAL / MENTOR"}</p></div>}
          </div>
          <div className="story-narrative">
            <h2>The Heart Behind {story?.academyName || PLATFORM_NAME}</h2>
            <p className="story-lead">{story?.intro || fallback[0]}</p>
            <p>{story?.story || fallback[1]}</p>
            <div className="story-quote"><FaQuoteLeft /><p>{story?.mission || "Built with dedication and care, our academy stands for clear learning, disciplined practice and the belief that every student can grow with the right support."}</p></div>
            <p>{story?.vision || fallback[2]}</p>
            {story?.leaderName && <div className="story-signature"><strong>{story.leaderName}</strong><span>{story.leaderRole || "Principal / Mentor"}</span></div>}
          </div>
        </div>
      </div>
    </section>
  </PublicLayout>;
};

export default About;
