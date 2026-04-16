// components/map/live-map.tsx (New file)
'use client'

import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import { Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// @ts-ignore
delete Icon.Default.prototype._getIconUrl
Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x.src,
  iconUrl: markerIcon.src,
  shadowUrl: markerShadow.src,
})

interface Location {
  id: string
  name: string
  type: 'locker' | 'staffed_hub'
  coordinates: {
    lat: number
    lng: number
  }
  status: 'online' | 'offline' | 'maintenance' | 'full'
  parcelCount: number
  capacity: number
}

interface LiveMapProps {
  locations: Location[]
  center: [number, number]
  zoom: number
  onLocationSelect: (id: string) => void
  selectedLocation: string | null
}

export default function LiveMap({ 
  locations, 
  center, 
  zoom, 
  onLocationSelect,
  selectedLocation 
}: LiveMapProps) {
  const getMarkerIcon = (location: Location) => {
    const size = 40
    const color = location.status === 'online' ? '#10b981' : 
                  location.status === 'offline' ? '#ef4444' :
                  location.status === 'maintenance' ? '#f59e0b' : '#8b5cf6'
    
    const svg = `
      <svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="40" fill="${color}" fill-opacity="0.8" stroke="white" stroke-width="4"/>
        ${location.type === 'locker' 
          ? '<rect x="30" y="30" width="40" height="40" fill="white" stroke="white" stroke-width="2"/>' 
          : '<circle cx="50" cy="50" r="20" fill="white" stroke="white" stroke-width="2"/>'
        }
        <text x="50" y="60" text-anchor="middle" fill="${color}" font-size="24" font-weight="bold">${location.parcelCount}</text>
      </svg>
    `
    
    return new Icon({
      iconUrl: 'data:image/svg+xml;base64,' + btoa(svg),
      iconSize: [size, size],
      iconAnchor: [size/2, size/2],
      popupAnchor: [0, -size/2]
    })
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Coverage Area */}
      <Circle
        center={center}
        radius={5000}
        pathOptions={{ fillColor: '#ff0000', color: '#ff0000', fillOpacity: 0.1 }}
      />

      {/* Location Markers */}
      {locations.map(location => (
        <Marker
          key={location.id}
          position={[location.coordinates.lat, location.coordinates.lng]}
          icon={getMarkerIcon(location)}
          eventHandlers={{
            click: () => onLocationSelect(location.id),
          }}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-bold text-gray-900">{location.name}</h3>
              <p className="text-sm text-gray-600">
                {location.type === 'locker' ? 'Smart Locker' : 'Staffed Hub'}
              </p>
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status:</span>
                  <span className={cn(
                    "text-sm font-medium", 
                    location.status === 'online' ? 'text-green-600' :
                    location.status === 'offline' ? 'text-red-600' :
                    location.status === 'maintenance' ? 'text-yellow-600' : 'text-purple-600'
                  )}>
                    {location.status.charAt(0).toUpperCase() + location.status.slice(1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Parcels:</span>
                  <span className="text-sm font-medium">{location.parcelCount}/{location.capacity}</span>
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}




