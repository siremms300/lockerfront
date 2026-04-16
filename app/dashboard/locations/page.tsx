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
    if (location.status === 'active') return 'online'
    if (location.status === 'inactive') return 'offline'
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



