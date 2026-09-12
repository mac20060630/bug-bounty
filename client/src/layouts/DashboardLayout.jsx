import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import useAuth from '../hooks/useAuth';
import {
  LayoutDashboard,
  ShieldCheck,
  User,
  Terminal,
  Activity,
  Award,
  AlertTriangle,
} from 'lucide-react';
import Badge from '../components/common/Badge';

export const DashboardLayout = () => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  const navItems = [
    {
      label: 'Overview',
      path: isAdmin ? '/admin/dashboard' : '/researcher/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'My Profile',
      path: '/profile',
      icon: User,
    },
  ];

  if (isAdmin) {
    navItems.splice(1, 0, {
      label: 'Admin Command',
      path: '/admin/dashboard',
      icon: Terminal,
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#070A11]">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-3 space-y-6">
            {/* User Identity Card */}
            <div className="glass-panel p-5 rounded-2xl border border-cyber-border/80">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center font-bold text-lg text-cyan-400">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-sm font-bold text-white truncate">{user?.name}</h3>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Account Role</span>
                <Badge variant={user?.role}>{user?.role}</Badge>
              </div>

              {user?.role === 'researcher' && (
                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Award className="h-3.5 w-3.5 text-amber-400" /> Reputation
                  </span>
                  <span className="font-mono font-bold text-cyan-400">{user?.reputation} PTS</span>
                </div>
              )}
            </div>

            {/* Quick Links Menu */}
            <div className="glass-panel p-3 rounded-2xl border border-cyber-border/80 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path + item.label}
                    to={item.path}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      active
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Security Status Snippet */}
            <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-900/30 text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold">
                <ShieldCheck className="h-4 w-4" />
                <span>Security Engine Active</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                All requests are encrypted and authenticated with JWT session tokens and strict rate
                limiting.
              </p>
            </div>
          </aside>

          {/* Main Dashboard Content Area */}
          <section className="lg:col-span-9">
            <Outlet />
          </section>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
