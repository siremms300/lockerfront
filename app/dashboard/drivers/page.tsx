// app/dashboard/drivers/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Truck, 
  User, 
  MapPin, 
  Package, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Filter,
  Search,
  Eye,
  Phone,
  Mail,
  Navigation,
  Battery,
  Wifi,
  Shield,
  BarChart3,
  Calendar,
  TrendingUp,
  MoreVertical,
  Edit,
  Trash2,
  Plus,
  QrCode,
  Loader2,
  Star
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/lib/socket'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { driverAPI } from '@/lib/api'
import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'

interface Driver {
  _id: string
  name: string
  phone: string
  email?: string
  status: 'active' | 'inactive' | 'on_delivery' | 'offline' | 'on_break'
  vehicle: {
    type: 'bike' | 'car' | 'van'
    plateNumber: string
    capacity: number
  }
  stats: {
    totalDeliveries: number
    completedToday: number
    rating: number
    totalEarnings: number
  }
  location?: {
    lat: number
    lng: number
    lastUpdated: Date
  }
  currentRoute?: {
    parcels: number
    stops: number
    estimatedTime: string
  }
  batteryLevel?: number
  networkStrength: 'excellent' | 'good' | 'poor'
  joinedDate: string
}

interface Delivery {
  _id: string
  trackingNumber: string
  status: string
  location: string
  codAmount: number
  collected: boolean
  items: Array<any>
  customer: {
    name: string
    phone: string
  }
}

interface DriverAnalytics {
  overview: {
    totalDrivers: number
    activeDrivers: number
    onDelivery: number
    totalParcelsToday: number
    codPending: number
    completionRate: number
  }
  performance: {
    avgDeliveryTime: string
    onTimeRate: string
    fuelEfficiency: string
    codCollectionRate: string
    customerRating: string
  }
}

