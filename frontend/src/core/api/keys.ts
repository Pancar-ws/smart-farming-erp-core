// src/core/api/keys.ts
export const qk = {
  me: ['me'] as const,
  dashboard: ['dashboard'] as const,
  notifications: ['notifications'] as const,
  members: {
    all: ['members'] as const,
    list: (p: object) => ['members', 'list', p] as const,
    detail: (id: number) => ['members', id] as const,
    summary: (id: number) => ['members', id, 'summary'] as const,
  },
  harvest: {
    list: (p: object) => ['harvest', 'list', p] as const,
  },
  inventory: {
    saprotan: ['inventory', 'saprotan'] as const,
    lots: (p: object) => ['inventory', 'lots', p] as const,
    alerts: ['inventory', 'alerts'] as const,
  },
  sorting: {
    all: ['sorting'] as const,
    detail: (id: number) => ['sorting', id] as const,
  },
  sales: {
    all: ['sales'] as const,
    quote: (p: object) => ['sales', 'quote', p] as const,
  },
  accounting: {
    payables: ['acct', 'payables'] as const,
    receivables: ['acct', 'receivables'] as const,
    reports: (name: string, p: object) => ['acct', 'report', name, p] as const,
  },
  trace: (code: string) => ['trace', code] as const,
  esg: (kind: string, p: object) => ['esg', kind, p] as const,
  lookups: ['lookups'] as const,
};

