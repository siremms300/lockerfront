// app/dashboard/parcels/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Package,
  User,
  MapPin,
  DollarSign,
  Clock,
  Calendar,
  Edit,
  Trash2,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck,
  QrCode,
  Printer,
  RefreshCw,
  Copy,
  Mail,
  Phone,
  Map,
  History,
  FileText,
  Download,
  Send
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { parcelAPI, locationAPI } from '@/lib/api'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { format } from 'date-fns'
import QRCode from 'react-qr-code'

interface Parcel {
  _id: string
  trackingNumber: string
  merchant: string
  customer: {
    name: string
    phone: string
    email?: string
  }
  items: Array<{
    description: string
    quantity: number
    value: number
    weight: number
  }>
  delivery: {
    pickupType: 'locker' | 'staffed_hub'
    location?: {
      _id: string
      name: string
      address: {
        street: string
        city: string
        state: string
      }
    }
    assignedCompartment?: string
    lockerSize?: 'small' | 'medium' | 'large'
    status: string
    pickupDeadline: string
  }
  payment: {
    isCOD: boolean
    amount: number
    collected: boolean
  }
  codes: {
    customerPin: string
    qrCode: string
  }
  events: Array<{
    status: string
    description: string
    timestamp: string
  }>
  createdAt: string
  updatedAt: string
}

interface Location {
  _id: string
  name: string
  address: {
    street: string
    city: string
    state: string
  }
}

