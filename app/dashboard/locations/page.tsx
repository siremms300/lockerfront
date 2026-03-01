// app/dashboard/locations/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  MapPin, 
  Wifi, 
  Battery, 
  Package, 
  Users, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Filter,
  Search,
  Layers,
  Eye,
  Navigation,
  Zap,
  Shield,
  Plus,
  Edit,
  Trash2,
  Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/lib/socket'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { locationAPI, parcelAPI } from '@/lib/api'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { PermissionGuard } from '@/components/auth/permission-guard'
import { useAuth } from '@/hooks/useAuth'

// Dynamically import the map component (client-side only)
const DynamicMap = dynamic(
  () => import('@/components/map/live-map'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[500px] lg:h-[calc(100%-4rem)] bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pepper-500 mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }
)

interface Location {
  _id: string
  name: string
  type: 'locker' | 'staffed_hub'
  coordinates: {
    lat: number
    lng: number
  }
  address: {
    street: string
    city: string
    state: string
    country: string
  }
  contact: {
    phone: string
    email?: string
  }
  hours: {
    opens: string
    closes: string
    timezone: string
  }
  status: 'active' | 'inactive' | 'maintenance'
  isOnline: boolean
  createdAt: string
  updatedAt: string
  // Extended fields for UI (calculated from parcels)
  parcelCount?: number
  capacity?: number
  availableCompartments?: number
  lastHeartbeat?: string
  powerSource?: 'grid' | 'solar' | 'battery'
  batteryLevel?: number
  networkStrength?: 'excellent' | 'good' | 'poor'
}

interface LocationStats {
  totalParcels: number
  activeParcels: number
  completedParcels: number
  utilization: number
}

