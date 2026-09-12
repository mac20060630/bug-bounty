import React from 'react';

export const Badge = ({ children, variant = 'neutral', size = 'sm', className = '' }) => {
  const variantStyles = {
    researcher: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    admin: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    danger: 'bg-red-500/10 text-red-400 border-red-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    neutral: 'bg-slate-800 text-slate-300 border-slate-700',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  };

  const sizeStyles = {
    xs: 'text-[10px] px-2 py-0.5',
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border uppercase tracking-wider ${
        variantStyles[variant] || variantStyles.neutral
      } ${sizeStyles[size] || sizeStyles.sm} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
