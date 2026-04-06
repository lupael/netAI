import axios from 'axios'

// Use same-origin base URL so nginx proxying works in Docker/production.
// Override with VITE_API_URL only when explicitly needed (e.g., local dev pointing at a remote backend).
const BASE_URL = import.meta.env.VITE_API_URL ?? ''

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.detail ?? err.message ?? 'Unknown error'
    console.error('[API Error]', msg)
    return Promise.reject(new Error(msg))
  },
)

export default client
