// components/dashboard/recent-parcels.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Package, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  MoreVertical,
  ExternalLink,
  Truck,
  MapPin,
  User,
  DollarSign
} from 'lucide-react'
import { useRealTime } from '@/components/providers/realtime-provider'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface RecentParcelsProps {
  parcels?: any[]
  loading?: boolean
}

const statusConfig = {
  picked_up: { 
    icon: CheckCircle, 
    color: 'text-green-600', 
    bg: 'bg-green-100', 
    label: 'Picked Up' 
  },
  delivered: { 
    icon: CheckCircle, 
    color: 'text-green-600', 
    bg: 'bg-green-100', 
    label: 'Delivered' 
  },
  in_transit: { 
    icon: Truck, 
    color: 'text-blue-600', 
    bg: 'bg-blue-100', 
    label: 'In Transit' 
  },
  ready_for_pickup: { 
    icon: Package, 
    color: 'text-green-600', 
    bg: 'bg-green-100', 
    label: 'Ready' 
  },
  at_location: { 
    icon: MapPin, 
    color: 'text-purple-600', 
    bg: 'bg-purple-100', 
    label: 'At Location' 
  },
  created: { 
    icon: Clock, 
    color: 'text-gray-600', 
    bg: 'bg-gray-100', 
    label: 'Created' 
  },
  delivery_failed: { 
    icon: AlertCircle, 
    color: 'text-red-600', 
    bg: 'bg-red-100', 
    label: 'Failed' 
  },
  default: { 
    icon: Package, 
    color: 'text-gray-600', 
    bg: 'bg-gray-100', 
    label: 'Pending' 
  }
}

export function RecentParcels({ parcels = [], loading = false }: RecentParcelsProps) {
  const { emitEvent } = useRealTime()
  const [stats, setStats] = useState({
    todayCount: 0,
    totalValue: 0,
    successRate: 0
  })

  useEffect(() => {
    if (parcels.length > 0) {
      calculateStats()
    }
  }, [parcels])

  const calculateStats = () => {
    const today = new Date().toDateString()
    
    const todayCount = parcels.filter(p => 
      new Date(p.createdAt).toDateString() === today
    ).length

    const totalValue = parcels.reduce((sum, p) => 
      sum + (p.payment?.amount || 0), 0
    )

    const successful = parcels.filter(p => 
      p.delivery?.status === 'picked_up' || p.delivery?.status === 'delivered'
    ).length

    const successRate = parcels.length > 0 
      ? Math.round((successful / parcels.length) * 100)
      : 0

    setStats({ todayCount, totalValue, successRate })
  }

  const getStatusConfig = (status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.default
  }

  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'Unknown'
    }
  }

  const handleStatusUpdate = (id: string, newStatus: string) => {
    // Emit real-time event
    emitEvent('update-parcel-status', { 
      parcelId: id, 
      status: newStatus 
    })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-6 bg-gray-200 rounded w-32 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Recent Parcels</h3>
          <p className="text-sm text-gray-500">
            {parcels.length > 0 ? `Latest ${parcels.length} parcels` : 'No parcels yet'}
          </p>
        </div>
        <Link 
          href="/dashboard/parcels" 
          className="text-sm text-pepper-600 font-medium hover:text-pepper-700"
        >
          View all →
        </Link>
      </div>

      <div className="space-y-4">
        {parcels.length > 0 ? (
          parcels.map((parcel) => {
            const config = getStatusConfig(parcel.delivery?.status)
            const Icon = config.icon
            
            return (
              <Link 
                key={parcel._id} 
                href={`/dashboard/parcels/${parcel._id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${config.bg}`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {parcel.trackingNumber || 'Unknown'}
                      </p>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <User className="h-3 w-3" />
                        <span>{parcel.customer?.name || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">
                      ₦{parcel.payment?.amount?.toLocaleString() || '0'}
                    </span>
                    <button 
                      className="p-1 opacity-0 group-hover:opacity-100 transition"
                      onClick={(e) => {
                        e.preventDefault()
                        // Handle more options
                      }}
                    >
                      <MoreVertical className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-600">
                        {parcel.delivery?.location?.name || 'No location'}
                      </span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500">
                      {getTimeAgo(parcel.createdAt)}
                    </span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                    {config.label}
                  </span>
                </div>

                {/* Item preview */}
                {parcel.items && parcel.items.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    {parcel.items[0].description}
                    {parcel.items.length > 1 && ` +${parcel.items.length - 1} more`}
                  </div>
                )}

                {/* COD indicator */}
                {parcel.payment?.isCOD && !parcel.payment?.collected && (
                  <div className="mt-2 flex items-center space-x-1 text-xs text-yellow-600">
                    <DollarSign className="h-3 w-3" />
                    <span>COD pending collection</span>
                  </div>
                )}
              </Link>
            )
          })
        ) : (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h4 className="font-medium text-gray-900 mb-1">No parcels yet</h4>
            <p className="text-sm text-gray-500 mb-4">Create your first parcel to get started</p>
            <Link href="/dashboard/parcels/create">
              <button className="px-4 py-2 bg-pepper-500 text-white rounded-lg hover:bg-pepper-600 transition text-sm font-medium">
                Create Parcel
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {parcels.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.todayCount}</p>
              <p className="text-xs text-gray-500">Today's Parcels</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                ₦{(stats.totalValue / 1000).toFixed(0)}K
              </p>
              <p className="text-xs text-gray-500">Total Value</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.successRate}%</p>
              <p className="text-xs text-gray-500">Success Rate</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}