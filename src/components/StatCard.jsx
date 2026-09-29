import React from "react";

// icon: react-icon component, accent: tailwind color class for the icon chip
const StatCard = ({ icon: Icon, label, value, accent = "bg-gold/15 text-gold" }) => {
  return (
    <div className="admin-stat-card card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${accent}`}>
        <Icon />
      </div>
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-sm">{label}</p>
        <p className="font-display text-2xl font-bold text-navy dark:text-white">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
