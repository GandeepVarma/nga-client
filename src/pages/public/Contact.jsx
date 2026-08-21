import React from "react";
import PublicLayout from "../../components/PublicLayout";

const Contact = () => (
  <PublicLayout>
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="font-display text-3xl font-bold text-navy dark:text-white mb-4">Contact Us</h1>
      <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
        Have a question about pricing, registering your academy, or an existing account? Reach out
        and we'll get back to you.
      </p>
      <div className="card space-y-2 text-sm">
        <p><span className="text-slate-400">Email:</span> <span className="font-medium text-navy dark:text-white">hello@nextgenacademy.com</span></p>
        <p><span className="text-slate-400">For offline payment queries:</span> <span className="font-medium text-navy dark:text-white">Mention your Academy ID when registration is submitted</span></p>
      </div>
    </div>
  </PublicLayout>
);

export default Contact;
