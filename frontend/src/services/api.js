const BASE = '/api/orders'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `Erro ${res.status}`)
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  getAll: () => request(''),
  getByStatus: (status) => request(`/status/${status}`),
  create: (data) => request('', { method: 'POST', body: JSON.stringify(data) }),
}
