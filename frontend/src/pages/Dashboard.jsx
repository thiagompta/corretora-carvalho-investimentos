import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'
import StatsCards from '../components/StatsCards'
import NewOrderForm from '../components/NewOrderForm'
import OrdersTable from '../components/OrdersTable'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const STATUS_COLORS = {
  CONFIRMED: '#22c55e',
  PENDING: '#f59e0b',
  PROCESSING: '#00a8e0',
  FAILED: '#ef4444',
  DEAD: '#a855f7',
}

const STATUS_LABELS = {
  CONFIRMED: 'Confirmadas',
  PENDING: 'Pendentes',
  PROCESSING: 'Processando',
  FAILED: 'Falhou',
  DEAD: 'DLQ',
}

export default function Dashboard() {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)

  const fetchOrders = useCallback(async () => {
    try {
      const data = await api.getAll()
      setOrders(data)
      setLastUpdate(new Date())
    } catch (err) {
      console.error('Erro ao buscar ordens:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
    // Auto-refresh a cada 5 segundos para mostrar atualizações do Kafka em tempo real
    const interval = setInterval(fetchOrders, 5000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  const handleCreate = async (data) => {
    await api.create(data)
    await fetchOrders()
  }

  // Dados para o gráfico de pizza
  const chartData = Object.entries(
    orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1
      return acc
    }, {})
  ).map(([status, count]) => ({
    name: STATUS_LABELS[status] || status,
    value: count,
    status,
  }))

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.loadingDot} />
        Conectando ao Kafka...
      </div>
    )
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <div style={styles.brandRow}>
            <span style={styles.brandDot} />
            <h1 style={styles.brand}>Carvalho Investimentos</h1>
          </div>
          <p style={styles.subtitle}>Sistema de processamento de ordens de investimento</p>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.liveIndicator}>
            <span style={styles.liveDot} />
            <span style={styles.liveText}>Ao vivo</span>
          </div>
          {lastUpdate && (
            <p style={styles.lastUpdate}>
              Atualizado às {lastUpdate.toLocaleTimeString('pt-BR')}
            </p>
          )}
        </div>
      </header>

      <main style={styles.main}>
        {/* Stats */}
        <StatsCards orders={orders} />

        {/* Chart + Form */}
        <div style={styles.midRow}>
          {/* Gráfico */}
          <div style={styles.chartCard}>
            <h2 style={styles.cardTitle}>Distribuição por status</h2>
            {chartData.length === 0 ? (
              <p style={styles.empty}>Nenhuma ordem ainda.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={STATUS_COLORS[entry.status] || '#6b82a8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, n) => [`${v} ordens`, n]}
                    contentStyle={{
                      background: '#0d1624',
                      border: '1px solid #1a2740',
                      borderRadius: 8,
                      color: '#e8f0ff',
                    }}
                  />
                  <Legend formatter={(v) => v} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Info do sistema */}
          <div style={styles.infoCard}>
            <h2 style={styles.cardTitle}>Pipeline de automação</h2>
            <div style={styles.pipeline}>
              {[
                { icon: '📥', label: 'Nova ordem', desc: 'API REST recebe e salva no PostgreSQL' },
                { icon: '📨', label: 'Kafka', desc: 'Publicada no tópico btg.orders' },
                { icon: '⚙️', label: 'Processamento', desc: 'notification-service (Node.js) consome' },
                { icon: '✅', label: 'Confirmação', desc: 'Status atualizado para CONFIRMED' },
                { icon: '🔁', label: 'Retry auto', desc: 'Scheduler reprocessa falhas a cada 5min' },
                { icon: '💀', label: 'DLQ', desc: 'Após 3 falhas, vai para Dead Letter Queue' },
              ].map((step) => (
                <div key={step.label} style={styles.pipelineStep}>
                  <span style={styles.pipelineIcon}>{step.icon}</span>
                  <div>
                    <p style={styles.pipelineLabel}>{step.label}</p>
                    <p style={styles.pipelineDesc}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form */}
        <NewOrderForm onCreated={handleCreate} />

        {/* Table */}
        <OrdersTable orders={orders} filter={filter} onFilter={setFilter} />
      </main>
    </div>
  )
}

const styles = {
  page: { maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem 4rem' },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '2rem 0 1.5rem',
    borderBottom: '1px solid var(--border)',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: 16,
  },
  brandRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 },
  brandDot: {
    width: 10, height: 10, borderRadius: '50%',
    background: 'var(--accent)',
    boxShadow: '0 0 8px var(--accent)',
  },
  brand: { fontSize: 24, color: 'var(--text-primary)' },
  subtitle: { fontSize: 13, color: 'var(--text-secondary)', paddingLeft: 20 },
  headerRight: { textAlign: 'right' },
  liveIndicator: { display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', marginBottom: 4 },
  liveDot: {
    width: 8, height: 8, borderRadius: '50%',
    background: 'var(--green)',
    boxShadow: '0 0 6px var(--green)',
    animation: 'pulse 2s infinite',
  },
  liveText: { fontSize: 12, color: 'var(--green)', fontWeight: 600 },
  lastUpdate: { fontSize: 12, color: 'var(--text-secondary)' },
  main: {},
  midRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
    marginBottom: '1.5rem',
  },
  chartCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '1.5rem',
  },
  infoCard: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '1.5rem',
  },
  cardTitle: { fontSize: 15, marginBottom: '1rem' },
  pipeline: { display: 'flex', flexDirection: 'column', gap: 10 },
  pipelineStep: { display: 'flex', alignItems: 'flex-start', gap: 10 },
  pipelineIcon: { fontSize: 16, flexShrink: 0, marginTop: 1 },
  pipelineLabel: { fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' },
  pipelineDesc: { fontSize: 12, color: 'var(--text-secondary)' },
  empty: { color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' },
  loading: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    height: '100vh', color: 'var(--text-secondary)', fontSize: 16, gap: 12,
  },
  loadingDot: {
    width: 10, height: 10, borderRadius: '50%',
    background: 'var(--accent)',
    animation: 'pulse 1s infinite',
  },
}
