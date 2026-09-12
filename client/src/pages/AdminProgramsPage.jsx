import React, { useState, useEffect } from 'react';
import {
  Building2,
  PlusCircle,
  Edit2,
  Power,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Target,
  DollarSign,
  X,
  ExternalLink,
  Shield,
} from 'lucide-react';
import * as programService from '../services/programService';
import Spinner from '../components/common/Spinner';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Alert from '../components/common/Alert';

export const AdminProgramsPage = () => {
  const [programs, setPrograms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const initialForm = {
    companyName: '',
    title: '',
    description: '',
    rewardRange: { min: 250, max: 5000, currency: 'USD' },
    rules:
      '1. Respect privacy and do not alter customer data.\n2. Do not conduct Denial of Service (DoS) attacks.\n3. Report vulnerabilities promptly with clear reproduction steps.\n4. Maintain confidentiality until authorized disclosure.',
    scope: {
      inScope: [{ target: '*.example.com', type: 'web', description: 'Primary web targets' }],
      outOfScope: [{ target: 'blog.example.com', description: 'Third party hosted blog' }],
    },
    status: 'active',
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchAdminPrograms = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // In admin context, query retrieves all statuses
      const response = await programService.getPrograms();
      if (response.success && response.data?.programs) {
        setPrograms(response.data.programs);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load programs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminPrograms();
  }, []);

  const openCreateModal = () => {
    setEditingProgramId(null);
    setFormData(initialForm);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (prog) => {
    setEditingProgramId(prog._id);
    setFormData({
      companyName: prog.companyName || '',
      title: prog.title || '',
      description: prog.description || '',
      rewardRange: {
        min: prog.rewardRange?.min || 0,
        max: prog.rewardRange?.max || 5000,
        currency: prog.rewardRange?.currency || 'USD',
      },
      rules: prog.rules || '',
      scope: {
        inScope: prog.scope?.inScope?.length > 0 ? prog.scope.inScope : [{ target: '', type: 'web', description: '' }],
        outOfScope: prog.scope?.outOfScope?.length > 0 ? prog.scope.outOfScope : [{ target: '', description: '' }],
      },
      status: prog.status || 'active',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleScopeChange = (scopeType, index, field, value) => {
    setFormData((prev) => {
      const list = [...prev.scope[scopeType]];
      list[index] = { ...list[index], [field]: value };
      return {
        ...prev,
        scope: { ...prev.scope, [scopeType]: list },
      };
    });
  };

  const addScopeRow = (scopeType) => {
    setFormData((prev) => ({
      ...prev,
      scope: {
        ...prev.scope,
        [scopeType]:
          scopeType === 'inScope'
            ? [...prev.scope.inScope, { target: '', type: 'web', description: '' }]
            : [...prev.scope.outOfScope, { target: '', description: '' }],
      },
    }));
  };

  const removeScopeRow = (scopeType, index) => {
    setFormData((prev) => ({
      ...prev,
      scope: {
        ...prev.scope,
        [scopeType]: prev.scope[scopeType].filter((_, idx) => idx !== index),
      },
    }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.companyName.trim()) errs.companyName = 'Company name is required';
    if (!formData.title.trim()) errs.title = 'Title is required';
    if (!formData.description.trim()) errs.description = 'Description is required';
    if (Number(formData.rewardRange.max) <= 0) errs.maxReward = 'Max reward must be positive';
    if (Number(formData.rewardRange.min) > Number(formData.rewardRange.max))
      errs.minReward = 'Min reward cannot exceed max reward';

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveProgram = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (editingProgramId) {
        await programService.updateProgram(editingProgramId, formData);
        setSuccessMessage('Program updated successfully!');
      } else {
        await programService.createProgram(formData);
        setSuccessMessage('New Bounty Program published successfully!');
      }
      setIsModalOpen(false);
      fetchAdminPrograms();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save program');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (prog) => {
    const newStatus = prog.status === 'active' ? 'paused' : 'active';
    try {
      await programService.updateProgram(prog._id, { status: newStatus });
      setSuccessMessage(`Program status updated to '${newStatus}'`);
      fetchAdminPrograms();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to update status');
    }
  };

  const handleDelete = async (progId) => {
    if (!window.confirm('Are you sure you want to close and deactivate this program?')) return;
    try {
      await programService.deleteProgram(progId);
      setSuccessMessage('Program deactivated and marked closed.');
      fetchAdminPrograms();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to deactivate program');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Bounty Program Management</h1>
            <Badge variant="admin">Admin Console</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure in-scope assets, reward structures, disclosure rules, and program status.
          </p>
        </div>

        <Button variant="accent" size="sm" onClick={openCreateModal} icon={PlusCircle}>
          Create New Program
        </Button>
      </div>

      {successMessage && (
        <Alert
          type="success"
          title="Operation Succeeded"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      {error && (
        <Alert
          type="error"
          title="Program Management Error"
          message={error}
          onClose={() => setError(null)}
        />
      )}

      {/* Programs List Table */}
      {isLoading ? (
        <div className="py-20 text-center text-cyan-400">
          <Spinner size="lg" />
          <p className="text-xs font-mono text-slate-400 mt-3">Loading Programs...</p>
        </div>
      ) : programs.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center max-w-md mx-auto space-y-3">
          <Building2 className="h-10 w-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Programs Configured</h3>
          <p className="text-xs text-slate-400">
            Publish your first bounty program to allow researchers to find and report vulnerabilities.
          </p>
          <div className="pt-2">
            <Button variant="primary" size="sm" onClick={openCreateModal}>
              Create Program
            </Button>
          </div>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-cyber-border/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Company / Title</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Reward Range</th>
                  <th className="py-3.5 px-4 font-semibold">Scope Targets</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {programs.map((prog) => (
                  <tr key={prog._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4">
                      <span className="font-bold text-white block">{prog.companyName}</span>
                      <span className="text-[11px] text-slate-400 block truncate max-w-[240px]">
                        {prog.title}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <Badge
                        variant={
                          prog.status === 'active'
                            ? 'admin'
                            : prog.status === 'paused'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {prog.status}
                      </Badge>
                    </td>

                    <td className="py-4 px-4 font-mono font-medium text-emerald-400">
                      ${prog.rewardRange?.min || 0} – ${prog.rewardRange?.max || 0}{' '}
                      {prog.rewardRange?.currency || 'USD'}
                    </td>

                    <td className="py-4 px-4">
                      <span className="text-slate-300">
                        {prog.scope?.inScope?.length || 0} in-scope
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleToggleStatus(prog)}
                        title={prog.status === 'active' ? 'Pause Program' : 'Activate Program'}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                      >
                        <Power className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => openEditModal(prog)}
                        title="Edit Program"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(prog._id)}
                        title="Close / Deactivate Program"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Program Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-3xl rounded-2xl border border-cyber-border/80 shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-cyan-400" />
                <span>{editingProgramId ? 'Edit Bounty Program' : 'Create New Bounty Program'}</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProgram} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Company / Organization Name"
                  name="companyName"
                  placeholder="e.g. Acme Cloud Corp"
                  value={formData.companyName}
                  onChange={(e) => setFormData((p) => ({ ...p, companyName: e.target.value }))}
                  error={formErrors.companyName}
                  required
                />

                <Input
                  label="Program Title"
                  name="title"
                  placeholder="e.g. Acme Web & Cloud Infrastructure Program"
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  error={formErrors.title}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Program Summary Description <span className="text-cyan-400">*</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  placeholder="High-level description of scope, targets, and disclosure goals..."
                  className="w-full rounded-lg bg-[#0D1322] border border-slate-700 text-slate-100 text-sm p-3 focus:outline-none focus:border-cyan-400"
                />
                {formErrors.description && <p className="mt-1 text-xs text-red-400">{formErrors.description}</p>}
              </div>

              {/* Reward Range */}
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="Min Reward ($)"
                  type="number"
                  value={formData.rewardRange.min}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      rewardRange: { ...p.rewardRange, min: Number(e.target.value) },
                    }))
                  }
                  error={formErrors.minReward}
                />
                <Input
                  label="Max Reward ($)"
                  type="number"
                  value={formData.rewardRange.max}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      rewardRange: { ...p.rewardRange, max: Number(e.target.value) },
                    }))
                  }
                  error={formErrors.maxReward}
                  required
                />
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                    className="w-full rounded-lg bg-[#0D1322] border border-slate-700 text-slate-100 text-sm px-3 py-2.5 focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* In Scope Targets Builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    In-Scope Targets
                  </label>
                  <button
                    type="button"
                    onClick={() => addScopeRow('inScope')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    + Add Target
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.scope.inScope.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Target (e.g. *.acme.com)"
                        value={item.target}
                        onChange={(e) => handleScopeChange('inScope', idx, 'target', e.target.value)}
                        className="flex-1 rounded-lg bg-[#0D1322] border border-slate-700 text-xs text-slate-100 px-3 py-2"
                      />
                      <select
                        value={item.type}
                        onChange={(e) => handleScopeChange('inScope', idx, 'type', e.target.value)}
                        className="rounded-lg bg-[#0D1322] border border-slate-700 text-xs text-slate-100 px-2 py-2"
                      >
                        <option value="web">Web</option>
                        <option value="api">API</option>
                        <option value="mobile">Mobile</option>
                        <option value="cloud">Cloud</option>
                        <option value="hardware">Hardware</option>
                        <option value="other">Other</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeScopeRow('inScope', idx)}
                        className="p-1.5 text-slate-500 hover:text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rules of engagement */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Rules & Disclosure Policy
                </label>
                <textarea
                  rows={3}
                  value={formData.rules}
                  onChange={(e) => setFormData((p) => ({ ...p, rules: e.target.value }))}
                  className="w-full rounded-lg bg-[#0D1322] border border-slate-700 text-slate-100 text-xs p-3 font-mono focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <Button variant="secondary" size="md" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
                  {editingProgramId ? 'Save Changes' : 'Publish Program'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProgramsPage;
