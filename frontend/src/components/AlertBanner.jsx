/**
 * Komponen AlertBanner Reusable untuk Notifikasi Kontekstual
 * Varian: 'info' | 'success' | 'warning' | 'danger'
 */
export default function AlertBanner({ variant = 'info', children, onClose }) {
  if (!children) return null

  return (
    <div className={`alert-banner alert-${variant}`} role="alert">
      <div>{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            color: 'inherit',
            fontSize: '16px',
          }}
          aria-label="Tutup pesan"
        >
          ✕
        </button>
      )}
    </div>
  )
}
