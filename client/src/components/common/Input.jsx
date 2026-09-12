import React, { forwardRef } from 'react';

export const Input = forwardRef(
  (
    {
      label,
      id,
      name,
      type = 'text',
      value,
      onChange,
      placeholder,
      error,
      helperText,
      required = false,
      disabled = false,
      icon: Icon,
      className = '',
      autoComplete,
      ...props
    },
    ref
  ) => {
    const inputId = id || name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
          >
            {label}
            {required && <span className="text-cyan-400 ml-1">*</span>}
          </label>
        )}
        <div className="relative rounded-lg shadow-sm">
          {Icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            disabled={disabled}
            required={required}
            placeholder={placeholder}
            autoComplete={autoComplete}
            className={`block w-full rounded-lg bg-[#0D1322]/90 border text-slate-100 placeholder-slate-500 text-sm transition-colors duration-150 focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed ${
              Icon ? 'pl-9 pr-3' : 'px-3.5'
            } py-2.5 ${
              error
                ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/30'
                : 'border-slate-700/80 hover:border-slate-600 focus:border-cyan-400 focus:ring-cyan-400/20'
            } ${className}`}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
        {helperText && !error && (
          <p className="mt-1.5 text-xs text-slate-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
