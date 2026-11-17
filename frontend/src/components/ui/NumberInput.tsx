// src/components/ui/NumberInput.tsx
import { forwardRef } from 'react';
import { normalizeDecimal } from '@/core/format/input';

export interface NumberInputProps {
  value: string;
  onChange(v: string): void;
  unit?: string;
  maxDp?: number;
  invalid?: boolean;
  id?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value = '',
      onChange,
      unit,
      maxDp = 3,
      invalid = false,
      disabled = false,
      placeholder = '0',
      className = '',
      ...p
    },
    ref
  ) => {
    return (
      <div
        className={`flex items-center border rounded-control bg-white h-control transition-colors ${
          invalid ? 'border-coral-700' : 'border-line'
        } ${
          disabled ? 'bg-gray-100 opacity-70' : 'focus-within:outline focus-within:outline-[3px] focus-within:outline-navy-700'
        } ${className}`}
      >
        <input
          ref={ref}
          inputMode="decimal"
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          className="num flex-1 h-full px-3 text-right bg-transparent outline-none text-ink-900 text-sm font-medium"
          value={value ? value.replace('.', ',') : ''}
          onChange={(e) => onChange(normalizeDecimal(e.target.value, maxDp))}
          {...p}
        />
        {unit && <span className="px-3 text-ink-600 font-medium text-xs select-none border-l border-line">{unit}</span>}
      </div>
    );
  }
);
NumberInput.displayName = 'NumberInput';

