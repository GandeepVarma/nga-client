import React from "react";
import PublicLayout from "../../components/PublicLayout";

const About = () => (
  <PublicLayout>
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="font-display text-3xl font-bold text-navy dark:text-white mb-4">About NextGen Learning Academy</h1>
      <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
        NextGen Learning Academy started as a single Mathematics coaching center's management
        platform and has grown into a SaaS product for tuition centers and coaching academies —
        handling students, teachers, attendance, fees, tests, assignments, and parent
        communication in one place.
      </p>
      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
        Founded by Gandeep Varma Ganaraju. <span className="font-medium">Learn Today. Lead Tomorrow.</span>
      </p>
    </div>
  </PublicLayout>
);

export default About;
