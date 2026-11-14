/**
 * Komponen Badge Status, Grade Mutu, dan Segmen Pelanggan
 * Varian: 'navy' | 'green' | 'amber' | 'red' | 'gray'
 */
export default function Badge({ children, variant = 'navy', className = '' }) {
  return <span className={`badge badge-${variant} ${className}`.trim()}>{children}</span>
}
