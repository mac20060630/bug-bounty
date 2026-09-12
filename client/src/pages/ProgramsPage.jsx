import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Search, DollarSign, Target, ArrowRight, Building2, PlusCircle, AlertCircle } from 'lucide-react';
import * as programService from '../services/programService';
import useAuth from '../hooks/useAuth';
import Spinner from '../components/common/Spinner';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';

export const ProgramsPage = () => {
  const { isAdmin } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  const fetchPrograms = async (search = '') => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await programService.getPrograms({ search });
      if (response.success && response.data?.programs) {
        setPrograms(response.data.programs);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load bounty programs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPrograms(searchQuery);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Active Bounty Programs</h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              {programs.length} In Scope
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Discover verified organizations, inspect scope targets, and submit vulnerability reports for rewards.
          </p>
        </div>

        {isAdmin && (
          <Link to="/admin/programs">
            <Button variant="accent" size="sm" icon={PlusCircle}>
              Manage Programs
            </Button>
          </Link>
        )}
      </div>

      {/* Search & Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-3 max-w-xl">
        <div className="relative flex-1">
          <Search className="absolute inset-y-0 left-3 my-auto h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search programs by company, title, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20"
          />
        </div>
        <Button type="submit" variant="primary" size="md">
          Search
        </Button>
      </form>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-900/40 text-xs text-red-300 flex items-center gap-3">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Programs Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-cyan-400">
          <Spinner size="lg" />
          <p className="text-xs font-mono text-slate-400 mt-3">Loading Bounty Catalog...</p>
        </div>
      ) : programs.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center max-w-md mx-auto space-y-3">
          <Shield className="h-10 w-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Programs Found</h3>
          <p className="text-xs text-slate-400">
            {searchQuery
              ? `No bounty programs matched your query '${searchQuery}'.`
              : 'There are currently no active public programs.'}
          </p>
          {isAdmin && (
            <div className="pt-2">
              <Link to="/admin/programs">
                <Button variant="primary" size="sm">
                  Create First Program
                </Button>
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((prog) => {
            const inScopeCount = prog.scope?.inScope?.length || 0;
            const rewardMin = prog.rewardRange?.min || 0;
            const rewardMax = prog.rewardRange?.max || 0;
            const currency = prog.rewardRange?.currency || 'USD';

            return (
              <div
                key={prog._id}
                className="glass-panel p-6 rounded-2xl border border-cyber-border/80 hover:border-cyan-500/40 transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Top Meta */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
                      <Building2 className="h-3.5 w-3.5" />
                      {prog.companyName}
                    </span>
                    <Badge variant={prog.status === 'active' ? 'admin' : 'neutral'} size="xs">
                      {prog.status}
                    </Badge>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors mb-2 line-clamp-1">
                    {prog.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {prog.description}
                  </p>
                </div>

                {/* Bottom Badges & CTA */}
                <div className="pt-4 border-t border-slate-800/80 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Target className="h-3.5 w-3.5 text-cyan-400" />
                      {inScopeCount} Targets in Scope
                    </span>
                    <span className="font-mono font-bold text-emerald-400">
                      ${rewardMin.toLocaleString()} – ${rewardMax.toLocaleString()} {currency}
                    </span>
                  </div>

                  <Link to={`/programs/${prog._id}`} className="block">
                    <Button variant="secondary" size="sm" className="w-full justify-between" icon={ArrowRight}>
                      View Program Scope
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProgramsPage;
