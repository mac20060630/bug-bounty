import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  ShieldAlert,
  Send,
  Building2,
  AlertCircle,
  CheckCircle2,
  FileCode,
  ArrowRight,
  Info,
} from 'lucide-react';
import * as programService from '../services/programService';
import * as reportService from '../services/reportService';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import FileUpload from '../components/common/FileUpload';
import Spinner from '../components/common/Spinner';

export const SubmitReportPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Parse programId query param if present
  const queryParams = new URLSearchParams(location.search);
  const initialProgramId = queryParams.get('programId') || '';

  const [programs, setPrograms] = useState([]);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    programId: initialProgramId,
    title: '',
    category: 'broken_access_control',
    affectedAsset: '',
    severity: 'medium',
    description: '',
    reproductionSteps: '',
    impact: '',
    suggestedRemediation: '',
    evidence: [],
  });

  const categories = [
    { value: 'broken_access_control', label: 'Broken Access Control' },
    { value: 'injection', label: 'Injection (SQL, NoSQL, Command)' },
    { value: 'broken_auth', label: 'Broken Authentication' },
    { value: 'idor', label: 'Insecure Direct Object Reference (IDOR)' },
    { value: 'ssrf', label: 'Server-Side Request Forgery (SSRF)' },
    { value: 'rce', label: 'Remote Code Execution (RCE)' },
    { value: 'xss', label: 'Cross-Site Scripting (XSS)' },
    { value: 'csrf', label: 'Cross-Site Request Forgery (CSRF)' },
    { value: 'sensitive_data_exposure', label: 'Cryptographic Failure / Data Exposure' },
    { value: 'security_misconfiguration', label: 'Security Misconfiguration' },
    { value: 'insecure_deserialization', label: 'Insecure Deserialization' },
    { value: 'other', label: 'Other Vulnerability' },
  ];

  const severities = [
    { key: 'low', label: 'Low', cvss: '0.1 - 3.9', color: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/20' },
    { key: 'medium', label: 'Medium', cvss: '4.0 - 6.9', color: 'border-amber-500/40 text-amber-400 bg-amber-950/20' },
    { key: 'high', label: 'High', cvss: '7.0 - 8.9', color: 'border-orange-500/40 text-orange-400 bg-orange-950/20' },
    { key: 'critical', label: 'Critical', cvss: '9.0 - 10.0', color: 'border-red-500/40 text-red-400 bg-red-950/20' },
  ];

  useEffect(() => {
    const loadPrograms = async () => {
      try {
        const res = await programService.getPrograms();
        if (res.success && res.data?.programs) {
          setPrograms(res.data.programs);
          if (!formData.programId && res.data.programs.length > 0) {
            setFormData((p) => ({ ...p, programId: res.data.programs[0]._id }));
          }
        }
      } catch (err) {
        console.error('Failed to load programs for submission:', err);
      } finally {
        setIsLoadingPrograms(false);
      }
    };

    loadPrograms();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.programId) errs.programId = 'Please select a bounty program';
    if (!formData.title.trim()) errs.title = 'Title is required';
    else if (formData.title.trim().length < 5) errs.title = 'Title must be at least 5 characters';

    if (!formData.affectedAsset.trim()) errs.affectedAsset = 'Affected asset URL/target is required';
    if (!formData.description.trim()) errs.description = 'Description is required';
    else if (formData.description.trim().length < 15) errs.description = 'Description must be at least 15 characters';

    if (!formData.reproductionSteps.trim()) errs.reproductionSteps = 'Detailed reproduction steps are required';
    else if (formData.reproductionSteps.trim().length < 20)
      errs.reproductionSteps = 'Reproduction steps must be at least 20 characters';

    if (!formData.impact.trim()) errs.impact = 'Impact assessment is required';
    else if (formData.impact.trim().length < 10) errs.impact = 'Impact must be at least 10 characters';

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const response = await reportService.createReport(formData);
      if (response.success && response.data?.report) {
        setSubmissionSuccess(response.data.report);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || 'Failed to submit report');
      if (err.response?.data?.errors) {
        setFieldErrors(err.response.data.errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submissionSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto shadow-xl shadow-emerald-500/20">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Vulnerability Report Submitted!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Report <span className="font-mono text-cyan-400">#{submissionSuccess._id}</span> has been
            queued with status <span className="text-cyan-400 font-semibold uppercase">Submitted</span>.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-left text-xs space-y-2 max-w-lg mx-auto">
          <div className="flex justify-between py-1 border-b border-slate-800">
            <span className="text-slate-400">Vulnerability:</span>
            <span className="font-bold text-white truncate max-w-[240px]">{submissionSuccess.title}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800">
            <span className="text-slate-400">Severity Assessment:</span>
            <span className="font-bold uppercase text-amber-400">{submissionSuccess.severity}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-800">
            <span className="text-slate-400">Target Asset:</span>
            <span className="font-mono text-cyan-400 truncate max-w-[240px]">{submissionSuccess.affectedAsset}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-400">Attached Evidence:</span>
            <span className="text-slate-300">{submissionSuccess.evidence?.length || 0} file(s)</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link to={`/reports/${submissionSuccess._id}`}>
            <Button variant="primary" size="md" icon={ArrowRight}>
              View Submitted Report
            </Button>
          </Link>
          <Link to="/reports">
            <Button variant="secondary" size="md">
              Go to My Reports
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Submit Vulnerability Report</h1>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
            Responsible Disclosure
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Provide complete, reproducible technical steps to assist security triage and validation.
        </p>
      </div>

      {formError && (
        <Alert
          type="error"
          title="Submission Rejected"
          message={formError}
          onClose={() => setFormError(null)}
        />
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-cyber-border/80 space-y-5">
          {/* Target Bounty Program */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Target Bounty Program <span className="text-cyan-400">*</span>
            </label>
            {isLoadingPrograms ? (
              <div className="p-3 bg-slate-900 rounded-lg text-xs text-slate-400 flex items-center gap-2">
                <Spinner size="sm" /> Loading programs...
              </div>
            ) : (
              <select
                name="programId"
                value={formData.programId}
                onChange={handleChange}
                className="w-full rounded-lg bg-[#0D1322] border border-slate-700 text-slate-100 text-sm px-3.5 py-2.5 focus:outline-none focus:border-cyan-400"
              >
                {programs.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.companyName} — {p.title}
                  </option>
                ))}
              </select>
            )}
            {fieldErrors.programId && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.programId}</p>
            )}
          </div>

          {/* Vulnerability Title */}
          <Input
            label="Vulnerability Title"
            name="title"
            placeholder="e.g. IDOR in User Profile Endpoint permitting unauthorized data leakage"
            value={formData.title}
            onChange={handleChange}
            error={fieldErrors.title}
            required
          />

          {/* Asset & Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Affected Asset / Endpoint"
              name="affectedAsset"
              placeholder="e.g. https://api.acme.com/v1/users/{id}"
              value={formData.affectedAsset}
              onChange={handleChange}
              error={fieldErrors.affectedAsset}
              required
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Vulnerability Category <span className="text-cyan-400">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full rounded-lg bg-[#0D1322] border border-slate-700 text-slate-100 text-sm px-3.5 py-2.5 focus:outline-none focus:border-cyan-400"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Severity Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Assessed Severity <span className="text-cyan-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {severities.map((sev) => (
                <button
                  key={sev.key}
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, severity: sev.key }))}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    formData.severity === sev.key
                      ? sev.color + ' ring-2 ring-cyan-400/30'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold uppercase">{sev.label}</p>
                  <p className="text-[10px] opacity-75 font-mono mt-0.5">CVSS {sev.cvss}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Description / Summary <span className="text-cyan-400">*</span>
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="Concise technical summary of the flaw and its mechanism..."
              value={formData.description}
              onChange={handleChange}
              className={`w-full rounded-lg bg-[#0D1322] border text-slate-100 text-sm p-3 focus:outline-none ${
                fieldErrors.description ? 'border-red-500' : 'border-slate-700 focus:border-cyan-400'
              }`}
            />
            {fieldErrors.description && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.description}</p>
            )}
          </div>

          {/* Steps to Reproduce */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Detailed Steps to Reproduce <span className="text-cyan-400">*</span>
            </label>
            <textarea
              name="reproductionSteps"
              rows={5}
              placeholder="1. Authenticate as user A and note session token...&#10;2. Intercept GET request to /api/records/42...&#10;3. Alter ID to 43 belonging to user B..."
              value={formData.reproductionSteps}
              onChange={handleChange}
              className={`w-full rounded-lg bg-[#0D1322] border font-mono text-xs text-slate-100 p-3 focus:outline-none ${
                fieldErrors.reproductionSteps ? 'border-red-500' : 'border-slate-700 focus:border-cyan-400'
              }`}
            />
            {fieldErrors.reproductionSteps && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.reproductionSteps}</p>
            )}
          </div>

          {/* Impact & Suggested Remediation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Impact Assessment <span className="text-cyan-400">*</span>
              </label>
              <textarea
                name="impact"
                rows={3}
                placeholder="What can an attacker achieve? (e.g. unauthorized data exfiltration)..."
                value={formData.impact}
                onChange={handleChange}
                className={`w-full rounded-lg bg-[#0D1322] border text-slate-100 text-sm p-3 focus:outline-none ${
                  fieldErrors.impact ? 'border-red-500' : 'border-slate-700 focus:border-cyan-400'
                }`}
              />
              {fieldErrors.impact && <p className="mt-1 text-xs text-red-400">{fieldErrors.impact}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Suggested Remediation
              </label>
              <textarea
                name="suggestedRemediation"
                rows={3}
                placeholder="Recommended code fix or configuration change..."
                value={formData.suggestedRemediation}
                onChange={handleChange}
                className="w-full rounded-lg bg-[#0D1322] border border-slate-700 text-slate-100 text-sm p-3 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* Supporting Evidence Upload (Cloudinary Integration) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Supporting Evidence (Screenshots / HTTP Logs)
            </label>
            <FileUpload
              uploadedFiles={formData.evidence}
              onFilesUploaded={(files) => setFormData((p) => ({ ...p, evidence: files }))}
            />
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <p className="text-[11px] text-slate-500">
              By submitting, you affirm that testing complied with program scope.
            </p>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              icon={Send}
            >
              Submit Vulnerability Report
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SubmitReportPage;
