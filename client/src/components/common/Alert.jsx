import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export const Alert = ({
  type = 'info',
  title,
  message,
  onClose,
  className = '',
}) => {
  const config = {
    error: {
      bg: 'bg-red-950/40 border-red-500/40 text-red-200',
      icon: AlertCircle,
      iconColor: 'text-red-400',
    },
    success: {
      bg: 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200',
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
    },
    warning: {
      bg: 'bg-amber-950/40 border-amber-500/40 text-amber-200',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
    },
    info: {
      bg: 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200',
      icon: Info,
      iconColor: 'text-cyan-400',
    },
  }[type] || {
    bg: 'bg-slate-900 border-slate-700 text-slate-200',
    icon: Info,
    iconColor: 'text-slate-400',
  };

  const IconComponent = config.icon;

  return (
    <div
      role="alert"
      className={`relative flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md ${config.bg} ${className}`}
    >
      <IconComponent className={`h-5 w-5 shrink-0 mt-0.5 ${config.iconColor}`} />
      <div className="flex-1 text-sm">
        {title && <p className="font-semibold text-white mb-0.5">{title}</p>}
        {message && <div className="leading-relaxed opacity-90">{message}</div>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-slate-400 hover:text-white transition-colors p-1"
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;
