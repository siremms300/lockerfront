// app/admin/monitoring/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Activity, Server, Database, Cpu, 
  Clock, AlertTriangle, TrendingUp, TrendingDown 
} from 'lucide-react'
import { SystemMetricsChart } from '@/components/admin/monitoring/metrics-chart'
import { LogViewer } from '@/components/admin/monitoring/log-viewer'

export default function MonitoringPage() {
  const [metrics, setMetrics] = useState({
    cpu: 45,
    memory: 68,
    disk: 32,
    network: 125,
    requests: 1245,
    errors: 12,
    responseTime: 145
  })

  useEffect(() => {
    // Simulate live metrics updates
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cpu: Math.max(10, Math.min(90, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(20, Math.min(95, prev.memory + (Math.random() - 0.5) * 5)),
        requests: prev.requests + Math.floor(Math.random() * 10),
        responseTime: Math.max(50, Math.min(300, prev.responseTime + (Math.random() - 0.5) * 20))
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Monitoring</h1>
        <p className="text-gray-600">Real-time system performance and health metrics</p>
      </div>

      {/* Alert Bar */}
      <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <div>
            <p className="font-medium text-yellow-800">2 services require attention</p>
            <p className="text-sm text-yellow-700">SMS service latency is high • Database connection intermittent</p>
          </div>
        </div>
        <button className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition">
          View Details
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'CPU Usage', value: `${metrics.cpu}%`, icon: Cpu, color: 'bg-blue-500', trend: 'up' },
          { label: 'Memory', value: `${metrics.memory}%`, icon: Database, color: 'bg-green-500', trend: 'stable' },
          { label: 'Disk I/O', value: `${metrics.disk}MB/s`, icon: Server, color: 'bg-purple-500', trend: 'down' },
          { label: 'Network', value: `${metrics.network}Mb/s`, icon: Activity, color: 'bg-orange-500', trend: 'up' },
        ].map((metric) => (
          <div key={metric.label} className="bg-white p-6 rounded-lg shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 ${metric.color} rounded-lg`}>
                <metric.icon className="h-6 w-6 text-white" />
              </div>
              <div className={`flex items-center space-x-1 ${
                metric.trend === 'up' ? 'text-green-600' :
                metric.trend === 'down' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {metric.trend === 'up' ? <TrendingUp className="h-4 w-4" /> :
                 metric.trend === 'down' ? <TrendingDown className="h-4 w-4" /> :
                 <Activity className="h-4 w-4" />}
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">{metric.value}</h3>
            <p className="text-gray-600">{metric.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SystemMetricsChart title="Response Time" data={[]} />
        <SystemMetricsChart title="Request Rate" data={[]} />
      </div>

      {/* Log Viewer */}
      <LogViewer />

      {/* Service Status */}
      <div className="bg-white rounded-lg shadow-soft p-6">
        <h3 className="text-lg font-bold mb-4">Service Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { name: 'API Gateway', status: 'healthy', latency: '45ms' },
            { name: 'Database', status: 'degraded', latency: '120ms' },
            { name: 'Redis', status: 'healthy', latency: '8ms' },
            { name: 'Socket.IO', status: 'healthy', latency: '18ms' },
            { name: 'SMS Gateway', status: 'degraded', latency: '320ms' },
            { name: 'Payment API', status: 'healthy', latency: '67ms' },
          ].map((service) => (
            <div key={service.name} className="text-center p-4 border border-gray-200 rounded-lg">
              <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
                service.status === 'healthy' ? 'bg-green-500' : 'bg-yellow-500'
              }`} />
              <p className="font-medium text-sm">{service.name}</p>
              <p className="text-xs text-gray-500">{service.latency}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


