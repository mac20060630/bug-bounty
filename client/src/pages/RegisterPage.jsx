import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, User, Mail, Lock, UserPlus, Check, AlertCircle } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';

export const RegisterPage = () => {
  const { register, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'researcher',
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password requirements checklist
  const passwordCriteria = {
    length: formData.password.length >= 8,
    hasLetter: /[A-Za-z]/.test(formData.password),
    hasNumber: /[0-9]/.test(formData.password),
  };

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
    if (!formData.name.trim()) {
      errs.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please provide a valid email address';
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errs.password = 'Password must be at least 8 characters long';
    } else if (!passwordCriteria.hasLetter || !passwordCriteria.hasNumber) {
      errs.password = 'Password must contain at least one letter and one number';
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const result = await register(formData);
    setIsSubmitting(false);

    if (result.success) {
      if (result.user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/researcher/dashboard', { replace: true });
      }
    } else if (result.errors) {
      setFormErrors(result.errors);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 items-center justify-center text-cyan-400 mb-3 shadow-lg shadow-cyan-500/20">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Create Security Account</h2>
          <p className="text-xs text-slate-400 mt-1">
            Join BugBounty to participate in ethical disclosure and bounty programs
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-cyber-border/80 shadow-2xl">
          {error && (
            <Alert
              type="error"
              title="Registration Error"
              message={error}
              onClose={clearError}
              className="mb-6"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              name="name"
              type="text"
              icon={User}
              placeholder="e.g. Alice Vance"
              value={formData.name}
              onChange={handleChange}
              error={formErrors.name}
              required
            />

            <Input
              label="Email Address"
              name="email"
              type="email"
              icon={Mail}
              placeholder="alice@security.org"
              value={formData.email}
              onChange={handleChange}
              error={formErrors.email}
              required
            />

            <Input
              label="Password"
              name="password"
              type="password"
              icon={Lock}
              placeholder="Min 8 chars, 1 letter & 1 number"
              value={formData.password}
              onChange={handleChange}
              error={formErrors.password}
              required
            />

            {/* Live Password Strength Checklist */}
            {formData.password.length > 0 && (
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs space-y-1.5">
                <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                  Password Requirements:
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className={`flex items-center justify-center w-3.5 h-3.5 rounded-full text-[9px] ${
                      passwordCriteria.length
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    <Check className="h-2.5 w-2.5" />
                  </span>
                  <span
                    className={passwordCriteria.length ? 'text-emerald-300' : 'text-slate-400'}
                  >
                    At least 8 characters
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`flex items-center justify-center w-3.5 h-3.5 rounded-full text-[9px] ${
                      passwordCriteria.hasLetter
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    <Check className="h-2.5 w-2.5" />
                  </span>
                  <span
                    className={passwordCriteria.hasLetter ? 'text-emerald-300' : 'text-slate-400'}
                  >
                    At least one letter (a-z)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`flex items-center justify-center w-3.5 h-3.5 rounded-full text-[9px] ${
                      passwordCriteria.hasNumber
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    <Check className="h-2.5 w-2.5" />
                  </span>
                  <span
                    className={passwordCriteria.hasNumber ? 'text-emerald-300' : 'text-slate-400'}
                  >
                    At least one number (0-9)
                  </span>
                </div>
              </div>
            )}

            {/* Role Choice (Defaults to researcher, allows admin selection for evaluation) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Select Account Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, role: 'researcher' }))}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    formData.role === 'researcher'
                      ? 'bg-cyan-500/10 border-cyan-500/50 text-white'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold text-cyan-400">Researcher</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Submit bug reports & earn bounties</p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, role: 'admin' }))}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    formData.role === 'admin'
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold text-emerald-400">Admin</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Manage triage & platform settings</p>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isSubmitting}
                icon={UserPlus}
              >
                Create Account
              </Button>
            </div>
          </form>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Already registered?{' '}
          <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4">
            Sign in to existing account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
