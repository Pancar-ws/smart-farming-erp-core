/**
 * Utilitas lokalisasi Bahasa Indonesia sesuai SDD & SRS-NFR-005:
 * - Mata uang: Rupiah (Rp) format titik ribuan Indonesia
 * - Tanggal  : DD/MM/YYYY
 * - Berat    : kilogram (kg)
 */

/**
 * Format angka menjadi mata uang Rupiah (contoh: Rp 46.000)
 */
export function formatRupiah(value) {
  const num = Number(value ?? 0)
  if (Number.isNaN(num)) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num)
}

/**
 * Format angka berat ke satuan kg lokal Indonesia (contoh: 1.000 kg atau 1,50 kg)
 */
export function formatKg(value, decimals = 2) {
  const num = Number(value ?? 0)
  if (Number.isNaN(num)) return '0 kg'
  const formatted = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(num)
  return `${formatted} kg`
}

/**
 * Format angka desimal umum (misal luas lahan hektare)
 */
export function formatNumberID(value, decimals = 2) {
  const num = Number(value ?? 0)
  if (Number.isNaN(num)) return '0'
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(num)
}

/**
 * Format string tanggal (YYYY-MM-DD atau ISO) menjadi DD/MM/YYYY
 */
export function formatDateID(dateInput) {
  if (!dateInput) return '-'
  const d = new Date(dateInput)
  if (Number.isNaN(d.getTime())) return String(dateInput)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Format timestamp ISO menjadi DD/MM/YYYY HH:mm WIB
 */
export function formatDateTimeID(dateInput) {
  if (!dateInput) return '-'
  const d = new Date(dateInput)
  if (Number.isNaN(d.getTime())) return String(dateInput)
  const datePart = formatDateID(d)
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${datePart} ${hours}:${minutes}`
}

/**
 * Menghasilkan tanggal hari ini dalam format YYYY-MM-DD untuk input type="date"
 */
export function todayISODate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
