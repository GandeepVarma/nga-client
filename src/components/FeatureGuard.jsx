import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { hasFeature } from "../config/planFeatures";

export const FeatureUnavailable = ({ feature, planLabel }) => {
  const navigate = useNavigate();

  return (
    <div className="card max-w-xl mx-auto mt-10 p-8 text-center">
      <div className="text-4xl mb-4">🔒</div>
      <h2 className="font-display text-2xl font-bold text-navy dark:text-white mb-3">Feature not available</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-5">
        Your current {planLabel || "Free"} plan does not include this feature.
      </p>
      <p className="text-slate-600 dark:text-slate-300 mb-6">
        Upgrade your plan to access this feature.
      </p>
      <button className="btn-primary" onClick={() => navigate("/pricing")}>Upgrade Plan</button>
    </div>
  );
};

const FeatureGuard = ({ feature, children, fallback = null }) => {
  const { user } = useAuth();

  if (!feature) return children;
  if (hasFeature(feature, user)) return children;

  const planLabel = user?.academy?.planName || user?.academy?.plan || user?.academy?.approvedPlan?.name || "Free";

  if (fallback) return fallback;
  return <FeatureUnavailable feature={feature} planLabel={planLabel} />;
};

export default FeatureGuard;
