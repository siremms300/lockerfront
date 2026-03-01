// app/admin/locations/page.tsx
'use client'

import { useState } from 'react'
import { MapPin, Plus, Wifi, Battery, AlertCircle, Edit } from 'lucide-react'
import { LocationMap } from '@/components/admin/locations/location-map'
import { LocationTable } from '@/components/admin/locations/location-table'
import { CreateLocationModal } from '@/components/admin/locations/create-location-modal'

export default function LocationsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<any>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Location Management</h1>
          <p className="text-gray-600">Monitor and manage locker locations</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 pepper-gradient text-white rounded-lg hover:shadow-lg transition flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Location</span>
        </button>
      </div>

      {/* Location Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LocationMap
            locations={[]}
            onLocationSelect={setSelectedLocation}
          />
        </div>
        <div className="space-y-4">
          {[
            { label: 'Total Locations', value: '48', color: 'bg-blue-500' },
            { label: 'Online Lockers', value: '42', color: 'bg-green-500' },
            { label: 'Offline Lockers', value: '6', color: 'bg-red-500' },
            { label: 'Maintenance', value: '2', color: 'bg-yellow-500' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white p-4 rounded-lg shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
                <div className={`w-3 h-3 rounded-full ${stat.color}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Location Table */}
      <LocationTable onEdit={setSelectedLocation} />

      {/* Selected Location Details */}
      {selectedLocation && (
        <div className="bg-white rounded-lg shadow-soft p-6">
          <h3 className="text-lg font-bold mb-4">Location Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Basic Info</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{selectedLocation.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {selectedLocation.type}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    selectedLocation.status === 'online' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedLocation.status}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Hardware Status</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Connectivity:</span>
                  <div className="flex items-center space-x-1">
                    <Wifi className={`h-4 w-4 ${
                      selectedLocation.signal > 50 ? 'text-green-500' : 'text-yellow-500'
                    }`} />
                    <span>{selectedLocation.signal}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Power:</span>
                  <div className="flex items-center space-x-1">
                    <Battery className={`h-4 w-4 ${
                      selectedLocation.battery > 30 ? 'text-green-500' : 'text-red-500'
                    }`} />
                    <span>{selectedLocation.battery}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Last Ping:</span>
                  <span>2 min ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <CreateLocationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        location={selectedLocation}
      />
    </div>
  )
}




