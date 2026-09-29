import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useAuth } from "../context/AuthContext";

const DashboardLayout = ({ title, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const subscription = user?.academy;

  return (
    <div className="admin-shell flex min-h-screen bg-slate-50 dark:bg-navy">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={title} onMenuClick={() => setSidebarOpen(true)} />
        {subscription && subscription.subscriptionStatus !== "active" && (
          <div className="mx-4 mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {subscription.subscriptionStatus === "pending"
              ? "Your academy is awaiting Super Admin approval."
              : subscription.subscriptionStatus === "rejected"
                ? "Your academy registration was rejected. Please contact support."
                : "Your academy subscription is suspended. Please contact support."}
          </div>
        )}
        <main className="admin-main flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
