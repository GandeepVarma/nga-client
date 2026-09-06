export const PLAN_FEATURES = {
  free: {
    dashboard: true,
    students: true,
    attendance: true,
    fees: false,
    tests: false,
    assignments: false,
    studyMaterials: false,
    analytics: false,
    aiInsights: false,
    whatsappReminders: false,
    qrAttendance: false,
    advancedReports: false,
  },
  basic: {
    dashboard: true,
    students: true,
    attendance: true,
    fees: true,
    tests: true,
    assignments: false,
    studyMaterials: false,
    analytics: false,
    aiInsights: false,
    whatsappReminders: false,
    qrAttendance: false,
    advancedReports: false,
  },
  standard: {
    dashboard: true,
    students: true,
    attendance: true,
    fees: true,
    tests: true,
    assignments: true,
    studyMaterials: true,
    analytics: true,
    aiInsights: false,
    whatsappReminders: false,
    qrAttendance: true,
    advancedReports: false,
  },
  premium: {
    dashboard: true,
    students: true,
    attendance: true,
    fees: true,
    tests: true,
    assignments: true,
    studyMaterials: true,
    analytics: true,
    aiInsights: true,
    whatsappReminders: true,
    qrAttendance: true,
    advancedReports: true,
  },
};

export const normalizePlanKey = (plan) => {
  if (!plan) return "free";

  if (typeof plan === "string") {
    const normalized = plan.toLowerCase().trim();
    if (PLAN_FEATURES[normalized]) return normalized;
    const match = Object.keys(PLAN_FEATURES).find((key) => key.toLowerCase() === normalized);
    return match || "free";
  }

  if (typeof plan === "object") {
    if (plan.key) return normalizePlanKey(plan.key);
    if (plan.name) return normalizePlanKey(plan.name);
  }

  return "free";
};

export const getFeatureAccessForPlan = (plan) => ({ ...PLAN_FEATURES[normalizePlanKey(plan)] });

export const hasFeature = (feature, user = null) => {
  if (!feature) return false;
  const role = user?.role;
  if (role === "super_admin") return true;

  const academy = user?.academy || user || {};
  const planName = academy?.planName || academy?.plan?.name || academy?.approvedPlan?.name || academy?.requestedPlan?.name || "free";
  return Boolean(getFeatureAccessForPlan(planName)[feature]);
};

export const getPlanLabel = (plan) => {
  const key = normalizePlanKey(plan);
  return key.charAt(0).toUpperCase() + key.slice(1);
};
