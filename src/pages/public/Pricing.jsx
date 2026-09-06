import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FaCheck } from "react-icons/fa";
import PublicLayout from "../../components/PublicLayout";
import api from "../../api/axios";

const Pricing = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cycle, setCycle] = useState("monthly");

  useEffect(() => {
    api.get("/public/plans").then((res) => setPlans(res.data.data)).catch(() => toast.error("Could not load pricing plans")).finally(() => setLoading(false));
  }, []);

  return (
    <PublicLayout>
      <section className="max-w-5xl mx-auto px-4 lg:px-8 py-16 text-center">
        <h1 className="font-display text-3xl lg:text-4xl font-bold text-navy dark:text-white mb-3">Simple, Transparent Pricing</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">Choose the plan that fits your academy. Change or cancel anytime.</p>

        <div className="inline-flex bg-slate-100 dark:bg-navy-lighter rounded-lg p-1 mb-12">
          <button onClick={() => setCycle("monthly")} className={`px-4 py-2 rounded-md text-sm font-medium ${cycle === "monthly" ? "bg-white dark:bg-navy-light text-navy dark:text-white shadow" : "text-slate-500"}`}>Monthly</button>
          <button onClick={() => setCycle("yearly")} className={`px-4 py-2 rounded-md text-sm font-medium ${cycle === "yearly" ? "bg-white dark:bg-navy-light text-navy dark:text-white shadow" : "text-slate-500"}`}>Yearly</button>
        </div>

        {loading ? (
          <p className="text-slate-400">Loading plans...</p>
        ) : plans.length === 0 ? (
          <p className="text-slate-400">No plans are available right now — please check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {plans.map((plan, i) => (
              <div key={plan._id} className={`card flex flex-col ${i === 1 ? "border-2 border-gold" : ""}`}>
                {i === 1 && <span className="badge bg-gold/15 text-gold self-start mb-3">Most Popular</span>}
                <h3 className="font-display font-bold text-xl text-navy dark:text-white mb-1">{plan.name}</h3>
                <p className="mb-4">
                  <span className="font-display text-3xl font-bold text-navy dark:text-white">
                    ₹{cycle === "monthly" ? plan.priceMonthly : plan.priceYearly}
                  </span>
                  <span className="text-slate-400 text-sm">/{cycle === "monthly" ? "month" : "year"}</span>
                </p>
                <p className="text-xs text-slate-400 mb-4">
                  {plan.studentLimit ? `Up to ${plan.studentLimit} students` : "Unlimited students"} &middot; {plan.teacherLimit ? `${plan.teacherLimit} teachers` : "Unlimited teachers"}
                </p>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <FaCheck className="text-emerald-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link to={`/register-academy?plan=${plan._id}&cycle=${cycle}`} className="btn-primary text-center">Get Started</Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </PublicLayout>
  );
};

export default Pricing;