export default function LocationsPage() {
  const { can, user } = useAuth() // Get auth state
  const socket = useSocket()
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<'all' | 'locker' | 'staffed_hub'>('all')
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'online' | 'offline' | 'maintenance' | 'full'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list')
  const [locationStats, setLocationStats] = useState<Record<string, LocationStats>>({})
  const [center] = useState<[number, number]>([6.5244, 3.3792]) // Lagos center
  const [zoom] = useState(12)

  // Fetch locations on mount
  useEffect(() => {
    fetchLocations()
  }, [])

  // Fetch stats for each location
  useEffect(() => {
    if (locations.length > 0) {
      locations.forEach(location => {
        fetchLocationStats(location._id)
      })
    }
  }, [locations])

  const fetchLocations = async () => {
    try {
      setLoading(true)
      const response = await locationAPI.getAll()
      
      // Transform API data to match UI format
      const transformedLocations = response.data.locations.map((loc: any) => ({
        ...loc,
        // Add calculated/demo fields for UI
        lastHeartbeat: getRandomHeartbeat(),
        powerSource: getRandomPowerSource(),
        batteryLevel: Math.floor(Math.random() * 30) + 70, // 70-100%
        networkStrength: getRandomNetworkStrength(),
        parcelCount: 0, // Will be updated by stats
        capacity: loc.type === 'locker' ? 100 : 50, // Default capacities
        availableCompartments: 0 // Will be updated by stats
      }))
      
      setLocations(transformedLocations)
    } catch (error: any) {
      toast.error('Failed to load locations')
      console.error('Error fetching locations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLocationStats = async (locationId: string) => {
    try {
      const response = await locationAPI.getStats(locationId)
      setLocationStats(prev => ({
        ...prev,
        [locationId]: response.data
      }))

      // Update location with stats
      setLocations(prev => prev.map(loc => {
        if (loc._id === locationId) {
          const stats = response.data
          return {
            ...loc,
            parcelCount: stats.totalParcels,
            availableCompartments: (loc.capacity || 100) - stats.activeParcels
          }
        }
        return loc
      }))
    } catch (error) {
      console.error(`Failed to fetch stats for location ${locationId}:`, error)
    }
  }

  // Helper functions for demo data (replace with real data from your locker hardware)
  const getRandomHeartbeat = () => {
    const minutes = Math.floor(Math.random() * 10)
    return minutes === 0 ? 'Just now' : `${minutes} min ago`
  }

  const getRandomPowerSource = () => {
    const sources: Array<'grid' | 'solar' | 'battery'> = ['grid', 'solar', 'battery']
    return sources[Math.floor(Math.random() * sources.length)]
  }

  const getRandomNetworkStrength = () => {
    const strengths: Array<'excellent' | 'good' | 'poor'> = ['excellent', 'good', 'poor']
    return strengths[Math.floor(Math.random() * strengths.length)]
  }

  // Handle socket updates for real-time locker status
  useEffect(() => {
    if (!socket) return

    socket.on('locker-status-update', (update: any) => {
      setLocations(prev => prev.map(loc => 
        loc._id === update.locationId 
          ? { 
              ...loc, 
              status: update.status,
              isOnline: update.status === 'online',
              lastHeartbeat: 'Just now',
              batteryLevel: update.batteryLevel,
              networkStrength: update.networkStrength
            }
          : loc
      ))
      toast.success(`Locker ${update.locationName} status updated to ${update.status}`)
    })

    socket.on('locker-metrics-update', (update: any) => {
      setLocations(prev => prev.map(loc => 
        loc._id === update.locationId 
          ? { 
              ...loc, 
              parcelCount: update.parcelCount,
              availableCompartments: update.availableCompartments
            }
          : loc
      ))
    })

    return () => {
      socket.off('locker-status-update')
      socket.off('locker-metrics-update')
    }
  }, [socket])

  const refreshLocations = async () => {
    setIsRefreshing(true)
    await fetchLocations()
    setIsRefreshing(false)
    toast.success('Location data refreshed')
  }

  const getStatusIcon = (status: string, isOnline: boolean) => {
    if (!isOnline) return <XCircle className="h-4 w-4 text-red-500" />
    
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'maintenance': return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default: return <CheckCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string, isOnline: boolean) => {
    if (!isOnline) return 'bg-red-500'
    
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'maintenance': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getDisplayStatus = (location: Location) => {
    if (!location.isOnline) return 'offline'
    if (location.parcelCount && location.capacity && location.parcelCount >= location.capacity) return 'full'
    return location.status
  }

  const calculateUtilization = (location: Location) => {
    if (!location.parcelCount || !location.capacity) return 0
    return Math.round((location.parcelCount / location.capacity) * 100)
  }

  // Filter locations based on selections
  const filteredLocations = locations.filter(location => {
    const displayStatus = getDisplayStatus(location)
    const matchesType = selectedType === 'all' || location.type === selectedType
    const matchesStatus = selectedStatus === 'all' || displayStatus === selectedStatus
    const matchesSearch = searchQuery === '' || 
      location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${location.address.street}, ${location.address.city}`.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesStatus && matchesSearch
  })

  const stats = {
    totalLocations: locations.length,
    onlineLocations: locations.filter(l => l.isOnline).length,
    totalParcels: locations.reduce((sum, loc) => sum + (loc.parcelCount || 0), 0),
    availableCapacity: locations.reduce((sum, loc) => sum + ((loc.capacity || 0) - (loc.parcelCount || 0)), 0),
    lockers: locations.filter(l => l.type === 'locker').length,
    hubs: locations.filter(l => l.type === 'staffed_hub').length,
  }

  const formatAddress = (location: Location) => {
    return `${location.address.street}, ${location.address.city}, ${location.address.state}`
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl p-4 animate-pulse h-96"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Network Locations</h1>
          <p className="text-gray-600">
            {user?.role === 'admin' || user?.role === 'super_admin' 
              ? 'Manage all locker and hub locations'
              : 'View locker and hub locations'
            }
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={refreshLocations}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            title="Refresh"
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-5 w-5 text-gray-600", isRefreshing && "animate-spin")} />
          </button>

          <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('map')}
              className={cn(
                "px-3 py-1.5 rounded text-sm font-medium transition",
                viewMode === 'map' ? "bg-white shadow-sm text-pepper-600" : "text-gray-600 hover:text-gray-900"
              )}
            >
              Map View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "px-3 py-1.5 rounded text-sm font-medium transition",
                viewMode === 'list' ? "bg-white shadow-sm text-pepper-600" : "text-gray-600 hover:text-gray-900"
              )}
            >
              List View
            </button>
          </div>

          {/* Only show Add Location button if user has createLocation permission */}
          <PermissionGuard permission="createLocation">
            <Link
              href="/dashboard/locations/new"
              className="px-4 py-2 pepper-gradient text-white rounded-lg hover:shadow-lg transition flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Location</span>
            </Link>
          </PermissionGuard>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: 'Total Locations', value: stats.totalLocations, icon: MapPin, color: 'bg-blue-500' },
          { label: 'Online Now', value: stats.onlineLocations, icon: CheckCircle, color: 'bg-green-500' },
          { label: 'Smart Lockers', value: stats.lockers, icon: Zap, color: 'bg-purple-500' },
          { label: 'Staffed Hubs', value: stats.hubs, icon: Users, color: 'bg-yellow-500' },
          { label: 'Active Parcels', value: stats.totalParcels, icon: Package, color: 'bg-cyan-500' },
          { label: 'Available Space', value: stats.availableCapacity, icon: Shield, color: 'bg-emerald-500' },
        ].map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-soft p-4 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
                <div className={`p-2 ${stat.color} rounded-lg`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-xl shadow-soft p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search locations by name or address..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20 focus:outline-none transition"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <select
                className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20 focus:outline-none transition"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
              >
                <option value="all">All Types</option>
                <option value="locker">Smart Lockers</option>
                <option value="staffed_hub">Staffed Hubs</option>
              </select>
            </div>

            <select
              className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20 focus:outline-none transition"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
            >
              <option value="all">All Status</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="maintenance">Maintenance</option>
              <option value="full">Full</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'map' ? (
        /* Map View */
        <div className="bg-white rounded-xl shadow-soft overflow-hidden border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-900">Network Map View</h3>
            <p className="text-gray-600 text-sm">Click on markers for location details</p>
          </div>
          <div className="h-[600px]">
            <DynamicMap
              locations={filteredLocations.map(l => ({
                id: l._id,
                name: l.name,
                type: l.type,
                coordinates: l.coordinates,
                status: getDisplayStatus(l),
                parcelCount: l.parcelCount || 0,
                capacity: l.capacity || 100
              }))}
              center={center}
              zoom={zoom}
              onLocationSelect={setSelectedLocation}
              selectedLocation={selectedLocation}
            />
          </div>
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl shadow-soft overflow-hidden border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">All Locations</h3>
            <p className="text-gray-600">{filteredLocations.length} locations found</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Update
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <AnimatePresence>
                  {filteredLocations.map((location) => {
                    const displayStatus = getDisplayStatus(location)
                    return (
                      <motion.tr
                        key={location._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(location.status, location.isOnline)}
                            <div>
                              <div className="font-medium text-gray-900">{location.name}</div>
                              <div className="text-sm text-gray-500">{formatAddress(location)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium",
                            location.type === 'locker' 
                              ? "bg-purple-100 text-purple-800"
                              : "bg-yellow-100 text-yellow-800"
                          )}>
                            {location.type === 'locker' ? 'Smart Locker' : 'Staffed Hub'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(location.status, location.isOnline)}`} />
                            <span className="capitalize">{displayStatus}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-900">
                              {location.parcelCount || 0}/{location.capacity || 100}
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
                              <div
                                className={cn(
                                  "h-full transition-all duration-300",
                                  calculateUtilization(location) > 90 ? "bg-red-500" :
                                  calculateUtilization(location) > 70 ? "bg-yellow-500" : "bg-green-500"
                                )}
                                style={{ width: `${calculateUtilization(location)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="text-sm text-gray-900">{location.contact.phone}</div>
                            {location.contact.email && (
                              <div className="text-sm text-gray-500">{location.contact.email}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            {location.hours.opens} - {location.hours.closes}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {location.lastHeartbeat}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            {/* View button - everyone can view */}
                            <button
                              title="View"
                              className="p-1 hover:bg-gray-100 rounded transition"
                              onClick={() => setSelectedLocation(location._id)}
                            >
                              <Eye className="h-4 w-4 text-gray-600" />
                            </button>
                            
                            {/* Edit button - only if user has editLocation permission */}
                            <PermissionGuard permission="editLocation">
                              <Link href={`/dashboard/locations/${location._id}/edit`}>
                                <button
                                  title="Edit"
                                  className="p-1 hover:bg-gray-100 rounded transition"
                                >
                                  <Edit className="h-4 w-4 text-gray-600" />
                                </button>
                              </Link>
                            </PermissionGuard>
                            
                            {/* Delete button - only if user has deleteLocation permission */}
                            <PermissionGuard permission="deleteLocation">
                              <button
                                title="Delete"
                                className="p-1 hover:bg-gray-100 rounded transition text-red-600 hover:text-red-700"
                                onClick={async () => {
                                  if (confirm('Are you sure you want to delete this location?')) {
                                    try {
                                      await locationAPI.delete(location._id)
                                      toast.success('Location deleted successfully')
                                      fetchLocations()
                                      if (selectedLocation === location._id) {
                                        setSelectedLocation(null)
                                      }
                                    } catch (error) {
                                      toast.error('Failed to delete location')
                                    }
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </PermissionGuard>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredLocations.length === 0 && (
            <div className="p-12 text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
              <p className="text-gray-600">
                {searchQuery || selectedType !== 'all' || selectedStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : user?.role === 'admin' || user?.role === 'super_admin'
                  ? 'Add your first location to get started'
                  : 'No locations available at the moment'
                }
              </p>
              {user?.role === 'admin' || user?.role === 'super_admin' ? (
                <PermissionGuard permission="createLocation">
                  <Link
                    href="/dashboard/locations/new"
                    className="mt-4 inline-flex px-4 py-2 bg-pepper-500 text-white rounded-lg hover:bg-pepper-600 transition"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Location
                  </Link>
                </PermissionGuard>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Selected Location Details */}
      <AnimatePresence>
        {selectedLocation && (() => {
          const location = locations.find(l => l._id === selectedLocation)
          if (!location) return null

          const displayStatus = getDisplayStatus(location)

          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-xl shadow-soft p-6 border border-gray-200"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{location.name}</h3>
                  <p className="text-gray-600">{formatAddress(location)}</p>
                </div>
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Status & Info */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                    <div className={cn(
                      "px-4 py-2 rounded-lg font-medium inline-flex items-center space-x-2",
                      displayStatus === 'online' ? "bg-green-100 text-green-800" :
                      displayStatus === 'offline' ? "bg-red-100 text-red-800" :
                      displayStatus === 'maintenance' ? "bg-yellow-100 text-yellow-800" : 
                      displayStatus === 'full' ? "bg-purple-100 text-purple-800" :
                      "bg-gray-100 text-gray-800"
                    )}>
                      {getStatusIcon(location.status, location.isOnline)}
                      <span>{displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Location Type</h4>
                    <div className={cn(
                      "px-4 py-2 rounded-lg font-medium",
                      location.type === 'locker' 
                        ? "bg-purple-100 text-purple-800"
                        : "bg-yellow-100 text-yellow-800"
                    )}>
                      {location.type === 'locker' ? 'Smart Locker' : 'Staffed Hub'}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Operating Hours</h4>
                    <div className="px-4 py-2 bg-gray-100 rounded-lg font-medium">
                      {location.hours.opens} - {location.hours.closes} ({location.hours.timezone})
                    </div>
                  </div>
                </div>

                {/* Capacity */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Capacity Utilization</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Used</span>
                        <span className="font-medium">{location.parcelCount || 0} parcels</span>
                      </div>
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full transition-all duration-300",
                            calculateUtilization(location) > 90 ? "bg-red-500" :
                            calculateUtilization(location) > 70 ? "bg-yellow-500" : "bg-green-500"
                          )}
                          style={{ width: `${calculateUtilization(location)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{calculateUtilization(location)}% full</span>
                        <span className="text-gray-600">{location.availableCompartments || 0} available</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{location.contact.phone}</span>
                      </div>
                      {location.contact.email && (
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-600">Email:</span>
                          <span className="font-medium">{location.contact.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Technical Info */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Technical Information</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-sm text-gray-500">Power Source</div>
                        <div className="font-medium capitalize">{location.powerSource || 'grid'}</div>
                      </div>
                      {location.batteryLevel && (
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="text-sm text-gray-500">Battery Level</div>
                          <div className="font-medium">{location.batteryLevel}%</div>
                        </div>
                      )}
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-sm text-gray-500">Network</div>
                        <div className="font-medium capitalize">{location.networkStrength || 'good'}</div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="text-sm text-gray-500">Last Update</div>
                        <div className="font-medium">{location.lastHeartbeat}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    {/* View Analytics - everyone can view */}
                    <Link href={`/dashboard/locations/${location._id}/analytics`} className="flex-1">
                      <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">
                        View Analytics
                      </button>
                    </Link>
                    
                    {/* Edit button - only if user has permission */}
                    <PermissionGuard permission="editLocation">
                      <Link href={`/dashboard/locations/${location._id}/edit`} className="flex-1">
                        <button className="w-full px-4 py-2 bg-pepper-500 text-white rounded-lg hover:bg-pepper-600 transition font-medium">
                          Edit Location
                        </button>
                      </Link>
                    </PermissionGuard>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })()}
      </AnimatePresence>
    </div>
  )
}





























































// // app/dashboard/locations/page.tsx
// 'use client'

// import { useState, useEffect } from 'react'
// import { 
//   MapPin, 
//   Wifi, 
//   Battery, 
//   Package, 
//   Users, 
//   Clock, 
//   AlertCircle, 
//   CheckCircle, 
//   XCircle, 
//   RefreshCw,
//   Filter,
//   Search,
//   Layers,
//   Eye,
//   Navigation,
//   Zap,
//   Shield,
//   Plus,
//   Edit,
//   Trash2
// } from 'lucide-react'
// import { motion, AnimatePresence } from 'framer-motion'
// import { useSocket } from '@/lib/socket'
// import { toast } from 'react-hot-toast'
// import { cn } from '@/lib/utils'
// import { locationAPI, parcelAPI } from '@/lib/api'
// import dynamic from 'next/dynamic'
// import Link from 'next/link'
// // @@@@@@@@@@@@@@@@@@@@@@@@@@@@ 

// // Dynamically import the map component (client-side only)
// const DynamicMap = dynamic(
//   () => import('@/components/map/live-map'),
//   { 
//     ssr: false,
//     loading: () => (
//       <div className="h-[500px] lg:h-[calc(100%-4rem)] bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
//         <div className="text-center">
//           <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pepper-500 mb-4"></div>
//           <p className="text-gray-600">Loading map...</p>
//         </div>
//       </div>
//     )
//   }
// )

// interface Location {
//   _id: string
//   name: string
//   type: 'locker' | 'staffed_hub'
//   coordinates: {
//     lat: number
//     lng: number
//   }
//   address: {
//     street: string
//     city: string
//     state: string
//     country: string
//   }
//   contact: {
//     phone: string
//     email?: string
//   }
//   hours: {
//     opens: string
//     closes: string
//     timezone: string
//   }
//   status: 'active' | 'inactive' | 'maintenance'
//   isOnline: boolean
//   createdAt: string
//   updatedAt: string
//   // Extended fields for UI (calculated from parcels)
//   parcelCount?: number
//   capacity?: number
//   availableCompartments?: number
//   lastHeartbeat?: string
//   powerSource?: 'grid' | 'solar' | 'battery'
//   batteryLevel?: number
//   networkStrength?: 'excellent' | 'good' | 'poor'
// }

// interface LocationStats {
//   totalParcels: number
//   activeParcels: number
//   completedParcels: number
//   utilization: number
// }

// export default function LocationsPage() {
//   const socket = useSocket()
//   const [locations, setLocations] = useState<Location[]>([])
//   const [loading, setLoading] = useState(true)
//   const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
//   const [selectedType, setSelectedType] = useState<'all' | 'locker' | 'staffed_hub'>('all')
//   const [selectedStatus, setSelectedStatus] = useState<'all' | 'online' | 'offline' | 'maintenance' | 'full'>('all')
//   const [searchQuery, setSearchQuery] = useState('')
//   const [isRefreshing, setIsRefreshing] = useState(false)
//   const [viewMode, setViewMode] = useState<'map' | 'list'>('list')
//   const [locationStats, setLocationStats] = useState<Record<string, LocationStats>>({})
//   const [center] = useState<[number, number]>([6.5244, 3.3792]) // Lagos center
//   const [zoom] = useState(12)

//   // Fetch locations on mount
//   useEffect(() => {
//     fetchLocations()
//   }, [])

//   // Fetch stats for each location
//   useEffect(() => {
//     if (locations.length > 0) {
//       locations.forEach(location => {
//         fetchLocationStats(location._id)
//       })
//     }
//   }, [locations])

//   const fetchLocations = async () => {
//     try {
//       setLoading(true)
//       const response = await locationAPI.getAll()
      
//       // Transform API data to match UI format
//       const transformedLocations = response.data.locations.map((loc: any) => ({
//         ...loc,
//         // Add calculated/demo fields for UI
//         lastHeartbeat: getRandomHeartbeat(),
//         powerSource: getRandomPowerSource(),
//         batteryLevel: Math.floor(Math.random() * 30) + 70, // 70-100%
//         networkStrength: getRandomNetworkStrength(),
//         parcelCount: 0, // Will be updated by stats
//         capacity: loc.type === 'locker' ? 100 : 50, // Default capacities
//         availableCompartments: 0 // Will be updated by stats
//       }))
      
//       setLocations(transformedLocations)
//     } catch (error: any) {
//       toast.error('Failed to load locations')
//       console.error('Error fetching locations:', error)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const fetchLocationStats = async (locationId: string) => {
//     try {
//       const response = await locationAPI.getStats(locationId)
//       setLocationStats(prev => ({
//         ...prev,
//         [locationId]: response.data
//       }))

//       // Update location with stats
//       setLocations(prev => prev.map(loc => {
//         if (loc._id === locationId) {
//           const stats = response.data
//           return {
//             ...loc,
//             parcelCount: stats.totalParcels,
//             availableCompartments: (loc.capacity || 100) - stats.activeParcels
//           }
//         }
//         return loc
//       }))
//     } catch (error) {
//       console.error(`Failed to fetch stats for location ${locationId}:`, error)
//     }
//   }

//   // Helper functions for demo data (replace with real data from your locker hardware)
//   const getRandomHeartbeat = () => {
//     const minutes = Math.floor(Math.random() * 10)
//     return minutes === 0 ? 'Just now' : `${minutes} min ago`
//   }

//   const getRandomPowerSource = () => {
//     const sources: Array<'grid' | 'solar' | 'battery'> = ['grid', 'solar', 'battery']
//     return sources[Math.floor(Math.random() * sources.length)]
//   }

//   const getRandomNetworkStrength = () => {
//     const strengths: Array<'excellent' | 'good' | 'poor'> = ['excellent', 'good', 'poor']
//     return strengths[Math.floor(Math.random() * strengths.length)]
//   }

//   // Handle socket updates for real-time locker status
//   useEffect(() => {
//     if (!socket) return

//     socket.on('locker-status-update', (update: any) => {
//       setLocations(prev => prev.map(loc => 
//         loc._id === update.locationId 
//           ? { 
//               ...loc, 
//               status: update.status,
//               isOnline: update.status === 'online',
//               lastHeartbeat: 'Just now',
//               batteryLevel: update.batteryLevel,
//               networkStrength: update.networkStrength
//             }
//           : loc
//       ))
//       toast.success(`Locker ${update.locationName} status updated to ${update.status}`)
//     })

//     socket.on('locker-metrics-update', (update: any) => {
//       setLocations(prev => prev.map(loc => 
//         loc._id === update.locationId 
//           ? { 
//               ...loc, 
//               parcelCount: update.parcelCount,
//               availableCompartments: update.availableCompartments
//             }
//           : loc
//       ))
//     })

//     return () => {
//       socket.off('locker-status-update')
//       socket.off('locker-metrics-update')
//     }
//   }, [socket])

//   const refreshLocations = async () => {
//     setIsRefreshing(true)
//     await fetchLocations()
//     setIsRefreshing(false)
//     toast.success('Location data refreshed')
//   }

//   const getStatusIcon = (status: string, isOnline: boolean) => {
//     if (!isOnline) return <XCircle className="h-4 w-4 text-red-500" />
    
//     switch (status) {
//       case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />
//       case 'maintenance': return <AlertCircle className="h-4 w-4 text-yellow-500" />
//       default: return <CheckCircle className="h-4 w-4 text-gray-500" />
//     }
//   }

//   const getStatusColor = (status: string, isOnline: boolean) => {
//     if (!isOnline) return 'bg-red-500'
    
//     switch (status) {
//       case 'active': return 'bg-green-500'
//       case 'maintenance': return 'bg-yellow-500'
//       default: return 'bg-gray-500'
//     }
//   }

//   const getDisplayStatus = (location: Location) => {
//     if (!location.isOnline) return 'offline'
//     if (location.parcelCount && location.capacity && location.parcelCount >= location.capacity) return 'full'
//     return location.status
//   }

//   const calculateUtilization = (location: Location) => {
//     if (!location.parcelCount || !location.capacity) return 0
//     return Math.round((location.parcelCount / location.capacity) * 100)
//   }

//   // Filter locations based on selections
//   const filteredLocations = locations.filter(location => {
//     const displayStatus = getDisplayStatus(location)
//     const matchesType = selectedType === 'all' || location.type === selectedType
//     const matchesStatus = selectedStatus === 'all' || displayStatus === selectedStatus
//     const matchesSearch = searchQuery === '' || 
//       location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       `${location.address.street}, ${location.address.city}`.toLowerCase().includes(searchQuery.toLowerCase())
//     return matchesType && matchesStatus && matchesSearch
//   })

//   const stats = {
//     totalLocations: locations.length,
//     onlineLocations: locations.filter(l => l.isOnline).length,
//     totalParcels: locations.reduce((sum, loc) => sum + (loc.parcelCount || 0), 0),
//     availableCapacity: locations.reduce((sum, loc) => sum + ((loc.capacity || 0) - (loc.parcelCount || 0)), 0),
//     lockers: locations.filter(l => l.type === 'locker').length,
//     hubs: locations.filter(l => l.type === 'staffed_hub').length,
//   }

//   const formatAddress = (location: Location) => {
//     return `${location.address.street}, ${location.address.city}, ${location.address.state}`
//   }

//   if (loading) {
//     return (
//       <div className="space-y-6">
//         <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
//         <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
//           {[...Array(6)].map((_, i) => (
//             <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
//               <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
//               <div className="h-8 bg-gray-200 rounded w-3/4"></div>
//             </div>
//           ))}
//         </div>
//         <div className="bg-white rounded-xl p-4 animate-pulse h-96"></div>
//       </div>
//     )
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Network Locations</h1>
//           <p className="text-gray-600">Manage all locker and hub locations</p>
//         </div>

//         <div className="flex items-center space-x-3">
//           <button
//             onClick={refreshLocations}
//             className="p-2 hover:bg-gray-100 rounded-lg transition"
//             title="Refresh"
//             disabled={isRefreshing}
//           >
//             <RefreshCw className={cn("h-5 w-5 text-gray-600", isRefreshing && "animate-spin")} />
//           </button>

//           <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
//             <button
//               onClick={() => setViewMode('map')}
//               className={cn(
//                 "px-3 py-1.5 rounded text-sm font-medium transition",
//                 viewMode === 'map' ? "bg-white shadow-sm text-pepper-600" : "text-gray-600 hover:text-gray-900"
//               )}
//             >
//               Map View
//             </button>
//             <button
//               onClick={() => setViewMode('list')}
//               className={cn(
//                 "px-3 py-1.5 rounded text-sm font-medium transition",
//                 viewMode === 'list' ? "bg-white shadow-sm text-pepper-600" : "text-gray-600 hover:text-gray-900"
//               )}
//             >
//               List View
//             </button>
//           </div>

//           <Link
//             href="/dashboard/locations/new"
//             className="px-4 py-2 pepper-gradient text-white rounded-lg hover:shadow-lg transition flex items-center space-x-2"
//           >
//             <Plus className="h-4 w-4" />
//             <span>Add Location</span>
//           </Link>
//         </div>
//       </div>

//       {/* Stats Bar */}
//       <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
//         {[
//           { label: 'Total Locations', value: stats.totalLocations, icon: MapPin, color: 'bg-blue-500' },
//           { label: 'Online Now', value: stats.onlineLocations, icon: CheckCircle, color: 'bg-green-500' },
//           { label: 'Smart Lockers', value: stats.lockers, icon: Zap, color: 'bg-purple-500' },
//           { label: 'Staffed Hubs', value: stats.hubs, icon: Users, color: 'bg-yellow-500' },
//           { label: 'Active Parcels', value: stats.totalParcels, icon: Package, color: 'bg-cyan-500' },
//           { label: 'Available Space', value: stats.availableCapacity, icon: Shield, color: 'bg-emerald-500' },
//         ].map((stat, index) => {
//           const Icon = stat.icon
//           return (
//             <motion.div
//               key={stat.label}
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: index * 0.1 }}
//               className="bg-white rounded-xl shadow-soft p-4 border border-gray-200"
//             >
//               <div className="flex items-center justify-between">
//                 <div>
//                   <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
//                   <div className="text-sm text-gray-500">{stat.label}</div>
//                 </div>
//                 <div className={`p-2 ${stat.color} rounded-lg`}>
//                   <Icon className="h-5 w-5 text-white" />
//                 </div>
//               </div>
//             </motion.div>
//           )
//         })}
//       </div>

//       {/* Filters & Search */}
//       <div className="bg-white rounded-xl shadow-soft p-4 border border-gray-200">
//         <div className="flex flex-col md:flex-row gap-4">
//           {/* Search */}
//           <div className="flex-1">
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//               <input
//                 type="text"
//                 placeholder="Search locations by name or address..."
//                 className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20 focus:outline-none transition"
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//               />
//             </div>
//           </div>

//           <div className="flex items-center space-x-4">
//             <div className="flex items-center space-x-2">
//               <Filter className="h-5 w-5 text-gray-500" />
//               <select
//                 className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20 focus:outline-none transition"
//                 value={selectedType}
//                 onChange={(e) => setSelectedType(e.target.value as any)}
//               >
//                 <option value="all">All Types</option>
//                 <option value="locker">Smart Lockers</option>
//                 <option value="staffed_hub">Staffed Hubs</option>
//               </select>
//             </div>

//             <select
//               className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20 focus:outline-none transition"
//               value={selectedStatus}
//               onChange={(e) => setSelectedStatus(e.target.value as any)}
//             >
//               <option value="all">All Status</option>
//               <option value="online">Online</option>
//               <option value="offline">Offline</option>
//               <option value="maintenance">Maintenance</option>
//               <option value="full">Full</option>
//             </select>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       {viewMode === 'map' ? (
//         /* Map View */
//         <div className="bg-white rounded-xl shadow-soft overflow-hidden border border-gray-200">
//           <div className="p-4 border-b border-gray-200">
//             <h3 className="font-bold text-gray-900">Network Map View</h3>
//             <p className="text-gray-600 text-sm">Click on markers for location details</p>
//           </div>
//           <div className="h-[600px]">
//             <DynamicMap
//               locations={filteredLocations.map(l => ({
//                 id: l._id,
//                 name: l.name,
//                 type: l.type,
//                 coordinates: l.coordinates,
//                 status: getDisplayStatus(l),
//                 parcelCount: l.parcelCount || 0,
//                 capacity: l.capacity || 100
//               }))}
//               center={center}
//               zoom={zoom}
//               onLocationSelect={setSelectedLocation}
//               selectedLocation={selectedLocation}
//             />
//           </div>
//         </div>
//       ) : (
//         /* List View */
//         <div className="bg-white rounded-xl shadow-soft overflow-hidden border border-gray-200">
//           <div className="p-6 border-b border-gray-200">
//             <h3 className="text-lg font-bold text-gray-900">All Locations</h3>
//             <p className="text-gray-600">{filteredLocations.length} locations found</p>
//           </div>

//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead>
//                 <tr className="bg-gray-50 border-b border-gray-200">
//                   <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Location
//                   </th>
//                   <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Type
//                   </th>
//                   <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Status
//                   </th>
//                   <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Capacity
//                   </th>
//                   <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Contact
//                   </th>
//                   <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Hours
//                   </th>
//                   <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Last Update
//                   </th>
//                   <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-200">
//                 <AnimatePresence>
//                   {filteredLocations.map((location) => {
//                     const displayStatus = getDisplayStatus(location)
//                     return (
//                       <motion.tr
//                         key={location._id}
//                         initial={{ opacity: 0 }}
//                         animate={{ opacity: 1 }}
//                         exit={{ opacity: 0 }}
//                         className="hover:bg-gray-50 transition-colors"
//                       >
//                         <td className="py-3 px-4">
//                           <div className="flex items-center space-x-3">
//                             {getStatusIcon(location.status, location.isOnline)}
//                             <div>
//                               <div className="font-medium text-gray-900">{location.name}</div>
//                               <div className="text-sm text-gray-500">{formatAddress(location)}</div>
//                             </div>
//                           </div>
//                         </td>
//                         <td className="py-3 px-4">
//                           <span className={cn(
//                             "px-3 py-1 rounded-full text-xs font-medium",
//                             location.type === 'locker' 
//                               ? "bg-purple-100 text-purple-800"
//                               : "bg-yellow-100 text-yellow-800"
//                           )}>
//                             {location.type === 'locker' ? 'Smart Locker' : 'Staffed Hub'}
//                           </span>
//                         </td>
//                         <td className="py-3 px-4">
//                           <div className="flex items-center space-x-2">
//                             <div className={`w-2 h-2 rounded-full ${getStatusColor(location.status, location.isOnline)}`} />
//                             <span className="capitalize">{displayStatus}</span>
//                           </div>
//                         </td>
//                         <td className="py-3 px-4">
//                           <div>
//                             <div className="font-medium text-gray-900">
//                               {location.parcelCount || 0}/{location.capacity || 100}
//                             </div>
//                             <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
//                               <div
//                                 className={cn(
//                                   "h-full transition-all duration-300",
//                                   calculateUtilization(location) > 90 ? "bg-red-500" :
//                                   calculateUtilization(location) > 70 ? "bg-yellow-500" : "bg-green-500"
//                                 )}
//                                 style={{ width: `${calculateUtilization(location)}%` }}
//                               />
//                             </div>
//                           </div>
//                         </td>
//                         <td className="py-3 px-4">
//                           <div>
//                             <div className="text-sm text-gray-900">{location.contact.phone}</div>
//                             {location.contact.email && (
//                               <div className="text-sm text-gray-500">{location.contact.email}</div>
//                             )}
//                           </div>
//                         </td>
//                         <td className="py-3 px-4">
//                           <div className="text-sm">
//                             {location.hours.opens} - {location.hours.closes}
//                           </div>
//                         </td>
//                         <td className="py-3 px-4 text-sm text-gray-500">
//                           {location.lastHeartbeat}
//                         </td>
//                         <td className="py-3 px-4">
//                           <div className="flex items-center space-x-2">
//                             <button
//                               title="View"
//                               className="p-1 hover:bg-gray-100 rounded transition"
//                               onClick={() => setSelectedLocation(location._id)}
//                             >
//                               <Eye className="h-4 w-4 text-gray-600" />
//                             </button>
//                             <Link href={`/dashboard/locations/${location._id}/edit`}>
//                               <button
//                                 title="Edit"
//                                 className="p-1 hover:bg-gray-100 rounded transition"
//                               >
//                                 <Edit className="h-4 w-4 text-gray-600" />
//                               </button>
//                             </Link>
//                             <button
//                               title="Delete"
//                               className="p-1 hover:bg-gray-100 rounded transition text-red-600 hover:text-red-700"
//                               onClick={async () => {
//                                 if (confirm('Are you sure you want to delete this location?')) {
//                                   try {
//                                     await locationAPI.delete(location._id)
//                                     toast.success('Location deleted successfully')
//                                     fetchLocations()
//                                   } catch (error) {
//                                     toast.error('Failed to delete location')
//                                   }
//                                 }
//                               }}
//                             >
//                               <Trash2 className="h-4 w-4" />
//                             </button>
//                           </div>
//                         </td>
//                       </motion.tr>
//                     )
//                   })}
//                 </AnimatePresence>
//               </tbody>
//             </table>
//           </div>

//           {/* Empty State */}
//           {filteredLocations.length === 0 && (
//             <div className="p-12 text-center">
//               <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//               <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
//               <p className="text-gray-600">
//                 {searchQuery || selectedType !== 'all' || selectedStatus !== 'all'
//                   ? 'Try adjusting your filters'
//                   : 'Add your first location to get started'
//                 }
//               </p>
//             </div>
//           )}
//         </div>
//       )}

//       {/* Selected Location Details */}
//       <AnimatePresence>
//         {selectedLocation && (() => {
//           const location = locations.find(l => l._id === selectedLocation)
//           if (!location) return null

//           const displayStatus = getDisplayStatus(location)

//           return (
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -20 }}
//               className="bg-white rounded-xl shadow-soft p-6 border border-gray-200"
//             >
//               <div className="flex items-start justify-between mb-6">
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-900">{location.name}</h3>
//                   <p className="text-gray-600">{formatAddress(location)}</p>
//                 </div>
//                 <button
//                   onClick={() => setSelectedLocation(null)}
//                   className="p-2 hover:bg-gray-100 rounded-lg"
//                 >
//                   ✕
//                 </button>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                 {/* Status & Info */}
//                 <div className="space-y-4">
//                   <div>
//                     <h4 className="font-medium text-gray-900 mb-2">Status</h4>
//                     <div className={cn(
//                       "px-4 py-2 rounded-lg font-medium inline-flex items-center space-x-2",
//                       displayStatus === 'online' ? "bg-green-100 text-green-800" :
//                       displayStatus === 'offline' ? "bg-red-100 text-red-800" :
//                       displayStatus === 'maintenance' ? "bg-yellow-100 text-yellow-800" : 
//                       displayStatus === 'full' ? "bg-purple-100 text-purple-800" :
//                       "bg-gray-100 text-gray-800"
//                     )}>
//                       {getStatusIcon(location.status, location.isOnline)}
//                       <span>{displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}</span>
//                     </div>
//                   </div>

//                   <div>
//                     <h4 className="font-medium text-gray-900 mb-2">Location Type</h4>
//                     <div className={cn(
//                       "px-4 py-2 rounded-lg font-medium",
//                       location.type === 'locker' 
//                         ? "bg-purple-100 text-purple-800"
//                         : "bg-yellow-100 text-yellow-800"
//                     )}>
//                       {location.type === 'locker' ? 'Smart Locker' : 'Staffed Hub'}
//                     </div>
//                   </div>

//                   <div>
//                     <h4 className="font-medium text-gray-900 mb-2">Operating Hours</h4>
//                     <div className="px-4 py-2 bg-gray-100 rounded-lg font-medium">
//                       {location.hours.opens} - {location.hours.closes} ({location.hours.timezone})
//                     </div>
//                   </div>
//                 </div>

//                 {/* Capacity */}
//                 <div className="space-y-4">
//                   <div>
//                     <h4 className="font-medium text-gray-900 mb-2">Capacity Utilization</h4>
//                     <div className="space-y-2">
//                       <div className="flex items-center justify-between">
//                         <span className="text-sm text-gray-600">Used</span>
//                         <span className="font-medium">{location.parcelCount || 0} parcels</span>
//                       </div>
//                       <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
//                         <div
//                           className={cn(
//                             "h-full transition-all duration-300",
//                             calculateUtilization(location) > 90 ? "bg-red-500" :
//                             calculateUtilization(location) > 70 ? "bg-yellow-500" : "bg-green-500"
//                           )}
//                           style={{ width: `${calculateUtilization(location)}%` }}
//                         />
//                       </div>
//                       <div className="flex items-center justify-between text-sm">
//                         <span className="text-gray-600">{calculateUtilization(location)}% full</span>
//                         <span className="text-gray-600">{location.availableCompartments || 0} available</span>
//                       </div>
//                     </div>
//                   </div>

//                   <div>
//                     <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
//                     <div className="space-y-1">
//                       <div className="flex items-center space-x-2">
//                         <span className="text-gray-600">Phone:</span>
//                         <span className="font-medium">{location.contact.phone}</span>
//                       </div>
//                       {location.contact.email && (
//                         <div className="flex items-center space-x-2">
//                           <span className="text-gray-600">Email:</span>
//                           <span className="font-medium">{location.contact.email}</span>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>

//                 {/* Technical Info */}
//                 <div className="space-y-4">
//                   <div>
//                     <h4 className="font-medium text-gray-900 mb-2">Technical Information</h4>
//                     <div className="grid grid-cols-2 gap-3">
//                       <div className="bg-gray-50 p-3 rounded">
//                         <div className="text-sm text-gray-500">Power Source</div>
//                         <div className="font-medium capitalize">{location.powerSource || 'grid'}</div>
//                       </div>
//                       {location.batteryLevel && (
//                         <div className="bg-gray-50 p-3 rounded">
//                           <div className="text-sm text-gray-500">Battery Level</div>
//                           <div className="font-medium">{location.batteryLevel}%</div>
//                         </div>
//                       )}
//                       <div className="bg-gray-50 p-3 rounded">
//                         <div className="text-sm text-gray-500">Network</div>
//                         <div className="font-medium capitalize">{location.networkStrength || 'good'}</div>
//                       </div>
//                       <div className="bg-gray-50 p-3 rounded">
//                         <div className="text-sm text-gray-500">Last Update</div>
//                         <div className="font-medium">{location.lastHeartbeat}</div>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="flex space-x-3">
//                     <Link href={`/dashboard/locations/${location._id}/edit`} className="flex-1">
//                       <button className="w-full px-4 py-2 bg-pepper-500 text-white rounded-lg hover:bg-pepper-600 transition font-medium">
//                         Edit Location
//                       </button>
//                     </Link>
//                     <Link href={`/dashboard/locations/${location._id}/analytics`}>
//                       <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">
//                         View Analytics
//                       </button>
//                     </Link>
//                   </div>
//                 </div>
//               </div>
//             </motion.div>
//           )
//         })()}
//       </AnimatePresence>
//     </div>
//   )
// }













































































// // app/dashboard/locations/page.tsx
// 'use client'

// import { useState, useEffect } from 'react'
// import { 
//   MapPin, 
//   Wifi, 
//   Battery, 
//   Package, 
//   Users, 
//   Clock, 
//   AlertCircle, 
//   CheckCircle, 
//   XCircle, 
//   RefreshCw,
//   Filter,
//   Search,
//   Layers,
//   Eye,
//   Navigation,
//   Zap,
//   Shield,
//   Plus,
//   Edit,
//   Trash2
// } from 'lucide-react'
// import { motion, AnimatePresence } from 'framer-motion'
// import { useSocket } from '@/lib/socket'
// import { toast } from 'react-hot-toast'
// import { cn } from '@/lib/utils'
// import dynamic from 'next/dynamic'

// // Dynamically import the map component (client-side only)
// const DynamicMap = dynamic(
//   () => import('@/components/map/live-map'),
//   { 
//     ssr: false,
//     loading: () => (
//       <div className="h-[500px] lg:h-[calc(100%-4rem)] bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
//         <div className="text-center">
//           <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pepper-500 mb-4"></div>
//           <p className="text-gray-600">Loading map...</p>
//         </div>
//       </div>
//     )
//   }
// )

// interface Location {
//   id: string
//   name: string
//   type: 'locker' | 'staffed_hub'
//   coordinates: {
//     lat: number
//     lng: number
//   }
//   address: string
//   status: 'online' | 'offline' | 'maintenance' | 'full'
//   parcelCount: number
//   capacity: number
//   availableCompartments: number
//   lastHeartbeat: string
//   powerSource: 'grid' | 'solar' | 'battery'
//   batteryLevel?: number
//   networkStrength: 'excellent' | 'good' | 'poor'
//   contact: {
//     phone: string
//     email?: string
//   }
//   hours: {
//     opens: string
//     closes: string
//   }
// }

// export default function LocationsPage() {
//   const socket = useSocket()
//   const [locations, setLocations] = useState<Location[]>([
//     // Lagos Locations
//     { id: '1', name: 'Ikeja City Mall', type: 'locker', coordinates: { lat: 6.6018, lng: 3.3515 }, address: 'Ikeja, Lagos', status: 'online', parcelCount: 42, capacity: 100, availableCompartments: 58, lastHeartbeat: '2 min ago', powerSource: 'grid', batteryLevel: 100, networkStrength: 'excellent', contact: { phone: '+234 800 000 0001' }, hours: { opens: '08:00', closes: '22:00' } },
//     { id: '2', name: 'Lekki Phase 1 Hub', type: 'locker', coordinates: { lat: 6.4413, lng: 3.4723 }, address: 'Lekki, Lagos', status: 'online', parcelCount: 35, capacity: 80, availableCompartments: 45, lastHeartbeat: '1 min ago', powerSource: 'solar', batteryLevel: 85, networkStrength: 'good', contact: { phone: '+234 800 000 0002' }, hours: { opens: '24/7', closes: '24/7' } },
//     { id: '3', name: 'ABC Pharmacy', type: 'staffed_hub', coordinates: { lat: 6.4281, lng: 3.4246 }, address: 'Victoria Island, Lagos', status: 'online', parcelCount: 28, capacity: 50, availableCompartments: 0, lastHeartbeat: '5 min ago', powerSource: 'grid', networkStrength: 'excellent', contact: { phone: '+234 800 000 0003', email: 'pharmacy@example.com' }, hours: { opens: '09:00', closes: '21:00' } },
//     { id: '4', name: 'Yaba Tech Hub', type: 'locker', coordinates: { lat: 6.5095, lng: 3.3711 }, address: 'Yaba, Lagos', status: 'maintenance', parcelCount: 15, capacity: 60, availableCompartments: 0, lastHeartbeat: '15 min ago', powerSource: 'battery', batteryLevel: 45, networkStrength: 'poor', contact: { phone: '+234 800 000 0004' }, hours: { opens: '24/7', closes: '24/7' } },
//     { id: '5', name: 'Surulere Supermarket', type: 'staffed_hub', coordinates: { lat: 6.5010, lng: 3.3580 }, address: 'Surulere, Lagos', status: 'online', parcelCount: 22, capacity: 40, availableCompartments: 0, lastHeartbeat: '3 min ago', powerSource: 'grid', networkStrength: 'good', contact: { phone: '+234 800 000 0005' }, hours: { opens: '08:00', closes: '20:00' } },
//     { id: '6', name: 'Apapa Port', type: 'locker', coordinates: { lat: 6.4391, lng: 3.3585 }, address: 'Apapa, Lagos', status: 'full', parcelCount: 60, capacity: 60, availableCompartments: 0, lastHeartbeat: '30 sec ago', powerSource: 'grid', batteryLevel: 95, networkStrength: 'excellent', contact: { phone: '+234 800 000 0006' }, hours: { opens: '24/7', closes: '24/7' } },
//     { id: '7', name: 'Ajah Express', type: 'locker', coordinates: { lat: 6.4685, lng: 3.6006 }, address: 'Ajah, Lagos', status: 'offline', parcelCount: 0, capacity: 50, availableCompartments: 50, lastHeartbeat: '1 hour ago', powerSource: 'solar', batteryLevel: 20, networkStrength: 'poor', contact: { phone: '+234 800 000 0007' }, hours: { opens: '24/7', closes: '24/7' } },
//     { id: '8', name: 'Ojota Park', type: 'staffed_hub', coordinates: { lat: 6.5877, lng: 3.3740 }, address: 'Ojota, Lagos', status: 'online', parcelCount: 18, capacity: 30, availableCompartments: 0, lastHeartbeat: '10 min ago', powerSource: 'grid', networkStrength: 'good', contact: { phone: '+234 800 000 0008' }, hours: { opens: '07:00', closes: '19:00' } },
//   ])
//   const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
//   const [selectedType, setSelectedType] = useState<'all' | 'locker' | 'staffed_hub'>('all')
//   const [selectedStatus, setSelectedStatus] = useState<'all' | 'online' | 'offline' | 'maintenance' | 'full'>('all')
//   const [searchQuery, setSearchQuery] = useState('')
//   const [isLoading, setIsLoading] = useState(false)
//   const [viewMode, setViewMode] = useState<'map' | 'list'>('list')
//   const [center] = useState<[number, number]>([6.5244, 3.3792]) // Lagos center
//   const [zoom] = useState(12)

//   // Filter locations based on selections
//   const filteredLocations = locations.filter(location => {
//     const matchesType = selectedType === 'all' || location.type === selectedType
//     const matchesStatus = selectedStatus === 'all' || location.status === selectedStatus
//     const matchesSearch = searchQuery === '' || 
//       location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       location.address.toLowerCase().includes(searchQuery.toLowerCase())
//     return matchesType && matchesStatus && matchesSearch
//   })

//   // Handle socket updates
//   useEffect(() => {
//     if (!socket) return

//     socket.on('locker-status-update', (update: any) => {
//       setLocations(prev => prev.map(loc => 
//         loc.id === update.locationId 
//           ? { ...loc, ...update.data, lastHeartbeat: 'Just now' }
//           : loc
//       ))
//     })

//     return () => {
//       socket.off('locker-status-update')
//     }
//   }, [socket])

//   const refreshLocations = async () => {
//     setIsLoading(true)
//     // Simulate API call
//     setTimeout(() => {
//       setLocations(prev => prev.map(loc => ({
//         ...loc,
//         lastHeartbeat: 'Just now',
//         parcelCount: Math.max(0, Math.floor(Math.random() * 20) + loc.parcelCount - 10),
//         availableCompartments: Math.max(0, Math.floor(Math.random() * 10) + loc.availableCompartments - 5)
//       })))
//       setIsLoading(false)
//       toast.success('Location data refreshed')
//     }, 1000)
//   }

//   const getStatusIcon = (status: Location['status']) => {
//     switch (status) {
//       case 'online': return <CheckCircle className="h-4 w-4 text-green-500" />
//       case 'offline': return <XCircle className="h-4 w-4 text-red-500" />
//       case 'maintenance': return <AlertCircle className="h-4 w-4 text-yellow-500" />
//       case 'full': return <Package className="h-4 w-4 text-purple-500" />
//     }
//   }

//   const getStatusColor = (status: Location['status']) => {
//     switch (status) {
//       case 'online': return 'bg-green-500'
//       case 'offline': return 'bg-red-500'
//       case 'maintenance': return 'bg-yellow-500'
//       case 'full': return 'bg-purple-500'
//     }
//   }

//   const calculateUtilization = (location: Location) => {
//     return Math.round((location.parcelCount / location.capacity) * 100)
//   }

//   const stats = {
//     totalLocations: locations.length,
//     onlineLocations: locations.filter(l => l.status === 'online').length,
//     totalParcels: locations.reduce((sum, loc) => sum + loc.parcelCount, 0),
//     availableCapacity: locations.reduce((sum, loc) => sum + loc.availableCompartments, 0),
//     lockers: locations.filter(l => l.type === 'locker').length,
//     hubs: locations.filter(l => l.type === 'staffed_hub').length,
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Network Locations</h1>
//           <p className="text-gray-600">Manage all locker and hub locations</p>
//         </div>

//         <div className="flex items-center space-x-3">
//           <button
//             onClick={refreshLocations}
//             className="p-2 hover:bg-gray-100 rounded-lg transition"
//             title="Refresh"
//           >
//             <RefreshCw className={cn("h-5 w-5 text-gray-600", isLoading && "animate-spin")} />
//           </button>

//           <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
//             <button
//               onClick={() => setViewMode('map')}
//               className={cn(
//                 "px-3 py-1.5 rounded text-sm font-medium transition",
//                 viewMode === 'map' ? "bg-white shadow-sm text-pepper-600" : "text-gray-600 hover:text-gray-900"
//               )}
//             >
//               Map View
//             </button>
//             <button
//               onClick={() => setViewMode('list')}
//               className={cn(
//                 "px-3 py-1.5 rounded text-sm font-medium transition",
//                 viewMode === 'list' ? "bg-white shadow-sm text-pepper-600" : "text-gray-600 hover:text-gray-900"
//               )}
//             >
//               List View
//             </button>
//           </div>

//           <a
//             href="/dashboard/locations/new"
//             className="px-4 py-2 pepper-gradient text-white rounded-lg hover:shadow-lg transition flex items-center space-x-2"
//           >
//             <Plus className="h-4 w-4" />
//             <span>Add Location</span>
//           </a>
//         </div>
//       </div>

//       {/* Stats Bar */}
//       <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
//         {[
//           { label: 'Total Locations', value: stats.totalLocations, icon: MapPin, color: 'bg-blue-500' },
//           { label: 'Online Now', value: stats.onlineLocations, icon: CheckCircle, color: 'bg-green-500' },
//           { label: 'Smart Lockers', value: stats.lockers, icon: Zap, color: 'bg-purple-500' },
//           { label: 'Staffed Hubs', value: stats.hubs, icon: Users, color: 'bg-yellow-500' },
//           { label: 'Active Parcels', value: stats.totalParcels, icon: Package, color: 'bg-cyan-500' },
//           { label: 'Available Space', value: stats.availableCapacity, icon: Shield, color: 'bg-emerald-500' },
//         ].map((stat, index) => {
//           const Icon = stat.icon
//           return (
//             <motion.div
//               key={stat.label}
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: index * 0.1 }}
//               className="bg-white rounded-xl shadow-soft p-4 border border-gray-200"
//             >
//               <div className="flex items-center justify-between">
//                 <div>
//                   <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
//                   <div className="text-sm text-gray-500">{stat.label}</div>
//                 </div>
//                 <div className={`p-2 ${stat.color} rounded-lg`}>
//                   <Icon className="h-5 w-5 text-white" />
//                 </div>
//               </div>
//             </motion.div>
//           )
//         })}
//       </div>

