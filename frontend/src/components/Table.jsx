/**
 * Komponen Tabel Data Enterprise Reusable
 */
export default function Table({
  columns = [],
  data = [],
  rowKey = 'id',
  emptyMessage = 'Belum ada data untuk ditampilkan.',
  loading = false,
}) {
  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '28px' }}>
                Memuat data...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)' }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr key={row[rowKey] ?? idx}>
                {columns.map((col) => (
                  <td key={col.key} style={col.align ? { textAlign: col.align } : undefined}>
                    {col.render ? col.render(row, idx) : row[col.key] ?? '-'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
