// src/components/ui/StatusBadge.tsx
import { STATUS, Tone } from '@/core/i18n/id';
import { CheckCircle2, AlertCircle, Clock, XCircle, HelpCircle } from 'lucide-react';

export interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const item = STATUS[status] || {
    label: status,
    tone: 'neutral' as Tone,
  };

  const tones: Record<Tone, { bg: string; text: string; Icon: typeof CheckCircle2 }> = {
    neutral: { bg: 'bg-gray-100', text: 'text-gray-700', Icon: Clock },
    info: { bg: 'bg-navy-50', text: 'text-navy-700', Icon: Clock },
    success: { bg: 'bg-green-50', text: 'text-green-700', Icon: CheckCircle2 },
    warning: { bg: 'bg-amber-50', text: 'text-amber-800', Icon: AlertCircle },
    danger: { bg: 'bg-coral-50', text: 'text-coral-700', Icon: XCircle },
  };

  const current = tones[item.tone] || { bg: 'bg-gray-100', text: 'text-gray-700', Icon: HelpCircle };
  const { bg, text, Icon } = current;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${bg} ${text} ${className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{item.label}</span>
    </span>
  );
}