//       {/* Filters & Search */}
//       <div className="bg-white rounded-xl shadow-soft p-4 border border-gray-200">
//         <div className="flex flex-col md:flex-row gap-4">
//           {/* Search */}
//           <div className="flex-1">
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//               <input
//                 type="text"
//                 placeholder="Search locations by name or address..."
//                 className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20 focus:outline-none transition"
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//               />
//             </div>
//           </div>

//           <div className="flex items-center space-x-4">
//             <div className="flex items-center space-x-2">
//               <Filter className="h-5 w-5 text-gray-500" />
//               <select
//                 className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20 focus:outline-none transition"
//                 value={selectedType}
//                 onChange={(e) => setSelectedType(e.target.value as any)}
//               >
//                 <option value="all">All Types</option>
//                 <option value="locker">Smart Lockers</option>
//                 <option value="staffed_hub">Staffed Hubs</option>
//               </select>
//             </div>

//             <select
//               className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20 focus:outline-none transition"
//               value={selectedStatus}
//               onChange={(e) => setSelectedStatus(e.target.value as any)}
//             >
//               <option value="all">All Status</option>
//               <option value="online">Online</option>
//               <option value="offline">Offline</option>
//               <option value="maintenance">Maintenance</option>
//               <option value="full">Full</option>
//             </select>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       {viewMode === 'map' ? (
//         /* Map View */
//         <div className="bg-white rounded-xl shadow-soft overflow-hidden border border-gray-200">
//           <div className="p-4 border-b border-gray-200">
//             <h3 className="font-bold text-gray-900">Network Map View</h3>
//             <p className="text-gray-600 text-sm">Click on markers for location details</p>
//           </div>
//           <div className="h-[600px]">
//             <DynamicMap
//               locations={filteredLocations}
//               center={center}
//               zoom={zoom}
//               onLocationSelect={setSelectedLocation}
//               selectedLocation={selectedLocation}
//             />
//           </div>
//         </div>
//       ) : (
//         /* List View */
//         <div className="bg-white rounded-xl shadow-soft overflow-hidden border border-gray-200">
//           <div className="p-6 border-b border-gray-200">
//             <h3 className="text-lg font-bold text-gray-900">All Locations</h3>
//             <p className="text-gray-600">{filteredLocations.length} locations found</p>
//           </div>

