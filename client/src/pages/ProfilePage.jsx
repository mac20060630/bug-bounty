import React, { useState } from 'react';
import useAuth from '../hooks/useAuth';
import {
  User,
  Mail,
  Shield,
  Award,
  Calendar,
  Clock,
  RefreshCw,
  Lock,
  CheckCircle,
} from 'lucide-react';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';

export const ProfilePage = () => {
  const { user, refreshProfile } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshProfile();
    setIsRefreshing(false);
    setRefreshSuccess(true);
    setTimeout(() => setRefreshSuccess(false), 3000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not recorded';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">User Security Profile</h1>
          <p className="text-xs text-slate-400 mt-1">
            Authenticated identity, access privileges, and research credentials
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRefresh}
          isLoading={isRefreshing}
          icon={RefreshCw}
        >
          {refreshSuccess ? 'Profile Synced!' : 'Sync Profile'}
        </Button>
      </div>

      {/* Main Profile Info Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-cyber-border/80">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-slate-800">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center font-extrabold text-3xl text-cyan-400 shadow-xl shadow-cyan-500/10">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">{user?.name}</h2>
              <Badge variant={user?.role}>{user?.role}</Badge>
            </div>
            <p className="text-xs text-slate-400 font-mono">{user?.email}</p>
            <p className="text-[11px] text-slate-500 font-mono">ID: {user?.id}</p>
          </div>
        </div>

        {/* Detailed Attributes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <Shield className="h-4 w-4 text-cyan-400" />
              <span>Assigned Role</span>
            </div>
            <p className="text-base font-bold text-white capitalize">{user?.role}</p>
            <p className="text-[11px] text-slate-500">
              {user?.role === 'admin'
                ? 'Full triage & system governance'
                : 'Vulnerability research & reporting'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <Award className="h-4 w-4 text-amber-400" />
              <span>Reputation Score</span>
            </div>
            <p className="text-base font-bold text-amber-400 font-mono">{user?.reputation} PTS</p>
            <p className="text-[11px] text-slate-500">Accrues with validated disclosures</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <Calendar className="h-4 w-4 text-emerald-400" />
              <span>Account Created</span>
            </div>
            <p className="text-xs font-bold text-slate-200">{formatDate(user?.createdAt)}</p>
            <p className="text-[11px] text-slate-500">Member in good standing</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1 md:col-span-2 lg:col-span-3">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase tracking-wider">
              <Clock className="h-4 w-4 text-purple-400" />
              <span>Last Active Login</span>
            </div>
            <p className="text-xs font-bold text-slate-200">{formatDate(user?.lastLoginAt)}</p>
            <p className="text-[11px] text-slate-500">
              Session secured via JWT signed with 256-bit secret.
            </p>
          </div>
        </div>
      </div>

      {/* Security Privilege Matrix */}
      <div className="glass-panel p-6 rounded-2xl border border-cyber-border/80">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Lock className="h-4 w-4 text-cyan-400" />
          <span>Security & Permissions Matrix</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-900/30 border border-slate-800">
            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="text-slate-300">Submit vulnerability reports (Phase 2)</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-900/30 border border-slate-800">
            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="text-slate-300">View responsible disclosure guidelines</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-900/30 border border-slate-800">
            {user?.role === 'admin' ? (
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <span className="h-4 w-4 rounded-full border border-slate-600 text-[10px] flex items-center justify-center text-slate-500 shrink-0">
                &times;
              </span>
            )}
            <span className={user?.role === 'admin' ? 'text-slate-300' : 'text-slate-500'}>
              Triage & validate researcher submissions
            </span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-900/30 border border-slate-800">
            {user?.role === 'admin' ? (
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <span className="h-4 w-4 rounded-full border border-slate-600 text-[10px] flex items-center justify-center text-slate-500 shrink-0">
                &times;
              </span>
            )}
            <span className={user?.role === 'admin' ? 'text-slate-300' : 'text-slate-500'}>
              Access `/api/auth/admin-check` endpoint
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
