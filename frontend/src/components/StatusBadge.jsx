const STATUS_CONFIG = {
  PENDING:    { label: 'Pendente',    color: '#f59e0b' },
  PROCESSING: { label: 'Processando', color: '#00a8e0' },
  CONFIRMED:  { label: 'Confirmada',  color: '#22c55e' },
  FAILED:     { label: 'Falhou',      color: '#ef4444' },
  DEAD:       { label: 'DLQ',         color: '#a855f7' },
}

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: '#6b82a8' }
  return (
    <span style={{
      fontSize: 11,
      fontWeight: 600,
      padding: '3px 10px',
      borderRadius: 99,
      border: `1px solid ${cfg.color}`,
      color: cfg.color,
      letterSpacing: '0.04em',
      background: `${cfg.color}18`,
    }}>
      {cfg.label}
    </span>
  )
}