//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead>
//                 <tr className="bg-gray-50 border-b border-gray-200">
//                   <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Location
//                   </th>
//                   <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Type
//                   </th>
//                   <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Status
//                   </th>
//                   <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Capacity
//                   </th>
//                   <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Contact
//                   </th>
//                   <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Hours
//                   </th>
//                   <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Last Update
//                   </th>
//                   <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-200">
//                 <AnimatePresence>
//                   {filteredLocations.map((location) => (
//                     <motion.tr
//                       key={location.id}
//                       initial={{ opacity: 0 }}
//                       animate={{ opacity: 1 }}
//                       exit={{ opacity: 0 }}
//                       className="hover:bg-gray-50 transition-colors"
//                     >
//                       <td className="py-3 px-4">
//                         <div className="flex items-center space-x-3">
//                           {getStatusIcon(location.status)}
//                           <div>
//                             <div className="font-medium text-gray-900">{location.name}</div>
//                             <div className="text-sm text-gray-500">{location.address}</div>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="py-3 px-4">
//                         <span className={cn(
//                           "px-3 py-1 rounded-full text-xs font-medium",
//                           location.type === 'locker' 
//                             ? "bg-purple-100 text-purple-800"
//                             : "bg-yellow-100 text-yellow-800"
//                         )}>
//                           {location.type === 'locker' ? 'Smart Locker' : 'Staffed Hub'}
//                         </span>
//                       </td>
//                       <td className="py-3 px-4">
//                         <div className="flex items-center space-x-2">
//                           <div className={`w-2 h-2 rounded-full ${getStatusColor(location.status)}`} />
//                           <span className="capitalize">{location.status}</span>
//                         </div>
//                       </td>
//                       <td className="py-3 px-4">
//                         <div>
//                           <div className="font-medium text-gray-900">
//                             {location.parcelCount}/{location.capacity}
//                           </div>
//                           <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
//                             <div
//                               className={cn(
//                                 "h-full transition-all duration-300",
//                                 calculateUtilization(location) > 90 ? "bg-red-500" :
//                                 calculateUtilization(location) > 70 ? "bg-yellow-500" : "bg-green-500"
//                               )}
//                               style={{ width: `${calculateUtilization(location)}%` }}
//                             />
//                           </div>
//                         </div>
//                       </td>
//                       <td className="py-3 px-4">
//                         <div>
//                           <div className="text-sm text-gray-900">{location.contact.phone}</div>
//                           {location.contact.email && (
//                             <div className="text-sm text-gray-500">{location.contact.email}</div>
//                           )}
//                         </div>
//                       </td>
//                       <td className="py-3 px-4">
//                         <div className="text-sm">
//                           {location.hours.opens} - {location.hours.closes}
//                         </div>
//                       </td>
//                       <td className="py-3 px-4 text-sm text-gray-500">
//                         {location.lastHeartbeat}
//                       </td>
//                       <td className="py-3 px-4">
//                         <div className="flex items-center space-x-2">
//                           <button
//                             title="View"
//                             className="p-1 hover:bg-gray-100 rounded transition"
//                             onClick={() => setSelectedLocation(location.id)}
//                           >
//                             <Eye className="h-4 w-4 text-gray-600" />
//                           </button>
//                           <button
//                             title="Edit"
//                             className="p-1 hover:bg-gray-100 rounded transition"
//                           >
//                             <Edit className="h-4 w-4 text-gray-600" />
//                           </button>
//                           <button
//                             title="Delete"
//                             className="p-1 hover:bg-gray-100 rounded transition text-red-600 hover:text-red-700"
//                           >
//                             <Trash2 className="h-4 w-4" />
//                           </button>
//                         </div>
//                       </td>
//                     </motion.tr>
//                   ))}
//                 </AnimatePresence>
//               </tbody>
//             </table>
//           </div>

