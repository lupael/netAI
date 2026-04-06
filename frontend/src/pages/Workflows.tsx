import React, { useCallback, useEffect, useState } from 'react'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import client from '../api/client'
import { Play } from 'lucide-react'

interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  estimated_duration_sec: number
  last_run: string
  last_status: string
  enabled: boolean
}

interface WorkflowRun {
  run_id: string
  workflow_id: string
  workflow_name: string
  triggered_by: string
  started_at: string
  finished_at: string | null
  duration_sec: number | null
  status: string
  log_summary: string
}

const MOCK_TEMPLATES: WorkflowTemplate[] = [
  { id: 'backup_all_configs', name: 'Backup All Configs', description: 'Archive running configurations to the config store.', category: 'config', estimated_duration_sec: 180, last_run: new Date(Date.now() - 21600000).toISOString(), last_status: 'success', enabled: true },
  { id: 'firmware_audit', name: 'Firmware Audit', description: 'Compare installed firmware against vendor advisories.', category: 'compliance', estimated_duration_sec: 120, last_run: new Date(Date.now() - 86400000).toISOString(), last_status: 'success', enabled: true },
  { id: 'threat_scan', name: 'Threat Scan', description: 'Run a full threat intelligence sweep across all flows.', category: 'security', estimated_duration_sec: 300, last_run: new Date(Date.now() - 3600000).toISOString(), last_status: 'success', enabled: true },
  { id: 'compliance_check', name: 'Compliance Check', description: 'Validate configs against CIS benchmarks.', category: 'compliance', estimated_duration_sec: 240, last_run: new Date(Date.now() - 172800000).toISOString(), last_status: 'warning', enabled: true },
  { id: 'topology_discovery', name: 'Topology Discovery', description: 'Re-discover topology using LLDP/CDP.', category: 'discovery', estimated_duration_sec: 90, last_run: new Date(Date.now() - 43200000).toISOString(), last_status: 'success', enabled: true },
]

const MOCK_RUNS: WorkflowRun[] = [
  { run_id: 'run-001', workflow_id: 'backup_all_configs', workflow_name: 'Backup All Configs', triggered_by: 'scheduler', started_at: new Date(Date.now() - 21600000).toISOString(), finished_at: new Date(Date.now() - 21420000).toISOString(), duration_sec: 172, status: 'success', log_summary: '15/15 devices backed up.' },
  { run_id: 'run-002', workflow_id: 'threat_scan', workflow_name: 'Threat Scan', triggered_by: 'noc-operator', started_at: new Date(Date.now() - 3600000).toISOString(), finished_at: new Date(Date.now() - 3312000).toISOString(), duration_sec: 295, status: 'success', log_summary: '4 new threat indicators detected.' },
  { run_id: 'run-003', workflow_id: 'firmware_audit', workflow_name: 'Firmware Audit', triggered_by: 'scheduler', started_at: new Date(Date.now() - 86400000).toISOString(), finished_at: new Date(Date.now() - 86280000).toISOString(), duration_sec: 118, status: 'success', log_summary: '3 devices have outdated firmware.' },
  { run_id: 'run-004', workflow_id: 'compliance_check', workflow_name: 'Compliance Check', triggered_by: 'scheduler', started_at: new Date(Date.now() - 172800000).toISOString(), finished_at: new Date(Date.now() - 172560000).toISOString(), duration_sec: 238, status: 'warning', log_summary: '2 devices failed CIS Level 1 checks.' },
  { run_id: 'run-005', workflow_id: 'topology_discovery', workflow_name: 'Topology Discovery', triggered_by: 'scheduler', started_at: new Date(Date.now() - 43200000).toISOString(), finished_at: new Date(Date.now() - 43110000).toISOString(), duration_sec: 89, status: 'success', log_summary: 'Topology updated — 15 nodes, 11 links.' },
]

const categoryColor = (category: string): string => {
  switch (category) {
    case 'config': return 'var(--accent-blue)'
    case 'compliance': return 'var(--accent-yellow)'
    case 'security': return 'var(--accent-red)'
    case 'discovery': return 'var(--accent-purple)'
    default: return 'var(--text-muted)'
  }
}

const formatDuration = (sec: number | null): string => {
  if (sec === null) return '—'
  if (sec < 60) return `${sec}s`
  return `${Math.floor(sec / 60)}m ${sec % 60}s`
}

const Workflows: React.FC = () => {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>(MOCK_TEMPLATES)
  const [runs, setRuns] = useState<WorkflowRun[]>(MOCK_RUNS)
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await client.get<{ templates: WorkflowTemplate[]; recent_runs: WorkflowRun[] }>('/api/workflows')
      setTemplates(res.data.templates)
      setRuns(res.data.recent_runs)
    } catch {
      // use mock
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchData() }, [fetchData])

  const handleRun = async (id: string) => {
    setTriggering(id)
    try {
      const res = await client.post<{ run: WorkflowRun }>(`/api/workflows/${id}/run`)
      setRuns((prev) => [res.data.run, ...prev])
    } catch {
      // optimistic add
      const tpl = templates.find((t) => t.id === id)
      if (tpl) {
        const fakeRun: WorkflowRun = {
          run_id: `run-${Date.now()}`,
          workflow_id: id,
          workflow_name: tpl.name,
          triggered_by: 'api-user',
          started_at: new Date().toISOString(),
          finished_at: null,
          duration_sec: null,
          status: 'running',
          log_summary: 'Workflow started.',
        }
        setRuns((prev) => [fakeRun, ...prev])
      }
    } finally {
      setTriggering(null)
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header title="Workflows" subtitle="Automated network management tasks" />
      <div className="page-content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <LoadingSpinner size={40} />
          </div>
        ) : (
          <>
            <div className="mb-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
              {templates.map((tpl) => (
                <div key={tpl.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>{tpl.name}</div>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: categoryColor(tpl.category),
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}>
                        {tpl.category}
                      </span>
                    </div>
                    <StatusBadge status={tpl.last_status} />
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>{tpl.description}</p>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Est. {formatDuration(tpl.estimated_duration_sec)} · Last run: {new Date(tpl.last_run).toLocaleDateString()}
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => void handleRun(tpl.id)}
                    disabled={triggering === tpl.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start' }}
                  >
                    <Play size={12} />
                    {triggering === tpl.id ? 'Starting…' : 'Run Now'}
                  </button>
                </div>
              ))}
            </div>

            <div className="card">
              <p className="card-title">Execution History</p>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Workflow</th>
                      <th>Triggered By</th>
                      <th>Started</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runs.map((run) => (
                      <tr key={run.run_id}>
                        <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{run.workflow_name}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{run.triggered_by}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{new Date(run.started_at).toLocaleString()}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{formatDuration(run.duration_sec)}</td>
                        <td><StatusBadge status={run.status} /></td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{run.log_summary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Workflows
