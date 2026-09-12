import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Bug,
  Lock,
  Terminal,
  Award,
  Zap,
  CheckCircle2,
  ArrowRight,
  Database,
  Cpu,
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import Button from '../components/common/Button';

export const LandingPage = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  const features = [
    {
      icon: Bug,
      title: 'Responsible Disclosure',
      desc: 'Structured vulnerability reporting workflows connecting ethical researchers directly with security teams.',
    },
    {
      icon: Award,
      title: 'Reputation & Recognition',
      desc: 'Build your verified cybersecurity profile, earn reputation score, and claim bounties for high-impact findings.',
    },
    {
      icon: Lock,
      title: 'Zero-Trust Architecture',
      desc: 'End-to-end authenticated API endpoints backed by Bcrypt salted hashing, JWT tokens, and strict RBAC.',
    },
    {
      icon: Zap,
      title: 'Rapid Triage Engine',
      desc: 'Streamlined vulnerability verification, severity assignment (CVSS), and direct disclosure coordination.',
    },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Background cyber grid & glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-cyan-500/10 via-transparent to-transparent blur-3xl pointer-events-none" />

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 lg:pt-28 lg:pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono uppercase tracking-wider mb-8">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>Vulnerability Reporting Platform &bull; Phase 1 Active</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-none">
          Secure Disclosure for <br />
          <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
            Modern Security Teams
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          BugBounty bridges elite security researchers with organizations. Submit vulnerability
          reports, coordinate responsible triage, and earn verified reputation on a tamper-resistant
          platform.
        </p>

        {/* CTA Actions */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          {isAuthenticated ? (
            <Link to={isAdmin ? '/admin/dashboard' : '/researcher/dashboard'}>
              <Button size="lg" icon={ArrowRight}>
                Enter Your Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/register">
                <Button size="lg" icon={Shield}>
                  Start as Researcher
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="lg">
                  Access Portal
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Security Trust Badges */}
        <div className="mt-16 pt-10 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">Bcrypt Hashing</p>
              <p className="text-[11px] text-slate-400">Salt rounds 12</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">JWT & RBAC</p>
              <p className="text-[11px] text-slate-400">Enforced on backend</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">NoSQL Sanitization</p>
              <p className="text-[11px] text-slate-400">Injection-resistant</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">Rate Limiting</p>
              <p className="text-[11px] text-slate-400">Brute-force protection</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Engineered for High-Consequence Security
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Built from the ground up for strict privacy, robust authentication, and verifiable reputation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition-all duration-200 group"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{feat.title}</h3>
                <p className="text-xs leading-relaxed text-slate-400">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