//           {/* Empty State */}
//           {filteredLocations.length === 0 && (
//             <div className="p-12 text-center">
//               <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//               <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
//               <p className="text-gray-600">
//                 {searchQuery || selectedType !== 'all' || selectedStatus !== 'all'
//                   ? 'Try adjusting your filters'
//                   : 'Add your first location to get started'
//                 }
//               </p>
//             </div>
//           )}
//         </div>
//       )}

//       {/* Selected Location Details */}
//       <AnimatePresence>
//         {selectedLocation && (() => {
//           const location = locations.find(l => l.id === selectedLocation)
//           if (!location) return null

//           return (
//             <motion.div
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -20 }}
//               className="bg-white rounded-xl shadow-soft p-6 border border-gray-200"
//             >
//               <div className="flex items-start justify-between mb-6">
//                 <div>
//                   <h3 className="text-xl font-bold text-gray-900">{location.name}</h3>
//                   <p className="text-gray-600">{location.address}</p>
//                 </div>
//                 <button
//                   onClick={() => setSelectedLocation(null)}
//                   className="p-2 hover:bg-gray-100 rounded-lg"
//                 >
//                   ✕
//                 </button>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                 {/* Status & Info */}
//                 <div className="space-y-4">
//                   <div>
//                     <h4 className="font-medium text-gray-900 mb-2">Status</h4>
//                     <div className={cn(
//                       "px-4 py-2 rounded-lg font-medium inline-flex items-center space-x-2",
//                       location.status === 'online' ? "bg-green-100 text-green-800" :
//                       location.status === 'offline' ? "bg-red-100 text-red-800" :
//                       location.status === 'maintenance' ? "bg-yellow-100 text-yellow-800" : "bg-purple-100 text-purple-800"
//                     )}>
//                       {getStatusIcon(location.status)}
//                       <span>{location.status.charAt(0).toUpperCase() + location.status.slice(1)}</span>
//                     </div>
//                   </div>

