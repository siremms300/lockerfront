// app/dashboard/locations/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  MapPin,
  Building,
  Phone,
  Mail,
  Clock,
  Wifi,
  Battery,
  Zap,
  Edit,
  Trash2,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package,
  Users,
  BarChart3,
  Save,
  X,
  RefreshCw
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { locationAPI, parcelAPI } from '@/lib/api'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { format } from 'date-fns'

interface Location {
  _id: string
  name: string
  type: 'locker' | 'staffed_hub'
  address: {
    street: string
    city: string
    state: string
    country: string
  }
  coordinates: {
    lat: number
    lng: number
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
  capacity?: number
  createdAt: string
  updatedAt: string
}

interface LocationStats {
  totalParcels: number
  activeParcels: number
  completedParcels: number
  utilization: number
}

interface RecentParcel {
  _id: string
  trackingNumber: string
  customer: {
    name: string
    phone: string
  }
  status: string
  createdAt: string
}

export default function LocationDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const locationId = params.id as string

  const [location, setLocation] = useState<Location | null>(null)
  const [stats, setStats] = useState<LocationStats | null>(null)
  const [recentParcels, setRecentParcels] = useState<RecentParcel[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Location>>({})

  useEffect(() => {
    fetchLocationData()
  }, [locationId])

  const fetchLocationData = async () => {
    try {
      setLoading(true)
      
      // Fetch location details
      const locationRes = await locationAPI.getById(locationId)
      setLocation(locationRes.data)
      setEditForm(locationRes.data)
      
      // Fetch location stats
      try {
        const statsRes = await locationAPI.getStats(locationId)
        setStats(statsRes.data)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      }
      
      // Fetch recent parcels at this location
      try {
        const parcelsRes = await parcelAPI.getAll({ 
          location: locationId,
          limit: 5,
          sort: '-createdAt'
        })
        setRecentParcels(parcelsRes.data.parcels || [])
      } catch (error) {
        console.error('Failed to fetch parcels:', error)
      }
      
    } catch (error: any) {
      toast.error('Failed to load location details')
      console.error('Error fetching location:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await fetchLocationData()
    setRefreshing(false)
    toast.success('Data refreshed')
  }

  const handleEdit = () => {
    setEditing(true)
  }

  const handleCancel = () => {
    setEditing(false)
    setEditForm(location || {})
  }

  const handleSave = async () => {
    if (!location) return
    
    setSaving(true)
    try {
      const response = await locationAPI.update(locationId, editForm)
      setLocation(response.data)
      setEditing(false)
      toast.success('Location updated successfully')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update location')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this location? This action cannot be undone.')) return
    
    try {
      await locationAPI.delete(locationId)
      toast.success('Location deleted successfully')
      router.push('/dashboard/locations')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete location')
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setEditForm(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof Location] as object || {}),
        [field]: value
      }
    }))
  }

  const getStatusBadge = () => {
    if (!location) return null
    
    if (!location.isOnline) {
      return {
        label: 'Offline',
        color: 'bg-red-100 text-red-800',
        icon: XCircle
      }
    }
    
    switch (location.status) {
      case 'active':
        return {
          label: 'Active',
          color: 'bg-green-100 text-green-800',
          icon: CheckCircle
        }
      case 'maintenance':
        return {
          label: 'Maintenance',
          color: 'bg-yellow-100 text-yellow-800',
          icon: AlertCircle
        }
      default:
        return {
          label: 'Inactive',
          color: 'bg-gray-100 text-gray-800',
          icon: XCircle
        }
    }
  }

  const getStatusColor = () => {
    if (!location) return 'bg-gray-500'
    if (!location.isOnline) return 'bg-red-500'
    if (location.status === 'maintenance') return 'bg-yellow-500'
    return location.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
  }

  const formatAddress = () => {
    if (!location) return ''
    return `${location.address.street}, ${location.address.city}, ${location.address.state}, ${location.address.country}`
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return format(new Date(dateString), 'MMM d, yyyy h:mm a')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded-2xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-32 bg-gray-200 rounded-xl"></div>
              <div className="h-32 bg-gray-200 rounded-xl"></div>
              <div className="h-32 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!location) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-8">
        <div className="max-w-6xl mx-auto text-center py-12">
          <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Location not found</h2>
          <p className="text-gray-600 mb-6">The location you're looking for doesn't exist or has been deleted.</p>
          <Link
            href="/dashboard/locations"
            className="px-6 py-3 bg-pepper-500 text-white rounded-lg hover:bg-pepper-600 transition"
          >
            Back to Locations
          </Link>
        </div>
      </div>
    )
  }

  const statusBadge = getStatusBadge()
  const StatusIcon = statusBadge?.icon || MapPin

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard/locations"
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{location.name}</h1>
                <p className="text-gray-600">{formatAddress()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title="Refresh"
              >
                <RefreshCw className={cn("h-5 w-5 text-gray-600", refreshing && "animate-spin")} />
              </button>
              {!editing ? (
                <>
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 bg-pepper-500 text-white rounded-lg hover:bg-pepper-600 transition flex items-center space-x-2"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition flex items-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center space-x-2"
                  >
                    <X className="h-4 w-4" />
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center space-x-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-soft p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Status</div>
                <div className="flex items-center space-x-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
                  <span className="font-medium capitalize">
                    {!location.isOnline ? 'Offline' : location.status}
                  </span>
                </div>
              </div>
              <div className="p-2 bg-gray-100 rounded-lg">
                <StatusIcon className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-soft p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Type</div>
                <div className="font-medium mt-1">
                  {location.type === 'locker' ? 'Smart Locker' : 'Staffed Hub'}
                </div>
              </div>
              <div className="p-2 bg-gray-100 rounded-lg">
                {location.type === 'locker' ? (
                  <Zap className="h-5 w-5 text-gray-600" />
                ) : (
                  <Users className="h-5 w-5 text-gray-600" />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-soft p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Capacity</div>
                <div className="font-medium mt-1">
                  {stats ? `${stats.activeParcels}/${location.capacity || 100}` : 'N/A'}
                </div>
              </div>
              <div className="p-2 bg-gray-100 rounded-lg">
                <Package className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-soft p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Last Updated</div>
                <div className="font-medium mt-1 text-sm">
                  {formatDateTime(location.updatedAt)}
                </div>
              </div>
              <div className="p-2 bg-gray-100 rounded-lg">
                <Clock className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Address & Coordinates */}
            <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Location Details</h3>
              
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location Name
                    </label>
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      value={editForm.address?.street || ''}
                      onChange={(e) => handleNestedChange('address', 'street', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={editForm.address?.city || ''}
                        onChange={(e) => handleNestedChange('address', 'city', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        value={editForm.address?.state || ''}
                        onChange={(e) => handleNestedChange('address', 'state', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      value={editForm.address?.country || ''}
                      onChange={(e) => handleNestedChange('address', 'country', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={editForm.coordinates?.lat || ''}
                        onChange={(e) => handleNestedChange('coordinates', 'lat', parseFloat(e.target.value))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={editForm.coordinates?.lng || ''}
                        onChange={(e) => handleNestedChange('coordinates', 'lng', parseFloat(e.target.value))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                      />
                    </div>
                  </div>
                  
                  {location.type === 'locker' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Capacity (compartments)
                      </label>
                      <input
                        type="number"
                        value={editForm.capacity || ''}
                        onChange={(e) => handleInputChange('capacity', parseInt(e.target.value))}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Location Name</div>
                      <div className="font-medium">{location.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Type</div>
                      <div className="font-medium">
                        {location.type === 'locker' ? 'Smart Locker' : 'Staffed Hub'}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500">Full Address</div>
                    <div className="font-medium">{formatAddress()}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Coordinates</div>
                      <div className="font-medium">
                        {location.coordinates.lat.toFixed(6)}, {location.coordinates.lng.toFixed(6)}
                      </div>
                    </div>
                    {location.type === 'locker' && (
                      <div>
                        <div className="text-sm text-gray-500">Capacity</div>
                        <div className="font-medium">{location.capacity || 100} compartments</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Contact & Hours */}
            <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Contact & Operating Hours</h3>
              
              {editing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={editForm.contact?.phone || ''}
                      onChange={(e) => handleNestedChange('contact', 'phone', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editForm.contact?.email || ''}
                      onChange={(e) => handleNestedChange('contact', 'email', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Opens
                      </label>
                      <input
                        type="time"
                        value={editForm.hours?.opens || ''}
                        onChange={(e) => handleNestedChange('hours', 'opens', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Closes
                      </label>
                      <input
                        type="time"
                        value={editForm.hours?.closes || ''}
                        onChange={(e) => handleNestedChange('hours', 'closes', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timezone
                    </label>
                    <input
                      type="text"
                      value={editForm.hours?.timezone || ''}
                      onChange={(e) => handleNestedChange('hours', 'timezone', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={editForm.isOnline}
                      onChange={(e) => handleInputChange('isOnline', e.target.checked)}
                      className="h-5 w-5 text-pepper-600 rounded"
                    />
                    <div>
                      <label className="font-medium text-gray-900">Location is online</label>
                      <p className="text-sm text-gray-600">
                        Online locations are visible and available for deliveries
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={editForm.status || 'active'}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Phone</div>
                      <div className="font-medium flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{location.contact.phone}</span>
                      </div>
                    </div>
                    {location.contact.email && (
                      <div>
                        <div className="text-sm text-gray-500">Email</div>
                        <div className="font-medium flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span>{location.contact.email}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Operating Hours</div>
                      <div className="font-medium">
                        {location.hours.opens} - {location.hours.closes}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Timezone</div>
                      <div className="font-medium">{location.hours.timezone}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <div className="text-sm text-gray-500">Created</div>
                      <div className="font-medium text-sm">{formatDateTime(location.createdAt)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Last Updated</div>
                      <div className="font-medium text-sm">{formatDateTime(location.updatedAt)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Stats & Recent Activity */}
          <div className="space-y-6">
            {/* Performance Stats */}
            <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Performance Stats</h3>
              
              {stats ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Total Parcels</span>
                      <span className="font-bold">{stats.totalParcels}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${Math.min(100, (stats.totalParcels / 100) * 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Active Parcels</span>
                      <span className="font-bold">{stats.activeParcels}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500"
                        style={{ width: `${(stats.activeParcels / (stats.totalParcels || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Completed</span>
                      <span className="font-bold">{stats.completedParcels}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${(stats.completedParcels / (stats.totalParcels || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Utilization Rate</span>
                      <span className="text-2xl font-bold text-pepper-600">{stats.utilization}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  No stats available
                </div>
              )}
            </div>

            {/* Recent Parcels */}
            <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Recent Parcels</h3>
                <Link
                  href={`/dashboard/parcels?location=${locationId}`}
                  className="text-sm text-pepper-600 hover:text-pepper-700"
                >
                  View all
                </Link>
              </div>
              
              <div className="space-y-3">
                {recentParcels.length > 0 ? (
                  recentParcels.map((parcel) => (
                    <Link
                      key={parcel._id}
                      href={`/dashboard/parcels/${parcel._id}`}
                      className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">{parcel.trackingNumber}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          parcel.status === 'picked_up' ? "bg-green-100 text-green-800" :
                          parcel.status === 'in_transit' ? "bg-yellow-100 text-yellow-800" :
                          parcel.status === 'ready_for_pickup' ? "bg-blue-100 text-blue-800" :
                          "bg-gray-100 text-gray-800"
                        )}>
                          {parcel.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{parcel.customer.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(parcel.createdAt), 'MMM d, h:mm a')}
                      </p>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    No recent parcels
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-pepper-600 to-pepper-500 rounded-xl p-6 text-white">
              <h3 className="font-bold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link href={`/dashboard/parcels/create?location=${locationId}`}>
                  <button className="w-full px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition font-medium text-sm">
                    Create Parcel at this Location
                  </button>
                </Link>
                <Link href={`/dashboard/analytics?location=${locationId}`}>
                  <button className="w-full px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition font-medium text-sm">
                    View Location Analytics
                  </button>
                </Link>
                <button
                  onClick={() => {
                    const mapsUrl = `https://www.google.com/maps?q=${location.coordinates.lat},${location.coordinates.lng}`
                    window.open(mapsUrl, '_blank')
                  }}
                  className="w-full px-4 py-2 bg-white text-pepper-600 rounded-lg hover:bg-gray-100 transition font-medium text-sm"
                >
                  Open in Google Maps
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}