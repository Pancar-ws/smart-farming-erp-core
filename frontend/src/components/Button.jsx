/**
 * Komponen Button Reusable (Touch-Friendly >= 44px)
 * Varian warna mengikuti palet SDD Section 7.1:
 * - primary : Deep Navy #1F4E79
 * - success : Forest Green #2E7D32
 * - warning : Amber #F57F17
 * - danger  : Coral Red #C62828
 * - outline / ghost
 */
export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  className = '',
  title,
}) {
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : ''
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={`btn btn-${variant} ${sizeClass} ${className}`.trim()}
    >
      {children}
    </button>
  )
}
