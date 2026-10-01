import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import PublicLayout from "../../components/PublicLayout";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { PLATFORM_NAME, PLATFORM_TAGLINE } from "../../config/branding";
import { FaAtom, FaLock, FaUser, FaUserGraduate } from "react-icons/fa";

const trustPoints = [
  { value: "5+ Years", label: "Experienced Tutor" },
  { value: "1:1", label: "Individual Attention" },
  { value: "Strong", label: "Fundamentals" },
  { value: "Regular", label: "Guidance" },
];

const reasons = [
  { title: "Experienced Tutor", text: "Guidance shaped around clear teaching and steady academic support." },
  { title: "Individual Attention", text: "Every student receives a learning pace that matches their strengths and gaps." },
  { title: "Strong Concept Building", text: "Learning starts with understanding, not memorisation alone." },
  { title: "Regular Guidance", text: "Frequent review and direct support help students stay on track." },
  { title: "Smart Learning Methods", text: "Simple techniques and structured practice make skills stick." },
  { title: "Academic Growth", text: "Progress is shaped through consistency, clarity, and confidence." },
];

const steps = [
  { number: "01", title: "UNDERSTAND", text: "Build strong concepts from the basics." },
  { number: "02", title: "PRACTICE", text: "Apply what you learn through regular practice." },
  { number: "03", title: "IMPROVE", text: "Identify mistakes and work on them with guidance." },
  { number: "04", title: "ACHIEVE", text: "Turn consistent effort into academic progress." },
];

const achievementCards = [
  { title: "Concept clarity", text: "Students build stronger understanding before moving to tougher topics." },
  { title: "Practice discipline", text: "Learning becomes more consistent through guided repetition and review." },
  { title: "Confidence building", text: "Regular support helps students participate, ask questions, and improve." },
  { title: "Progress tracking", text: "Academic growth is monitored through regular feedback and careful attention." },
];

const testimonialCards = [
  { quote: "The learning environment is encouraging, structured, and focused on real understanding.", label: "Parent feedback" },
  { quote: "Students get the attention they need to improve step by step without feeling rushed.", label: "Student perspective" },
  { quote: "Clear teaching and regular support make difficult concepts feel manageable and approachable.", label: "Learning experience" },
];

const defaultForm = {
  studentName: "",
  parentName: "",
  className: "",
  school: "",
  phone: "",
  preferredProgram: "",
  message: "",
};

