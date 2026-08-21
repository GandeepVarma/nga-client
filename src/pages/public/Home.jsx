import React from "react";
import { Link } from "react-router-dom";
import { FaUsers, FaCalendarCheck, FaMoneyBillWave, FaClipboardList, FaWhatsapp, FaChartLine } from "react-icons/fa";
import PublicLayout from "../../components/PublicLayout";

const features = [
  { icon: FaUsers, title: "Student & Teacher Management", desc: "Keep every profile, class, and assignment organized in one place." },
  { icon: FaCalendarCheck, title: "Attendance", desc: "Mark attendance in seconds, with automatic parent alerts." },
  { icon: FaMoneyBillWave, title: "Fees", desc: "Track payments, carry-forward balances, and send reminders automatically." },
  { icon: FaClipboardList, title: "Tests & MCQ Exams", desc: "Offline marks entry or fully timed online MCQ tests with instant results." },
  { icon: FaWhatsapp, title: "WhatsApp Notifications", desc: "Fee reminders, results, and announcements delivered where parents already are." },
  { icon: FaChartLine, title: "Dashboards for Everyone", desc: "Purpose-built views for admins, teachers, and students." },
];

const Home = () => {
  return (
    <PublicLayout>
      <section className="bg-navy text-white">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-20 lg:py-28 text-center">
          <p className="text-gold font-semibold tracking-wide text-sm mb-4">SAAS MANAGEMENT PLATFORM</p>
          <h1 className="font-display text-4xl lg:text-6xl font-bold leading-tight mb-6">
            Manage Your Academy <span className="text-gold">Smarter</span>
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-10">
            One platform for students, teachers, attendance, fees, tests, assignments, and communication —
            built for tuition centers and coaching academies of any size.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register-academy" className="btn-primary text-base py-3 px-8">Get Started</Link>
            <Link to="/academy-login" className="btn-outline !border-slate-400 !text-white hover:!bg-navy-lighter text-base py-3 px-8">Academy Login</Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 lg:px-8 py-16">
        <h2 className="font-display text-2xl lg:text-3xl font-bold text-navy dark:text-white text-center mb-12">
          Everything your academy needs, in one place
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card">
              <div className="w-12 h-12 rounded-xl bg-gold/15 text-gold flex items-center justify-center text-xl mb-4">
                <Icon />
              </div>
              <h3 className="font-display font-semibold text-navy dark:text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-navy-light">
        <div className="max-w-4xl mx-auto px-4 lg:px-8 py-16 text-center">
          <h2 className="font-display text-2xl lg:text-3xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-slate-300 mb-8">See our plans, or register your academy in a few minutes.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/pricing" className="btn-primary text-base py-3 px-8">View Pricing</Link>
            <Link to="/register-academy" className="btn-outline !border-slate-400 !text-white hover:!bg-navy text-base py-3 px-8">Register Your Academy</Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Home;
