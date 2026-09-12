import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Search, Shield, ArrowUpRight, Star } from 'lucide-react';
import * as leaderboardService from '../services/leaderboardService';
import Spinner from '../components/common/Spinner';
import Badge from '../components/common/Badge';

export const LeaderboardPage = () => {
  const [researchers, setResearchers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await leaderboardService.getLeaderboard({ limit: 100 });
        if (response.success && response.data?.leaderboard) {
          setResearchers(response.data.leaderboard);
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load leaderboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const filteredResearchers = researchers.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const topThree = researchers.slice(0, 3);

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 text-xs shadow-lg shadow-amber-500/20">
          🥇
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-400/20 text-slate-300 font-bold border border-slate-400/40 text-xs">
          🥈
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/20 text-amber-500 font-bold border border-amber-700/40 text-xs">
          🥉
        </span>
      );
    }
    return (
      <span className="font-mono text-xs text-slate-400 font-semibold px-2 py-0.5">
        #{rank}
      </span>
    );
  };

  return (
    <div className="space-y-8 py-4">
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
          <Trophy className="h-3.5 w-3.5" />
          <span>Global Security Hall of Fame</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Researcher Leaderboard
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          Celebrating the world's most elite ethical security researchers who protect systems, uncover high-impact vulnerabilities, and earn verified reputation.
        </p>
      </div>

      {/* Top 3 Podium (if at least 1 researcher) */}
      {!isLoading && researchers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto pt-4">
          {/* Rank 2 (Silver) */}
          {topThree[1] && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-700/80 md:order-1 flex flex-col items-center text-center relative overflow-hidden bg-gradient-to-b from-slate-900/60 to-slate-950">
              <div className="text-2xl mb-2">🥈</div>
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                Rank #2
              </span>
              <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-slate-500 flex items-center justify-center font-bold text-lg text-white my-3 shadow-md">
                {topThree[1].name.charAt(0).toUpperCase()}
              </div>
              <h3 className="font-bold text-white text-base truncate max-w-full">
                {topThree[1].name}
              </h3>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="text-lg font-mono font-black text-cyan-400">
                  {topThree[1].reputation}
                </span>
                <span className="text-xs text-slate-400 font-semibold">PTS</span>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 w-full flex justify-around text-xs text-slate-400">
                <div>
                  <span className="text-slate-200 font-bold block">{topThree[1].acceptedReportsCount}</span>
                  <span>Accepted</span>
                </div>
                <div>
                  <span className="text-emerald-400 font-bold block">${topThree[1].totalRewardsAmount}</span>
                  <span>Rewards</span>
                </div>
              </div>
            </div>
          )}

          {/* Rank 1 (Gold) */}
          {topThree[0] && (
            <div className="glass-panel p-7 rounded-2xl border border-amber-500/50 md:order-2 flex flex-col items-center text-center relative overflow-hidden bg-gradient-to-b from-amber-950/20 to-slate-950 shadow-xl shadow-amber-500/5 -mt-2">
              <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-black text-[10px] font-black px-3 py-0.5 rounded-bl-lg uppercase tracking-wider">
                Champion
              </div>
              <div className="text-3xl mb-1">🥇</div>
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                Rank #1
              </span>
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-400 flex items-center justify-center font-black text-xl text-amber-300 my-3 shadow-lg shadow-amber-500/20">
                {topThree[0].name.charAt(0).toUpperCase()}
              </div>
              <h3 className="font-black text-white text-lg truncate max-w-full">
                {topThree[0].name}
              </h3>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="text-2xl font-mono font-black text-amber-400">
                  {topThree[0].reputation}
                </span>
                <span className="text-xs text-amber-300/80 font-bold">PTS</span>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 w-full flex justify-around text-xs text-slate-400">
                <div>
                  <span className="text-slate-100 font-bold block">{topThree[0].acceptedReportsCount}</span>
                  <span>Accepted</span>
                </div>
                <div>
                  <span className="text-emerald-400 font-bold block">${topThree[0].totalRewardsAmount}</span>
                  <span>Rewards</span>
                </div>
              </div>
            </div>
          )}

          {/* Rank 3 (Bronze) */}
          {topThree[2] && (
            <div className="glass-panel p-6 rounded-2xl border border-amber-800/60 md:order-3 flex flex-col items-center text-center relative overflow-hidden bg-gradient-to-b from-slate-900/60 to-slate-950">
              <div className="text-2xl mb-2">🥉</div>
              <span className="text-xs font-mono font-bold text-amber-600 uppercase tracking-wider">
                Rank #3
              </span>
              <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-amber-700 flex items-center justify-center font-bold text-lg text-amber-500 my-3 shadow-md">
                {topThree[2].name.charAt(0).toUpperCase()}
              </div>
              <h3 className="font-bold text-white text-base truncate max-w-full">
                {topThree[2].name}
              </h3>
              <div className="mt-2 flex items-center gap-1.5">
                <span className="text-lg font-mono font-black text-cyan-400">
                  {topThree[2].reputation}
                </span>
                <span className="text-xs text-slate-400 font-semibold">PTS</span>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 w-full flex justify-around text-xs text-slate-400">
                <div>
                  <span className="text-slate-200 font-bold block">{topThree[2].acceptedReportsCount}</span>
                  <span>Accepted</span>
                </div>
                <div>
                  <span className="text-emerald-400 font-bold block">${topThree[2].totalRewardsAmount}</span>
                  <span>Rewards</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Leaderboard Table Section */}
      <div className="glass-panel p-6 rounded-2xl border border-cyber-border/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Full Researcher Standings</h2>
            <span className="text-xs font-mono text-slate-400">
              ({researchers.length} Active Researchers)
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search researcher name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-cyan-400">
            <Spinner size="lg" />
            <p className="text-xs font-mono text-slate-400 mt-2">Compiling Leaderboard...</p>
          </div>
        ) : filteredResearchers.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-sm">No researchers found matching your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-16">Rank</th>
                  <th className="py-3 px-4">Researcher</th>
                  <th className="py-3 px-4 text-right">Reputation</th>
                  <th className="py-3 px-4 text-right">Accepted Reports</th>
                  <th className="py-3 px-4 text-right">Total Bounties</th>
                  <th className="py-3 px-4 text-right">Active Since</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredResearchers.map((res) => (
                  <tr
                    key={res.researcherId}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="py-3.5 px-4">{getRankBadge(res.rank)}</td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-cyan-400 group-hover:border-cyan-500/50 transition-colors">
                          {res.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-100 flex items-center gap-1.5">
                            <span>{res.name}</span>
                            {res.rank <= 3 && (
                              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            VERIFIED RESEARCHER
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-mono font-bold text-sm text-cyan-400">
                        {res.reputation}
                      </span>
                      <span className="text-[10px] text-slate-500 ml-1">PTS</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-mono font-medium text-slate-200">
                        {res.acceptedReportsCount}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-mono font-bold text-emerald-400">
                        ${res.totalRewardsAmount.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500 font-mono text-[11px]">
                      {res.createdAt
                        ? new Date(res.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
