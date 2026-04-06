import React, { useCallback, useEffect, useState } from 'react'
import Header from '../components/Header'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import client from '../api/client'
import type { SoftwareInfo, UpgradeJob } from '../types'
import { Download, Calendar, CheckCircle, AlertTriangle, Package, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'

const MOCK_SOFTWARE: SoftwareInfo[] = [
  { device_id: 'core-01', hostname: 'core-sw-01', current_version: 'IOS-XE 17.9.3', available_version: 'IOS-XE 17.12.1', vendor: 'Cisco', platform: 'Catalyst 9500', update_status: 'update_available', last_checked: new Date(Date.now() - 3600000).toISOString(), cve_count: 0 },
  { device_id: 'core-02', hostname: 'core-sw-02', current_version: 'IOS-XE 17.9.3', available_version: 'IOS-XE 17.12.1', vendor: 'Cisco', platform: 'Catalyst 9500', update_status: 'update_available', last_checked: new Date(Date.now() - 3600000).toISOString(), cve_count: 0 },
  { device_id: 'dist-01', hostname: 'dist-sw-01', current_version: 'IOS-XE 17.6.5', available_version: 'IOS-XE 17.12.1', vendor: 'Cisco', platform: 'Catalyst 9300', update_status: 'critical_update', last_checked: new Date(Date.now() - 7200000).toISOString(), cve_count: 3 },
  { device_id: 'dist-02', hostname: 'dist-sw-02', current_version: 'Junos 22.4R1', available_version: 'Junos 23.4R1', vendor: 'Juniper', platform: 'EX4300', update_status: 'update_available', last_checked: new Date(Date.now() - 14400000).toISOString(), cve_count: 1 },
  { device_id: 'edge-01', hostname: 'edge-router-01', current_version: 'IOS-XE 17.12.1', available_version: null, vendor: 'Cisco', platform: 'ASR 1002-X', update_status: 'current', last_checked: new Date().toISOString(), cve_count: 0 },
  { device_id: 'fw-01', hostname: 'firewall-01', current_version: 'PAN-OS 11.0.2', available_version: 'PAN-OS 11.1.3', vendor: 'Palo Alto', platform: 'PA-3220', update_status: 'update_available', last_checked: new Date(Date.now() - 1800000).toISOString(), cve_count: 0 },
  { device_id: 'acc-01', hostname: 'access-sw-01', current_version: 'IOS 15.2(7)E5', available_version: 'IOS 15.2(8)E2', vendor: 'Cisco', platform: 'Catalyst 2960-X', update_status: 'update_available', last_checked: new Date(Date.now() - 86400000).toISOString(), cve_count: 2 },
  { device_id: 'acc-03', hostname: 'access-sw-03', current_version: 'IOS 15.0(2)SE', available_version: 'IOS 15.2(8)E2', vendor: 'Cisco', platform: 'Catalyst 2960', update_status: 'end_of_life', last_checked: new Date(Date.now() - 86400000).toISOString(), cve_count: 8 },
]

const MOCK_JOBS: UpgradeJob[] = [
  { id: 'j1', device_id: 'dist-01', hostname: 'dist-sw-01', target_version: 'IOS-XE 17.12.1', scheduled_at: new Date(Date.now() + 3600000).toISOString(), status: 'pending', progress_pct: 0 },
  { id: 'j2', device_id: 'acc-01', hostname: 'access-sw-01', target_version: 'IOS 15.2(8)E2', scheduled_at: new Date(Date.now() - 600000).toISOString(), status: 'in_progress', progress_pct: 67, started_at: new Date(Date.now() - 600000).toISOString() },
  { id: 'j3', device_id: 'edge-01', hostname: 'edge-router-01', target_version: 'IOS-XE 17.12.1', scheduled_at: new Date(Date.now() - 86400000).toISOString(), status: 'completed', progress_pct: 100, completed_at: new Date(Date.now() - 82800000).toISOString() },
]

const Software: React.FC = () => {
  const [software, setSoftware] = useState<SoftwareInfo[]>(MOCK_SOFTWARE)
  const [jobs, setJobs] = useState<UpgradeJob[]>(MOCK_JOBS)
  const [loading, setLoading] = useState(true)
  const [scheduleDevice, setScheduleDevice] = useState('')
  const [scheduleVersion, setScheduleVersion] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [scheduling, setScheduling] = useState(false)
  const [scheduled, setScheduled] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await client.get<SoftwareInfo[]>('/api/v1/software')
      if (res.data.length) setSoftware(res.data)
    } catch {
      // use mock
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchData() }, [fetchData])

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scheduleDevice || !scheduleVersion) return
    setScheduling(true)
    await new Promise((r) => setTimeout(r, 1000))
    const dev = software.find((s) => s.hostname === scheduleDevice)
    const newJob: UpgradeJob = {
      id: `j${Date.now()}`,
      device_id: dev?.device_id ?? '',
      hostname: scheduleDevice,
      target_version: scheduleVersion,
      scheduled_at: scheduleTime ? new Date(scheduleTime).toISOString() : new Date(Date.now() + 3600000).toISOString(),
      status: 'pending',
      progress_pct: 0,
    }
    setJobs((prev) => [newJob, ...prev])
    setScheduleDevice(''); setScheduleVersion(''); setScheduleTime('')
    setScheduling(false); setScheduled(true)
    setTimeout(() => setScheduled(false), 3000)
  }

  const pending = software.filter((s) => s.update_status !== 'current')
  const critical = software.filter((s) => s.update_status === 'critical_update' || s.update_status === 'end_of_life')

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Header title="Software Lifecycle" subtitle="Firmware & OS update management" />
      <div className="page-content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><LoadingSpinner size={40} /></div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid-4 mb-6">
              {[
                { label: 'Total Devices', val: software.length, color: 'var(--accent-blue)' },
                { label: 'Up to Date', val: software.filter((s) => s.update_status === 'current').length, color: 'var(--accent-green)' },
                { label: 'Updates Available', val: pending.length, color: 'var(--accent-yellow)' },
                { label: 'Critical / EOL', val: critical.length, color: 'var(--accent-red)' },
              ].map(({ label, val, color }) => (
                <div key={label} className="card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color }}>{val}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Software Inventory */}
            <div className="card mb-6">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <p className="card-title" style={{ marginBottom: 0 }}>Software Inventory</p>
                <button className="btn btn-ghost btn-sm" onClick={() => void fetchData()} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <RefreshCw size={13} /> Refresh
                </button>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Device</th>
                      <th>Vendor / Platform</th>
                      <th>Current Version</th>
                      <th>Available</th>
                      <th>CVEs</th>
                      <th>Status</th>
                      <th>Last Checked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {software.map((sw) => (
                      <tr key={sw.device_id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {(sw.update_status === 'critical_update' || sw.update_status === 'end_of_life') && (
                              <AlertTriangle size={13} style={{ color: 'var(--accent-red)', flexShrink: 0 }} />
                            )}
                            <code style={{ fontSize: 12, color: 'var(--accent-blue)' }}>{sw.hostname}</code>
                          </div>
                        </td>
                        <td style={{ fontSize: 12 }}>{sw.vendor} · {sw.platform}</td>
                        <td><code style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{sw.current_version}</code></td>
                        <td>
                          {sw.available_version ? (
                            <code style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--accent-green)' }}>{sw.available_version}</code>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                        <td>
                          {(sw.cve_count ?? 0) > 0 ? (
                            <span style={{ fontSize: 12, color: 'var(--accent-red)', fontWeight: 600 }}>{sw.cve_count} CVEs</span>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>None</span>
                          )}
                        </td>
                        <td><StatusBadge status={sw.update_status} /></td>
                        <td style={{ fontSize: 12 }}>{format(new Date(sw.last_checked), 'MMM d, HH:mm')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Schedule + Jobs row */}
            <div className="grid-2">
              {/* Schedule Form */}
              <div className="card">
                <p className="card-title">Schedule Upgrade</p>
                <form onSubmit={(e) => void handleSchedule(e)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Device</label>
                    <select className="form-select" value={scheduleDevice} onChange={(e) => setScheduleDevice(e.target.value)} required>
                      <option value="">Select device…</option>
                      {software.filter((s) => s.update_status !== 'current').map((s) => (
                        <option key={s.device_id} value={s.hostname}>{s.hostname}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Target Version</label>
                    <input
                      className="form-input"
                      placeholder="e.g. IOS-XE 17.12.1"
                      value={scheduleVersion}
                      onChange={(e) => setScheduleVersion(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Scheduled Time (optional)</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={scheduling} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Calendar size={14} />
                    {scheduling ? 'Scheduling…' : 'Schedule Upgrade'}
                  </button>
                  {scheduled && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-green)', fontSize: 13 }}>
                      <CheckCircle size={14} /> Upgrade scheduled successfully
                    </div>
                  )}
                </form>
              </div>

              {/* Upgrade Jobs */}
              <div className="card">
                <p className="card-title">Upgrade Jobs</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {jobs.map((job) => (
                    <div key={job.id} style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '12px 14px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Package size={14} style={{ color: 'var(--accent-blue)' }} />
                            <code style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{job.hostname}</code>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3, fontFamily: 'monospace' }}>→ {job.target_version}</div>
                        </div>
                        <StatusBadge status={job.status} />
                      </div>
                      {job.status === 'in_progress' && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                            <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                            <span style={{ color: 'var(--accent-blue)' }}>{job.progress_pct}%</span>
                          </div>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${job.progress_pct}%`, background: 'var(--accent-blue)', transition: 'width 1s ease' }} />
                          </div>
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                        {job.status === 'completed' && job.completed_at
                          ? `Completed: ${format(new Date(job.completed_at), 'MMM d, HH:mm')}`
                          : `Scheduled: ${format(new Date(job.scheduled_at), 'MMM d, HH:mm')}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Software
