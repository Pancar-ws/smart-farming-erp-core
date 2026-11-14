import Badge from '../../components/Badge'

/**
 * Halaman Placeholder Terstruktur untuk modul yang dikerjakan oleh anggota tim lain:
 * - Caca : Penerimaan Panen (UI-PRC-01), Sortasi & Mass Balance (UI-MFG-01), Inventaris Multi-Gudang
 * - Amel : Laporan Keuangan, Cetak PDF, Ekspor Excel, dan Dashboard ESG
 */
export default function ModulePlaceholderPage({
  screenId,
  title,
  owner,
  description,
  endpoints = [],
  ursRefs = [],
}) {
  return (
    <div className="card" style={{ padding: '28px' }}>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {screenId && <Badge variant="navy">Screen ID: {screenId}</Badge>}
        <Badge variant="amber">PIC Modul: {owner}</Badge>
        {ursRefs.map((r) => (
          <Badge key={r} variant="gray">
            {r}
          </Badge>
        ))}
      </div>

      <h1 className="page-title">{title}</h1>
      <p className="page-subtitle" style={{ marginTop: '8px', maxWidth: '760px' }}>
        {description}
      </p>

      <div
        style={{
          marginTop: '24px',
          padding: '18px 20px',
          backgroundColor: 'var(--bg-muted)',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '8px' }}>
          Endpoint Backend FastAPI yang Siap Dihubungkan pada Route Ini:
        </div>
        <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '14px' }}>
          {endpoints.map((ep) => (
            <li key={ep} style={{ marginBottom: '4px' }}>
              <code>{ep}</code>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