//                   <div>
//                     <h4 className="font-medium text-gray-900 mb-2">Location Type</h4>
//                     <div className={cn(
//                       "px-4 py-2 rounded-lg font-medium",
//                       location.type === 'locker' 
//                         ? "bg-purple-100 text-purple-800"
//                         : "bg-yellow-100 text-yellow-800"
//                     )}>
//                       {location.type === 'locker' ? 'Smart Locker' : 'Staffed Hub'}
//                     </div>
//                   </div>

//                   <div>
//                     <h4 className="font-medium text-gray-900 mb-2">Operating Hours</h4>
//                     <div className="px-4 py-2 bg-gray-100 rounded-lg font-medium">
//                       {location.hours.opens} - {location.hours.closes}
//                     </div>
//                   </div>
//                 </div>

//                 {/* Capacity */}
//                 <div className="space-y-4">
//                   <div>
//                     <h4 className="font-medium text-gray-900 mb-2">Capacity Utilization</h4>
//                     <div className="space-y-2">
//                       <div className="flex items-center justify-between">
//                         <span className="text-sm text-gray-600">Used</span>
//                         <span className="font-medium">{location.parcelCount} parcels</span>
//                       </div>
//                       <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
//                         <div
//                           className={cn(
//                             "h-full transition-all duration-300",
//                             calculateUtilization(location) > 90 ? "bg-red-500" :
//                             calculateUtilization(location) > 70 ? "bg-yellow-500" : "bg-green-500"
//                           )}
//                           style={{ width: `${calculateUtilization(location)}%` }}
//                         />
//                       </div>
//                       <div className="flex items-center justify-between text-sm">
//                         <span className="text-gray-600">{calculateUtilization(location)}% full</span>
//                         <span className="text-gray-600">{location.availableCompartments} available</span>
//                       </div>
//                     </div>
//                   </div>

//                   <div>
//                     <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
//                     <div className="space-y-1">
//                       <div className="flex items-center space-x-2">
//                         <span className="text-gray-600">Phone:</span>
//                         <span className="font-medium">{location.contact.phone}</span>
//                       </div>
//                       {location.contact.email && (
//                         <div className="flex items-center space-x-2">
//                           <span className="text-gray-600">Email:</span>
//                           <span className="font-medium">{location.contact.email}</span>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>

//                 {/* Technical Info */}
//                 <div className="space-y-4">
//                   <div>
//                     <h4 className="font-medium text-gray-900 mb-2">Technical Information</h4>
//                     <div className="grid grid-cols-2 gap-3">
//                       <div className="bg-gray-50 p-3 rounded">
//                         <div className="text-sm text-gray-500">Power Source</div>
//                         <div className="font-medium capitalize">{location.powerSource}</div>
//                       </div>
//                       {location.batteryLevel && (
//                         <div className="bg-gray-50 p-3 rounded">
//                           <div className="text-sm text-gray-500">Battery Level</div>
//                           <div className="font-medium">{location.batteryLevel}%</div>
//                         </div>
//                       )}
//                       <div className="bg-gray-50 p-3 rounded">
//                         <div className="text-sm text-gray-500">Network</div>
//                         <div className="font-medium capitalize">{location.networkStrength}</div>
//                       </div>
//                       <div className="bg-gray-50 p-3 rounded">
//                         <div className="text-sm text-gray-500">Last Update</div>
//                         <div className="font-medium">{location.lastHeartbeat}</div>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="flex space-x-3">
//                     <button className="flex-1 px-4 py-2 bg-pepper-500 text-white rounded-lg hover:bg-pepper-600 transition font-medium">
//                       Edit Location
//                     </button>
//                     <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">
//                       View Analytics
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </motion.div>
//           )
//         })()}
//       </AnimatePresence>
//     </div>
//   )
// }






























































































// app/dashboard/map/page.tsx
// 'use client'

// import { useState, useEffect, useCallback } from 'react'
// import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, Tooltip } from 'react-leaflet'
// import { Icon } from 'leaflet'
// import 'leaflet/dist/leaflet.css'
// import {
//   MapPin,
//   Wifi,
//   Battery,
//   Package,
//   Users,
//   Clock,
//   AlertCircle,
//   CheckCircle,
//   XCircle,
//   RefreshCw,
//   Filter,
//   Search,
//   Layers,
//   Eye,
//   Navigation,
//   Zap,
//   Shield
// } from 'lucide-react'
// import { motion, AnimatePresence } from 'framer-motion'
// import { useSocket } from '@/lib/socket'
// import { toast } from 'react-hot-toast'
// import { cn } from '@/lib/utils'

// // Fix for default markers in Next.js
// import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
// import markerIcon from 'leaflet/dist/images/marker-icon.png'
// import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// @ts-ignore
// delete Icon.Default.prototype._getIconUrl
// Icon.Default.mergeOptions({
//   iconRetinaUrl: markerIcon2x.src,
//   iconUrl: markerIcon.src,
//   shadowUrl: markerShadow.src,
// })

// interface Location {
//   id: string
//   name: string
//   type: 'locker' | 'staffed_hub'
//   coordinates: {
//     lat: number
//     lng: number
//   }
//   address: string
//   status: 'online' | 'offline' | 'maintenance' | 'full'
//   parcelCount: number
//   capacity: number
//   availableCompartments: number
//   lastHeartbeat: string
//   powerSource: 'grid' | 'solar' | 'battery'
//   batteryLevel?: number
//   networkStrength: 'excellent' | 'good' | 'poor'
// }

// interface Parcel {
//   id: string
//   trackingNumber: string
//   locationId: string
//   status: string
//   coordinates?: {
//     lat: number
//     lng: number
//   }
// }

// const initialLocations: Location[] = [
//   // Lagos Locations
//   { id: '1', name: 'Ikeja City Mall', type: 'locker', coordinates: { lat: 6.6018, lng: 3.3515 }, address: 'Ikeja, Lagos', status: 'online', parcelCount: 42, capacity: 100, availableCompartments: 58, lastHeartbeat: '2 min ago', powerSource: 'grid', batteryLevel: 100, networkStrength: 'excellent' },
//   { id: '2', name: 'Lekki Phase 1 Hub', type: 'locker', coordinates: { lat: 6.4413, lng: 3.4723 }, address: 'Lekki, Lagos', status: 'online', parcelCount: 35, capacity: 80, availableCompartments: 45, lastHeartbeat: '1 min ago', powerSource: 'solar', batteryLevel: 85, networkStrength: 'good' },
//   { id: '3', name: 'ABC Pharmacy', type: 'staffed_hub', coordinates: { lat: 6.4281, lng: 3.4246 }, address: 'Victoria Island, Lagos', status: 'online', parcelCount: 28, capacity: 50, availableCompartments: 0, lastHeartbeat: '5 min ago', powerSource: 'grid', networkStrength: 'excellent' },
//   { id: '4', name: 'Yaba Tech Hub', type: 'locker', coordinates: { lat: 6.5095, lng: 3.3711 }, address: 'Yaba, Lagos', status: 'maintenance', parcelCount: 15, capacity: 60, availableCompartments: 0, lastHeartbeat: '15 min ago', powerSource: 'battery', batteryLevel: 45, networkStrength: 'poor' },
//   { id: '5', name: 'Surulere Supermarket', type: 'staffed_hub', coordinates: { lat: 6.5010, lng: 3.3580 }, address: 'Surulere, Lagos', status: 'online', parcelCount: 22, capacity: 40, availableCompartments: 0, lastHeartbeat: '3 min ago', powerSource: 'grid', networkStrength: 'good' },
//   { id: '6', name: 'Apapa Port', type: 'locker', coordinates: { lat: 6.4391, lng: 3.3585 }, address: 'Apapa, Lagos', status: 'full', parcelCount: 60, capacity: 60, availableCompartments: 0, lastHeartbeat: '30 sec ago', powerSource: 'grid', batteryLevel: 95, networkStrength: 'excellent' },
//   { id: '7', name: 'Ajah Express', type: 'locker', coordinates: { lat: 6.4685, lng: 3.6006 }, address: 'Ajah, Lagos', status: 'offline', parcelCount: 0, capacity: 50, availableCompartments: 50, lastHeartbeat: '1 hour ago', powerSource: 'solar', batteryLevel: 20, networkStrength: 'poor' },
//   { id: '8', name: 'Ojota Park', type: 'staffed_hub', coordinates: { lat: 6.5877, lng: 3.3740 }, address: 'Ojota, Lagos', status: 'online', parcelCount: 18, capacity: 30, availableCompartments: 0, lastHeartbeat: '10 min ago', powerSource: 'grid', networkStrength: 'good' },
// ]

