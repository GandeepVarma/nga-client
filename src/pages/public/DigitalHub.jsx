import React, { useEffect, useState } from "react";
import { FaInstagram, FaPlay, FaQuoteLeft, FaYoutube } from "react-icons/fa";
import PublicLayout from "../../components/PublicLayout";

const defaults = { heading: "Our Digital Learning Ecosystem", intro: "We bridge classroom learning with useful online resources, study guidance and motivation.", closingQuote: "We use digital content to build consistency, confidence and a serious mindset in every learner.", youtube: { name: "Official YouTube Channel", handle: "Concept explainers & study guidance", description: "Concept explainers, study guidance and motivation for students.", url: "https://youtube.com", videoUrl: "", imageUrl: "", features: [] }, instagram: { name: "NGA on Instagram", handle: "Success mindset & shorts", description: "Academy moments, reminders and useful learning prompts.", url: "https://instagram.com", imageUrl: "", features: [] } };

const DigitalHub = () => {
  const [hub, setHub] = useState(defaults);
  useEffect(() => { fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/public/digital-hub`).then((response) => response.json()).then((response) => response.data && setHub({ ...defaults, ...response.data, youtube: { ...defaults.youtube, ...response.data.youtube }, instagram: { ...defaults.instagram, ...response.data.instagram } })).catch(() => {}); }, []);
  useEffect(() => {
    const section = document.querySelector(".digital-hub-section");
    if (!section || window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined") return;

    section.dataset.motionReady = "true";
    const targets = section.querySelectorAll("[data-scroll-reveal], [data-scroll-stagger]");
    targets.forEach((target) => {
      if (!target.hasAttribute("data-scroll-stagger")) return;
      Array.from(target.children).forEach((child, index) => child.style.setProperty("--reveal-delay", `${index * 100}ms`));
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.2, rootMargin: "0px 0px -6% 0px" });

    targets.forEach((target) => observer.observe(target));
    return () => {
      observer.disconnect();
      section.removeAttribute("data-motion-ready");
    };
  }, []);
  const youtube = hub.youtube || defaults.youtube;
  const instagram = hub.instagram || defaults.instagram;
  const renderFeatures = (features) => features?.length > 0 && <ul>{features.map((item) => <li key={item}>{item}</li>)}</ul>;
  return <PublicLayout>
    <section className="page-banner"><div className="page-banner-inner"><p className="eyebrow">Online learning &amp; motivation</p><h1>{hub.heading}</h1><p>{hub.intro}</p></div></section>
    <section className="content-section digital-hub-section"><div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"><div className="digital-hub-intro" data-scroll-reveal><p>We bridge offline classroom rigour with high-quality online resources, providing open access concepts and study motivation to students.</p></div><div className="digital-reference-grid" data-scroll-stagger>
      <article className="digital-reference-card youtube-reference"><div className="digital-card-top"><div className="digital-card-brand"><FaYoutube /><div><strong>{youtube.name}</strong><span>{youtube.handle || "Official YouTube Channel"}</span></div></div><a href={youtube.url} target="_blank" rel="noreferrer" className="digital-action youtube-action">Subscribe <FaPlay /></a></div><div className="digital-card-body"><p>{youtube.description}</p>{renderFeatures(youtube.features)}{youtube.imageUrl ? <img src={youtube.imageUrl} alt="YouTube learning preview" className="digital-preview-image" /> : youtube.videoUrl ? <div className="digital-video-preview"><a href={youtube.videoUrl} target="_blank" rel="noreferrer"><FaPlay /> Watch on YouTube</a></div> : <div className="digital-placeholder-media"><FaYoutube /><span>Video preview will appear here</span></div>}</div></article>
      <article className="digital-reference-card instagram-reference"><div className="digital-card-top"><div className="digital-card-brand"><FaInstagram /><div><strong>{instagram.handle || instagram.name}</strong><span>{instagram.name}</span></div></div><a href={instagram.url} target="_blank" rel="noreferrer" className="digital-action instagram-action">Follow <FaInstagram /></a></div><div className="digital-card-body"><p>{instagram.description}</p>{instagram.imageUrl ? <img src={instagram.imageUrl} alt="Instagram academy preview" className="digital-preview-image" /> : <div className="instagram-placeholder-grid"><span>Academy</span><span>Learning</span><span>Growth</span></div>}{renderFeatures(instagram.features)}</div></article>
    </div><div className="digital-closing-quote" data-scroll-reveal><FaQuoteLeft /><em>{hub.closingQuote}</em></div></div></section>
  </PublicLayout>;
};

export default DigitalHub;
