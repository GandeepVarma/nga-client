import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaGraduationCap, FaBars, FaTimes } from "react-icons/fa";
import { PLATFORM_NAME, PLATFORM_TAGLINE } from "../config/branding";

const PublicLayout = ({ children }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/pricing", label: "Pricing" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-navy">
      <header className="bg-navy text-white sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gold flex items-center justify-center">
              <FaGraduationCap className="text-navy text-lg" />
            </div>
            <span className="font-display font-bold tracking-tight">{PLATFORM_NAME}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to} className="text-sm text-slate-300 hover:text-white transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/academy-login" className="btn-outline !border-slate-500 !text-white hover:!bg-navy-lighter text-sm py-2 px-4">
              Academy Login
            </Link>
            <Link to="/register-academy" className="btn-primary text-sm py-2 px-4">
              New Academy? Get Started
            </Link>
          </div>

          <button className="md:hidden text-xl" onClick={() => setMenuOpen((o) => !o)}>
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-navy-light px-4 py-4 space-y-3">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)} className="block text-sm text-slate-300 hover:text-white">
                {l.label}
              </Link>
            ))}
            <Link to="/academy-login" onClick={() => setMenuOpen(false)} className="block text-sm text-gold font-medium">
              Academy Login
            </Link>
            <Link to="/register-academy" onClick={() => setMenuOpen(false)} className="block text-sm text-gold font-medium">
              New Academy? Get Started
            </Link>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-navy text-slate-400 text-sm">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>&copy; {new Date().getFullYear()} {PLATFORM_NAME}. {PLATFORM_TAGLINE}</p>
          <div className="flex gap-5">
            <Link to="/pricing" className="hover:text-white">Pricing</Link>
            <Link to="/about" className="hover:text-white">About</Link>
            <Link to="/contact" className="hover:text-white">Contact</Link>
            <Link to="/super-admin/login" className="hover:text-white">Super Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
