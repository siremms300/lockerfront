// components/admin/locations/location-table.tsx
'use client'

import { useState } from 'react'
import { Edit, Trash2, MoreVertical, Wifi, WifiOff, AlertTriangle } from 'lucide-react'

interface Location {
  id: string
  name: string
  address: string
  status: 'online' | 'offline' | 'maintenance'
  lockers: number
  available: number
  lastActive: string
}

interface LocationTableProps {
  onEdit: (location: Location) => void
}

export default function LocationTable({ onEdit }: LocationTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const sampleLocations: Location[] = [
    {
      id: '1',
      name: 'Downtown Hub',
      address: '123 Main St, Downtown',
      status: 'online',
      lockers: 24,
      available: 12,
      lastActive: '2 min ago',
    },
    {
      id: '2',
      name: 'Westside Plaza',
      address: '456 West Ave, Westside',
      status: 'online',
      lockers: 16,
      available: 8,
      lastActive: '5 min ago',
    },
    {
      id: '3',
      name: 'East Village',
      address: '789 East Blvd, Eastside',
      status: 'offline',
      lockers: 12,
      available: 0,
      lastActive: '2 hours ago',
    },
    {
      id: '4',
      name: 'North Station',
      address: '321 North Rd, Northside',
      status: 'maintenance',
      lockers: 20,
      available: 0,
      lastActive: '1 hour ago',
    },
    {
      id: '5',
      name: 'South Park Mall',
      address: '654 South St, Southside',
      status: 'online',
      lockers: 32,
      available: 24,
      lastActive: '1 min ago',
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800'
      case 'offline':
        return 'bg-red-100 text-red-800'
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <Wifi className="h-4 w-4" />
      case 'offline':
        return <WifiOff className="h-4 w-4" />
      case 'maintenance':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return null
    }
  }

  const filteredLocations = sampleLocations.filter(location => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.address.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || location.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="bg-white rounded-lg shadow-soft">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <h3 className="text-lg font-bold">Location List</h3>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lockers</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredLocations.map((location) => (
              <tr key={location.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{location.name}</p>
                    <p className="text-sm text-gray-500">{location.address}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(location.status)}`}>
                    {getStatusIcon(location.status)}
                    <span>{location.status}</span>
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{location.lockers}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{location.available}</span>
                    <div className="flex-1 max-w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 rounded-full h-2"
                        style={{ width: `${(location.available / location.lockers) * 100}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{location.lastActive}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => onEdit(location)}
                    className="text-blue-600 hover:text-blue-800 transition"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-600">
            Showing {filteredLocations.length} of {sampleLocations.length} locations
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