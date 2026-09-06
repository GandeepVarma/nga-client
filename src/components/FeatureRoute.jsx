import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { hasFeature } from "../config/planFeatures";

const FeatureRoute = ({ feature, children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-navy">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role === "super_admin") return children;

  if (!hasFeature(feature, user)) {
    return (
      <div className="card max-w-xl mx-auto mt-10 p-8 text-center">
        <div className="text-4xl mb-4">🚫</div>
        <h2 className="font-display text-2xl font-bold text-navy dark:text-white mb-3">403 - Feature Not Available</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-4">
          Your current {user?.academy?.planName || user?.academy?.plan || "Free"} plan does not include this feature.
        </p>
        <p className="text-slate-600 dark:text-slate-300 mb-6">Upgrade your plan to access this feature.</p>
        <div className="flex justify-center">
          <a href="/pricing" className="btn-primary">Upgrade Plan</a>
        </div>
      </div>
    );
  }

  return children;
};

export default FeatureRoute;
