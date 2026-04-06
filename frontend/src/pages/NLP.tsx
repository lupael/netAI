import React, { useCallback, useRef, useState } from 'react'
import Header from '../components/Header'
import LoadingSpinner from '../components/LoadingSpinner'
import client from '../api/client'
import type { ChatMessage, NLPResponse } from '../types'
import { Send, Bot, User, Lightbulb, TerminalSquare } from 'lucide-react'
import { format } from 'date-fns'

const SUGGESTIONS = [
  'Show me all critical threats right now',
  'Which devices have high CPU usage?',
  'List devices with pending software updates',
  'Are there any configuration violations?',
  'What is the health score of the network?',
  'Show me the traffic anomalies in the last hour',
  'Which devices are down?',
  'Summarize all unacknowledged alerts',
]

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: `👋 Hello! I'm the **netAI Assistant** — your AI-powered network operations colleague.

I can help you with:
- 🔍 **Network status queries** — device health, uptime, alerts
- 🛡️ **Threat analysis** — active threats, MITRE techniques, mitigations
- ⚙️ **Config compliance** — policy violations, drift detection
- 📦 **Software lifecycle** — CVEs, pending updates, EOL detection
- 📊 **Performance analytics** — CPU spikes, traffic anomalies, predictions

Ask me anything about your network!`,
  timestamp: new Date().toISOString(),
}

const MOCK_RESPONSES: Record<string, string> = {
  default: "I've analyzed your query against the current network state. Based on real-time telemetry, here's what I found:",
  threat: "🛡️ **Threat Analysis Complete**\n\nI've identified **4 active threats** in your network:\n- 🔴 **Critical**: Port scan from 10.0.0.99 (T1046)\n- 🔴 **Critical**: DDoS attack on WAN link — 14 Gbps\n- 🟠 **High**: SSH brute force on edge-router-01 (T1110)\n- 🟠 **High**: Data exfiltration via access-sw-03 (T1041)\n\nRecommended actions: Isolate 10.0.0.99, enable null-routing on WAN, and investigate access-sw-03.",
  cpu: "💻 **High CPU Devices**\n\n| Device | CPU | Status |\n|--------|-----|--------|\n| access-sw-03 | 94% | 🔴 Degraded |\n| dist-sw-02 | 87% | 🟡 Warning |\n| firewall-01 | 55% | 🟢 Normal |\n\n**Recommendation**: access-sw-03 shows 73% failure probability in the next 24h. Consider load balancing or proactive replacement.",
  update: "📦 **Pending Software Updates**\n\n**Critical updates (immediate action required):**\n- `dist-sw-01` — IOS-XE 17.6.5 → 17.12.1 (3 CVEs)\n- `access-sw-03` — IOS 15.0(2)SE (EOL — 8 CVEs!)\n\n**Regular updates:**\n- `core-sw-01`, `core-sw-02` — IOS-XE 17.9.3 → 17.12.1\n- `firewall-01` — PAN-OS 11.0.2 → 11.1.3\n\n**Action**: Schedule maintenance window for critical updates first.",
  config: "⚙️ **Configuration Violations Found**\n\n`dist-sw-02` has **3 policy violations**:\n- 🔴 `NO-TELNET` (Critical): Telnet enabled on VTY lines\n- 🔴 `VTY-AUTH` (Critical): No VTY password set\n- 🟠 `SNMP-COMM` (High): Default community 'public' in use\n\n**Auto-remediation available**: I can generate a remediation script to fix these issues.",
  health: "📊 **Network Health Report**\n\n**Overall Score: 87/100** ✅\n\n- Devices: 38/42 online (90.5%)\n- Active Threats: 7 (4 critical)\n- Config Compliance: 4 violations\n- Avg Latency: 2.3ms\n- Packet Loss: 0.02%\n\n**Risk Areas**: dist-sw-02 and access-sw-03 require immediate attention.",
  down: "🔴 **Devices Currently Down**\n\nOnly `access-sw-05` is currently offline.\n- **Last seen**: 30 minutes ago\n- **IP**: 10.0.2.5\n- **Location**: Floor 5 IDF\n- **Impact**: Users on Floor 5 have no network access\n\n**Action**: Check physical connectivity and power status for access-sw-05.",
}

function getMockResponse(query: string): string {
  const q = query.toLowerCase()
  if (q.includes('threat') || q.includes('attack') || q.includes('scan')) return MOCK_RESPONSES.threat
  if (q.includes('cpu') || q.includes('performance') || q.includes('spike')) return MOCK_RESPONSES.cpu
  if (q.includes('update') || q.includes('software') || q.includes('patch') || q.includes('cve')) return MOCK_RESPONSES.update
  if (q.includes('config') || q.includes('compliance') || q.includes('violation')) return MOCK_RESPONSES.config
  if (q.includes('health') || q.includes('score') || q.includes('status')) return MOCK_RESPONSES.health
  if (q.includes('down') || q.includes('offline') || q.includes('unreachable')) return MOCK_RESPONSES.down
  return `${MOCK_RESPONSES.default}\n\nBased on current network telemetry, I've processed your query: **"${query}"**\n\nNetwork is currently operating at 87% health. 42 devices monitored, 7 active threats detected, 4 config violations pending remediation. Would you like me to drill down into any specific area?`
}

