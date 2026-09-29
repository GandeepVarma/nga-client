import React, { useState } from "react";
import PublicLayout from "../../components/PublicLayout";
import { PLATFORM_NAME } from "../../config/branding";

const Contact = () => {
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const [status, setStatus] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.phone.trim() || !form.message.trim()) {
      setStatus("Please complete all fields before sending your message.");
      return;
    }

    const whatsappMessage = `Hello ${PLATFORM_NAME},\n\nName: ${form.name}\nPhone: ${form.phone}\nMessage: ${form.message}`;
    const whatsappUrl = `https://wa.me/919502477923?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setStatus("Your message is ready to send on WhatsApp.");
    setForm({ name: "", phone: "", message: "" });
  };

  return (
    <PublicLayout>
      <section className="page-inner-section">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="contact-grid page-contact-grid">
            <div className="contact-details">
              <p className="eyebrow accent">Get in touch</p>
              <h1>CONTACT</h1>
              <div className="contact-card">
                <h3>{PLATFORM_NAME}</h3>
                <p>Kompally</p>
                <a href="tel:+919502477923">9502477923</a>
                <div className="contact-links">
                  <a href="tel:+919502477923" className="mini-action">Call</a>
                  <a href="https://wa.me/919502477923" target="_blank" rel="noreferrer" className="mini-action alt">WhatsApp</a>
                </div>
              </div>
            </div>

            <form className="enquiry-form" onSubmit={handleSubmit} noValidate>
              <h2>Send a message</h2>
              <label>
                <span>Name</span>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
              </label>
              <label>
                <span>Phone Number</span>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Your number" />
              </label>
              <label>
                <span>Message</span>
                <textarea rows="5" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="How can we help?" />
              </label>

              {status && <p className={status.includes("ready") ? "form-success" : "form-error"}>{status}</p>}

              <button type="submit" className="primary-button full-width">SEND MESSAGE</button>
            </form>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Contact;
