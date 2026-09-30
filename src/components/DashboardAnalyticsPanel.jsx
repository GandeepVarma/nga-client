import React from "react";

const DashboardAnalyticsPanel = ({ title, description, actions, children, className = "" }) => (
  <section className={`card min-w-0 p-5 ${className}`}>
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-display text-base font-semibold text-navy">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="min-w-0 max-w-full flex-wrap justify-end gap-2">{actions}</div>}
    </header>
    <div className="mt-5 min-w-0">{children}</div>
  </section>
);

export default DashboardAnalyticsPanel;