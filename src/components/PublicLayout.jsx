import React, { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { FaBars, FaTimes, FaUserCircle } from "react-icons/fa";
import { PLATFORM_NAME, PLATFORM_TAGLINE } from "../config/branding";
import ngaLogo from "../assets/nga-logo.png.jpeg";

export const LogoMark = ({ className = "" }) => (
  <img src={ngaLogo} className={className} alt="Next GenLearning Academy logo" />
);

const PublicLayout = ({ children, homepage = false }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);

  useEffect(() => {
    const updateHeaderScroll = () => {
      const nextScrolled = window.scrollY > 24;
      setHeaderScrolled((current) => current === nextScrolled ? current : nextScrolled);
    };

    updateHeaderScroll();
    window.addEventListener("scroll", updateHeaderScroll, { passive: true });
    return () => window.removeEventListener("scroll", updateHeaderScroll);
  }, []);

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Our Story", href: "/about" },
    { label: "Programs", href: "/programs" },
    { label: "Results", href: "/results" },
    { label: "Digital Hub", href: "/digital-hub" },
    { label: "Portal", href: "/academy-login", icon: <FaUserCircle /> },
  ];

  return (
    <div className={homepage ? "page-shell home-page-shell" : "page-shell"} data-homepage={homepage ? "true" : undefined}>
      <header className={headerScrolled ? "site-header is-scrolled" : "site-header"}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="header-inner">
            <Link to="/" className="brand-wrap header-brand" aria-label="Go to homepage">
              <span className="brand-logo-frame">
                <span className="brand-logo-clip"><LogoMark className="logo-mark" /></span>
              </span>
              <div className="brand-copy">
                <p className="brand-name">{PLATFORM_NAME}</p>
                <p className="brand-tagline">{PLATFORM_TAGLINE}</p>
              </div>
            </Link>

            <nav className="main-nav" aria-label="Main navigation">
              {navLinks.map((link) => (
                <NavLink key={link.label} to={link.href} end={link.href === "/"} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} onClick={() => setMenuOpen(false)}>
                  {link.icon}{link.label}
                </NavLink>
              ))}
            </nav>

            <div className="header-actions">
              <a href="#enquire" className="primary-button small-button">
                Enquiry Now
              </a>
            </div>

            <button
              type="button"
              className="mobile-menu-button"
              aria-label="Toggle mobile menu"
              onClick={() => setMenuOpen((current) => !current)}
            >
              {menuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="mobile-menu">
            {navLinks.map((link) => (
              <NavLink key={link.label} to={link.href} end={link.href === "/"} className={({ isActive }) => isActive ? "mobile-link active" : "mobile-link"} onClick={() => setMenuOpen(false)}>
                {link.icon}{link.label}
              </NavLink>
            ))}
            <a href="#enquire" className="primary-button full-width" onClick={() => setMenuOpen(false)}>
              Enquiry Now
            </a>
          </div>
        )}
      </header>

      <main>{children}</main>

      <footer className="site-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="footer-grid">
            <div>
              <Link to="/" className="brand-wrap footer-brand">
                <LogoMark className="logo-mark small" />
                <div>
                  <p className="brand-name">{PLATFORM_NAME}</p>
                  <p className="brand-tagline">{PLATFORM_TAGLINE}</p>
                </div>
              </Link>
            </div>

            <div>
              <h3>Quick Links</h3>
              <ul>
                <li><a href="/#top">Home</a></li>
                <li><a href="/#about">About</a></li>
                <li><a href="/#programs">Programs</a></li>
                <li><a href="/#why-nga">Why NGA</a></li>
                <li><a href="/#campus">Our Campus</a></li>
              </ul>
            </div>

            <div>
              <h3>Explore</h3>
              <ul>
                <li><a href="/#achievements">Achievements</a></li>
                <li><a href="/#testimonials">Testimonials</a></li>
                <li><a href="/contact">Contact</a></li>
                <li><a href="/academy-login">Academy Login</a></li>
              </ul>
            </div>

            <div>
              <h3>Contact</h3>
              <ul>
                <li>Kompally</li>
                <li><a href="tel:+919502477923">9502477923</a></li>
                <li><a href="https://wa.me/919502477923" target="_blank" rel="noreferrer">WhatsApp</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} {PLATFORM_NAME}. All rights reserved.</p>
            <p>Learn Today. Lead Tomorrow.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
