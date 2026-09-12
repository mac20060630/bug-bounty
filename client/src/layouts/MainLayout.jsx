import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Shield, Lock, Terminal } from 'lucide-react';

export const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#070A11]">
      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-800/80 bg-[#070A11] py-8 px-4 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-cyan-400" />
            <span className="text-slate-400 font-semibold">BugBounty Platform</span>
            <span className="text-slate-600">|</span>
            <span>Enterprise Vulnerability Management & Disclosure</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1 text-slate-400">
              <Lock className="h-3 w-3 text-emerald-400" /> End-to-End Encrypted Auth
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <Terminal className="h-3 w-3 text-cyan-400" /> JWT & RBAC Active
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
