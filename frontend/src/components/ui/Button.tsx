// src/components/ui/Button.tsx
import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const base =
      'inline-flex items-center justify-center font-medium rounded-control transition-colors select-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-navy-700 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

    const variants: Record<ButtonVariant, string> = {
      primary: 'bg-navy-700 hover:bg-navy-800 text-white shadow-sm',
      secondary: 'bg-navy-50 hover:bg-navy-700 hover:text-white text-navy-700 border border-line',
      danger: 'bg-coral-700 hover:bg-red-800 text-white shadow-sm',
      ghost: 'hover:bg-navy-50 text-ink-900',
      outline: 'border border-line hover:bg-navy-50 text-ink-900',
    };

    const sizes: Record<ButtonSize, string> = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-control px-4 text-sm',
      lg: 'h-[52px] px-6 text-base font-semibold',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

