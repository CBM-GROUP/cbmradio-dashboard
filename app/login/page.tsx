"use client";
import React, { useState, useEffect } from "react";
import Toast from "../components/toast";
import { LockIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  // Restore user's preferred theme mode if set
  useEffect(() => {
    const stored = window.localStorage.getItem("dashboard-theme");
    if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark");
    } else if (stored === "light") {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    
    setLoading(true);
    try {
      // 📡 Calls your local API handler bridge
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.user) {
        setToast("⚡ Authorization Verified! Unlocking Control Tower Room...");
        setTimeout(() => {
          router.replace("/dashboard");
        }, 1500);
      } else {
        setToast(data.error || "❌ Access Denied: Invalid Administrator Credentials.");
      }
    } catch {
      setToast("❌ Network Error: Failed to reach authorization server.");
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 font-mono transition-colors duration-200">
      <Toast message={toast} />

      <form onSubmit={handleAdminSubmit} className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-xl relative overflow-hidden border-t-4 border-t-emerald-500">
        <div>
          <LockIcon className="mx-auto h-8 w-8 text-emerald-500" />
          <h1 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-widest text-center mt-2">Studio Console Access</h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center mt-1">Authorized Station Personnel Only</p>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-1">Admin Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition"
              placeholder="e.g., admin_station"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-1">Secure Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-bold rounded-md text-xs uppercase tracking-wider transition cursor-pointer"
        >
          {loading ? "Verifying Credentials..." : "Verify Authorization"}
        </button>
      </form>
    </div>
  );
}