// const mockParcels: Parcel[] = [
//   { id: '1', trackingNumber: 'LKR-4892', locationId: '1', status: 'at_location' },
//   { id: '2', trackingNumber: 'LKR-4893', locationId: '2', status: 'ready_for_pickup' },
//   { id: '3', trackingNumber: 'LKR-4894', locationId: '3', status: 'picked_up' },
//   { id: '4', trackingNumber: 'LKR-4895', locationId: '4', status: 'in_transit' },
// ]

// export default function LiveMapPage() {
//   const socket = useSocket()
//   const [locations, setLocations] = useState<Location[]>(initialLocations)
//   const [parcels, setParcels] = useState<Parcel[]>(mockParcels)
//   const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
//   const [selectedType, setSelectedType] = useState<'all' | 'locker' | 'staffed_hub'>('all')
//   const [selectedStatus, setSelectedStatus] = useState<'all' | 'online' | 'offline' | 'maintenance' | 'full'>('all')
//   const [searchQuery, setSearchQuery] = useState('')
//   const [isLoading, setIsLoading] = useState(false)
//   const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
//   const [center, setCenter] = useState<[number, number]>([6.5244, 3.3792]) // Lagos center
//   const [zoom, setZoom] = useState(12)

//   // Filter locations based on selections
//   const filteredLocations = locations.filter(location => {
//     const matchesType = selectedType === 'all' || location.type === selectedType
//     const matchesStatus = selectedStatus === 'all' || location.status === selectedStatus
//     const matchesSearch = searchQuery === '' || 
//       location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       location.address.toLowerCase().includes(searchQuery.toLowerCase())
//     return matchesType && matchesStatus && matchesSearch
//   })

//   // Handle socket updates
//   useEffect(() => {
//     if (!socket) return

//     socket.on('locker-status-update', (update: any) => {
//       setLocations(prev => prev.map(loc => 
//         loc.id === update.locationId 
//           ? { ...loc, ...update.data, lastHeartbeat: 'Just now' }
//           : loc
//       ))
//     })

//     socket.on('parcel-updated', (update: any) => {
//       setParcels(prev => prev.map(p => 
//         p.id === update.parcelId 
//           ? { ...p, status: update.status, locationId: update.locationId }
//           : p
//       ))
//     })

//     return () => {
//       socket.off('locker-status-update')
//       socket.off('parcel-updated')
//     }
//   }, [socket])

//   const refreshLocations = async () => {
//     setIsLoading(true)
//     // Simulate API call
//     setTimeout(() => {
//       setLocations(prev => prev.map(loc => ({
//         ...loc,
//         lastHeartbeat: 'Just now',
//         parcelCount: Math.floor(Math.random() * 20) + loc.parcelCount - 10,
//         availableCompartments: Math.max(0, Math.floor(Math.random() * 10) + loc.availableCompartments - 5)
//       })))
//       setIsLoading(false)
//       toast.success('Location data refreshed')
//     }, 1000)
//   }

//   const getStatusIcon = (status: Location['status']) => {
//     switch (status) {
//       case 'online': return <CheckCircle className="h-4 w-4 text-green-500" />
//       case 'offline': return <XCircle className="h-4 w-4 text-red-500" />
//       case 'maintenance': return <AlertCircle className="h-4 w-4 text-yellow-500" />
//       case 'full': return <Package className="h-4 w-4 text-purple-500" />
//     }
//   }

//   const getStatusColor = (status: Location['status']) => {
//     switch (status) {
//       case 'online': return 'bg-green-500'
//       case 'offline': return 'bg-red-500'
//       case 'maintenance': return 'bg-yellow-500'
//       case 'full': return 'bg-purple-500'
//     }
//   }

//   const getMarkerIcon = (location: Location) => {
//     const size = 40
//     const color = location.status === 'online' ? '#10b981' : 
//                   location.status === 'offline' ? '#ef4444' :
//                   location.status === 'maintenance' ? '#f59e0b' : '#8b5cf6'
    
//     const svg = `
//       <svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
//         <circle cx="50" cy="50" r="40" fill="${color}" fill-opacity="0.8" stroke="white" stroke-width="4"/>
//         ${location.type === 'locker' 
//           ? '<rect x="30" y="30" width="40" height="40" fill="white" stroke="white" stroke-width="2"/>' 
//           : '<circle cx="50" cy="50" r="20" fill="white" stroke="white" stroke-width="2"/>'
//         }
//         <text x="50" y="60" text-anchor="middle" fill="${color}" font-size="24" font-weight="bold">${location.parcelCount}</text>
//       </svg>
//     `
    
//     return new Icon({
//       iconUrl: 'data:image/svg+xml;base64,' + btoa(svg),
//       iconSize: [size, size],
//       iconAnchor: [size/2, size/2],
//       popupAnchor: [0, -size/2]
//     })
//   }

//   const getNetworkIcon = (strength: Location['networkStrength']) => {
//     switch (strength) {
//       case 'excellent': return <Wifi className="h-4 w-4 text-green-500" />
//       case 'good': return <Wifi className="h-4 w-4 text-yellow-500" />
//       case 'poor': return <Wifi className="h-4 w-4 text-red-500" />
//     }
//   }

//   const handleLocationClick = (locationId: string) => {
//     setSelectedLocation(locationId === selectedLocation ? null : locationId)
//     const location = locations.find(l => l.id === locationId)
//     if (location) {
//       setCenter([location.coordinates.lat, location.coordinates.lng])
//       setZoom(15)
//     }
//   }

//   const calculateUtilization = (location: Location) => {
//     return Math.round((location.parcelCount / location.capacity) * 100)
//   }

//   const stats = {
//     totalLocations: locations.length,
//     onlineLocations: locations.filter(l => l.status === 'online').length,
//     totalParcels: locations.reduce((sum, loc) => sum + loc.parcelCount, 0),
//     availableCapacity: locations.reduce((sum, loc) => sum + loc.availableCompartments, 0),
//   }

//   return (
//     <div className="h-[calc(100vh-8rem)] flex flex-col">
//       {/* Header */}
//       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Live Network Map</h1>
//           <p className="text-gray-600">Real-time status of all locker locations</p>
//         </div>

//         <div className="flex items-center space-x-3">
//           <div className="flex items-center space-x-2">
//             <div className="flex items-center space-x-1">
//               <div className="w-3 h-3 bg-green-500 rounded-full"></div>
//               <span className="text-sm text-gray-600">Online</span>
//             </div>
//             <div className="flex items-center space-x-1">
//               <div className="w-3 h-3 bg-red-500 rounded-full"></div>
//               <span className="text-sm text-gray-600">Offline</span>
//             </div>
//             <div className="flex items-center space-x-1">
//               <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
//               <span className="text-sm text-gray-600">Maintenance</span>
//             </div>
//           </div>

//           <button
//             onClick={refreshLocations}
//             className="p-2 hover:bg-gray-100 rounded-lg transition"
//             title="Refresh"
//           >
//             <RefreshCw className={cn("h-5 w-5 text-gray-600", isLoading && "animate-spin")} />
//           </button>

//           <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
//             <button
//               onClick={() => setViewMode('map')}
//               className={cn(
//                 "px-3 py-1.5 rounded text-sm font-medium transition",
//                 viewMode === 'map' ? "bg-white shadow-sm text-pepper-600" : "text-gray-600 hover:text-gray-900"
//               )}
//             >
//               Map
//             </button>
//             <button
//               onClick={() => setViewMode('list')}
//               className={cn(
//                 "px-3 py-1.5 rounded text-sm font-medium transition",
//                 viewMode === 'list' ? "bg-white shadow-sm text-pepper-600" : "text-gray-600 hover:text-gray-900"
//               )}
//             >
//               List
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Stats Bar */}
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
//         {[
//           { label: 'Total Locations', value: stats.totalLocations, icon: MapPin, color: 'bg-blue-500' },
//           { label: 'Online Now', value: stats.onlineLocations, icon: CheckCircle, color: 'bg-green-500' },
//           { label: 'Active Parcels', value: stats.totalParcels, icon: Package, color: 'bg-purple-500' },
//           { label: 'Available Capacity', value: stats.availableCapacity, icon: Shield, color: 'bg-cyan-500' },
//         ].map((stat, index) => {
//           const Icon = stat.icon
//           return (
//             <motion.div
//               key={stat.label}
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: index * 0.1 }}
//               className="bg-white rounded-xl shadow-soft p-4 border border-gray-200"
//             >
//               <div className="flex items-center justify-between">
//                 <div>
//                   <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
//                   <div className="text-sm text-gray-500">{stat.label}</div>
//                 </div>
//                 <div className={`p-2 ${stat.color} rounded-lg`}>
//                   <Icon className="h-5 w-5 text-white" />
//                 </div>
//               </div>
//             </motion.div>
//           )
//         })}
//       </div>

//       {/* Main Content */}
//       <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* Map Container */}
//         <div className="lg:col-span-2">
//           <div className="bg-white rounded-xl shadow-soft overflow-hidden border border-gray-200 h-full">
//             <div className="p-4 border-b border-gray-200 flex items-center justify-between">
//               <div className="flex items-center space-x-4">
//                 <Filter className="h-5 w-5 text-gray-500" />
//                 <select
//                   value={selectedType}
//                   onChange={(e) => setSelectedType(e.target.value as any)}
//                   className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20 text-sm"
//                 >
//                   <option value="all">All Types</option>
//                   <option value="locker">Smart Lockers</option>
//                   <option value="staffed_hub">Staffed Hubs</option>
//                 </select>
//                 <select
//                   value={selectedStatus}
//                   onChange={(e) => setSelectedStatus(e.target.value as any)}
//                   className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20 text-sm"
//                 >
//                   <option value="all">All Status</option>
//                   <option value="online">Online</option>
//                   <option value="offline">Offline</option>
//                   <option value="maintenance">Maintenance</option>
//                   <option value="full">Full</option>
//                 </select>
//               </div>
              
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//                 <input
//                   type="text"
//                   placeholder="Search locations..."
//                   className="pl-9 pr-4 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20 text-sm w-48"
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                 />
//               </div>
//             </div>

//             <div className="h-[500px] lg:h-[calc(100%-4rem)] relative">
//               {viewMode === 'map' ? (
//                 <>
//                   <MapContainer
//                     center={center}
//                     zoom={zoom}
//                     className="h-full w-full rounded-b-xl z-0"
//                     scrollWheelZoom={true}
//                   >
//                     <TileLayer
//                       attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//                       url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//                     />
                    
//                     {/* Coverage Areas */}
//                     <Circle
//                       center={[6.5244, 3.3792]}
//                       radius={5000}
//                       pathOptions={{ fillColor: '#ff0000', color: '#ff0000', fillOpacity: 0.1 }}
//                     />

