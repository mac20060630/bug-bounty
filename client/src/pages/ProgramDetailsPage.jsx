import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Building2,
  DollarSign,
  Target,
  FileCode,
  AlertTriangle,
  ArrowLeft,
  PlusCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import * as programService from '../services/programService';
import useAuth from '../hooks/useAuth';
import Spinner from '../components/common/Spinner';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';

export const ProgramDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [program, setProgram] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProgram = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await programService.getProgramById(id);
        if (response.success && response.data?.program) {
          setProgram(response.data.program);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Program not found');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProgram();
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-24 text-center text-cyan-400">
        <Spinner size="lg" />
        <p className="text-xs font-mono text-slate-400 mt-3">Loading Scope & Guidelines...</p>
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <Alert type="error" title="Program Unavailable" message={error} />
        <Link to="/programs">
          <Button variant="secondary" size="sm" icon={ArrowLeft}>
            Back to Programs
          </Button>
        </Link>
      </div>
    );
  }

  const inScope = program.scope?.inScope || [];
  const outOfScope = program.scope?.outOfScope || [];
  const minReward = program.rewardRange?.min || 0;
  const maxReward = program.rewardRange?.max || 0;
  const currency = program.rewardRange?.currency || 'USD';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Link */}
      <Link
        to="/programs"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to all programs</span>
      </Link>

      {/* Program Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-cyber-border/80 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1 text-xs font-semibold text-cyan-400">
                <Building2 className="h-3.5 w-3.5" />
                {program.companyName}
              </span>
              <Badge variant={program.status === 'active' ? 'admin' : 'warning'} size="xs">
                {program.status}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {program.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              {program.description}
            </p>
          </div>

          {/* Reward Bounty Card */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-700/80 shrink-0 space-y-2 lg:text-right">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Bounty Reward Range
            </span>
            <div className="text-2xl font-extrabold text-emerald-400 font-mono">
              ${minReward.toLocaleString()} – ${maxReward.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500 block">Currency: {currency}</span>

            <div className="pt-2">
              <Link to={`/reports/submit?programId=${program._id}`}>
                <Button variant="primary" size="md" className="w-full" icon={PlusCircle}>
                  Submit Vulnerability
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Scope Overview Grid */}
        <div className="space-y-6">
          {/* In-Scope Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                In-Scope Targets ({inScope.length})
              </h3>
            </div>

            {inScope.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No specific in-scope targets declared.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Target Asset</th>
                      <th className="py-3 px-4 font-semibold">Type</th>
                      <th className="py-3 px-4 font-semibold">Instruction / Scope Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {inScope.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-mono font-medium text-cyan-400">{item.target}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] uppercase font-mono">
                            {item.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">{item.description || 'Standard testing rules apply'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Out-of-Scope Section */}
          {outOfScope.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="h-4 w-4 text-red-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Out-of-Scope Targets ({outOfScope.length})
                </h3>
              </div>
              <div className="rounded-xl border border-slate-800 divide-y divide-slate-800/60 text-xs">
                {outOfScope.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-900/40 flex items-center justify-between">
                    <span className="font-mono text-slate-400 line-through">{item.target}</span>
                    <span className="text-slate-500 text-[11px]">{item.description || 'Strictly out of bounds'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rules of Engagement */}
          <div className="pt-4 border-t border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4 text-cyan-400" />
              <span>Rules of Engagement & Responsible Disclosure</span>
            </h3>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 whitespace-pre-line leading-relaxed font-mono">
              {program.rules}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramDetailsPage;
