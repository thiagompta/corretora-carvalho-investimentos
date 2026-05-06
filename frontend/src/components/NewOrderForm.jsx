import { useState } from 'react'

const ASSETS_BY_TYPE = {
  'Renda Variável': null,
  'FIIs': null,
  'Tesouro Direto': ['Tesouro Selic 2029', 'Tesouro IPCA+ 2035', 'Tesouro Prefixado 2027', 'Tesouro IPCA+ 2040', 'Tesouro Selic 2031'],
  'Renda Fixa': ['CDB Banco Inter 115% CDI', 'LCI Bradesco 92% CDI', 'LCA Itaú 88% CDI', 'CRI Cyrela 10,5% aa', 'Debenture Petrobras IPCA+6%'],
  'Fundos de Investimento': ['FIC Multimercado BTG', 'FIC Renda Fixa XP', 'FIA Dividendos Brasil', 'FIC Global Tech USD', 'FIM Macro Kinea'],
  'COE': ['COE S&P500 Capital Protegido', 'COE Nasdaq Participação', 'COE Europa Defensivo', 'COE Ibovespa Alavancado', 'COE Dólar Proteção'],
}

const initial = { clientId: '', category: '', asset: '', type: 'BUY', amount: '' }

const isTickerFree = (category) => category === 'Renda Variável' || category === 'FIIs'

export default function NewOrderForm({ onCreated }) {
  const [form, setForm] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
    setSuccess(false)
  }

  const handleCategoryChange = (e) => {
    setForm(prev => ({ ...prev, category: e.target.value, asset: '' }))
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onCreated({
        clientId: form.clientId,
        asset: isTickerFree(form.category) ? form.asset.toUpperCase() : form.asset,
        type: form.type,
        amount: parseFloat(form.amount),
      })
      setForm(initial)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.title}>Nova ordem</h2>

      {error && <p style={styles.error}>{error}</p>}
      {success && <p style={styles.successMsg}>✓ Ordem criada e publicada no Kafka!</p>}

      <form onSubmit={handleSubmit}>
        <div style={styles.row}>

          <div style={styles.field}>
            <label style={styles.label}>Cliente ID</label>
            <input
              name="clientId"
              value={form.clientId}
              onChange={handleChange}
              placeholder="ex: client-001"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Categoria</label>
            <select
              name="category"
              value={form.category}
              onChange={handleCategoryChange}
              required
              style={styles.input}
            >
              <option value="">Selecione...</option>
              {Object.keys(ASSETS_BY_TYPE).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              Ativo {isTickerFree(form.category) && <span style={styles.hint}>(digite o ticker)</span>}
            </label>
            {isTickerFree(form.category) ? (
              <input
                name="asset"
                value={form.asset}
                onChange={handleChange}
                placeholder={form.category === 'FIIs' ? 'ex: MXRF11' : 'ex: PETR4'}
                required
                maxLength={10}
                style={{ ...styles.input, textTransform: 'uppercase' }}
              />
            ) : (
              <select
                name="asset"
                value={form.asset}
                onChange={handleChange}
                required
                disabled={!form.category}
                style={styles.input}
              >
                <option value="">Selecione...</option>
                {(ASSETS_BY_TYPE[form.category] || []).map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            )}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Tipo</label>
            <select name="type" value={form.type} onChange={handleChange} style={styles.input}>
              <option value="BUY">Compra</option>
              <option value="SELL">Venda</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Valor (R$)</label>
            <input
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={handleChange}
              placeholder="0,00"
              required
              style={styles.input}
            />
          </div>

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Enviando...' : '+ Criar ordem'}
          </button>

        </div>
      </form>
    </div>
  )
}

const styles = {
  wrapper: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '1.5rem',
    marginBottom: '1.5rem',
  },
  title: { fontSize: 16, marginBottom: '1rem' },
  row: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    flex: '1 1 140px',
  },
  label: { fontSize: 12, color: 'var(--text-secondary)' },
  hint: { color: 'var(--accent)', fontStyle: 'italic' },
  input: {
    background: '#07111f',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '8px 12px',
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
  },
  btn: {
    background: 'var(--accent)',
    color: '#000',
    border: 'none',
    borderRadius: 8,
    padding: '9px 20px',
    fontWeight: 700,
    fontSize: 14,
    flexShrink: 0,
    alignSelf: 'flex-end',
  },
  error: { color: 'var(--red)', fontSize: 13, marginBottom: '0.75rem' },
  successMsg: { color: 'var(--green)', fontSize: 13, marginBottom: '0.75rem' },
}