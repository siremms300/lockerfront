// components/admin/locations/location-map.tsx
'use client'

import { useEffect, useRef } from 'react'
import { MapPin } from 'lucide-react'

interface Location {
  id: string
  name: string
  lat: number
  lng: number
  status: string
}

interface LocationMapProps {
  locations: Location[]
  onLocationSelect: (location: Location) => void
}

export function LocationMap({ locations, onLocationSelect }: LocationMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)

  // Sample locations for demo
  const sampleLocations: Location[] = [
    { id: '1', name: 'Downtown Hub', lat: 40.7128, lng: -74.0060, status: 'online' },
    { id: '2', name: 'Westside Plaza', lat: 40.7580, lng: -73.9855, status: 'online' },
    { id: '3', name: 'East Village', lat: 40.7282, lng: -73.9942, status: 'offline' },
    { id: '4', name: 'North Station', lat: 40.7549, lng: -73.9840, status: 'online' },
  ]

  const displayLocations = locations.length > 0 ? locations : sampleLocations

  // Simple map representation without external libraries
  return (
    <div className="bg-white rounded-lg shadow-soft overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-bold">Location Map</h3>
        <p className="text-sm text-gray-600">Click on markers to view details</p>
      </div>
      
      <div 
        ref={mapContainerRef}
        className="relative h-100 bg-linear-to-br from-blue-50 to-green-50"
      >
        {/* Map Grid Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%3E%3Cpath%20fill%3D%22%23e5e7eb%22%20fill-opacity%3D%220.4%22%20d%3D%22M0%200h40v40H0z%22%2F%3E%3C%2Fsvg%3E')] opacity-20" />
        </div>

        {/* Location Markers */}
        <div className="relative h-full">
          {displayLocations.map((location) => (
            <button
              key={location.id}
              onClick={() => onLocationSelect(location)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
              style={{
                left: `${((location.lng + 74.1) / 0.2) * 100}%`,
                top: `${((40.8 - location.lat) / 0.2) * 100}%`,
              }}
            >
              <div className="relative">
                <MapPin 
                  className={`h-8 w-8 transition-transform group-hover:scale-110 ${
                    location.status === 'online' ? 'text-green-500' : 'text-red-500'
                  }`}
                />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-gray-900 text-white text-sm rounded-lg px-2 py-1 whitespace-nowrap">
                    {location.name}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Map Controls (Mock) */}
        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-md p-2">
          <div className="flex flex-col space-y-1">
            <button className="p-1 hover:bg-gray-100 rounded">+</button>
            <button className="p-1 hover:bg-gray-100 rounded">-</button>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-green-500" />
              <span className="text-gray-600">Online: {displayLocations.filter(l => l.status === 'online').length}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-red-500" />
              <span className="text-gray-600">Offline: {displayLocations.filter(l => l.status === 'offline').length}</span>
            </div>
          </div>
          <span className="text-gray-400">Click markers for details</span>
        </div>
      </div>
    </div>
  )
}