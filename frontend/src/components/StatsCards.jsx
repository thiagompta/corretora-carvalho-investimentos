const formatBRL = (v) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function StatsCards({ orders }) {
  const total = orders.length
  const confirmed = orders.filter(o => o.status === 'CONFIRMED').length
  const failed = orders.filter(o => o.status === 'FAILED' || o.status === 'DEAD').length
  const volume = orders
    .filter(o => o.status === 'CONFIRMED')
    .reduce((acc, o) => acc + Number(o.amount), 0)

  const cards = [
    { label: 'Total de ordens', value: total, color: '#00a8e0' },
    { label: 'Confirmadas', value: confirmed, color: '#22c55e' },
    { label: 'Com falha / DLQ', value: failed, color: '#ef4444' },
    { label: 'Volume confirmado', value: formatBRL(volume), color: '#f59e0b' },
  ]

  return (
    <div style={styles.grid}>
      {cards.map((card) => (
        <div key={card.label} style={styles.card}>
          <p style={styles.label}>{card.label}</p>
          <p style={{ ...styles.value, color: card.color }}>{card.value}</p>
        </div>
      ))}
    </div>
  )
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
    marginBottom: '1.5rem',
  },
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '1.25rem',
  },
  label: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    marginBottom: 8,
  },
  value: {
    fontSize: 24,
    fontWeight: 700,
    fontFamily: 'var(--font-display)',
  },
}
