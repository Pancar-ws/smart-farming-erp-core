// src/core/notifications/useContextualError.ts
// CACA - Notifikasi & Error Handling (Jobdesc Fitur: Pesan error kontekstual)
// Hook terpusat untuk menampilkan toast error yang sesuai konteks operasi gudang.

import { toast } from 'sonner';

// ─── Pemetaan kode error API → pesan ramah pengguna ──────────────────────────
const ERROR_MESSAGES: Record<string, string> = {
  // Inventory / Stock
  NEGATIVE_STOCK: '❌ Stok tidak mencukupi. Jumlah pengeluaran melebihi stok tersedia.',
  STOCK_LOCKED: '🔒 Stok sedang dikunci oleh transaksi lain. Tunggu beberapa saat dan coba lagi.',
  BATCH_NOT_FOUND: '📦 Kode batch tidak ditemukan. Pastikan kode batch sudah benar.',
  BATCH_ALREADY_SORTED: '⚠️ Batch ini sudah pernah disortasi dan tidak dapat diproses ulang.',

  // Mass Balance
  MASS_BALANCE_VIOLATED:
    '⚖️ Neraca massa dilanggar. Total output tidak boleh melebihi input batch.',

  // Member / Anggota
  MEMBER_NOT_FOUND: '👤 Kode anggota tidak ditemukan. Periksa kembali atau scan ulang.',
  MEMBER_INACTIVE: '🚫 Anggota tidak aktif. Hubungi admin untuk mengaktifkan kembali.',

  // Timbangan
  SCALE_DISCONNECTED: '⚡ Timbangan terputus. Sambungkan ulang alat timbang.',
  SCALE_UNSTABLE: '📉 Bacaan timbangan tidak stabil. Tunggu hingga tanda "Stabil" muncul.',
  WEIGHT_ZERO: '0️⃣ Berat tidak boleh nol. Pastikan komoditas sudah diletakkan di timbangan.',

  // Autentikasi
  UNAUTHORIZED: '🔐 Sesi login habis. Silakan login ulang.',
  FORBIDDEN: '⛔ Anda tidak memiliki akses untuk operasi ini.',

  // Server
  SERVER_ERROR: '🔧 Terjadi gangguan pada server. Coba beberapa saat lagi.',
  NETWORK_ERROR:
    '📡 Koneksi internet terputus. Data telah disimpan lokal dan akan dikirim saat online.',
  TIMEOUT: '⏱️ Permintaan memakan waktu terlalu lama. Periksa koneksi dan coba lagi.',

  // Validasi umum
  REQUIRED_FIELD: '📝 Ada kolom wajib yang belum diisi.',
  INVALID_FORMAT: '✏️ Format data tidak valid. Periksa kembali isian.',
  DUPLICATE_ENTRY: '🔁 Data ini sudah pernah diinput sebelumnya.',
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useContextualError() {
  /**
   * Tampilkan toast error berdasarkan kode error API atau pesan fallback.
   * @param code   - Kode error dari respons API (opsional)
   * @param fallback - Pesan default jika kode tidak dikenali
   */
  const showError = (code?: string, fallback?: string) => {
    const message =
      (code && ERROR_MESSAGES[code]) ||
      fallback ||
      '❌ Terjadi kesalahan. Silakan coba lagi atau hubungi admin.';
    toast.error(message);
  };

  /**
   * Tampilkan toast peringatan (warning).
   */
  const showWarning = (message: string) => {
    toast.warning(message);
  };

  /**
   * Tampilkan toast sukses.
   */
  const showSuccess = (message: string) => {
    toast.success(message);
  };

  /**
   * Tampilkan toast info.
   */
  const showInfo = (message: string) => {
    toast.info(message);
  };

  /**
   * Tampilkan banner peringatan Restock jika stok mendekati ROP.
   * @param itemName       - Nama barang
   * @param currentStock   - Stok saat ini (kg)
   * @param ropThreshold   - Reorder Point threshold (kg)
   */
  const checkRestockAlert = (
    itemName: string,
    currentStock: number,
    ropThreshold: number
  ) => {
    if (currentStock <= ropThreshold) {
      toast.warning(
        `⚠️ Stok ${itemName} mendekati batas minimum (${currentStock} kg ≤ ${ropThreshold} kg). Segera lakukan restock!`,
        { duration: 8000 }
      );
    }
  };

  return { showError, showWarning, showSuccess, showInfo, checkRestockAlert };
}

// ─── Helper standalone (tanpa hook, untuk dipakai di luar komponen React) ─────
export function messageFor(code?: string, fallback?: string): string {
  return (
    (code && ERROR_MESSAGES[code]) ||
    fallback ||
    'Terjadi kesalahan. Silakan coba lagi.'
  );
}
