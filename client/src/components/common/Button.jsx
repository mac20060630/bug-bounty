import React from 'react';
import Spinner from './Spinner';

export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  onClick,
  className = '',
  icon: Icon,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#070A11] disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 focus:ring-cyan-400 border border-cyan-400/30',
    secondary:
      'bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700 focus:ring-slate-500',
    accent:
      'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 focus:ring-emerald-400 border border-emerald-400/30',
    danger:
      'bg-red-600/90 hover:bg-red-500 text-white border border-red-500/30 focus:ring-red-500 shadow-lg shadow-red-600/20',
    outline:
      'border border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-500/10 text-slate-300 hover:text-cyan-300 focus:ring-cyan-500',
    ghost:
      'text-slate-400 hover:text-white hover:bg-slate-800/60 focus:ring-slate-500',
  };

  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${
        sizeClasses[size] || sizeClasses.md
      } ${className}`}
      {...props}
    >
      {isLoading ? (
        <Spinner size="sm" className="text-current" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      <span>{children}</span>
    </button>
  );
};

export default Button;
