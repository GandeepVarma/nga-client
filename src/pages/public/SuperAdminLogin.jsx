import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FaLock } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { PLATFORM_NAME } from "../../config/branding";

const SuperAdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginSuperAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginSuperAdmin(email, password);
      toast.success("Welcome, Super Admin");
      navigate("/super-admin/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-4">
            <FaLock className="text-slate-400 text-xl" />
          </div>
          <p className="text-slate-400 font-display font-bold tracking-wide mb-2">{PLATFORM_NAME}</p>
          <h1 className="font-display text-xl font-bold text-white">Super Admin</h1>
          <p className="text-slate-500 text-sm mt-1">Platform owner access only</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl2 p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-1.5">Email</label>
            <input
              type="email"
              required
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300 block mb-1.5">Password</label>
            <input
              type="password"
              required
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-white text-black font-semibold py-2.5 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-slate-600 text-xs mt-6">
          Looking for your academy? <Link to="/academy-login" className="text-slate-400 hover:text-white">Academy Login</Link>
        </p>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
