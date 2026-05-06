import StatusBadge from './StatusBadge'

const formatBRL = (v) =>
  Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatDate = (d) => {
  if (!d) return '—'
  const date = new Date(d + 'Z')
  return date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Todas' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'PROCESSING', label: 'Processando' },
  { value: 'CONFIRMED', label: 'Confirmada' },
  { value: 'FAILED', label: 'Falhou' },
  { value: 'DEAD', label: 'DLQ' },
]

export default function OrdersTable({ orders, filter, onFilter }) {
  const filtered = filter === 'ALL' ? orders : orders.filter(o => o.status === filter)

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <h2 style={styles.title}>Ordens ({filtered.length})</h2>
        <div style={styles.filters}>
          {STATUS_OPTIONS.map(s => (
            <button
              key={s.value}
              onClick={() => onFilter(s.value)}
              style={{
                ...styles.filterBtn,
                background: filter === s.value ? 'var(--accent)' : 'transparent',
                color: filter === s.value ? '#000' : 'var(--text-secondary)',
                borderColor: filter === s.value ? 'var(--accent)' : 'var(--border)',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p style={styles.empty}>Nenhuma ordem encontrada.</p>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['ID', 'Cliente', 'Ativo', 'Tipo', 'Valor', 'Status', 'Tentativas', 'Criada em', 'Processada em'].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((order, i) => (
                <tr key={order.id} style={{ background: i % 2 === 0 ? 'transparent' : '#0a1525' }}>
                  <td style={styles.td}>
                    <span style={styles.id}>{order.id.slice(0, 8)}...</span>
                  </td>
                  <td style={styles.td}>{order.clientId}</td>
                  <td style={styles.td}>{order.asset}</td>
                  <td style={styles.td}>
                    <span style={{ color: order.type === 'BUY' ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                      {order.type === 'BUY' ? 'Compra' : 'Venda'}
                    </span>
                  </td>
                  <td style={styles.td}>{formatBRL(order.amount)}</td>
                  <td style={styles.td}><StatusBadge status={order.status} /></td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>{order.retryCount}</td>
                  <td style={styles.td}>{formatDate(order.createdAt)}</td>
                  <td style={styles.td}>{formatDate(order.processedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const styles = {
  wrapper: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '1.5rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    flexWrap: 'wrap',
    gap: 12,
  },
  title: { fontSize: 16 },
  filters: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  filterBtn: {
    fontSize: 11,
    fontWeight: 600,
    padding: '4px 12px',
    borderRadius: 99,
    border: '1px solid',
    cursor: 'pointer',
    transition: 'all 0.15s',
    letterSpacing: '0.03em',
  },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textAlign: 'left',
    padding: '8px 12px',
    borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  td: {
    fontSize: 13,
    padding: '10px 12px',
    borderBottom: '1px solid #0d1e33',
    whiteSpace: 'nowrap',
    color: 'var(--text-primary)',
  },
  id: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: 'var(--text-secondary)',
  },
  empty: {
    textAlign: 'center',
    color: 'var(--text-secondary)',
    padding: '2rem',
  },
}