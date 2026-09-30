import React from "react";
import { Link } from "react-router-dom";
import { FaArrowDown, FaArrowRight, FaArrowUp } from "react-icons/fa";

const AnalyticsKpiCard = ({
  icon: Icon,
  label,
  value,
  to,
  detail,
  change,
  changeUnit = "percent",
  changePeriod = "vs previous month",
  positiveWhenUp = true,
}) => {
  const hasChange = Number.isFinite(change);
  const isPositive = changeUnit === "points" ? change >= 0 : (change >= 0) === positiveWhenUp;
  const TrendIcon = !hasChange ? null : change === 0 ? FaArrowRight : change > 0 ? FaArrowUp : FaArrowDown;
  const trendText = !hasChange
    ? "Comparison unavailable"
    : changeUnit === "points"
      ? `${change > 0 ? "+" : ""}${change} pp ${changePeriod}`
      : `${change > 0 ? "+" : ""}${change}% ${changePeriod}`;

  return (
    <Link
      to={to}
      className="admin-analytics-kpi card group flex min-h-36 flex-col justify-between gap-4 p-5 transition duration-200 hover:-translate-y-1 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold text-navy">{value}</p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy/10 text-navy">
          <Icon aria-hidden="true" />
        </span>
      </div>
      <div className="flex min-w-0 items-center justify-between gap-2 text-xs">
        <span className="truncate text-slate-500" title={detail}>{detail}</span>
        <span className={`inline-flex shrink-0 items-center gap-1 font-semibold ${hasChange ? isPositive ? "text-emerald-700" : "text-red-700" : "text-slate-400"}`}>
          {TrendIcon && <TrendIcon aria-hidden="true" />}
          {trendText}
        </span>
      </div>
    </Link>
  );
};

export default AnalyticsKpiCard;