export default function ParcelDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const parcelId = params.id as string

  const [parcel, setParcel] = useState<Parcel | null>(null)
  const [location, setLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [copied, setCopied] = useState(false)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchParcelData()
  }, [parcelId])

  const fetchParcelData = async () => {
    try {
      setLoading(true)
      
      // Fetch parcel details
      const response = await parcelAPI.getById(parcelId)
      setParcel(response.data)
      
      // Fetch location details if available
      if (response.data.delivery?.location?._id) {
        try {
          const locationRes = await locationAPI.getById(response.data.delivery.location._id)
          setLocation(locationRes.data)
        } catch (error) {
          console.error('Failed to fetch location:', error)
        }
      }
      
    } catch (error: any) {
      toast.error('Failed to load parcel details')
      console.error('Error fetching parcel:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await fetchParcelData()
    setRefreshing(false)
    toast.success('Data refreshed')
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this parcel? This action cannot be undone.')) return
    
    try {
      await parcelAPI.delete(parcelId)
      toast.success('Parcel deleted successfully')
      router.push('/dashboard/parcels')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete parcel')
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdating(true)
    try {
      await parcelAPI.update(parcelId, {
        delivery: { status: newStatus }
      })
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`)
      fetchParcelData()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const handleMarkCODCollected = async () => {
    setUpdating(true)
    try {
      await parcelAPI.update(parcelId, {
        payment: { collected: true }
      })
      toast.success('COD marked as collected')
      fetchParcelData()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update COD status')
    } finally {
      setUpdating(false)
    }
  }

  const handleResendCode = async () => {
    setUpdating(true)
    try {
      // In a real app, you'd call an API to resend the code via SMS/email
      toast.success('Pickup code resent to customer')
    } catch (error) {
      toast.error('Failed to resend code')
    } finally {
      setUpdating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Copied to clipboard')
  }

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; bg: string; icon: any }> = {
      created: {
        label: 'Created',
        color: 'text-gray-600',
        bg: 'bg-gray-100',
        icon: Package
      },
      in_transit: {
        label: 'In Transit',
        color: 'text-blue-600',
        bg: 'bg-blue-100',
        icon: Truck
      },
      at_location: {
        label: 'At Location',
        color: 'text-purple-600',
        bg: 'bg-purple-100',
        icon: MapPin
      },
      ready_for_pickup: {
        label: 'Ready for Pickup',
        color: 'text-green-600',
        bg: 'bg-green-100',
        icon: CheckCircle
      },
      picked_up: {
        label: 'Picked Up',
        color: 'text-green-600',
        bg: 'bg-green-100',
        icon: CheckCircle
      },
      delivery_failed: {
        label: 'Delivery Failed',
        color: 'text-red-600',
        bg: 'bg-red-100',
        icon: XCircle
      },
      return_requested: {
        label: 'Return Requested',
        color: 'text-orange-600',
        bg: 'bg-orange-100',
        icon: AlertCircle
      },
      returned: {
        label: 'Returned',
        color: 'text-gray-600',
        bg: 'bg-gray-100',
        icon: Package
      },
      expired: {
        label: 'Expired',
        color: 'text-gray-600',
        bg: 'bg-gray-100',
        icon: Clock
      },
      cancelled: {
        label: 'Cancelled',
        color: 'text-red-600',
        bg: 'bg-red-100',
        icon: XCircle
      }
    }
    return configs[status] || configs.created
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return format(new Date(dateString), 'MMM d, yyyy h:mm a')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const calculateTotalValue = () => {
    if (!parcel) return 0
    return parcel.items.reduce((sum, item) => sum + (item.value * item.quantity), 0)
  }

  const calculateTotalWeight = () => {
    if (!parcel) return 0
    return parcel.items.reduce((sum, item) => sum + (item.weight * item.quantity), 0)
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

  if (!parcel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-8">
        <div className="max-w-6xl mx-auto text-center py-12">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Parcel not found</h2>
          <p className="text-gray-600 mb-6">The parcel you're looking for doesn't exist or has been deleted.</p>
          <Link
            href="/dashboard/parcels"
            className="px-6 py-3 bg-pepper-500 text-white rounded-lg hover:bg-pepper-600 transition"
          >
            Back to Parcels
          </Link>
        </div>
      </div>
    )
  }

  const statusConfig = getStatusConfig(parcel.delivery.status)
  const StatusIcon = statusConfig.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard/parcels"
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-3xl font-bold text-gray-900">{parcel.trackingNumber}</h1>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-sm font-medium inline-flex items-center space-x-1",
                    statusConfig.bg,
                    statusConfig.color
                  )}>
                    <StatusIcon className="h-4 w-4" />
                    <span>{statusConfig.label}</span>
                  </span>
                </div>
                <p className="text-gray-600 mt-1">
                  Created {formatDateTime(parcel.createdAt)}
                </p>
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
              <Link href={`/dashboard/parcels/${parcelId}/edit`}>
                <button className="px-4 py-2 bg-pepper-500 text-white rounded-lg hover:bg-pepper-600 transition flex items-center space-x-2">
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </button>
              </Link>
              <button
                onClick={handleDelete}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-soft p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Total Value</div>
                <div className="text-xl font-bold text-gray-900 mt-1">
                  {formatCurrency(calculateTotalValue())}
                </div>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-soft p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Total Weight</div>
                <div className="text-xl font-bold text-gray-900 mt-1">
                  {calculateTotalWeight().toFixed(1)} kg
                </div>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-soft p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Items</div>
                <div className="text-xl font-bold text-gray-900 mt-1">
                  {parcel.items.length}
                </div>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-soft p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500">Pickup Type</div>
                <div className="text-xl font-bold text-gray-900 mt-1 capitalize">
                  {parcel.delivery.pickupType === 'locker' ? 'Smart Locker' : 'Staffed Hub'}
                </div>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                {parcel.delivery.pickupType === 'locker' ? (
                  <Package className="h-5 w-5 text-yellow-600" />
                ) : (
                  <User className="h-5 w-5 text-yellow-600" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Information</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Name</div>
                    <div className="font-medium">{parcel.customer.name}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Phone className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Phone</div>
                    <div className="font-medium">{parcel.customer.phone}</div>
                  </div>
                </div>
                
                {parcel.customer.email && (
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Mail className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Email</div>
                      <div className="font-medium">{parcel.customer.email}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Items List */}
            <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Items</h3>
              <div className="space-y-4">
                {parcel.items.map((item, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{item.description}</h4>
                      <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Value:</span>
                        <span className="ml-2 font-medium">{formatCurrency(item.value)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Weight:</span>
                        <span className="ml-2 font-medium">{item.weight} kg</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Location */}
            {location && (
              <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Pickup Location</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <MapPin className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-medium">{location.name}</div>
                      <div className="text-sm text-gray-600">
                        {location.address.street}, {location.address.city}, {location.address.state}
                      </div>
                    </div>
                  </div>
                  
                  {parcel.delivery.assignedCompartment && (
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Package className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Compartment</div>
                        <div className="font-medium">{parcel.delivery.assignedCompartment}</div>
                      </div>
                    </div>
                  )}
                  
                  {parcel.delivery.lockerSize && (
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Package className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Locker Size</div>
                        <div className="font-medium capitalize">{parcel.delivery.lockerSize}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Actions & Timeline */}
          <div className="space-y-6">
            {/* Pickup Code & QR */}
            <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Pickup Information</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Pickup Code</div>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 px-4 py-3 bg-gray-100 rounded-lg font-mono text-lg">
                      {parcel.codes.customerPin}
                    </code>
                    <button
                      onClick={() => copyToClipboard(parcel.codes.customerPin)}
                      className="p-3 hover:bg-gray-100 rounded-lg transition"
                      title="Copy code"
                    >
                      {copied ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Copy className="h-5 w-5 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-2">QR Code</div>
                  <div className="flex items-center justify-center p-4 bg-white border border-gray-200 rounded-lg">
                    {showQR ? (
                      <div className="text-center">
                        <QRCode value={parcel.codes.qrCode || parcel.trackingNumber} size={150} />
                        <button
                          onClick={() => setShowQR(false)}
                          className="mt-2 text-sm text-pepper-600 hover:text-pepper-700"
                        >
                          Hide QR
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowQR(true)}
                        className="flex flex-col items-center py-4"
                      >
                        <QrCode className="h-12 w-12 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">Click to show QR code</span>
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={handleResendCode}
                    disabled={updating}
                    className="flex-1 px-4 py-2 bg-pepper-500 text-white rounded-lg hover:bg-pepper-600 transition flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    <span>Resend Code</span>
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                    <Printer className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Status Actions */}
            <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Update Status</h3>
              
              <div className="space-y-3">
                {parcel.delivery.status === 'created' && (
                  <button
                    onClick={() => handleStatusUpdate('in_transit')}
                    disabled={updating}
                    className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <Truck className="h-4 w-4" />
                    <span>Mark In Transit</span>
                  </button>
                )}
                
                {parcel.delivery.status === 'in_transit' && (
                  <button
                    onClick={() => handleStatusUpdate('at_location')}
                    disabled={updating}
                    className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <MapPin className="h-4 w-4" />
                    <span>Mark At Location</span>
                  </button>
                )}
                
                {parcel.delivery.status === 'at_location' && (
                  <button
                    onClick={() => handleStatusUpdate('ready_for_pickup')}
                    disabled={updating}
                    className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Mark Ready for Pickup</span>
                  </button>
                )}
                
                {parcel.delivery.status === 'ready_for_pickup' && (
                  <button
                    onClick={() => handleStatusUpdate('picked_up')}
                    disabled={updating}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Mark Picked Up</span>
                  </button>
                )}
                
                {parcel.delivery.status !== 'picked_up' && parcel.delivery.status !== 'delivered' && (
                  <button
                    onClick={() => handleStatusUpdate('delivery_failed')}
                    disabled={updating}
                    className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Mark Failed</span>
                  </button>
                )}
              </div>
              
              {parcel.payment.isCOD && !parcel.payment.collected && parcel.delivery.status === 'picked_up' && (
                <div className="mt-4">
                  <button
                    onClick={handleMarkCODCollected}
                    disabled={updating}
                    className="w-full px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <DollarSign className="h-4 w-4" />
                    <span>Mark COD Collected</span>
                  </button>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Timeline</h3>
              
              <div className="space-y-4">
                {parcel.events.map((event, index) => {
                  const eventConfig = getStatusConfig(event.status)
                  const EventIcon = eventConfig.icon
                  
                  return (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={cn(
                        "p-2 rounded-full",
                        eventConfig.bg
                      )}>
                        <EventIcon className={cn("h-4 w-4", eventConfig.color)} />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{event.description}</p>
                        <p className="text-sm text-gray-500">{formatDateTime(event.timestamp)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Information</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Method</span>
                  <span className="font-medium">
                    {parcel.payment.isCOD ? 'Cash on Delivery' : 'Prepaid'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount</span>
                  <span className="font-bold text-lg">{formatCurrency(parcel.payment.amount)}</span>
                </div>
                
                {parcel.payment.isCOD && (
                  <div className="flex justify-between pt-3 border-t border-gray-200">
                    <span className="text-gray-600">Collection Status</span>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-sm font-medium",
                      parcel.payment.collected
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    )}>
                      {parcel.payment.collected ? 'Collected' : 'Pending'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Deadlines */}
            <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Deadlines</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pickup Deadline</span>
                  <span className="font-medium">
                    {formatDateTime(parcel.delivery.pickupDeadline)}
                  </span>
                </div>
                
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <span className="text-gray-600">Created</span>
                  <span className="text-sm text-gray-500">{formatDateTime(parcel.createdAt)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated</span>
                  <span className="text-sm text-gray-500">{formatDateTime(parcel.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}