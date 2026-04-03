// components/admin/monitoring/log-viewer.tsx
'use client'

import { useState } from 'react'
import { Search, Filter, Download, RefreshCw, AlertCircle, Info, AlertTriangle } from 'lucide-react'

interface Log {
  id: number
  timestamp: string
  level: 'info' | 'warning' | 'error'
  message: string
  source: string
}

export function LogViewer() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const sampleLogs: Log[] = [
    { id: 1, timestamp: '2024-01-15 14:23:45', level: 'info', message: 'User authentication successful', source: 'auth-service' },
    { id: 2, timestamp: '2024-01-15 14:24:12', level: 'warning', message: 'High memory usage detected', source: 'system' },
    { id: 3, timestamp: '2024-01-15 14:24:33', level: 'error', message: 'Database connection timeout', source: 'database' },
    { id: 4, timestamp: '2024-01-15 14:25:01', level: 'info', message: 'Payment processed successfully', source: 'payment-api' },
    { id: 5, timestamp: '2024-01-15 14:25:28', level: 'warning', message: 'Slow response time: 3.2s', source: 'api-gateway' },
    { id: 6, timestamp: '2024-01-15 14:26:15', level: 'error', message: 'SMS delivery failed', source: 'sms-gateway' },
  ]

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const filteredLogs = sampleLogs.filter(log => {
    if (filter !== 'all' && log.level !== filter) return false
    if (search && !log.message.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="bg-white rounded-lg shadow-soft">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">System Logs</h3>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
              <RefreshCw className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
              <Download className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Levels</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {getLevelIcon(log.level)}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(log.level)}`}>
                      {log.level.toUpperCase()}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {log.timestamp}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                  {log.source}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {log.message}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-600">
            Showing {filteredLogs.length} of {sampleLogs.length} logs
          </p>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-gray-600 hover:bg-gray-200 rounded transition" disabled>
              Previous
            </button>
            <button className="px-3 py-1 text-gray-600 hover:bg-gray-200 rounded transition" disabled>
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}