const NLP: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = useCallback(async (query: string) => {
    if (!query.trim() || loading) return

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    setTimeout(scrollToBottom, 50)

    try {
      const res = await client.post<NLPResponse>('/api/nlp/query', { query })
      const aiMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: res.data.response,
        timestamp: new Date().toISOString(),
        actions: res.data.actions,
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch {
      // Use mock response
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 600))
      const aiMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: getMockResponse(query),
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, aiMsg])
    } finally {
      setLoading(false)
      setTimeout(scrollToBottom, 50)
    }
  }, [loading])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void sendMessage(input)
  }

  const renderContent = (content: string) => {
    // Simple markdown-like rendering
    const lines = content.split('\n')
    return lines.map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <strong key={i} style={{ color: 'var(--text-primary)' }}>{line.slice(2, -2)}</strong>
      }
      // Bold inline
      const parts = line.split(/\*\*(.*?)\*\*/g)
      const formatted = parts.map((part, j) =>
        j % 2 === 1 ? <strong key={j} style={{ color: 'var(--text-primary)' }}>{part}</strong> : part
      )
      if (line.startsWith('- ')) {
        // Re-format the bullet content (without leading "- ") to preserve bold parts
        const bulletText = line.slice(2)
        const bulletParts = bulletText.split(/\*\*(.*?)\*\*/g)
        const bulletFormatted = bulletParts.map((part, j) =>
          j % 2 === 1 ? <strong key={j} style={{ color: 'var(--text-primary)' }}>{part}</strong> : part
        )
        return <div key={i} style={{ paddingLeft: 12, display: 'flex', gap: 6 }}><span>•</span><span>{bulletFormatted}</span></div>
      }
      if (line.startsWith('|') && line.endsWith('|')) {
        const cells = line.split('|').filter(Boolean)
        return (
          <div key={i} style={{ display: 'flex', gap: 12, fontFamily: 'monospace', fontSize: 12, padding: '2px 0' }}>
            {cells.map((c, ci) => <span key={ci} style={{ flex: 1, color: ci === 0 ? 'var(--accent-blue)' : 'var(--text-secondary)' }}>{c.trim()}</span>)}
          </div>
        )
      }
      if (line.trim() === '' ) return <br key={i} />
      return <div key={i}>{formatted}</div>
    })
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header title="AI Assistant" subtitle="ChatOps — natural language network operations" />
      <div className="page-content" style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
        {/* Chat Column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            {/* Messages */}
            <div className="chat-container" style={{ flex: 1 }}>
              {messages.map((msg) => (
                <div key={msg.id} className={`chat-msg ${msg.role}`}>
                  <div className="chat-avatar" style={{ background: msg.role === 'user' ? 'var(--accent-blue)' : 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))', color: '#fff' }}>
                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div className={`chat-bubble ${msg.role}`}>
                      <div style={{ lineHeight: 1.7 }}>
                        {renderContent(msg.content)}
                      </div>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', padding: '0 4px' }}>
                      {format(new Date(msg.timestamp), 'HH:mm')}
                    </span>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="chat-msg assistant">
                  <div className="chat-avatar" style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))', color: '#fff' }}>
                    <Bot size={14} />
                  </div>
                  <div className="chat-bubble assistant" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <LoadingSpinner size={16} />
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Analyzing network data…</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: 16, borderTop: '1px solid var(--border-color)' }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <TerminalSquare size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    className="form-input"
                    style={{ paddingLeft: 36 }}
                    placeholder="Ask about your network… (e.g. 'Show critical threats')"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()} style={{ flexShrink: 0 }}>
                  <Send size={15} />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Suggested Commands Sidebar */}
        <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Lightbulb size={15} style={{ color: 'var(--accent-yellow)' }} />
              <p className="card-title" style={{ marginBottom: 0 }}>Suggested Queries</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => void sendMessage(s)}
                  disabled={loading}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    padding: '8px 10px',
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                    lineHeight: 1.4,
                  }}
                  onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = 'var(--accent-blue-dim)'; (e.target as HTMLButtonElement).style.color = 'var(--accent-blue)' }}
                  onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = 'var(--bg-secondary)'; (e.target as HTMLButtonElement).style.color = 'var(--text-secondary)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <p className="card-title">Capabilities</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: '🔍', label: 'Network queries' },
                { icon: '🛡️', label: 'Threat analysis' },
                { icon: '⚙️', label: 'Config auditing' },
                { icon: '📦', label: 'Software lifecycle' },
                { icon: '📊', label: 'Performance insights' },
                { icon: '🤖', label: 'Predictive analytics' },
              ].map(({ icon, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                  <span>{icon}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NLP