//                     {/* Location Markers */}
//                     {filteredLocations.map(location => (
//                       <Marker
//                         key={location.id}
//                         position={[location.coordinates.lat, location.coordinates.lng]}
//                         icon={getMarkerIcon(location)}
//                         eventHandlers={{
//                           click: () => handleLocationClick(location.id),
//                         }}
//                       >
//                         <Popup>
//                           <div className="p-2">
//                             <h3 className="font-bold text-gray-900">{location.name}</h3>
//                             <p className="text-sm text-gray-600">{location.address}</p>
//                             <div className="mt-2 space-y-1">
//                               <div className="flex items-center justify-between">
//                                 <span className="text-sm text-gray-500">Type:</span>
//                                 <span className="text-sm font-medium">{location.type === 'locker' ? 'Smart Locker' : 'Staffed Hub'}</span>
//                               </div>
//                               <div className="flex items-center justify-between">
//                                 <span className="text-sm text-gray-500">Status:</span>
//                                 <span className={cn("text-sm font-medium", 
//                                   location.status === 'online' ? 'text-green-600' :
//                                   location.status === 'offline' ? 'text-red-600' :
//                                   location.status === 'maintenance' ? 'text-yellow-600' : 'text-purple-600'
//                                 )}>
//                                   {location.status.charAt(0).toUpperCase() + location.status.slice(1)}
//                                 </span>
//                               </div>
//                               <div className="flex items-center justify-between">
//                                 <span className="text-sm text-gray-500">Parcels:</span>
//                                 <span className="text-sm font-medium">{location.parcelCount}/{location.capacity}</span>
//                               </div>
//                               <div className="flex items-center justify-between">
//                                 <span className="text-sm text-gray-500">Available:</span>
//                                 <span className="text-sm font-medium">{location.availableCompartments}</span>
//                               </div>
//                             </div>
//                           </div>
//                         </Popup>
//                       </Marker>
//                     ))}

//                     {/* Parcel Movement Lines (simulated) */}
//                     {parcels
//                       .filter(p => p.status === 'in_transit')
//                       .map(parcel => {
//                         const fromLocation = locations[Math.floor(Math.random() * locations.length)]
//                         const toLocation = locations[Math.floor(Math.random() * locations.length)]
                        
//                         if (fromLocation && toLocation && fromLocation.id !== toLocation.id) {
//                           return (
//                             <Polyline
//                               key={parcel.id}
//                               positions={[
//                                 [fromLocation.coordinates.lat, fromLocation.coordinates.lng],
//                                 [toLocation.coordinates.lat, toLocation.coordinates.lng]
//                               ]}
//                               pathOptions={{ color: '#ff0000', dashArray: '10, 10', weight: 2 }}
//                             />
//                           )
//                         }
//                         return null
//                       })
//                       .filter(Boolean)}
//                   </MapContainer>

//                   {/* Map Controls */}
//                   <div className="absolute top-4 right-4 flex flex-col space-y-2">
//                     <button
//                       onClick={() => setCenter([6.5244, 3.3792])}
//                       className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition"
//                       title="Reset View"
//                     >
//                       <Navigation className="h-5 w-5 text-gray-700" />
//                     </button>
//                     <button
//                       onClick={() => setZoom(z => z + 1)}
//                       className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition"
//                       title="Zoom In"
//                     >
//                       <PlusIcon />
//                     </button>
//                     <button
//                       onClick={() => setZoom(z => Math.max(8, z - 1))}
//                       className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition"
//                       title="Zoom Out"
//                     >
//                       <MinusIcon />
//                     </button>
//                   </div>
//                 </>
//               ) : (
//                 /* List View */
//                 <div className="h-full overflow-y-auto p-4">
//                   <div className="space-y-3">
//                     {filteredLocations.map(location => (
//                       <div
//                         key={location.id}
//                         onClick={() => handleLocationClick(location.id)}
//                         className={cn(
//                           "p-4 rounded-lg border cursor-pointer transition-all",
//                           selectedLocation === location.id
//                             ? "border-pepper-500 bg-pepper-50"
//                             : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
//                         )}
//                       >
//                         <div className="flex items-center justify-between">
//                           <div className="flex items-center space-x-3">
//                             {getStatusIcon(location.status)}
//                             <div>
//                               <h4 className="font-medium text-gray-900">{location.name}</h4>
//                               <p className="text-sm text-gray-600">{location.address}</p>
//                             </div>
//                           </div>
//                           <div className="text-right">
//                             <div className="text-lg font-bold text-gray-900">{location.parcelCount}</div>
//                             <div className="text-sm text-gray-500">parcels</div>
//                           </div>
//                         </div>
                        
//                         <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
//                           <div className="flex items-center space-x-2">
//                             <MapPin className="h-4 w-4 text-gray-400" />
//                             <span className="text-gray-600">{location.type === 'locker' ? 'Locker' : 'Hub'}</span>
//                           </div>
//                           <div className="flex items-center space-x-2">
//                             {getNetworkIcon(location.networkStrength)}
//                             <span className="text-gray-600 capitalize">{location.networkStrength}</span>
//                           </div>
//                           <div className="flex items-center space-x-2">
//                             <Clock className="h-4 w-4 text-gray-400" />
//                             <span className="text-gray-600">{location.lastHeartbeat}</span>
//                           </div>
//                           <div className="flex items-center space-x-2">
//                             <Zap className="h-4 w-4 text-gray-400" />
//                             <span className="text-gray-600 capitalize">{location.powerSource}</span>
//                           </div>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Sidebar */}
//         <div className="space-y-6">
//           {/* Selected Location Details */}
//           <AnimatePresence>
//             {selectedLocation && (() => {
//               const location = locations.find(l => l.id === selectedLocation)
//               if (!location) return null

//               return (
//                 <motion.div
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   exit={{ opacity: 0, y: -20 }}
//                   className="bg-white rounded-xl shadow-soft p-6 border border-gray-200"
//                 >
//                   <div className="flex items-start justify-between mb-4">
//                     <div>
//                       <h3 className="text-xl font-bold text-gray-900">{location.name}</h3>
//                       <p className="text-gray-600">{location.address}</p>
//                     </div>
//                     <button
//                       onClick={() => setSelectedLocation(null)}
//                       className="p-1 hover:bg-gray-100 rounded"
//                     >
//                       <XCircle className="h-5 w-5 text-gray-500" />
//                     </button>
//                   </div>

//                   <div className="space-y-4">
//                     {/* Status Badge */}
//                     <div className="flex items-center justify-between">
//                       <span className="text-sm font-medium text-gray-700">Status</span>
//                       <span className={cn(
//                         "px-3 py-1 rounded-full text-xs font-medium",
//                         getStatusColor(location.status),
//                         location.status === 'online' ? 'text-green-800' :
//                         location.status === 'offline' ? 'text-red-800' :
//                         location.status === 'maintenance' ? 'text-yellow-800' : 'text-purple-800'
//                       )}>
//                         {location.status.charAt(0).toUpperCase() + location.status.slice(1)}
//                       </span>
//                     </div>

//                     {/* Capacity Bar */}
//                     <div>
//                       <div className="flex items-center justify-between mb-1">
//                         <span className="text-sm font-medium text-gray-700">Capacity</span>
//                         <span className="text-sm text-gray-600">
//                           {calculateUtilization(location)}% full
//                         </span>
//                       </div>
//                       <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
//                         <div
//                           className={cn(
//                             "h-full transition-all duration-300",
//                             calculateUtilization(location) > 90 ? "bg-red-500" :
//                             calculateUtilization(location) > 70 ? "bg-yellow-500" : "bg-green-500"
//                           )}
//                           style={{ width: `${calculateUtilization(location)}%` }}
//                         />
//                       </div>
//                       <div className="flex items-center justify-between mt-1 text-sm text-gray-500">
//                         <span>{location.parcelCount} parcels</span>
//                         <span>{location.availableCompartments} available</span>
//                       </div>
//                     </div>

//                     {/* Details Grid */}
//                     <div className="grid grid-cols-2 gap-3">
//                       <div className="bg-gray-50 p-3 rounded-lg">
//                         <div className="text-sm text-gray-500">Type</div>
//                         <div className="font-medium">{location.type === 'locker' ? 'Smart Locker' : 'Staffed Hub'}</div>
//                       </div>
//                       <div className="bg-gray-50 p-3 rounded-lg">
//                         <div className="text-sm text-gray-500">Network</div>
//                         <div className="font-medium capitalize">{location.networkStrength}</div>
//                       </div>
//                       <div className="bg-gray-50 p-3 rounded-lg">
//                         <div className="text-sm text-gray-500">Power</div>
//                         <div className="font-medium capitalize">{location.powerSource}</div>
//                       </div>
//                       <div className="bg-gray-50 p-3 rounded-lg">
//                         <div className="text-sm text-gray-500">Last Update</div>
//                         <div className="font-medium">{location.lastHeartbeat}</div>
//                       </div>
//                     </div>

//                     {/* Location Parcels */}
//                     <div>
//                       <h4 className="font-medium text-gray-900 mb-2">Active Parcels</h4>
//                       <div className="space-y-2">
//                         {parcels
//                           .filter(p => p.locationId === location.id && p.status !== 'picked_up')
//                           .map(parcel => (
//                             <div key={parcel.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
//                               <div>
//                                 <div className="font-medium text-sm">{parcel.trackingNumber}</div>
//                                 <div className="text-xs text-gray-500 capitalize">{parcel.status.replace('_', ' ')}</div>
//                               </div>
//                               <button className="p-1 hover:bg-gray-200 rounded">
//                                 <Eye className="h-4 w-4 text-gray-500" />
//                               </button>
//                             </div>
//                           ))}
                        
//                         {parcels.filter(p => p.locationId === location.id && p.status !== 'picked_up').length === 0 && (
//                           <div className="text-center py-4 text-gray-500 text-sm">
//                             No active parcels at this location
//                           </div>
//                         )}
//                       </div>
//                     </div>

//                     {/* Actions */}
//                     <div className="flex space-x-2">
//                       <button className="flex-1 px-4 py-2 bg-pepper-500 text-white rounded-lg hover:bg-pepper-600 transition font-medium">
//                         View Details
//                       </button>
//                       <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">
//                         Actions
//                       </button>
//                     </div>
//                   </div>
//                 </motion.div>
//               )
//             })()}
//           </AnimatePresence>

//           {/* Network Status */}
//           <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
//             <h3 className="text-lg font-bold text-gray-900 mb-4">Network Health</h3>
//             <div className="space-y-4">
//               {locations
//                 .filter(l => l.status !== 'online')
//                 .map(location => (
//                   <div key={location.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
//                     <div className="flex items-center space-x-3">
//                       {getStatusIcon(location.status)}
//                       <div>
//                         <div className="font-medium text-gray-900">{location.name}</div>
//                         <div className="text-sm text-gray-600">{location.status.toUpperCase()}</div>
//                       </div>
//                     </div>
//                     <AlertCircle className="h-5 w-5 text-red-500" />
//                   </div>
//                 ))}
              
//               {locations.filter(l => l.status !== 'online').length === 0 && (
//                 <div className="text-center py-4">
//                   <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
//                   <h4 className="font-medium text-gray-900">All systems operational</h4>
//                   <p className="text-sm text-gray-600">All locations are online and healthy</p>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Quick Stats */}
//           <div className="bg-gradient-to-r from-pepper-600 to-pepper-500 rounded-xl p-6 text-white">
//             <h3 className="text-lg font-bold mb-4">Quick Stats</h3>
//             <div className="space-y-3">
//               {[
//                 { label: 'Average Utilization', value: '72%', trend: '+2%' },
//                 { label: 'Peak Hours', value: '4-7 PM', trend: 'Today' },
//                 { label: 'Avg. Pickup Time', value: '2.1h', trend: '-0.3h' },
//                 { label: 'Network Uptime', value: '99.8%', trend: 'This week' },
//               ].map((stat, index) => (
//                 <div key={index} className="flex items-center justify-between">
//                   <span className="text-pepper-100">{stat.label}</span>
//                   <div className="text-right">
//                     <div className="font-bold">{stat.value}</div>
//                     <div className="text-xs text-pepper-200">{stat.trend}</div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// // Custom icons for map controls
// const PlusIcon = () => (
//   <svg className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
//   </svg>
// )

// const MinusIcon = () => (
//   <svg className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
//   </svg>
// )