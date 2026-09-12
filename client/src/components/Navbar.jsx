import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Bug, LogOut, User as UserIcon, LayoutDashboard, Terminal } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import Badge from './common/Badge';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-cyber-border/80 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400/80 transition-all duration-200">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold tracking-tight text-white text-base">
              <span>Bug</span>
              <span className="text-cyan-400">Bounty</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 ml-1">
                v1.0
              </span>
            </div>
            <div className="text-[10px] tracking-widest text-slate-400 uppercase font-mono">
              Vulnerability Disclosure
            </div>
          </div>
        </Link>

        {/* Navigation & User Menu */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to={isAdmin ? '/admin/dashboard' : '/researcher/dashboard'}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    location.pathname.includes('/dashboard')
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard
                </Link>

                <Link
                  to="/programs"
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    location.pathname.startsWith('/programs')
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Shield className="h-3.5 w-3.5" />
                  Programs
                </Link>

                {!isAdmin && (
                  <Link
                    to="/reports"
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      location.pathname.startsWith('/reports')
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Bug className="h-3.5 w-3.5" />
                    My Reports
                  </Link>
                )}

                {isAdmin && (
                  <Link
                    to="/admin/programs"
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      isActive('/admin/programs')
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-300 hover:text-emerald-400 hover:bg-emerald-950/30'
                    }`}
                  >
                    <Terminal className="h-3.5 w-3.5" />
                    Manage Programs
                  </Link>
                )}

                <Link
                  to="/profile"
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/profile')
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <UserIcon className="h-3.5 w-3.5" />
                  Profile
                </Link>
              </div>

              {/* User profile snippet */}
              <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
                <Link to="/profile" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-cyan-400">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-slate-200 leading-tight truncate max-w-[120px]">
                      {user?.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge variant={user?.role} size="xs">
                        {user?.role}
                      </Badge>
                      {user?.role === 'researcher' && (
                        <span className="text-[10px] text-cyan-400 font-mono font-medium">
                          {user?.reputation} REP
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-900/40 transition-all"
                  aria-label="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 border border-cyan-400/30 transition-all"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
