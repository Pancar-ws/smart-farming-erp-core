/**
 * Halaman informasi untuk modul operasional yang sedang dikerjakan anggota tim lainnya.
 */
export default function ModulePlaceholderPage({
  title,
  description,
}) {
  return (
    <div className="card" style={{ padding: '28px' }}>
      <h1 className="page-title">{title}</h1>
      <p className="page-subtitle" style={{ marginTop: '8px', maxWidth: '720px' }}>
        {description}
      </p>
    </div>
  )
}
