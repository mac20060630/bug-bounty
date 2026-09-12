import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Mail, Lock, LogIn, KeyRound } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';

export const LoginPage = () => {
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Where to navigate after login
  const from = location.state?.from?.pathname || null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (error) clearError();
  };

  const validate = () => {
    const errs = {};
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    }
    if (!formData.password) {
      errs.password = 'Password is required';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const result = await login(formData);
    setIsSubmitting(false);

    if (result.success) {
      // Determine redirection path
      if (from) {
        navigate(from, { replace: true });
      } else if (result.user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/researcher/dashboard', { replace: true });
      }
    }
  };

  // Quick fill helper for review
  const handleQuickFill = (role) => {
    if (role === 'researcher') {
      setFormData({
        email: 'alice@security.io',
        password: 'Password123!',
      });
    } else if (role === 'admin') {
      setFormData({
        email: 'admin@bugbounty.io',
        password: 'AdminPassword123!',
      });
    }
    setFormErrors({});
    if (error) clearError();
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 items-center justify-center text-cyan-400 mb-3 shadow-lg shadow-cyan-500/20">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Sign In to BugBounty</h2>
          <p className="text-xs text-slate-400 mt-1">
            Enter your credentials to access the secure reporting portal
          </p>
        </div>

        {/* Card Form */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-cyber-border/80 shadow-2xl">
          {error && (
            <Alert
              type="error"
              title="Authentication Failed"
              message={error}
              onClose={clearError}
              className="mb-6"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              name="email"
              type="email"
              autoComplete="email"
              icon={Mail}
              placeholder="researcher@domain.com"
              value={formData.email}
              onChange={handleChange}
              error={formErrors.email}
              required
            />

            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              icon={Lock}
              placeholder="••••••••••••"
              value={formData.password}
              onChange={handleChange}
              error={formErrors.password}
              required
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isSubmitting}
                icon={LogIn}
              >
                Sign In
              </Button>
            </div>
          </form>

          {/* Demo Credentials Helper for Quick Evaluation */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-3">
              <KeyRound className="h-3.5 w-3.5 text-cyan-400" />
              <span>Quick Test Credentials:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('researcher')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-[11px] font-medium transition-colors text-center"
              >
                Fill Researcher Demo
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-[11px] font-medium transition-colors text-center"
              >
                Fill Admin Demo
              </button>
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4">
            Register as a Researcher
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
