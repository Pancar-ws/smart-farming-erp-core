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
            {columns.map((col, cIdx) => {
              const colKey = col.key || col.accessor || `col-${cIdx}`
              return (
                <th key={colKey} style={col.width ? { width: col.width } : undefined}>
                  {col.header}
                </th>
              )
            })}
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
                {columns.map((col, cIdx) => {
                  const colKey = col.key || col.accessor || `col-${cIdx}`
                  const renderFn = col.render || col.cell
                  return (
                    <td key={colKey} style={col.align ? { textAlign: col.align } : undefined}>
                      {renderFn ? renderFn(row, idx) : (col.key || col.accessor ? row[col.key || col.accessor] : null) ?? '-'}
                    </td>
                  )
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
