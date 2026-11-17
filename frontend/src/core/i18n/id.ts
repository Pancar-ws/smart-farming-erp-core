// src/core/i18n/id.ts
export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export const STATUS: Record<string, { label: string; tone: Tone }> = {
  // Setoran panen
  MENUNGGU_SORTASI: { label: 'Menunggu sortasi', tone: 'info' },
  SEDANG_DIPROSES:  { label: 'Sedang diproses',  tone: 'info' },
  SELESAI:          { label: 'Selesai',          tone: 'success' },
  DIBATALKAN:       { label: 'Dibatalkan',       tone: 'danger' },

  // Dokumen umum & order
  DRAFT:     { label: 'Draf',         tone: 'neutral' },
  PROPOSED:  { label: 'Usulan',       tone: 'warning' },
  POSTED:    { label: 'Terposting',   tone: 'success' },
  REVERSED:  { label: 'Dibalik',      tone: 'danger' },
  CONFIRMED: { label: 'Terkonfirmasi', tone: 'info' },
  SHIPPED:   { label: 'Terkirim',     tone: 'success' },
  CANCELLED: { label: 'Dibatalkan',   tone: 'danger' },

  // Purchase Order
  ORDERED:  { label: 'Dipesan', tone: 'info' },
  PARTIAL:  { label: 'Sebagian', tone: 'warning' },
  RECEIVED: { label: 'Diterima', tone: 'success' },

  // Hutang / Piutang / Faktur
  OPEN: { label: 'Belum lunas', tone: 'warning' },
  PAID: { label: 'Lunas', tone: 'success' },
  VOID: { label: 'Batal', tone: 'danger' },

  // Keanggotaan
  AKTIF:     { label: 'Aktif',    tone: 'success' },
  NON_AKTIF: { label: 'Nonaktif', tone: 'neutral' },
};

export const SEGMENT = {
  KONSUMEN: 'Konsumen langsung',
  RETAIL: 'Retail',
  PASAR_MODERN: 'Pasar modern',
} as const;

export const SAPROTAN_TYPE = {
  BENIH: 'Benih',
  PUPUK_ORGANIK: 'Pupuk organik',
  PUPUK_KIMIA: 'Pupuk kimia',
  KEMASAN: 'Kemasan',
} as const;

export const ERROR_MESSAGES: Record<string, string> = {
  INSUFFICIENT_STOCK: 'Stok tidak cukup.',
  MASS_BALANCE_VIOLATION: 'Neraca massa belum seimbang.',
  QC_REQUIRED: 'Order sortasi belum memiliki hasil QC yang lolos.',
  PRICE_NOT_FOUND: 'Harga belum diatur untuk produk/grade ini.',
  MEMBER_INACTIVE: 'Anggota nonaktif tidak dapat melakukan transaksi.',
  PERIOD_CLOSED: 'Periode akuntansi sudah ditutup.',
  DUPLICATE: 'Data sudah terdaftar dalam sistem.',
  INVALID_STATE: 'Dokumen ini sudah berubah status. Silakan muat ulang.',
  FORBIDDEN: 'Peran Anda tidak berhak melakukan aksi ini.',
  UNAUTHORIZED: 'Sesi berakhir. Silakan masuk kembali.',
  NETWORK: 'Tidak dapat menghubungi server. Periksa koneksi internet.',
  JOURNAL_UNBALANCED: 'Jurnal tidak seimbang. Terjadi kesalahan pada server.',
};

export function messageFor(code: string, fallback?: string): string {
  return ERROR_MESSAGES[code] || fallback || 'Terjadi kesalahan pada sistem.';
}

