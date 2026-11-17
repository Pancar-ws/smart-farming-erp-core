// src/features/sorting/massBalance.ts
import { D, sum, Dec } from '@/core/format/money';
import Decimal from 'decimal.js';

export type BalanceState = 'balanced' | 'short' | 'over';

export interface MassBalanceResult {
  out: Decimal;
  diff: Decimal;
  state: BalanceState;
  shrinkPct: Decimal;
}

export function massBalance(input: Dec, outputs: Dec[], reject: Dec): MassBalanceResult {
  const out = sum(outputs);
  const diff = D(input).minus(out); // >0 kurang, <0 melebihi
  const state: BalanceState = diff.isZero() ? 'balanced' : diff.gt(0) ? 'short' : 'over';
  const shrinkPct = D(input).isZero() ? new Decimal(0) : D(reject).div(D(input)).times(100);
  return { out, diff, state, shrinkPct };
}

