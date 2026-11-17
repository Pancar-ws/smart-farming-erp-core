// src/core/api/invalidate.ts
import { QueryClient } from '@tanstack/react-query';

export type InvalidateEvent =
  | 'harvest-saved'
  | 'sorting-posted'
  | 'saprotan-issued'
  | 'goods-received'
  | 'so-created'
  | 'order-shipped'
  | 'payment-saved'
  | 'reversed';

const MAP: Record<InvalidateEvent, readonly (readonly unknown[])[]> = {
  'harvest-saved': [['harvest'], ['inventory'], ['dashboard'], ['members']],
  'sorting-posted': [['sorting'], ['harvest'], ['inventory'], ['acct'], ['esg'], ['dashboard'], ['trace']],
  'saprotan-issued': [['inventory'], ['notifications'], ['acct'], ['members']],
  'goods-received': [['inventory'], ['acct'], ['purchase-orders']],
  'so-created': [['sales'], ['inventory']],
  'order-shipped': [['sales'], ['inventory'], ['acct'], ['esg'], ['dashboard']],
  'payment-saved': [['acct'], ['members'], ['esg']],
  'reversed': [['acct'], ['inventory'], ['dashboard'], ['sorting'], ['sales']],
};

export const invalidateAfter = (qc: QueryClient, ev: InvalidateEvent) => {
  MAP[ev].forEach((key) => {
    qc.invalidateQueries({ queryKey: key as unknown[] });
  });
};

