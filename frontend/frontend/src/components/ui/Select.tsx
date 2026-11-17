// src/components/ui/Select.tsx
import React, { forwardRef } from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ options, invalid = false, className = '', ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`w-full h-control px-3 bg-white text-ink-900 border rounded-control transition-colors outline-none text-sm disabled:bg-gray-100 disabled:text-gray-500 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-navy-700 ${
          invalid ? 'border-coral-700' : 'border-line'
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }
);
Select.displayName = 'Select';