export default function DriversPage() {
  const socket = useSocket()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [analytics, setAnalytics] = useState<DriverAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'on_delivery' | 'inactive' | 'offline'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<'drivers' | 'deliveries' | 'analytics'>('drivers')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  // Fetch drivers on mount and when filters change
  useEffect(() => {
    fetchDrivers()
    fetchAnalytics()
  }, [selectedStatus, searchQuery, pagination.page])

  // Fetch driver deliveries when a driver is selected
  useEffect(() => {
    if (selectedDriver) {
      fetchDriverDeliveries(selectedDriver)
    }
  }, [selectedDriver])

  // Handle socket updates for real-time driver tracking
  useEffect(() => {
    if (!socket) return

    socket.on('driver-location-update', (update: any) => {
      setDrivers(prev => prev.map(driver => 
        driver._id === update.driverId 
          ? { 
              ...driver, 
              location: update.location,
              batteryLevel: update.batteryLevel,
              networkStrength: update.networkStrength,
              status: update.status || driver.status
            }
          : driver
      ))
      toast.success(`Driver ${update.driverName} location updated`)
    })

    socket.on('delivery-status-update', (update: any) => {
      // Update deliveries list
      setDeliveries(prev => prev.map(d => 
        d._id === update.parcelId
          ? { ...d, status: update.status }
          : d
      ))
      
      // Update driver stats
      if (update.driverId) {
        setDrivers(prev => prev.map(driver => {
          if (driver._id === update.driverId) {
            const newStats = { ...driver.stats }
            if (update.status === 'picked_up') {
              newStats.completedToday += 1
              newStats.totalDeliveries += 1
              newStats.totalEarnings += update.codAmount || 0
            }
            return { ...driver, stats: newStats }
          }
          return driver
        }))
      }
    })

    return () => {
      socket.off('driver-location-update')
      socket.off('delivery-status-update')
    }
  }, [socket])

  const fetchDrivers = async () => {
    try {
      setLoading(true)
      const response = await driverAPI.getAll({
        status: selectedStatus,
        search: searchQuery,
        page: pagination.page,
        limit: pagination.limit
      })
      
      setDrivers(response.data.drivers)
      setPagination(response.data.pagination)
    } catch (error: any) {
      toast.error('Failed to load drivers')
      console.error('Error fetching drivers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await driverAPI.getAnalytics()
      setAnalytics(response.data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  const fetchDriverDeliveries = async (driverId: string) => {
    try {
      const response = await driverAPI.getDeliveries(driverId)
      setDeliveries(response.data)
    } catch (error) {
      toast.error('Failed to load driver deliveries')
      console.error('Error fetching deliveries:', error)
    }
  }

  const refreshData = async () => {
    setIsRefreshing(true)
    await Promise.all([
      fetchDrivers(),
      fetchAnalytics()
    ])
    if (selectedDriver) {
      await fetchDriverDeliveries(selectedDriver)
    }
    setIsRefreshing(false)
    toast.success('Data refreshed')
  }

  const handleDeleteDriver = async (driverId: string) => {
    if (!confirm('Are you sure you want to delete this driver?')) return
    
    try {
      await driverAPI.delete(driverId)
      toast.success('Driver deleted successfully')
      fetchDrivers()
      if (selectedDriver === driverId) {
        setSelectedDriver(null)
      }
    } catch (error) {
      toast.error('Failed to delete driver')
    }
  }

  const getStatusIcon = (status: Driver['status']) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'on_delivery': return <Truck className="h-4 w-4 text-blue-500" />
      case 'inactive': return <Clock className="h-4 w-4 text-gray-500" />
      case 'offline': return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'on_break': return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: Driver['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'on_delivery': return 'bg-blue-100 text-blue-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'offline': return 'bg-red-100 text-red-800'
      case 'on_break': return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getVehicleIcon = (type: Driver['vehicle']['type']) => {
    switch (type) {
      case 'bike': return '🛵'
      case 'car': return '🚗'
      case 'van': return '🚚'
    }
  }

  const getTimeAgo = (date?: Date) => {
    if (!date) return 'Never'
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  }

  const stats = analytics ? {
    totalDrivers: analytics.overview.totalDrivers,
    activeDrivers: analytics.overview.activeDrivers,
    onDelivery: analytics.overview.onDelivery,
    totalParcelsToday: analytics.overview.totalParcelsToday,
    codPending: analytics.overview.codPending,
    completionRate: analytics.overview.completionRate
  } : {
    totalDrivers: 0,
    activeDrivers: 0,
    onDelivery: 0,
    totalParcelsToday: 0,
    codPending: 0,
    completionRate: 0
  }

  if (loading && drivers.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Driver Management</h1>
          <p className="text-gray-600">Monitor and manage your delivery fleet</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={refreshData}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            title="Refresh"
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-5 w-5 text-gray-600", isRefreshing && "animate-spin")} />
          </button>

          <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('drivers')}
              className={cn(
                "px-3 py-1.5 rounded text-sm font-medium transition",
                viewMode === 'drivers' ? "bg-white shadow-sm text-pepper-600" : "text-gray-600 hover:text-gray-900"
              )}
            >
              Drivers
            </button>
            <button
              onClick={() => setViewMode('deliveries')}
              className={cn(
                "px-3 py-1.5 rounded text-sm font-medium transition",
                viewMode === 'deliveries' ? "bg-white shadow-sm text-pepper-600" : "text-gray-600 hover:text-gray-900"
              )}
            >
              Deliveries
            </button>
            <button
              onClick={() => setViewMode('analytics')}
              className={cn(
                "px-3 py-1.5 rounded text-sm font-medium transition",
                viewMode === 'analytics' ? "bg-white shadow-sm text-pepper-600" : "text-gray-600 hover:text-gray-900"
              )}
            >
              Analytics
            </button>
          </div>

          <Link
            href="/dashboard/drivers/new"
            className="px-4 py-2 pepper-gradient text-white rounded-lg hover:shadow-lg transition flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Driver</span>
          </Link>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: 'Total Drivers', value: stats.totalDrivers, icon: User, color: 'bg-blue-500' },
          { label: 'Active Now', value: stats.activeDrivers, icon: CheckCircle, color: 'bg-green-500' },
          { label: 'On Delivery', value: stats.onDelivery, icon: Truck, color: 'bg-purple-500' },
          { label: "Today's Parcels", value: stats.totalParcelsToday, icon: Package, color: 'bg-cyan-500' },
          { label: 'COD Pending', value: `₦${stats.codPending.toLocaleString()}`, icon: DollarSign, color: 'bg-yellow-500' },
          { label: 'Completion Rate', value: `${stats.completionRate}%`, icon: TrendingUp, color: 'bg-emerald-500' },
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
                placeholder="Search drivers by name, phone, or vehicle plate..."
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
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="on_delivery">On Delivery</option>
                <option value="inactive">Inactive</option>
                <option value="offline">Offline</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Drivers View */}
      {viewMode === 'drivers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Drivers List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-soft overflow-hidden border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Driver Fleet</h3>
                <p className="text-gray-600">
                  {loading ? 'Loading...' : `${drivers.length} drivers found`}
                </p>
              </div>

              {loading ? (
                <div className="p-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-pepper-500 mx-auto mb-4" />
                  <p className="text-gray-600">Loading drivers...</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  <AnimatePresence>
                    {drivers.map((driver) => (
                      <motion.div
                        key={driver._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedDriver(driver._id === selectedDriver ? null : driver._id)}
                        className={cn(
                          "p-4 cursor-pointer transition-colors",
                          selectedDriver === driver._id
                            ? "bg-pepper-50 border-l-4 border-pepper-500"
                            : "hover:bg-gray-50"
                        )}
                      >
                        <div className="flex items-start space-x-4">
                          {/* Driver Avatar */}
                          <div className="flex-shrink-0">
                            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                              {driver.name.split(' ').map(n => n[0]).join('')}
                            </div>
                          </div>

                          {/* Driver Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-bold text-gray-900">{driver.name}</h4>
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full text-xs font-medium",
                                    getStatusColor(driver.status)
                                  )}>
                                    <span className="flex items-center space-x-1">
                                      {getStatusIcon(driver.status)}
                                      <span className="capitalize">{driver.status.replace('_', ' ')}</span>
                                    </span>
                                  </span>
                                </div>
                                
                                <div className="mt-2 flex items-center space-x-4 text-sm">
                                  <div className="flex items-center space-x-1">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-600">{driver.phone}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Truck className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-600">{driver.vehicle.plateNumber}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <span className="text-lg">{getVehicleIcon(driver.vehicle.type)}</span>
                                    <span className="text-gray-600 capitalize">{driver.vehicle.type}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                {driver.location && (
                                  <button className="p-1 hover:bg-gray-100 rounded" title="Track location">
                                    <Navigation className="h-4 w-4 text-gray-500" />
                                  </button>
                                )}
                                <button className="p-1 hover:bg-gray-100 rounded">
                                  <MoreVertical className="h-4 w-4 text-gray-500" />
                                </button>
                              </div>
                            </div>

                            {/* Stats & Info */}
                            <div className="mt-4 grid grid-cols-4 gap-4">
                              <div className="text-center">
                                <div className="text-lg font-bold text-gray-900">{driver.stats.completedToday}</div>
                                <div className="text-xs text-gray-500">Today</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-gray-900">{driver.stats.totalDeliveries.toLocaleString()}</div>
                                <div className="text-xs text-gray-500">Total</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-gray-900">{driver.stats.rating}★</div>
                                <div className="text-xs text-gray-500">Rating</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-gray-900">₦{(driver.stats.totalEarnings / 1000).toFixed(0)}K</div>
                                <div className="text-xs text-gray-500">Earned</div>
                              </div>
                            </div>

                            {/* Current Route */}
                            {driver.currentRoute && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <MapPin className="h-4 w-4 text-blue-500" />
                                    <span className="text-sm font-medium text-blue-700">On Route</span>
                                  </div>
                                  <div className="text-sm text-blue-600">
                                    {driver.currentRoute.parcels} parcels • {driver.currentRoute.stops} stops • {driver.currentRoute.estimatedTime}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Technical Status */}
                            <div className="mt-3 flex items-center space-x-4">
                              {driver.batteryLevel && (
                                <div className="flex items-center space-x-1">
                                  <Battery className={cn(
                                    "h-4 w-4",
                                    driver.batteryLevel > 50 ? "text-green-500" :
                                    driver.batteryLevel > 20 ? "text-yellow-500" : "text-red-500"
                                  )} />
                                  <span className="text-xs text-gray-600">{driver.batteryLevel}%</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-1">
                                <Wifi className={cn(
                                  "h-4 w-4",
                                  driver.networkStrength === 'excellent' ? "text-green-500" :
                                  driver.networkStrength === 'good' ? "text-yellow-500" : "text-red-500"
                                )} />
                                <span className="text-xs text-gray-600 capitalize">{driver.networkStrength}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="text-xs text-gray-600">
                                  {driver.location?.lastUpdated 
                                    ? getTimeAgo(driver.location.lastUpdated)
                                    : 'No location'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Empty State */}
                  {drivers.length === 0 && !loading && (
                    <div className="p-12 text-center">
                      <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No drivers found</h3>
                      <p className="text-gray-600">
                        {searchQuery || selectedStatus !== 'all'
                          ? 'Try adjusting your filters'
                          : 'Add your first driver to get started'
                        }
                      </p>
                    </div>
                  )}

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Page {pagination.page} of {pagination.pages}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                          disabled={pagination.page === 1}
                          className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                          disabled={pagination.page === pagination.pages}
                          className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Selected Driver or Stats */}
          <div className="space-y-6">
            <AnimatePresence>
              {selectedDriver ? (() => {
                const driver = drivers.find(d => d._id === selectedDriver)
                if (!driver) return null

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white rounded-xl shadow-soft p-6 border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{driver.name}</h3>
                        <p className="text-gray-600">Driver Details</p>
                      </div>
                      <button
                        onClick={() => setSelectedDriver(null)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Contact Info */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-700">{driver.phone}</span>
                          </div>
                          {driver.email && (
                            <div className="flex items-center space-x-3">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-700">{driver.email}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-3">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-700">
                              Joined {format(new Date(driver.joinedDate), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Vehicle Info */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Vehicle Information</h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl">{getVehicleIcon(driver.vehicle.type)}</span>
                              <span className="font-medium capitalize">{driver.vehicle.type}</span>
                            </div>
                            <span className="font-bold">{driver.vehicle.plateNumber}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            Capacity: {driver.vehicle.capacity} parcels
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Performance Stats</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-blue-50 p-3 rounded">
                            <div className="text-sm text-blue-600">Today's Deliveries</div>
                            <div className="text-xl font-bold">{driver.stats.completedToday}</div>
                          </div>
                          <div className="bg-green-50 p-3 rounded">
                            <div className="text-sm text-green-600">Total Deliveries</div>
                            <div className="text-xl font-bold">{driver.stats.totalDeliveries.toLocaleString()}</div>
                          </div>
                          <div className="bg-yellow-50 p-3 rounded">
                            <div className="text-sm text-yellow-600">Rating</div>
                            <div className="text-xl font-bold">{driver.stats.rating}★</div>
                          </div>
                          <div className="bg-purple-50 p-3 rounded">
                            <div className="text-sm text-purple-600">Total Earnings</div>
                            <div className="text-xl font-bold">₦{driver.stats.totalEarnings.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>

                      {/* Active Deliveries */}
                      {deliveries.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Active Deliveries</h4>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {deliveries.slice(0, 5).map(delivery => (
                              <div key={delivery._id} className="p-3 bg-gray-50 rounded-lg border">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">{delivery.trackingNumber}</span>
                                  <span className={cn(
                                    "px-2 py-0.5 rounded text-xs font-medium",
                                    delivery.status === 'in_transit' ? "bg-yellow-100 text-yellow-800" :
                                    delivery.status === 'at_location' ? "bg-blue-100 text-blue-800" :
                                    "bg-gray-100 text-gray-800"
                                  )}>
                                    {delivery.status.replace('_', ' ')}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600">
                                  {delivery.location} • {delivery.codAmount > 0 
                                    ? `₦${delivery.codAmount.toLocaleString()}`
                                    : 'Prepaid'
                                  }
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex space-x-3">
                        <Link href={`/dashboard/drivers/${driver._id}/edit`} className="flex-1">
                          <button className="w-full px-4 py-2 bg-pepper-500 text-white rounded-lg hover:bg-pepper-600 transition font-medium">
                            Edit Driver
                          </button>
                        </Link>
                        <button 
                          onClick={() => handleDeleteDriver(driver._id)}
                          className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })() : (
                <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-pepper-50 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-pepper-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Fleet Overview</h3>
                      <p className="text-gray-600">Quick statistics</p>
                    </div>
                  </div>

                  {analytics && (
                    <div className="space-y-4">
                      {[
                        { label: 'Active Drivers', value: analytics.overview.activeDrivers, total: analytics.overview.totalDrivers, color: 'bg-green-500' },
                        { label: 'On Delivery', value: analytics.overview.onDelivery, total: analytics.overview.totalDrivers, color: 'bg-blue-500' },
                        { label: 'Parcels Today', value: analytics.overview.totalParcelsToday, total: 100, color: 'bg-purple-500' },
                        { label: 'COD Pending', value: `₦${(analytics.overview.codPending / 1000).toFixed(0)}K`, total: 'Pending', color: 'bg-yellow-500' },
                      ].map((stat, index) => (
                        <div key={index}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-gray-700">{stat.label}</span>
                            <span className="text-sm font-medium">
                              {stat.value} {stat.total !== 'Pending' && stat.total !== 100 ? `/ ${stat.total}` : ''}
                            </span>
                          </div>
                          {typeof stat.value === 'number' && typeof stat.total === 'number' && stat.total > 0 && (
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${stat.color} transition-all duration-300`}
                                style={{ width: `${(stat.value / stat.total) * 100}%` }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
                    <div className="space-y-2">
                      <button className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition font-medium text-sm">
                        Send Broadcast Message
                      </button>
                      <button className="w-full px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition font-medium text-sm">
                        Generate Driver Reports
                      </button>
                      <button 
                        onClick={() => setViewMode('deliveries')}
                        className="w-full px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition font-medium text-sm"
                      >
                        View All Deliveries
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </AnimatePresence>

            {/* Real-time Status */}
            <div className="bg-gradient-to-r from-pepper-600 to-pepper-500 rounded-xl p-6 text-white">
              <div className="flex items-center space-x-3 mb-4">
                <Shield className="h-6 w-6" />
                <h3 className="font-bold">Real-time Monitoring</h3>
              </div>
              <p className="text-pepper-100 text-sm mb-4">
                Live tracking and updates from your driver fleet
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-pepper-200">Live Updates</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-pepper-200">Last Update</span>
                  <span>Just now</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-pepper-200">Connected Drivers</span>
                  <span>{stats.activeDrivers}/{stats.totalDrivers}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deliveries View */}
      {viewMode === 'deliveries' && (
        <div className="bg-white rounded-xl shadow-soft overflow-hidden border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Active Deliveries</h3>
                <p className="text-gray-600">
                  {deliveries.length} deliveries in progress
                </p>
              </div>
              <Link href="/dashboard/deliveries/new">
                <button className="px-4 py-2 pepper-gradient text-white rounded-lg hover:shadow-lg transition flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>New Delivery</span>
                </button>
              </Link>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {deliveries.length > 0 ? deliveries.map(delivery => {
              const driver = drivers.find(d => d._id === selectedDriver)

              return (
                <div key={delivery._id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Package className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-3">
                          <h4 className="font-bold text-gray-900">
                            {delivery.trackingNumber}
                          </h4>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            delivery.status === 'in_transit' ? "bg-yellow-100 text-yellow-800" :
                            delivery.status === 'at_location' ? "bg-blue-100 text-blue-800" :
                            delivery.status === 'picked_up' ? "bg-green-100 text-green-800" :
                            "bg-gray-100 text-gray-800"
                          )}>
                            {delivery.status.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <div className="mt-2 flex items-center space-x-4">
                          {driver && (
                            <div className="flex items-center space-x-1">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{driver.name}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{delivery.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {delivery.codAmount > 0 
                                ? `₦${delivery.codAmount.toLocaleString()} ${delivery.collected ? '(Paid)' : '(COD)'}`
                                : 'Prepaid'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button className="p-2 hover:bg-gray-100 rounded">
                        <QrCode className="h-4 w-4 text-gray-500" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded">
                        <MoreVertical className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            }) : (
              <div className="p-12 text-center">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No active deliveries</h3>
                <p className="text-gray-600">Assign deliveries to drivers to get started</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics View */}
      {viewMode === 'analytics' && analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Driver Performance */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Driver Performance</h3>
              
              <div className="space-y-4">
                {drivers.map(driver => (
                  <div key={driver._id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                          {driver.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{driver.name}</div>
                          <div className="text-sm text-gray-600">{driver.vehicle.plateNumber}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{driver.stats.rating}★</div>
                        <div className="text-sm text-gray-600">Rating</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-gray-900">{driver.stats.completedToday}</div>
                        <div className="text-xs text-gray-500">Today</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900">
                          {Math.round((driver.stats.completedToday / 20) * 100)}%
                        </div>
                        <div className="text-xs text-gray-500">Target</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900">
                          {driver.stats.totalDeliveries > 1000 
                            ? `${(driver.stats.totalDeliveries / 1000).toFixed(1)}K` 
                            : driver.stats.totalDeliveries
                          }
                        </div>
                        <div className="text-xs text-gray-500">Total</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900">
                          ₦{(driver.stats.totalEarnings / 1000).toFixed(0)}K
                        </div>
                        <div className="text-xs text-gray-500">Earned</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Analytics Sidebar */}
          <div className="space-y-6">
            {/* Efficiency Stats */}
            <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">Efficiency Metrics</h3>
              <div className="space-y-4">
                {[
                  { label: 'Average Delivery Time', value: analytics.performance.avgDeliveryTime, trend: '-12%' },
                  { label: 'On-time Delivery Rate', value: analytics.performance.onTimeRate, trend: '+2%' },
                  { label: 'Fuel Efficiency', value: analytics.performance.fuelEfficiency, trend: '+5%' },
                  { label: 'COD Collection Rate', value: analytics.performance.codCollectionRate, trend: '+1%' },
                  { label: 'Customer Rating', value: analytics.performance.customerRating, trend: '+0.2' },
                ].map((metric, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-700">{metric.label}</span>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{metric.value}</div>
                      <div className={cn(
                        "text-xs",
                        metric.trend.startsWith('+') ? "text-green-600" : "text-red-600"
                      )}>
                        {metric.trend} this month
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {drivers.slice(0, 5).map((driver, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-pepper-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-900">
                        <span className="font-medium">{driver.name}</span>{' '}
                        {driver.status === 'on_delivery' && 'started a delivery route'}
                        {driver.status === 'on_break' && 'went on break'}
                        {driver.status === 'active' && 'is available'}
                        {driver.status === 'offline' && 'went offline'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {driver.location?.lastUpdated 
                          ? getTimeAgo(driver.location.lastUpdated)
                          : 'No recent activity'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Reports */}
            <div className="bg-gradient-to-r from-pepper-600 to-pepper-500 rounded-xl p-6 text-white">
              <h3 className="font-bold mb-4">Generate Reports</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition font-medium text-sm">
                  Daily Performance Report
                </button>
                <button className="w-full px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition font-medium text-sm">
                  Weekly Analytics
                </button>
                <button className="w-full px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition font-medium text-sm">
                  Driver Payment Summary
                </button>
                <button className="w-full px-4 py-2 bg-white text-pepper-600 rounded-lg hover:bg-gray-100 transition font-medium text-sm">
                  Export All Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}































































// // app/dashboard/drivers/page.tsx
// 'use client'

// import { useState, useEffect } from 'react'
// import { 
//   Truck, 
//   User, 
//   MapPin, 
//   Package, 
//   DollarSign, 
//   Clock, 
//   CheckCircle, 
//   AlertCircle,
//   RefreshCw,
//   Filter,
//   Search,
//   Eye,
//   Phone,
//   Mail,
//   Navigation,
//   Battery,
//   Wifi,
//   Shield,
//   BarChart3,
//   Calendar,
//   TrendingUp,
//   MoreVertical,
//   Edit,
//   Trash2,
//   Plus,
//   QrCode
// } from 'lucide-react'
// import { motion, AnimatePresence } from 'framer-motion'
// import { useSocket } from '@/lib/socket'
// import { toast } from 'react-hot-toast'
// import { cn } from '@/lib/utils'

// interface Driver {
//   id: string
//   name: string
//   phone: string
//   email: string
//   status: 'active' | 'inactive' | 'on_delivery' | 'offline' | 'on_break'
//   vehicle: {
//     type: 'bike' | 'car' | 'van'
//     plateNumber: string
//     capacity: number
//   }
//   stats: {
//     totalDeliveries: number
//     completedToday: number
//     rating: number
//     totalEarnings: number
//   }
//   location?: {
//     lat: number
//     lng: number
//     lastUpdated: string
//   }
//   currentRoute?: {
//     parcels: number
//     stops: number
//     estimatedTime: string
//   }
//   batteryLevel?: number
//   networkStrength: 'excellent' | 'good' | 'poor'
// }

// interface Delivery {
//   id: string
//   driverId: string
//   parcels: Array<{
//     trackingNumber: string
//     status: 'picked_up' | 'in_transit' | 'delivered' | 'failed'
//     location: string
//     codAmount: number
//     collected: boolean
//   }>
//   route: Array<{
//     location: string
//     type: 'pickup' | 'dropoff'
//     completed: boolean
//     eta: string
//   }>
//   status: 'pending' | 'active' | 'completed' | 'cancelled'
//   startTime: string
//   endTime?: string
// }

// export default function DriversPage() {
//   const socket = useSocket()
//   const [drivers, setDrivers] = useState<Driver[]>([
//     {
//       id: '1',
//       name: 'Adebayo Johnson',
//       phone: '+234 801 234 5678',
//       email: 'adebayo@example.com',
//       status: 'on_delivery',
//       vehicle: { type: 'bike', plateNumber: 'LAG-123-AB', capacity: 20 },
//       stats: { totalDeliveries: 1245, completedToday: 12, rating: 4.8, totalEarnings: 1250000 },
//       location: { lat: 6.6018, lng: 3.3515, lastUpdated: '2 min ago' },
//       currentRoute: { parcels: 8, stops: 4, estimatedTime: '45 min' },
//       batteryLevel: 85,
//       networkStrength: 'good'
//     },
//     {
//       id: '2',
//       name: 'Chinedu Okoro',
//       phone: '+234 802 345 6789',
//       email: 'chinedu@example.com',
//       status: 'active',
//       vehicle: { type: 'car', plateNumber: 'LAG-456-CD', capacity: 50 },
//       stats: { totalDeliveries: 892, completedToday: 8, rating: 4.9, totalEarnings: 890000 },
//       location: { lat: 6.4413, lng: 3.4723, lastUpdated: '5 min ago' },
//       batteryLevel: 60,
//       networkStrength: 'excellent'
//     },
//     {
//       id: '3',
//       name: 'Fatima Bello',
//       phone: '+234 803 456 7890',
//       email: 'fatima@example.com',
//       status: 'on_break',
//       vehicle: { type: 'bike', plateNumber: 'LAG-789-EF', capacity: 20 },
//       stats: { totalDeliveries: 567, completedToday: 6, rating: 4.7, totalEarnings: 567000 },
//       networkStrength: 'poor'
//     },
//     {
//       id: '4',
//       name: 'Emmanuel Nwankwo',
//       phone: '+234 804 567 8901',
//       email: 'emmanuel@example.com',
//       status: 'offline',
//       vehicle: { type: 'van', plateNumber: 'LAG-012-GH', capacity: 100 },
//       stats: { totalDeliveries: 1342, completedToday: 0, rating: 4.6, totalEarnings: 1342000 },
//       networkStrength: 'poor'
//     },
//     {
//       id: '5',
//       name: 'Grace Oluwaseun',
//       phone: '+234 805 678 9012',
//       email: 'grace@example.com',
//       status: 'on_delivery',
//       vehicle: { type: 'bike', plateNumber: 'LAG-345-IJ', capacity: 20 },
//       stats: { totalDeliveries: 734, completedToday: 10, rating: 4.8, totalEarnings: 734000 },
//       location: { lat: 6.5095, lng: 3.3711, lastUpdated: 'Just now' },
//       currentRoute: { parcels: 12, stops: 6, estimatedTime: '1.5 hours' },
//       batteryLevel: 45,
//       networkStrength: 'good'
//     }
//   ])

//   const [deliveries, setDeliveries] = useState<Delivery[]>([
//     {
//       id: '1',
//       driverId: '1',
//       parcels: [
//         { trackingNumber: 'LKR-4892', status: 'in_transit', location: 'Ikeja City Mall', codAmount: 15000, collected: false },
//         { trackingNumber: 'LKR-4893', status: 'in_transit', location: 'Ikeja City Mall', codAmount: 25000, collected: false },
//         { trackingNumber: 'LKR-4894', status: 'picked_up', location: 'Lekki Hub', codAmount: 0, collected: true },
//       ],
//       route: [
//         { location: 'Ikeja City Mall', type: 'pickup', completed: true, eta: '09:00' },
//         { location: 'Lekki Hub', type: 'dropoff', completed: true, eta: '10:30' },
//         { location: 'Victoria Island', type: 'dropoff', completed: false, eta: '11:15' },
//         { location: 'Yaba Tech Hub', type: 'dropoff', completed: false, eta: '12:00' },
//       ],
//       status: 'active',
//       startTime: '2024-01-15T09:00:00Z'
//     },
//     {
//       id: '2',
//       driverId: '5',
//       parcels: [
//         { trackingNumber: 'LKR-4895', status: 'in_transit', location: 'Surulere Hub', codAmount: 35000, collected: false },
//         { trackingNumber: 'LKR-4896', status: 'in_transit', location: 'Surulere Hub', codAmount: 15000, collected: false },
//       ],
//       route: [
//         { location: 'Surulere Hub', type: 'pickup', completed: true, eta: '10:00' },
//         { location: 'Ojota Park', type: 'dropoff', completed: false, eta: '11:30' },
//         { location: 'Ikeja Mall', type: 'dropoff', completed: false, eta: '12:45' },
//       ],
//       status: 'active',
//       startTime: '2024-01-15T10:00:00Z'
//     }
//   ])

//   const [selectedDriver, setSelectedDriver] = useState<string | null>(null)
//   const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'on_delivery' | 'inactive' | 'offline'>('all')
//   const [searchQuery, setSearchQuery] = useState('')
//   const [isLoading, setIsLoading] = useState(false)
//   const [viewMode, setViewMode] = useState<'drivers' | 'deliveries' | 'analytics'>('drivers')

//   // Filter drivers based on selections
//   const filteredDrivers = drivers.filter(driver => {
//     const matchesStatus = selectedStatus === 'all' || driver.status === selectedStatus
//     const matchesSearch = searchQuery === '' || 
//       driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       driver.phone.includes(searchQuery) ||
//       driver.vehicle.plateNumber.toLowerCase().includes(searchQuery.toLowerCase())
//     return matchesStatus && matchesSearch
//   })

//   // Handle socket updates
//   useEffect(() => {
//     if (!socket) return

//     socket.on('driver-location-update', (update: any) => {
//       setDrivers(prev => prev.map(driver => 
//         driver.id === update.driverId 
//           ? { 
//               ...driver, 
//               location: update.location,
//               batteryLevel: update.batteryLevel,
//               networkStrength: update.networkStrength,
//               status: update.status || driver.status
//             }
//           : driver
//       ))
//     })

//     socket.on('delivery-updated', (update: any) => {
//       setDeliveries(prev => prev.map(delivery => 
//         delivery.id === update.deliveryId
//           ? { ...delivery, ...update.data }
//           : delivery
//       ))
//     })

//     return () => {
//       socket.off('driver-location-update')
//       socket.off('delivery-updated')
//     }
//   }, [socket])

//   const refreshData = async () => {
//     setIsLoading(true)
//     setTimeout(() => {
//       setIsLoading(false)
//       toast.success('Data refreshed')
//     }, 1000)
//   }

//   const getStatusIcon = (status: Driver['status']) => {
//     switch (status) {
//       case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />
//       case 'on_delivery': return <Truck className="h-4 w-4 text-blue-500" />
//       case 'inactive': return <Clock className="h-4 w-4 text-gray-500" />
//       case 'offline': return <AlertCircle className="h-4 w-4 text-red-500" />
//       case 'on_break': return <Clock className="h-4 w-4 text-yellow-500" />
//     }
//   }

//   const getStatusColor = (status: Driver['status']) => {
//     switch (status) {
//       case 'active': return 'bg-green-100 text-green-800'
//       case 'on_delivery': return 'bg-blue-100 text-blue-800'
//       case 'inactive': return 'bg-gray-100 text-gray-800'
//       case 'offline': return 'bg-red-100 text-red-800'
//       case 'on_break': return 'bg-yellow-100 text-yellow-800'
//     }
//   }

//   const getVehicleIcon = (type: Driver['vehicle']['type']) => {
//     switch (type) {
//       case 'bike': return '🛵'
//       case 'car': return '🚗'
//       case 'van': return '🚚'
//     }
//   }

//   const stats = {
//     totalDrivers: drivers.length,
//     activeDrivers: drivers.filter(d => d.status === 'active' || d.status === 'on_delivery').length,
//     onDelivery: drivers.filter(d => d.status === 'on_delivery').length,
//     totalParcelsToday: deliveries.reduce((sum, d) => sum + d.parcels.length, 0),
//     codPending: deliveries.reduce((sum, d) => 
//       sum + d.parcels.filter(p => p.codAmount > 0 && !p.collected).reduce((s, p) => s + p.codAmount, 0), 0
//     ),
//     completionRate: Math.round((drivers.filter(d => d.status === 'on_delivery').length / drivers.length) * 100)
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Driver Management</h1>
//           <p className="text-gray-600">Monitor and manage your delivery fleet</p>
//         </div>

//         <div className="flex items-center space-x-3">
//           <button
//             onClick={refreshData}
//             className="p-2 hover:bg-gray-100 rounded-lg transition"
//             title="Refresh"
//           >
//             <RefreshCw className={cn("h-5 w-5 text-gray-600", isLoading && "animate-spin")} />
//           </button>

//           <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
//             <button
//               onClick={() => setViewMode('drivers')}
//               className={cn(
//                 "px-3 py-1.5 rounded text-sm font-medium transition",
//                 viewMode === 'drivers' ? "bg-white shadow-sm text-pepper-600" : "text-gray-600 hover:text-gray-900"
//               )}
//             >
//               Drivers
//             </button>
//             <button
//               onClick={() => setViewMode('deliveries')}
//               className={cn(
//                 "px-3 py-1.5 rounded text-sm font-medium transition",
//                 viewMode === 'deliveries' ? "bg-white shadow-sm text-pepper-600" : "text-gray-600 hover:text-gray-900"
//               )}
//             >
//               Deliveries
//             </button>
//             <button
//               onClick={() => setViewMode('analytics')}
//               className={cn(
//                 "px-3 py-1.5 rounded text-sm font-medium transition",
//                 viewMode === 'analytics' ? "bg-white shadow-sm text-pepper-600" : "text-gray-600 hover:text-gray-900"
//               )}
//             >
//               Analytics
//             </button>
//           </div>

//           <a
//             href="/dashboard/drivers/new"
//             className="px-4 py-2 pepper-gradient text-white rounded-lg hover:shadow-lg transition flex items-center space-x-2"
//           >
//             <Plus className="h-4 w-4" />
//             <span>Add Driver</span>
//           </a>
//         </div>
//       </div>

//       {/* Stats Bar */}
//       <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
//         {[
//           { label: 'Total Drivers', value: stats.totalDrivers, icon: User, color: 'bg-blue-500' },
//           { label: 'Active Now', value: stats.activeDrivers, icon: CheckCircle, color: 'bg-green-500' },
//           { label: 'On Delivery', value: stats.onDelivery, icon: Truck, color: 'bg-purple-500' },
//           { label: "Today's Parcels", value: stats.totalParcelsToday, icon: Package, color: 'bg-cyan-500' },
//           { label: 'COD Pending', value: `₦${stats.codPending.toLocaleString()}`, icon: DollarSign, color: 'bg-yellow-500' },
//           { label: 'Completion Rate', value: `${stats.completionRate}%`, icon: TrendingUp, color: 'bg-emerald-500' },
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
//                 placeholder="Search drivers by name, phone, or vehicle plate..."
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
//                 value={selectedStatus}
//                 onChange={(e) => setSelectedStatus(e.target.value as any)}
//               >
//                 <option value="all">All Status</option>
//                 <option value="active">Active</option>
//                 <option value="on_delivery">On Delivery</option>
//                 <option value="inactive">Inactive</option>
//                 <option value="offline">Offline</option>
//               </select>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Main Content - Drivers View */}
//       {viewMode === 'drivers' && (
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Drivers List */}
//           <div className="lg:col-span-2">
//             <div className="bg-white rounded-xl shadow-soft overflow-hidden border border-gray-200">
//               <div className="p-6 border-b border-gray-200">
//                 <h3 className="text-lg font-bold text-gray-900">Driver Fleet</h3>
//                 <p className="text-gray-600">{filteredDrivers.length} drivers found</p>
//               </div>

//               <div className="divide-y divide-gray-100">
//                 <AnimatePresence>
//                   {filteredDrivers.map((driver) => (
//                     <motion.div
//                       key={driver.id}
//                       initial={{ opacity: 0 }}
//                       animate={{ opacity: 1 }}
//                       exit={{ opacity: 0 }}
//                       onClick={() => setSelectedDriver(driver.id === selectedDriver ? null : driver.id)}
//                       className={cn(
//                         "p-4 cursor-pointer transition-colors",
//                         selectedDriver === driver.id
//                           ? "bg-pepper-50 border-l-4 border-pepper-500"
//                           : "hover:bg-gray-50"
//                       )}
//                     >
//                       <div className="flex items-start space-x-4">
//                         {/* Driver Avatar */}
//                         <div className="flex-shrink-0">
//                           <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
//                             {driver.name.split(' ').map(n => n[0]).join('')}
//                           </div>
//                         </div>

//                         {/* Driver Info */}
//                         <div className="flex-1 min-w-0">
//                           <div className="flex items-start justify-between">
//                             <div>
//                               <div className="flex items-center space-x-2">
//                                 <h4 className="font-bold text-gray-900">{driver.name}</h4>
//                                 <span className={cn(
//                                   "px-2 py-0.5 rounded-full text-xs font-medium",
//                                   getStatusColor(driver.status)
//                                 )}>
//                                   <span className="flex items-center space-x-1">
//                                     {getStatusIcon(driver.status)}
//                                     <span className="capitalize">{driver.status.replace('_', ' ')}</span>
//                                   </span>
//                                 </span>
//                               </div>
                              
//                               <div className="mt-2 flex items-center space-x-4 text-sm">
//                                 <div className="flex items-center space-x-1">
//                                   <Phone className="h-4 w-4 text-gray-400" />
//                                   <span className="text-gray-600">{driver.phone}</span>
//                                 </div>
//                                 <div className="flex items-center space-x-1">
//                                   <Truck className="h-4 w-4 text-gray-400" />
//                                   <span className="text-gray-600">{driver.vehicle.plateNumber}</span>
//                                 </div>
//                                 <div className="flex items-center space-x-1">
//                                   <span className="text-lg">{getVehicleIcon(driver.vehicle.type)}</span>
//                                   <span className="text-gray-600 capitalize">{driver.vehicle.type}</span>
//                                 </div>
//                               </div>
//                             </div>

//                             <div className="flex items-center space-x-2">
//                               {driver.location && (
//                                 <button className="p-1 hover:bg-gray-100 rounded" title="Track location">
//                                   <Navigation className="h-4 w-4 text-gray-500" />
//                                 </button>
//                               )}
//                               <button className="p-1 hover:bg-gray-100 rounded">
//                                 <MoreVertical className="h-4 w-4 text-gray-500" />
//                               </button>
//                             </div>
//                           </div>

//                           {/* Stats & Info */}
//                           <div className="mt-4 grid grid-cols-4 gap-4">
//                             <div className="text-center">
//                               <div className="text-lg font-bold text-gray-900">{driver.stats.completedToday}</div>
//                               <div className="text-xs text-gray-500">Today</div>
//                             </div>
//                             <div className="text-center">
//                               <div className="text-lg font-bold text-gray-900">{driver.stats.totalDeliveries.toLocaleString()}</div>
//                               <div className="text-xs text-gray-500">Total</div>
//                             </div>
//                             <div className="text-center">
//                               <div className="text-lg font-bold text-gray-900">{driver.stats.rating}★</div>
//                               <div className="text-xs text-gray-500">Rating</div>
//                             </div>
//                             <div className="text-center">
//                               <div className="text-lg font-bold text-gray-900">₦{(driver.stats.totalEarnings / 1000).toFixed(0)}K</div>
//                               <div className="text-xs text-gray-500">Earned</div>
//                             </div>
//                           </div>

//                           {/* Current Route */}
//                           {driver.currentRoute && (
//                             <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
//                               <div className="flex items-center justify-between">
//                                 <div className="flex items-center space-x-2">
//                                   <MapPin className="h-4 w-4 text-blue-500" />
//                                   <span className="text-sm font-medium text-blue-700">On Route</span>
//                                 </div>
//                                 <div className="text-sm text-blue-600">
//                                   {driver.currentRoute.parcels} parcels • {driver.currentRoute.stops} stops • {driver.currentRoute.estimatedTime}
//                                 </div>
//                               </div>
//                             </div>
//                           )}

//                           {/* Technical Status */}
//                           <div className="mt-3 flex items-center space-x-4">
//                             {driver.batteryLevel && (
//                               <div className="flex items-center space-x-1">
//                                 <Battery className={cn(
//                                   "h-4 w-4",
//                                   driver.batteryLevel > 50 ? "text-green-500" :
//                                   driver.batteryLevel > 20 ? "text-yellow-500" : "text-red-500"
//                                 )} />
//                                 <span className="text-xs text-gray-600">{driver.batteryLevel}%</span>
//                               </div>
//                             )}
//                             <div className="flex items-center space-x-1">
//                               <Wifi className={cn(
//                                 "h-4 w-4",
//                                 driver.networkStrength === 'excellent' ? "text-green-500" :
//                                 driver.networkStrength === 'good' ? "text-yellow-500" : "text-red-500"
//                               )} />
//                               <span className="text-xs text-gray-600 capitalize">{driver.networkStrength}</span>
//                             </div>
//                             {driver.location && (
//                               <div className="flex items-center space-x-1">
//                                 <Clock className="h-4 w-4 text-gray-400" />
//                                 <span className="text-xs text-gray-600">{driver.location.lastUpdated}</span>
//                               </div>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     </motion.div>
//                   ))}
//                 </AnimatePresence>

//                 {/* Empty State */}
//                 {filteredDrivers.length === 0 && (
//                   <div className="p-12 text-center">
//                     <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//                     <h3 className="text-lg font-medium text-gray-900 mb-2">No drivers found</h3>
//                     <p className="text-gray-600">
//                       {searchQuery || selectedStatus !== 'all'
//                         ? 'Try adjusting your filters'
//                         : 'Add your first driver to get started'
//                       }
//                     </p>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Sidebar - Selected Driver or Stats */}
//           <div className="space-y-6">
//             <AnimatePresence>
//               {selectedDriver ? (() => {
//                 const driver = drivers.find(d => d.id === selectedDriver)
//                 if (!driver) return null

//                 const driverDeliveries = deliveries.filter(d => d.driverId === driver.id)

//                 return (
//                   <motion.div
//                     initial={{ opacity: 0, y: 20 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     exit={{ opacity: 0, y: -20 }}
//                     className="bg-white rounded-xl shadow-soft p-6 border border-gray-200"
//                   >
//                     <div className="flex items-start justify-between mb-6">
//                       <div>
//                         <h3 className="text-xl font-bold text-gray-900">{driver.name}</h3>
//                         <p className="text-gray-600">Driver Details</p>
//                       </div>
//                       <button
//                         onClick={() => setSelectedDriver(null)}
//                         className="p-2 hover:bg-gray-100 rounded-lg"
//                       >
//                         ✕
//                       </button>
//                     </div>

//                     <div className="space-y-6">
//                       {/* Contact Info */}
//                       <div>
//                         <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
//                         <div className="space-y-2">
//                           <div className="flex items-center space-x-3">
//                             <Phone className="h-4 w-4 text-gray-400" />
//                             <span className="text-gray-700">{driver.phone}</span>
//                           </div>
//                           <div className="flex items-center space-x-3">
//                             <Mail className="h-4 w-4 text-gray-400" />
//                             <span className="text-gray-700">{driver.email}</span>
//                           </div>
//                         </div>
//                       </div>

//                       {/* Vehicle Info */}
//                       <div>
//                         <h4 className="font-medium text-gray-900 mb-3">Vehicle Information</h4>
//                         <div className="bg-gray-50 p-4 rounded-lg">
//                           <div className="flex items-center justify-between mb-2">
//                             <div className="flex items-center space-x-2">
//                               <span className="text-2xl">{getVehicleIcon(driver.vehicle.type)}</span>
//                               <span className="font-medium capitalize">{driver.vehicle.type}</span>
//                             </div>
//                             <span className="font-bold">{driver.vehicle.plateNumber}</span>
//                           </div>
//                           <div className="text-sm text-gray-600">
//                             Capacity: {driver.vehicle.capacity} parcels
//                           </div>
//                         </div>
//                       </div>

//                       {/* Stats */}
//                       <div>
//                         <h4 className="font-medium text-gray-900 mb-3">Performance Stats</h4>
//                         <div className="grid grid-cols-2 gap-3">
//                           <div className="bg-blue-50 p-3 rounded">
//                             <div className="text-sm text-blue-600">Today's Deliveries</div>
//                             <div className="text-xl font-bold">{driver.stats.completedToday}</div>
//                           </div>
//                           <div className="bg-green-50 p-3 rounded">
//                             <div className="text-sm text-green-600">Total Deliveries</div>
//                             <div className="text-xl font-bold">{driver.stats.totalDeliveries.toLocaleString()}</div>
//                           </div>
//                           <div className="bg-yellow-50 p-3 rounded">
//                             <div className="text-sm text-yellow-600">Rating</div>
//                             <div className="text-xl font-bold">{driver.stats.rating}★</div>
//                           </div>
//                           <div className="bg-purple-50 p-3 rounded">
//                             <div className="text-sm text-purple-600">Total Earnings</div>
//                             <div className="text-xl font-bold">₦{driver.stats.totalEarnings.toLocaleString()}</div>
//                           </div>
//                         </div>
//                       </div>

//                       {/* Active Deliveries */}
//                       {driverDeliveries.length > 0 && (
//                         <div>
//                           <h4 className="font-medium text-gray-900 mb-3">Active Deliveries</h4>
//                           <div className="space-y-2">
//                             {driverDeliveries.map(delivery => (
//                               <div key={delivery.id} className="p-3 bg-gray-50 rounded-lg border">
//                                 <div className="flex items-center justify-between mb-2">
//                                   <span className="font-medium">Delivery #{delivery.id.slice(-6)}</span>
//                                   <span className="text-sm text-gray-600">{delivery.parcels.length} parcels</span>
//                                 </div>
//                                 <div className="text-sm text-gray-600">
//                                   Started: {new Date(delivery.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//                                 </div>
//                               </div>
//                             ))}
//                           </div>
//                         </div>
//                       )}

//                       {/* Actions */}
//                       <div className="flex space-x-3">
//                         <button className="flex-1 px-4 py-2 bg-pepper-500 text-white rounded-lg hover:bg-pepper-600 transition font-medium">
//                           Assign Delivery
//                         </button>
//                         <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">
//                           Message
//                         </button>
//                       </div>
//                     </div>
//                   </motion.div>
//                 )
//               })() : (
//                 <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
//                   <div className="flex items-center space-x-3 mb-6">
//                     <div className="p-2 bg-pepper-50 rounded-lg">
//                       <BarChart3 className="h-6 w-6 text-pepper-600" />
//                     </div>
//                     <div>
//                       <h3 className="font-bold text-gray-900">Fleet Overview</h3>
//                       <p className="text-gray-600">Quick statistics</p>
//                     </div>
//                   </div>

//                   <div className="space-y-4">
//                     {[
//                       { label: 'Active Drivers', value: stats.activeDrivers, total: stats.totalDrivers, color: 'bg-green-500' },
//                       { label: 'On Delivery', value: stats.onDelivery, total: stats.totalDrivers, color: 'bg-blue-500' },
//                       { label: 'Parcels Today', value: stats.totalParcelsToday, total: 100, color: 'bg-purple-500' },
//                       { label: 'COD Collected', value: '₦85,000', total: `₦${stats.codPending.toLocaleString()}`, color: 'bg-yellow-500' },
//                     ].map((stat, index) => (
//                       <div key={index}>
//                         <div className="flex items-center justify-between mb-1">
//                           <span className="text-sm text-gray-700">{stat.label}</span>
//                           <span className="text-sm font-medium">
//                             {stat.value} {stat.total && `/ ${stat.total}`}
//                           </span>
//                         </div>
//                         <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
//                           <div
//                             className={`h-full ${stat.color} transition-all duration-300`}
//                             style={{ width: typeof stat.value === 'number' && typeof stat.total === 'number' 
//                               ? `${(stat.value / stat.total) * 100}%` 
//                               : '75%' 
//                             }}
//                           />
//                         </div>
//                       </div>
//                     ))}
//                   </div>

//                   <div className="mt-6 pt-6 border-t border-gray-200">
//                     <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
//                     <div className="space-y-2">
//                       <button className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition font-medium text-sm">
//                         Send Broadcast Message
//                       </button>
//                       <button className="w-full px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition font-medium text-sm">
//                         Generate Driver Reports
//                       </button>
//                       <button className="w-full px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition font-medium text-sm">
//                         View All Deliveries
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </AnimatePresence>

//             {/* Real-time Status */}
//             <div className="bg-gradient-to-r from-pepper-600 to-pepper-500 rounded-xl p-6 text-white">
//               <div className="flex items-center space-x-3 mb-4">
//                 <Shield className="h-6 w-6" />
//                 <h3 className="font-bold">Real-time Monitoring</h3>
//               </div>
//               <p className="text-pepper-100 text-sm mb-4">
//                 Live tracking and updates from your driver fleet
//               </p>
//               <div className="space-y-3">
//                 <div className="flex items-center justify-between">
//                   <span className="text-pepper-200">Live Updates</span>
//                   <div className="flex items-center space-x-1">
//                     <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
//                     <span>Active</span>
//                   </div>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span className="text-pepper-200">Last Update</span>
//                   <span>Just now</span>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span className="text-pepper-200">Connected Drivers</span>
//                   <span>{drivers.filter(d => d.status !== 'offline').length}/{drivers.length}</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Deliveries View */}
//       {viewMode === 'deliveries' && (
//         <div className="bg-white rounded-xl shadow-soft overflow-hidden border border-gray-200">
//           <div className="p-6 border-b border-gray-200">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h3 className="text-lg font-bold text-gray-900">Active Deliveries</h3>
//                 <p className="text-gray-600">{deliveries.length} deliveries in progress</p>
//               </div>
//               <button className="px-4 py-2 pepper-gradient text-white rounded-lg hover:shadow-lg transition flex items-center space-x-2">
//                 <Plus className="h-4 w-4" />
//                 <span>New Delivery</span>
//               </button>
//             </div>
//           </div>

//           <div className="divide-y divide-gray-100">
//             {deliveries.map(delivery => {
//               const driver = drivers.find(d => d.id === delivery.driverId)
//               const completedStops = delivery.route.filter(r => r.completed).length
//               const totalStops = delivery.route.length

//               return (
//                 <div key={delivery.id} className="p-6 hover:bg-gray-50 transition">
//                   <div className="flex items-start justify-between">
//                     <div className="flex items-start space-x-4">
//                       <div className="p-3 bg-blue-100 rounded-lg">
//                         <Truck className="h-6 w-6 text-blue-600" />
//                       </div>
//                       <div>
//                         <div className="flex items-center space-x-3">
//                           <h4 className="font-bold text-gray-900">
//                             Delivery #{delivery.id.slice(-6)}
//                           </h4>
//                           <span className={cn(
//                             "px-2 py-0.5 rounded-full text-xs font-medium",
//                             delivery.status === 'active' ? "bg-blue-100 text-blue-800" :
//                             delivery.status === 'completed' ? "bg-green-100 text-green-800" :
//                             delivery.status === 'pending' ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
//                           )}>
//                             {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}
//                           </span>
//                         </div>
                        
//                         <div className="mt-2 flex items-center space-x-4">
//                           {driver && (
//                             <div className="flex items-center space-x-1">
//                               <User className="h-4 w-4 text-gray-400" />
//                               <span className="text-sm text-gray-600">{driver.name}</span>
//                             </div>
//                           )}
//                           <div className="flex items-center space-x-1">
//                             <Package className="h-4 w-4 text-gray-400" />
//                             <span className="text-sm text-gray-600">{delivery.parcels.length} parcels</span>
//                           </div>
//                           <div className="flex items-center space-x-1">
//                             <DollarSign className="h-4 w-4 text-gray-400" />
//                             <span className="text-sm text-gray-600">
//                               ₦{delivery.parcels.filter(p => p.codAmount > 0 && !p.collected).reduce((sum, p) => sum + p.codAmount, 0).toLocaleString()} COD
//                             </span>
//                           </div>
//                         </div>
//                       </div>
//                     </div>

//                     <div className="flex items-center space-x-2">
//                       <button className="p-2 hover:bg-gray-100 rounded">
//                         <QrCode className="h-4 w-4 text-gray-500" />
//                       </button>
//                       <button className="p-2 hover:bg-gray-100 rounded">
//                         <MoreVertical className="h-4 w-4 text-gray-500" />
//                       </button>
//                     </div>
//                   </div>

//                   {/* Route Progress */}
//                   <div className="mt-6">
//                     <div className="flex items-center justify-between mb-3">
//                       <h5 className="font-medium text-gray-900">Delivery Route</h5>
//                       <span className="text-sm text-gray-600">
//                         {completedStops}/{totalStops} stops completed
//                       </span>
//                     </div>
                    
//                     <div className="relative">
//                       {/* Progress Line */}
//                       <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200">
//                         <div 
//                           className="bg-green-500 w-0.5 transition-all duration-500"
//                           style={{ height: `${(completedStops / totalStops) * 100}%` }}
//                         />
//                       </div>

//                       {/* Stops */}
//                       <div className="space-y-6 pl-10">
//                         {delivery.route.map((stop, index) => (
//                           <div key={index} className="relative">
//                             <div className={cn(
//                               "absolute -left-10 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center",
//                               stop.completed 
//                                 ? "bg-green-500 text-white" 
//                                 : "bg-gray-200 text-gray-500"
//                             )}>
//                               {stop.completed ? (
//                                 <CheckCircle className="h-4 w-4" />
//                               ) : (
//                                 <MapPin className="h-4 w-4" />
//                               )}
//                             </div>
//                             <div className={cn(
//                               "p-3 rounded-lg border",
//                               stop.completed 
//                                 ? "bg-green-50 border-green-200" 
//                                 : "bg-gray-50 border-gray-200"
//                             )}>
//                               <div className="flex items-center justify-between">
//                                 <div>
//                                   <div className="font-medium text-gray-900">{stop.location}</div>
//                                   <div className="text-sm text-gray-600 capitalize">{stop.type}</div>
//                                 </div>
//                                 <div className="text-sm text-gray-500">ETA: {stop.eta}</div>
//                               </div>
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   </div>

//                   {/* Parcels List */}
//                   <div className="mt-6">
//                     <h5 className="font-medium text-gray-900 mb-3">Parcels in Delivery</h5>
//                     <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
//                       {delivery.parcels.map(parcel => (
//                         <div key={parcel.trackingNumber} className="p-3 bg-gray-50 rounded-lg border">
//                           <div className="flex items-center justify-between mb-2">
//                             <div className="font-medium text-gray-900">{parcel.trackingNumber}</div>
//                             <span className={cn(
//                               "px-2 py-0.5 rounded text-xs font-medium",
//                               parcel.status === 'picked_up' ? "bg-blue-100 text-blue-800" :
//                               parcel.status === 'in_transit' ? "bg-yellow-100 text-yellow-800" :
//                               parcel.status === 'delivered' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
//                             )}>
//                               {parcel.status.replace('_', ' ')}
//                             </span>
//                           </div>
//                           <div className="text-sm text-gray-600">
//                             {parcel.location} • {parcel.codAmount > 0 ? (
//                               <span className={parcel.collected ? "text-green-600" : "text-yellow-600"}>
//                                 ₦{parcel.codAmount.toLocaleString()} {parcel.collected ? '(Collected)' : '(Pending)'}
//                               </span>
//                             ) : 'Prepaid'}
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 </div>
//               )
//             })}

//             {/* Empty State */}
//             {deliveries.length === 0 && (
//               <div className="p-12 text-center">
//                 <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//                 <h3 className="text-lg font-medium text-gray-900 mb-2">No active deliveries</h3>
//                 <p className="text-gray-600">Assign deliveries to drivers to get started</p>
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Analytics View */}
//       {viewMode === 'analytics' && (
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Driver Performance */}
//           <div className="lg:col-span-2">
//             <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
//               <h3 className="text-lg font-bold text-gray-900 mb-6">Driver Performance</h3>
              
//               <div className="space-y-4">
//                 {drivers.map(driver => (
//                   <div key={driver.id} className="p-4 bg-gray-50 rounded-lg">
//                     <div className="flex items-center justify-between mb-3">
//                       <div className="flex items-center space-x-3">
//                         <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
//                           {driver.name.split(' ').map(n => n[0]).join('')}
//                         </div>
//                         <div>
//                           <div className="font-medium text-gray-900">{driver.name}</div>
//                           <div className="text-sm text-gray-600">{driver.vehicle.plateNumber}</div>
//                         </div>
//                       </div>
//                       <div className="text-right">
//                         <div className="text-2xl font-bold text-gray-900">{driver.stats.rating}★</div>
//                         <div className="text-sm text-gray-600">Rating</div>
//                       </div>
//                     </div>

//                     <div className="grid grid-cols-4 gap-4 text-center">
//                       <div>
//                         <div className="text-lg font-bold text-gray-900">{driver.stats.completedToday}</div>
//                         <div className="text-xs text-gray-500">Today</div>
//                       </div>
//                       <div>
//                         <div className="text-lg font-bold text-gray-900">
//                           {Math.round((driver.stats.completedToday / 20) * 100)}%
//                         </div>
//                         <div className="text-xs text-gray-500">Target</div>
//                       </div>
//                       <div>
//                         <div className="text-lg font-bold text-gray-900">
//                           {driver.stats.totalDeliveries > 1000 
//                             ? `${(driver.stats.totalDeliveries / 1000).toFixed(1)}K` 
//                             : driver.stats.totalDeliveries
//                           }
//                         </div>
//                         <div className="text-xs text-gray-500">Total</div>
//                       </div>
//                       <div>
//                         <div className="text-lg font-bold text-gray-900">
//                           ₦{(driver.stats.totalEarnings / 1000).toFixed(0)}K
//                         </div>
//                         <div className="text-xs text-gray-500">Earned</div>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* Analytics Sidebar */}
//           <div className="space-y-6">
//             {/* Efficiency Stats */}
//             <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
//               <h3 className="font-bold text-gray-900 mb-4">Efficiency Metrics</h3>
//               <div className="space-y-4">
//                 {[
//                   { label: 'Average Delivery Time', value: '2.4 hours', trend: '-12%' },
//                   { label: 'On-time Delivery Rate', value: '94%', trend: '+2%' },
//                   { label: 'Fuel Efficiency', value: '18km/L', trend: '+5%' },
//                   { label: 'COD Collection Rate', value: '96%', trend: '+1%' },
//                   { label: 'Customer Rating', value: '4.8/5', trend: '+0.2' },
//                 ].map((metric, index) => (
//                   <div key={index} className="flex items-center justify-between">
//                     <span className="text-gray-700">{metric.label}</span>
//                     <div className="text-right">
//                       <div className="font-bold text-gray-900">{metric.value}</div>
//                       <div className={cn(
//                         "text-xs",
//                         metric.trend.startsWith('+') ? "text-green-600" : "text-red-600"
//                       )}>
//                         {metric.trend} this month
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Recent Activity */}
//             <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
//               <h3 className="font-bold text-gray-900 mb-4">Recent Activity</h3>
//               <div className="space-y-3">
//                 {[
//                   { driver: 'Adebayo Johnson', action: 'Started delivery route', time: '5 min ago' },
//                   { driver: 'Chinedu Okoro', action: 'Completed 3 deliveries', time: '15 min ago' },
//                   { driver: 'Grace Oluwaseun', action: 'Collected ₦25,000 COD', time: '30 min ago' },
//                   { driver: 'Fatima Bello', action: 'Went on break', time: '1 hour ago' },
//                   { driver: 'Emmanuel Nwankwo', action: 'Vehicle maintenance', time: '2 hours ago' },
//                 ].map((activity, index) => (
//                   <div key={index} className="flex items-start space-x-3">
//                     <div className="w-2 h-2 bg-pepper-500 rounded-full mt-2"></div>
//                     <div className="flex-1">
//                       <div className="text-sm text-gray-900">
//                         <span className="font-medium">{activity.driver}</span> {activity.action}
//                       </div>
//                       <div className="text-xs text-gray-500">{activity.time}</div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Quick Reports */}
//             <div className="bg-gradient-to-r from-pepper-600 to-pepper-500 rounded-xl p-6 text-white">
//               <h3 className="font-bold mb-4">Generate Reports</h3>
//               <div className="space-y-3">
//                 <button className="w-full px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition font-medium text-sm">
//                   Daily Performance Report
//                 </button>
//                 <button className="w-full px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition font-medium text-sm">
//                   Weekly Analytics
//                 </button>
//                 <button className="w-full px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition font-medium text-sm">
//                   Driver Payment Summary
//                 </button>
//                 <button className="w-full px-4 py-2 bg-white text-pepper-600 rounded-lg hover:bg-gray-100 transition font-medium text-sm">
//                   Export All Data
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }




