import React from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Option[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-medium text-zinc-700 dark:text-zinc-300 select-none"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            className={`w-full appearance-none rounded-xl bg-zinc-50/70 dark:bg-zinc-800/80 border text-sm text-zinc-900 dark:text-zinc-100 transition-all duration-150 focus:outline-none focus:ring-2 focus:bg-white dark:focus:bg-zinc-800 px-3.5 py-2 pr-9 cursor-pointer ${
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-red-200/50'
                : 'border-zinc-200/80 dark:border-zinc-700/80 focus:border-mac-blue focus:ring-mac-blue/20'
            } ${className}`}
            {...props}
          >
            {options.map(opt => (
              <option key={opt.value} value={opt.value} className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 pointer-events-none text-zinc-400 dark:text-zinc-500">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        {!error && helperText && (
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
