import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import LoadingSpinner from './components/LoadingSpinner'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Topology = lazy(() => import('./pages/Topology'))
const Threats = lazy(() => import('./pages/Threats'))
const Config = lazy(() => import('./pages/Config'))
const Devices = lazy(() => import('./pages/Devices'))
const Software = lazy(() => import('./pages/Software'))
const Alerts = lazy(() => import('./pages/Alerts'))
const NLP = lazy(() => import('./pages/NLP'))
const LinkMonitor = lazy(() => import('./pages/LinkMonitor'))
const BGP = lazy(() => import('./pages/BGP'))
const Circuits = lazy(() => import('./pages/Circuits'))
const Workflows = lazy(() => import('./pages/Workflows'))
const IPManagement = lazy(() => import('./pages/IPManagement'))
const Reports = lazy(() => import('./pages/Reports'))
const DeviceDetail = lazy(() => import('./pages/DeviceDetail'))

const PageFallback = () => (
  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <LoadingSpinner size={40} />
  </div>
)

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/topology" element={<Topology />} />
              <Route path="/threats" element={<Threats />} />
              <Route path="/config" element={<Config />} />
              <Route path="/devices" element={<Devices />} />
              <Route path="/software" element={<Software />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/nlp" element={<NLP />} />
              <Route path="/links" element={<LinkMonitor />} />
              <Route path="/bgp" element={<BGP />} />
              <Route path="/circuits" element={<Circuits />} />
              <Route path="/workflows" element={<Workflows />} />
              <Route path="/ip-management" element={<IPManagement />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/devices/:id" element={<DeviceDetail />} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App
