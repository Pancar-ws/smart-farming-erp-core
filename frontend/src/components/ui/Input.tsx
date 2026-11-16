// src/components/ui/Input.tsx
import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ invalid = false, className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full h-control px-3 bg-white text-ink-900 border rounded-control transition-colors outline-none text-sm placeholder:text-ink-600/50 disabled:bg-gray-100 disabled:text-gray-500 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-navy-700 ${
          invalid ? 'border-coral-700' : 'border-line'
        } ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