const Home = () => {
  const [academies, setAcademies] = useState([]);
  const [academyId, setAcademyId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [portalPassword, setPortalPassword] = useState("");
  const [portalLoading, setPortalLoading] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { loginStudent } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    api.get("/public/academies", { signal: controller.signal })
      .then((response) => {
        const activeAcademies = response.data.data || [];
        setAcademies(activeAcademies);
        setAcademyId(activeAcademies[0]?._id || "");
      })
      .catch(() => {
        if (!controller.signal.aborted) toast.error("Could not load academy details");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/public/programs`)
      .then((response) => response.json())
      .then((response) => setPrograms(response.data || []))
      .catch(() => setPrograms([]))
      .finally(() => setProgramsLoading(false));
  }, []);

  useEffect(() => {
    const homeShell = document.querySelector('[data-homepage="true"]');
    if (!homeShell || window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined") return;

    homeShell.dataset.motionReady = "true";
    const revealTargets = homeShell.querySelectorAll("[data-scroll-reveal], [data-scroll-stagger]");
    revealTargets.forEach((target) => {
      if (!target.hasAttribute("data-scroll-stagger")) return;
      Array.from(target.children).forEach((child, index) => {
        child.style.setProperty("--reveal-delay", `${Math.min(index * 70, 350)}ms`);
      });
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.2, rootMargin: "0px 0px -6% 0px" });

    revealTargets.forEach((target) => observer.observe(target));
    return () => {
      observer.disconnect();
    };
  }, [programs]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleStudentLogin = async (event) => {
    event.preventDefault();
    if (!academyId) {
      toast.error("No active academy is available for login");
      return;
    }

    setPortalLoading(true);
    try {
      await loginStudent(studentId.trim(), portalPassword, academyId);
      toast.success("Welcome back!");
      navigate("/student/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const fields = Object.entries(form).filter(([key, value]) => key !== "message");
    const missingField = fields.find(([, value]) => !String(value).trim());

    if (missingField) {
      setError("Please complete all required fields before sending your enquiry.");
      setSubmitted(false);
      return;
    }

    setLoading(true);
    setError("");

    const whatsappMessage = [
      "Hello NEXT GENLEARNING ACADEMY,",
      `Student Name: ${form.studentName}`,
      `Parent Name: ${form.parentName}`,
      `Class: ${form.className}`,
      `School: ${form.school}`,
      `Phone Number: ${form.phone}`,
      `Preferred Program: ${form.preferredProgram}`,
      `Message: ${form.message || "No additional message"}`,
    ].join("\n");

    const whatsappUrl = `https://wa.me/919502477923?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");

    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
      setForm(defaultForm);
    }, 600);
  };

  return (
    <PublicLayout homepage>
      <section id="top" className="hero-section">
        <div className="hero-pattern" aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="hero-grid">
            <div className="hero-copy">
              <p className="hero-badge hero-intro-badge"><FaAtom /> FOUNDATION &amp; ACADEMIC SUPPORT</p>
              <p className="eyebrow hero-intro-eyebrow">{PLATFORM_NAME}</p>
              <h1 className="hero-title"><span className="hero-title-first">DON&apos;T JUST STUDY.</span><br /><strong className="hero-title-second">UNDERSTAND.</strong></h1>
              <div className="headline-stack hero-intro-tagline">
                <span>{PLATFORM_TAGLINE}</span>
              </div>
              <p className="hero-text hero-intro-description">Because real learning begins when concepts become clear.</p>
              <div className="cta-row hero-intro-actions">
                <a href="#enquire" className="primary-button">ENQUIRE NOW</a>
                <a href="#programs" className="secondary-button">EXPLORE PROGRAMS</a>
              </div>
            </div>

            <div className="hero-portal-wrap">
              <section className="hero-portal-card hero-intro-portal" aria-labelledby="hero-portal-title">
                <div className="hero-portal-heading">
                  <span className="hero-portal-icon"><FaUserGraduate /></span>
                  <div><p>STUDENT PORTAL</p><h2 id="hero-portal-title">Welcome back</h2></div>
                </div>
                <form className="hero-portal-form" onSubmit={handleStudentLogin}>
                  <label>
                    <span>Academy</span>
                    <select value={academyId} onChange={(event) => setAcademyId(event.target.value)} required disabled={academies.length === 0}>
                      {academies.length === 0 ? <option value="">No active academy available</option> : academies.map((academy) => <option key={academy._id} value={academy._id}>{academy.academyName}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>Student ID</span>
                    <div className="hero-portal-input"><FaUser aria-hidden="true" /><input type="text" value={studentId} onChange={(event) => setStudentId(event.target.value)} placeholder="Enter your student ID" autoComplete="username" required /></div>
                  </label>
                  <label>
                    <span>Password</span>
                    <div className="hero-portal-input"><FaLock aria-hidden="true" /><input type="password" value={portalPassword} onChange={(event) => setPortalPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" required /></div>
                  </label>
                  <button type="submit" className="primary-button full-width" disabled={portalLoading || academies.length === 0}>
                    {portalLoading ? "Signing in..." : "STUDENT LOGIN"}
                  </button>
                </form>
                <p className="hero-portal-enquiry">Not registered? <a href="#enquire">Enquire now</a></p>
              </section>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-strip">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-scroll-reveal>
          <div className="trust-grid" data-scroll-stagger>
            {trustPoints.map((point) => (
              <div key={point.label} className="trust-item">
                <strong>{point.value}</strong>
                <span>{point.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="content-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-scroll-reveal>
          <div className="section-header center">
            <p className="eyebrow accent">Where learning becomes understanding</p>
            <h2>WHERE LEARNING BECOMES UNDERSTANDING</h2>
          </div>

          <div className="about-grid" data-scroll-stagger>
            <div className="about-copy">
              <p>
                At {PLATFORM_NAME}, learning is shaped around clarity, confidence, and steady academic growth.
                We focus on building strong fundamentals, helping students understand ideas deeply, and guiding
                them through regular practice with personal attention.
              </p>
              <p>
                From concept building to revision and confidence, each step is designed to help students grow
                with structure, support, and consistency. The goal is not only marks — it is meaningful learning
                that stays with them beyond the classroom.
              </p>
            </div>

            <div className="feature-stack" data-scroll-stagger>
              <div className="mini-card">
                <strong>Concept clarity</strong>
                <span>Clear explanations and strong fundamentals</span>
              </div>
              <div className="mini-card">
                <strong>Individual attention</strong>
                <span>Learning designed around each student&apos;s pace</span>
              </div>
              <div className="mini-card">
                <strong>Regular practice</strong>
                <span>Steady steps that build confidence and accuracy</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="programs" className="content-section muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-scroll-reveal>
          <div className="section-header center">
            <p className="eyebrow accent">Learning pathways</p>
            <h2>OUR PROGRAMS</h2>
          </div>

          {programs.length > 0 ? <div className="program-grid" data-scroll-stagger>
            {programs.map((program) => (
              <article key={program._id} className="program-card">
                {program.imageUrl && <img src={program.imageUrl} alt={program.name} className="home-program-image" />}
                <div className="program-top"><span className="program-badge">{program.badge || "Program"}</span></div>
                <p className="program-level">{program.level}</p>
                <h3>{program.name}</h3>
                <p>{program.description}</p>
                <div className="subject-list">{(program.features || []).map((feature) => <span key={feature}>{feature}</span>)}</div>
                <a href="/programs" className="text-link">View program details</a>
              </article>
            ))}
          </div> : <div className="home-program-empty"><h3>Programs will be announced soon.</h3><p>Our latest learning pathways will appear here as the academy publishes them.</p><a href="#enquire" className="primary-button">Enquire now</a></div>}
        </div>
      </section>

      <section id="why-nga" className="content-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-scroll-reveal>
          <div className="section-header center">
            <p className="eyebrow accent">Why parents choose us</p>
            <h2>WHY CHOOSE NGA</h2>
          </div>

          <div className="reasons-grid" data-scroll-stagger>
            {reasons.map((reason) => (
              <div key={reason.title} className="reason-card">
                <div className="reason-icon">✓</div>
                <h3>{reason.title}</h3>
                <p>{reason.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="content-section muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-scroll-reveal>
          <div className="section-header center">
            <p className="eyebrow accent">Supporting every step</p>
            <h2>HOW WE HELP STUDENTS GROW</h2>
          </div>

          <div className="steps-grid" data-scroll-stagger>
            {steps.map((step) => (
              <div key={step.number} className="step-card">
                <span className="step-number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="achievements" className="content-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-scroll-reveal>
          <div className="section-header center">
            <p className="eyebrow accent">Progress that matters</p>
            <h2>STUDENT ACHIEVEMENTS</h2>
          </div>

          <div className="achievement-grid" data-scroll-stagger>
            {achievementCards.map((item) => (
              <div key={item.title} className="achievement-card">
                <div className="star-mark">✦</div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="content-section muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-scroll-reveal>
          <div className="section-header center">
            <p className="eyebrow accent">Parent and student voice</p>
            <h2>WHAT PARENTS &amp; STUDENTS SAY</h2>
          </div>

          <div className="testimonial-grid" data-scroll-stagger>
            {testimonialCards.map((item) => (
              <blockquote key={item.label} className="testimonial-card">
                <p>“{item.quote}”</p>
                <footer>{item.label}</footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section id="campus" className="content-section campus-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-scroll-reveal>
          <div className="section-header center">
            <p className="eyebrow accent">Our campus</p>
            <h2>VISIT OUR LOCATION</h2>
            <p>Find Next GenLearning Academy in Kompally and get directions to our learning space.</p>
          </div>
          <div className="location-panel" data-scroll-stagger>
            <div className="location-map-wrap">
              <iframe
                title="Next GenLearning Academy location in Kompally"
                src="https://www.google.com/maps?q=Sri%20Vani%20Cycle%20Mechanic%2C%20Devender%20Colony%2C%20Kompally&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="location-details">
              <p className="eyebrow accent">Next GenLearning Academy</p>
              <h3>Near Sri Vani Cycle Mechanic</h3>
              <p>Visit us for concept clarity, focused practice and consistent academic support.</p>
              <a href="https://www.google.com/maps/search/?api=1&query=Sri+Vani+Cycle+Mechanic%2C+Devender+Colony%2C+Kompally" target="_blank" rel="noreferrer" className="primary-button">Open in Google Maps</a>
            </div>
          </div>
        </div>
      </section>

      <section className="admission-band">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-scroll-reveal>
          <div className="admission-content" data-scroll-stagger>
            <div>
              <p className="eyebrow accent">Admission support</p>
              <h2>READY TO HELP YOUR CHILD LEARN BETTER?</h2>
              <p>Give your child the right guidance, stronger concepts and consistent academic support.</p>
            </div>
            <div className="admission-actions">
              <a href="#enquire" className="primary-button">ENQUIRE NOW</a>
              <a href="/contact" className="secondary-button dark">CONTACT US</a>
            </div>
          </div>
        </div>
      </section>

      <section id="enquire" className="content-section contact-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-scroll-reveal>
          <div className="contact-grid" data-scroll-stagger>
            <div className="contact-details">
              <p className="eyebrow accent">Get in touch</p>
              <h2>CONTACT</h2>
              <div className="contact-card">
                <h3>{PLATFORM_NAME}</h3>
                <p>Kompally</p>
                <a href="tel:+919502477923">9502477923</a>
                <div className="contact-links">
                  <a href="tel:+919502477923" className="mini-action">Call Now</a>
                  <a href="https://wa.me/919502477923" target="_blank" rel="noreferrer" className="mini-action alt">WhatsApp</a>
                </div>
              </div>
            </div>

            <form className="enquiry-form" onSubmit={handleSubmit} noValidate>
              <div className="form-grid">
                <label>
                  <span>Student Name</span>
                  <input type="text" name="studentName" value={form.studentName} onChange={handleChange} placeholder="Student Name" />
                </label>
                <label>
                  <span>Parent Name</span>
                  <input type="text" name="parentName" value={form.parentName} onChange={handleChange} placeholder="Parent Name" />
                </label>
                <label>
                  <span>Class</span>
                  <input type="text" name="className" value={form.className} onChange={handleChange} placeholder="Class" />
                </label>
                <label>
                  <span>School</span>
                  <input type="text" name="school" value={form.school} onChange={handleChange} placeholder="School" />
                </label>
                <label>
                  <span>Phone Number</span>
                  <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="Phone Number" />
                </label>
                <label>
                  <span>Preferred Program</span>
                  <select name="preferredProgram" value={form.preferredProgram} onChange={handleChange}>
                    <option value="">Select a preferred program</option>
                    {programs.map((program) => {
                      const programLabel = program.name;
                      return <option key={program._id} value={programLabel}>{programLabel}</option>;
                    })}
                    {programsLoading && <option value="" disabled>Loading programs...</option>}
                    {!programsLoading && programs.length === 0 && <option value="" disabled>No programs available</option>}
                  </select>
                </label>
                <label className="full-width">
                  <span>Message</span>
                  <textarea name="message" value={form.message} onChange={handleChange} rows="4" placeholder="Tell us how we can help" />
                </label>
              </div>

              {error && <p className="form-error">{error}</p>}
              {submitted && <p className="form-success">Your enquiry is ready to send on WhatsApp.</p>}

              <button type="submit" className="primary-button full-width" disabled={loading}>
                {loading ? "Preparing enquiry..." : "ENQUIRE NOW"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Home;
