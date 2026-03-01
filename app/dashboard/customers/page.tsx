// app/dashboard/customers/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Package, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle,
  Search,
  Filter,
  Eye,
  MessageSquare,
  QrCode,
  Bell,
  Calendar,
  DollarSign,
  TrendingUp,
  RefreshCw,
  MoreVertical,
  Shield,
  AlertCircle,
  UserPlus,
  Download,
  BarChart3,
  Star,
  Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '@/lib/socket'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { customerAPI, parcelAPI } from '@/lib/api'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'

const DynamicQRCode = dynamic(() => import('react-qr-code'), { ssr: false })

interface Customer {
  _id: string
  name: string
  phone: string
  email?: string
  totalParcels: number
  completedParcels: number
  pendingParcels: number
  totalSpent: number
  joinedDate: string
  lastPickup?: string
  preferredLocation?: {
    _id: string
    name: string
  }
  status: 'active' | 'inactive' | 'new'
  notificationPreference: {
    sms: boolean
    whatsapp: boolean
    email: boolean
  }
  rating?: number
  notes?: string
}

interface Pickup {
  _id: string
  trackingNumber: string
  parcelId: string
  location: {
    name: string
    type: 'locker' | 'staffed_hub'
  }
  status: string
  scheduledTime: string
  pickupTime?: string
  pickupCode: string
  qrCode: string
  items: Array<{
    description: string
    value: number
  }>
  payment: {
    isCOD: boolean
    amount: number
    collected: boolean
    paymentMethod?: string
  }
}

interface CustomerAnalytics {
  overview: {
    totalCustomers: number
    activeCustomers: number
    newCustomers: number
    totalRevenue: number
    avgRating: number
  }
  segments: {
    highValue: number
    regular: number
    lowValue: number
  }
}

export default function CustomersPage() {
  const socket = useSocket()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [pickups, setPickups] = useState<Pickup[]>([])
  const [analytics, setAnalytics] = useState<CustomerAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [pickupsLoading, setPickupsLoading] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
  const [selectedPickup, setSelectedPickup] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'new' | 'inactive'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<'customers' | 'pickups' | 'analytics'>('customers')
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'sms' | 'whatsapp' | 'email'>('all')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  // Fetch customers on mount and when filters change
  useEffect(() => {
    fetchCustomers()
    fetchAnalytics()
  }, [selectedStatus, searchQuery, pagination.page])

  // Fetch customer pickups when a customer is selected
  useEffect(() => {
    if (selectedCustomer) {
      fetchCustomerPickups(selectedCustomer)
    }
  }, [selectedCustomer])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const response = await customerAPI.getAll({
        status: selectedStatus,
        search: searchQuery,
        page: pagination.page,
        limit: pagination.limit
      })
      
      setCustomers(response.data.customers)
      setPagination(response.data.pagination)
    } catch (error: any) {
      toast.error('Failed to load customers')
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await customerAPI.getAnalytics()
      setAnalytics(response.data)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    }
  }

  const fetchCustomerPickups = async (customerId: string) => {
    try {
      setPickupsLoading(true)
      const response = await customerAPI.getPickups(customerId)
      setPickups(response.data)
    } catch (error) {
      toast.error('Failed to load customer pickups')
      console.error('Error fetching pickups:', error)
    } finally {
      setPickupsLoading(false)
    }
  }

  const refreshData = async () => {
    setIsRefreshing(true)
    await Promise.all([
      fetchCustomers(),
      fetchAnalytics()
    ])
    if (selectedCustomer) {
      await fetchCustomerPickups(selectedCustomer)
    }
    setIsRefreshing(false)
    toast.success('Data refreshed')
  }

  const getStatusIcon = (status: Customer['status']) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'inactive': return <XCircle className="h-4 w-4 text-gray-500" />
      case 'new': return <AlertCircle className="h-4 w-4 text-blue-500" />
    }
  }

  const getPickupStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Calendar className="h-4 w-4 text-blue-500" />
      case 'ready_for_pickup': return <Package className="h-4 w-4 text-green-500" />
      case 'in_transit': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'picked_up': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'delivery_failed': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <Package className="h-4 w-4 text-gray-500" />
    }
  }

  const getPickupStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'ready_for_pickup': return 'bg-green-100 text-green-800'
      case 'in_transit': return 'bg-yellow-100 text-yellow-800'
      case 'picked_up': return 'bg-green-100 text-green-800'
      case 'delivery_failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy • h:mm a')
  }

  const getTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  }

  const handleSendNotification = async (customerId: string, type: 'sms' | 'whatsapp' | 'email') => {
    toast.success(`${type.toUpperCase()} notification sent to customer`)
    // In real app, this would call your notification API
  }

  const handleResendPickupCode = async (pickupId: string) => {
    toast.success('Pickup code resent to customer')
    // In real app, this would regenerate and send the code
  }

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return
    
    try {
      await customerAPI.delete(customerId)
      toast.success('Customer deleted successfully')
      fetchCustomers()
      if (selectedCustomer === customerId) {
        setSelectedCustomer(null)
      }
    } catch (error) {
      toast.error('Failed to delete customer')
    }
  }

  const stats = analytics ? {
    totalCustomers: analytics.overview.totalCustomers,
    activeCustomers: analytics.overview.activeCustomers,
    newCustomers: analytics.overview.newCustomers,
    totalRevenue: analytics.overview.totalRevenue,
    avgRating: analytics.overview.avgRating.toFixed(1)
  } : {
    totalCustomers: 0,
    activeCustomers: 0,
    newCustomers: 0,
    totalRevenue: 0,
    avgRating: '0.0'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600">Manage customer pickups and notifications</p>
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
              onClick={() => setViewMode('customers')}
              className={cn(
                "px-3 py-1.5 rounded text-sm font-medium transition",
                viewMode === 'customers' ? "bg-white shadow-sm text-pepper-600" : "text-gray-600 hover:text-gray-900"
              )}
            >
              Customers
            </button>
            <button
              onClick={() => setViewMode('pickups')}
              className={cn(
                "px-3 py-1.5 rounded text-sm font-medium transition",
                viewMode === 'pickups' ? "bg-white shadow-sm text-pepper-600" : "text-gray-600 hover:text-gray-900"
              )}
            >
              Pickups
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
            href="/dashboard/customers/new"
            className="px-4 py-2 pepper-gradient text-white rounded-lg hover:shadow-lg transition flex items-center space-x-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Customer</span>
          </Link>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'bg-blue-500' },
          { label: 'Active Customers', value: stats.activeCustomers, icon: CheckCircle, color: 'bg-green-500' },
          { label: 'New This Month', value: stats.newCustomers, icon: UserPlus, color: 'bg-purple-500' },
          { label: 'Total Revenue', value: `₦${(stats.totalRevenue / 1000).toFixed(0)}K`, icon: DollarSign, color: 'bg-emerald-500' },
          { label: 'Avg. Rating', value: stats.avgRating, icon: Star, color: 'bg-yellow-500', suffix: '★' },
          { label: 'Pickups Today', value: '0', icon: Package, color: 'bg-cyan-500' }, // You'd calculate this
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
                  <div className="text-2xl font-bold text-gray-900">{stat.value}{stat.suffix || ''}</div>
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
                placeholder={
                  viewMode === 'customers' 
                    ? "Search customers by name, phone, or email..." 
                    : "Search pickups by tracking number..."
                }
                className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20 focus:outline-none transition"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-500" />
              {viewMode === 'customers' ? (
                <select
                  className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20 focus:outline-none transition"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="new">New</option>
                  <option value="inactive">Inactive</option>
                </select>
              ) : (
                <select
                  className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20 focus:outline-none transition"
                  value={notificationFilter}
                  onChange={(e) => setNotificationFilter(e.target.value as any)}
                >
                  <option value="all">All Pickups</option>
                  <option value="ready">Ready for Pickup</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Customers View */}
      {viewMode === 'customers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customers List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-soft overflow-hidden border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Customer Directory</h3>
                <p className="text-gray-600">
                  {loading ? 'Loading...' : `${customers.length} customers found`}
                </p>
              </div>

              {loading ? (
                <div className="p-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-pepper-500 mx-auto mb-4" />
                  <p className="text-gray-600">Loading customers...</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  <AnimatePresence>
                    {customers.map((customer) => (
                      <motion.div
                        key={customer._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedCustomer(customer._id === selectedCustomer ? null : customer._id)}
                        className={cn(
                          "p-4 cursor-pointer transition-colors",
                          selectedCustomer === customer._id
                            ? "bg-pepper-50 border-l-4 border-pepper-500"
                            : "hover:bg-gray-50"
                        )}
                      >
                        <div className="flex items-start space-x-4">
                          {/* Customer Avatar */}
                          <div className="flex-shrink-0">
                            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                              {customer.name.split(' ').map(n => n[0]).join('')}
                            </div>
                          </div>

                          {/* Customer Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-bold text-gray-900">{customer.name}</h4>
                                  {customer.status === 'new' && (
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                      New
                                    </span>
                                  )}
                                  {customer.rating && (
                                    <span className="flex items-center text-sm text-gray-600">
                                      {customer.rating}★
                                    </span>
                                  )}
                                </div>
                                
                                <div className="mt-2 flex items-center space-x-4 text-sm">
                                  <div className="flex items-center space-x-1">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-600">{customer.phone}</span>
                                  </div>
                                  {customer.email && (
                                    <div className="flex items-center space-x-1">
                                      <Mail className="h-4 w-4 text-gray-400" />
                                      <span className="text-gray-600">{customer.email}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center space-x-1">
                                    <Bell className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-600 capitalize">
                                      {Object.entries(customer.notificationPreference)
                                        .filter(([_, enabled]) => enabled)
                                        .map(([type]) => type)
                                        .join(', ') || 'None'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <button 
                                  className="p-1 hover:bg-gray-100 rounded"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleSendNotification(customer._id, 'sms')
                                  }}
                                >
                                  <MessageSquare className="h-4 w-4 text-gray-500" />
                                </button>
                                <button className="p-1 hover:bg-gray-100 rounded">
                                  <MoreVertical className="h-4 w-4 text-gray-500" />
                                </button>
                              </div>
                            </div>

                            {/* Stats & Info */}
                            <div className="mt-4 grid grid-cols-4 gap-4">
                              <div className="text-center">
                                <div className="text-lg font-bold text-gray-900">{customer.totalParcels}</div>
                                <div className="text-xs text-gray-500">Total Parcels</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-gray-900">{customer.completedParcels}</div>
                                <div className="text-xs text-gray-500">Completed</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-gray-900">{customer.pendingParcels}</div>
                                <div className="text-xs text-gray-500">Pending</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-gray-900">₦{(customer.totalSpent / 1000).toFixed(0)}K</div>
                                <div className="text-xs text-gray-500">Spent</div>
                              </div>
                            </div>

                            {/* Additional Info */}
                            <div className="mt-3 flex items-center space-x-4">
                              {customer.preferredLocation && (
                                <div className="flex items-center space-x-1">
                                  <MapPin className="h-4 w-4 text-gray-400" />
                                  <span className="text-xs text-gray-600">{customer.preferredLocation.name}</span>
                                </div>
                              )}
                              {customer.lastPickup && (
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4 text-gray-400" />
                                  <span className="text-xs text-gray-600">Last pickup: {getTimeAgo(customer.lastPickup)}</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                <span className="text-xs text-gray-600">Joined {format(new Date(customer.joinedDate), 'MMM yyyy')}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Empty State */}
                  {customers.length === 0 && !loading && (
                    <div className="p-12 text-center">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
                      <p className="text-gray-600">
                        {searchQuery || selectedStatus !== 'all'
                          ? 'Try adjusting your filters'
                          : 'Add your first customer to get started'
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

          {/* Sidebar - Selected Customer or Stats */}
          <div className="space-y-6">
            <AnimatePresence>
              {selectedCustomer ? (() => {
                const customer = customers.find(c => c._id === selectedCustomer)
                if (!customer) return null

                return (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white rounded-xl shadow-soft p-6 border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{customer.name}</h3>
                        <p className="text-gray-600">Customer Details</p>
                      </div>
                      <button
                        onClick={() => setSelectedCustomer(null)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Contact Info */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium text-gray-900">{customer.phone}</div>
                              <div className="text-sm text-gray-600">Primary phone</div>
                            </div>
                          </div>
                          {customer.email && (
                            <div className="flex items-center space-x-3">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <div>
                                <div className="font-medium text-gray-900">{customer.email}</div>
                                <div className="text-sm text-gray-600">Email address</div>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center space-x-3">
                            <Bell className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium text-gray-900 capitalize">
                                {Object.entries(customer.notificationPreference)
                                  .filter(([_, enabled]) => enabled)
                                  .map(([type]) => type)
                                  .join(', ') || 'No preferences'}
                              </div>
                              <div className="text-sm text-gray-600">Notification preference</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Customer Stats */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Customer Statistics</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-blue-50 p-3 rounded">
                            <div className="text-sm text-blue-600">Total Parcels</div>
                            <div className="text-xl font-bold">{customer.totalParcels}</div>
                          </div>
                          <div className="bg-green-50 p-3 rounded">
                            <div className="text-sm text-green-600">Success Rate</div>
                            <div className="text-xl font-bold">
                              {customer.totalParcels > 0 
                                ? Math.round((customer.completedParcels / customer.totalParcels) * 100) 
                                : 0}%
                            </div>
                          </div>
                          <div className="bg-purple-50 p-3 rounded">
                            <div className="text-sm text-purple-600">Total Spent</div>
                            <div className="text-xl font-bold">₦{customer.totalSpent.toLocaleString()}</div>
                          </div>
                          <div className="bg-yellow-50 p-3 rounded">
                            <div className="text-sm text-yellow-600">Avg. Value</div>
                            <div className="text-xl font-bold">
                              ₦{customer.totalParcels > 0 
                                ? (customer.totalSpent / customer.totalParcels).toLocaleString(undefined, { maximumFractionDigits: 0 })
                                : 0}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Active Pickups */}
                      {pickups.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Recent Pickups</h4>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {pickups
                              .filter(p => p.status !== 'picked_up')
                              .slice(0, 3)
                              .map(pickup => (
                                <div key={pickup._id} className="p-3 bg-gray-50 rounded-lg border">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium">{pickup.trackingNumber}</span>
                                    <span className={cn(
                                      "px-2 py-0.5 rounded text-xs font-medium",
                                      getPickupStatusColor(pickup.status)
                                    )}>
                                      {pickup.status.replace(/_/g, ' ')}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {pickup.location.name} • {format(new Date(pickup.scheduledTime), 'MMM d')}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex space-x-3">
                        <Link href={`/dashboard/customers/${customer._id}/edit`} className="flex-1">
                          <button className="w-full px-4 py-2 bg-pepper-500 text-white rounded-lg hover:bg-pepper-600 transition font-medium">
                            Edit Customer
                          </button>
                        </Link>
                        <button 
                          onClick={() => handleDeleteCustomer(customer._id)}
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
                      <h3 className="font-bold text-gray-900">Customer Insights</h3>
                      <p className="text-gray-600">Quick statistics</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {analytics && [
                      { 
                        label: 'Active Customers', 
                        value: analytics.overview.activeCustomers, 
                        total: analytics.overview.totalCustomers, 
                        color: 'bg-green-500' 
                      },
                      { 
                        label: 'New Customers', 
                        value: analytics.overview.newCustomers, 
                        total: analytics.overview.totalCustomers, 
                        color: 'bg-blue-500' 
                      },
                      { 
                        label: 'High Value', 
                        value: analytics.segments.highValue, 
                        total: analytics.overview.totalCustomers, 
                        color: 'bg-purple-500' 
                      },
                      { 
                        label: 'Avg. Customer Value', 
                        value: `₦${(analytics.overview.totalRevenue / (analytics.overview.totalCustomers || 1) / 1000).toFixed(0)}K`, 
                        total: 'Per Customer', 
                        color: 'bg-yellow-500' 
                      },
                    ].map((stat, index) => (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700">{stat.label}</span>
                          <span className="text-sm font-medium">
                            {stat.value} {stat.total !== 'Per Customer' && `/ ${stat.total}`}
                          </span>
                        </div>
                        {typeof stat.value === 'number' && typeof stat.total === 'number' && (
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

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
                    <div className="space-y-2">
                      <button className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition font-medium text-sm">
                        Send Bulk Notification
                      </button>
                      <button className="w-full px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition font-medium text-sm">
                        Export Customer List
                      </button>
                      <Link href="/dashboard/customers/analytics">
                        <button className="w-full px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition font-medium text-sm">
                          View Detailed Analytics
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </AnimatePresence>

            {/* Quick Stats */}
            <div className="bg-gradient-to-r from-pepper-600 to-pepper-500 rounded-xl p-6 text-white">
              <div className="flex items-center space-x-3 mb-4">
                <Package className="h-6 w-6" />
                <h3 className="font-bold">Today's Overview</h3>
              </div>
              <p className="text-pepper-100 text-sm mb-4">
                Real-time customer activity
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-pepper-200">New Customers</span>
                  <span>{analytics?.overview.newCustomers || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-pepper-200">Active Pickups</span>
                  <span>0</span> {/* You'd calculate this */}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-pepper-200">COD Collected</span>
                  <span>₦0</span> {/* You'd calculate this */}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-pepper-200">Pending Pickups</span>
                  <span>0</span> {/* You'd calculate this */}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pickups View - You'd implement this similarly */}
      {viewMode === 'pickups' && (
        <div className="bg-white rounded-xl shadow-soft p-12 text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Pickup Management Coming Soon</h3>
          <p className="text-gray-600">This view is being built with real data</p>
        </div>
      )}

      {/* Analytics View */}
      {viewMode === 'analytics' && analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Analytics */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Customer Analytics</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Customers', value: analytics.overview.totalCustomers, change: '+12%' },
                  { label: 'Active Rate', value: `${Math.round((analytics.overview.activeCustomers / analytics.overview.totalCustomers) * 100)}%`, change: '+3%' },
                  { label: 'Avg. Parcels/Customer', value: (customers.reduce((sum, c) => sum + c.totalParcels, 0) / (customers.length || 1)).toFixed(1), change: '+0.5' },
                  { label: 'Avg. Rating', value: analytics.overview.avgRating.toFixed(1), change: '+0.2' },
                ].map((metric, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                    <div className="text-sm text-gray-600">{metric.label}</div>
                    <div className="text-xs text-green-600 mt-1">{metric.change} this month</div>
                  </div>
                ))}
              </div>

              {/* Customer Segments */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Customer Segments</h4>
                <div className="space-y-3">
                  {[
                    { segment: 'High Value', customers: analytics.segments.highValue, avgValue: '₦125K', color: 'bg-green-500' },
                    { segment: 'Regular', customers: analytics.segments.regular, avgValue: '₦45K', color: 'bg-blue-500' },
                    { segment: 'Low Value', customers: analytics.segments.lowValue, avgValue: '₦8K', color: 'bg-yellow-500' },
                  ].map((segment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 ${segment.color} rounded-full`} />
                        <div>
                          <div className="font-medium text-gray-900">{segment.segment}</div>
                          <div className="text-sm text-gray-600">Avg. value: {segment.avgValue}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{segment.customers}</div>
                        <div className="text-sm text-gray-600">customers</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Reports */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">Retention Metrics</h3>
              <div className="space-y-4">
                {[
                  { label: 'Repeat Customer Rate', value: '68%', trend: '+5%' },
                  { label: 'Avg. Customer Lifespan', value: '8.2 months', trend: '+1.2' },
                  { label: 'Churn Rate', value: '12%', trend: '-2%' },
                  { label: 'Customer Satisfaction', value: '4.6/5', trend: '+0.3' },
                ].map((metric, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-700">{metric.label}</span>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{metric.value}</div>
                      <div className="text-xs text-green-600">{metric.trend}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-xl p-6 text-white">
              <h3 className="font-bold mb-4">Generate Reports</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition font-medium text-sm">
                  Customer Activity Report
                </button>
                <button className="w-full px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition font-medium text-sm">
                  Retention Analysis
                </button>
                <button className="w-full px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-gray-100 transition font-medium text-sm">
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








































































// // app/dashboard/customers/page.tsx
// 'use client'

// import { useState, useEffect } from 'react'
// import { 
//   Users, 
//   Package, 
//   MapPin, 
//   Phone, 
//   Mail, 
//   Clock, 
//   CheckCircle, 
//   XCircle,
//   Search,
//   Filter,
//   Eye,
//   MessageSquare,
//   QrCode,
//   Bell,
//   Calendar,
//   DollarSign,
//   TrendingUp,
//   RefreshCw,
//   MoreVertical,
//   Shield,
//   AlertCircle,
//   UserPlus,
//   Download,
//   BarChart3
// } from 'lucide-react'
// import { motion, AnimatePresence } from 'framer-motion'
// import { useSocket } from '@/lib/socket'
// import { toast } from 'react-hot-toast'
// import { cn } from '@/lib/utils'
// import dynamic from 'next/dynamic'

// const DynamicQRCode = dynamic(() => import('react-qr-code'), { ssr: false })

// interface Customer {
//   id: string
//   name: string
//   phone: string
//   email?: string
//   totalParcels: number
//   completedParcels: number
//   pendingParcels: number
//   totalSpent: number
//   joinedDate: string
//   lastPickup?: string
//   preferredLocation?: string
//   status: 'active' | 'inactive' | 'new'
//   notificationPreference: 'sms' | 'whatsapp' | 'email' | 'all'
//   rating?: number
// }

// interface Pickup {
//   id: string
//   customerId: string
//   trackingNumber: string
//   parcelId: string
//   location: string
//   locationType: 'locker' | 'staffed_hub'
//   status: 'scheduled' | 'ready' | 'in_progress' | 'completed' | 'expired' | 'cancelled'
//   scheduledTime: string
//   pickupTime?: string
//   pickupCode: string
//   qrCode: string
//   items: Array<{
//     description: string
//     value: number
//   }>
//   payment: {
//     isCOD: boolean
//     amount: number
//     collected: boolean
//     paymentMethod?: string
//   }
//   notifications: Array<{
//     type: 'sms' | 'whatsapp' | 'email'
//     sent: boolean
//     sentAt?: string
//   }>
// }

// export default function CustomersPage() {
//   const socket = useSocket()
//   const [customers, setCustomers] = useState<Customer[]>([
//     {
//       id: '1',
//       name: 'Adebayo Johnson',
//       phone: '+234 801 234 5678',
//       email: 'adebayo@example.com',
//       totalParcels: 24,
//       completedParcels: 22,
//       pendingParcels: 2,
//       totalSpent: 245000,
//       joinedDate: '2023-11-15',
//       lastPickup: '2024-01-15T10:30:00Z',
//       preferredLocation: 'Ikeja City Mall',
//       status: 'active',
//       notificationPreference: 'whatsapp',
//       rating: 4.8
//     },
//     {
//       id: '2',
//       name: 'Chinwe Okoro',
//       phone: '+234 802 345 6789',
//       email: 'chinwe@example.com',
//       totalParcels: 12,
//       completedParcels: 11,
//       pendingParcels: 1,
//       totalSpent: 128000,
//       joinedDate: '2024-01-05',
//       lastPickup: '2024-01-14T15:45:00Z',
//       preferredLocation: 'Lekki Phase 1 Hub',
//       status: 'active',
//       notificationPreference: 'sms',
//       rating: 4.5
//     },
//     {
//       id: '3',
//       name: 'Emeka Nwankwo',
//       phone: '+234 803 456 7890',
//       totalParcels: 8,
//       completedParcels: 7,
//       pendingParcels: 1,
//       totalSpent: 89000,
//       joinedDate: '2024-01-10',
//       lastPickup: '2024-01-13T09:15:00Z',
//       preferredLocation: 'ABC Pharmacy',
//       status: 'active',
//       notificationPreference: 'all',
//       rating: 4.9
//     },
//     {
//       id: '4',
//       name: 'Fatima Bello',
//       phone: '+234 804 567 8901',
//       email: 'fatima@example.com',
//       totalParcels: 3,
//       completedParcels: 2,
//       pendingParcels: 1,
//       totalSpent: 45000,
//       joinedDate: '2024-01-12',
//       lastPickup: '2024-01-14T14:20:00Z',
//       preferredLocation: 'Yaba Tech Hub',
//       status: 'new',
//       notificationPreference: 'email'
//     },
//     {
//       id: '5',
//       name: 'Grace Oluwaseun',
//       phone: '+234 805 678 9012',
//       totalParcels: 16,
//       completedParcels: 15,
//       pendingParcels: 1,
//       totalSpent: 187000,
//       joinedDate: '2023-12-20',
//       lastPickup: '2024-01-12T11:10:00Z',
//       preferredLocation: 'Surulere Supermarket',
//       status: 'inactive',
//       notificationPreference: 'whatsapp',
//       rating: 4.7
//     },
//     {
//       id: '6',
//       name: 'Ibrahim Musa',
//       phone: '+234 806 789 0123',
//       email: 'ibrahim@example.com',
//       totalParcels: 5,
//       completedParcels: 4,
//       pendingParcels: 1,
//       totalSpent: 65000,
//       joinedDate: '2024-01-08',
//       lastPickup: '2024-01-11T16:30:00Z',
//       preferredLocation: 'Apapa Port',
//       status: 'active',
//       notificationPreference: 'sms'
//     },
//     {
//       id: '7',
//       name: 'Joyce Adekunle',
//       phone: '+234 807 890 1234',
//       email: 'joyce@example.com',
//       totalParcels: 32,
//       completedParcels: 31,
//       pendingParcels: 1,
//       totalSpent: 412000,
//       joinedDate: '2023-10-05',
//       lastPickup: '2024-01-15T09:45:00Z',
//       preferredLocation: 'Ojota Park',
//       status: 'active',
//       notificationPreference: 'all',
//       rating: 4.6
//     },
//     {
//       id: '8',
//       name: 'Kolawole Taiwo',
//       phone: '+234 808 901 2345',
//       totalParcels: 1,
//       completedParcels: 0,
//       pendingParcels: 1,
//       totalSpent: 15000,
//       joinedDate: '2024-01-14',
//       status: 'new',
//       notificationPreference: 'whatsapp'
//     }
//   ])

//   const [pickups, setPickups] = useState<Pickup[]>([
//     {
//       id: '1',
//       customerId: '1',
//       trackingNumber: 'LKR-4892',
//       parcelId: '1',
//       location: 'Ikeja City Mall',
//       locationType: 'locker',
//       status: 'in_progress',
//       scheduledTime: '2024-01-15T10:00:00Z',
//       pickupCode: 'A5B8C2',
//       qrCode: 'LKR-4892-A5B8C2',
//       items: [
//         { description: 'iPhone 15 Pro', value: 850000 },
//         { description: 'AirPods Pro', value: 150000 }
//       ],
//       payment: {
//         isCOD: true,
//         amount: 1000000,
//         collected: false
//       },
//       notifications: [
//         { type: 'sms', sent: true, sentAt: '2024-01-15T09:00:00Z' },
//         { type: 'whatsapp', sent: true, sentAt: '2024-01-15T09:05:00Z' }
//       ]
//     },
//     {
//       id: '2',
//       customerId: '2',
//       trackingNumber: 'LKR-4893',
//       parcelId: '2',
//       location: 'Lekki Phase 1 Hub',
//       locationType: 'locker',
//       status: 'ready',
//       scheduledTime: '2024-01-15T11:30:00Z',
//       pickupCode: 'D3E9F1',
//       qrCode: 'LKR-4893-D3E9F1',
//       items: [
//         { description: 'Designer Handbag', value: 75000 }
//       ],
//       payment: {
//         isCOD: false,
//         amount: 75000,
//         collected: true
//       },
//       notifications: [
//         { type: 'sms', sent: true, sentAt: '2024-01-15T10:30:00Z' },
//         { type: 'whatsapp', sent: false }
//       ]
//     },
//     {
//       id: '3',
//       customerId: '3',
//       trackingNumber: 'LKR-4894',
//       parcelId: '3',
//       location: 'ABC Pharmacy',
//       locationType: 'staffed_hub',
//       status: 'completed',
//       scheduledTime: '2024-01-14T15:00:00Z',
//       pickupTime: '2024-01-14T15:45:00Z',
//       pickupCode: 'G7H2I6',
//       qrCode: 'LKR-4894-G7H2I6',
//       items: [
//         { description: 'Laptop', value: 320000 },
//         { description: 'Wireless Mouse', value: 15000 }
//       ],
//       payment: {
//         isCOD: true,
//         amount: 335000,
//         collected: true,
//         paymentMethod: 'cash'
//       },
//       notifications: [
//         { type: 'sms', sent: true, sentAt: '2024-01-14T14:00:00Z' },
//         { type: 'whatsapp', sent: true, sentAt: '2024-01-14T14:05:00Z' },
//         { type: 'email', sent: true, sentAt: '2024-01-14T14:10:00Z' }
//       ]
//     },
//     {
//       id: '4',
//       customerId: '4',
//       trackingNumber: 'LKR-4895',
//       parcelId: '4',
//       location: 'Yaba Tech Hub',
//       locationType: 'locker',
//       status: 'expired',
//       scheduledTime: '2024-01-13T12:00:00Z',
//       pickupCode: 'J4K8L2',
//       qrCode: 'LKR-4895-J4K8L2',
//       items: [
//         { description: 'Smart Watch', value: 45000 }
//       ],
//       payment: {
//         isCOD: false,
//         amount: 45000,
//         collected: true
//       },
//       notifications: [
//         { type: 'sms', sent: true, sentAt: '2024-01-13T11:00:00Z' },
//         { type: 'whatsapp', sent: true, sentAt: '2024-01-13T11:05:00Z' },
//         { type: 'email', sent: true, sentAt: '2024-01-13T11:10:00Z' }
//       ]
//     },
//     {
//       id: '5',
//       customerId: '5',
//       trackingNumber: 'LKR-4896',
//       parcelId: '5',
//       location: 'Surulere Supermarket',
//       locationType: 'staffed_hub',
//       status: 'scheduled',
//       scheduledTime: '2024-01-16T09:00:00Z',
//       pickupCode: 'M9N3O7',
//       qrCode: 'LKR-4896-M9N3O7',
//       items: [
//         { description: 'Kitchen Blender', value: 35000 },
//         { description: 'Mixer', value: 25000 }
//       ],
//       payment: {
//         isCOD: true,
//         amount: 60000,
//         collected: false
//       },
//       notifications: [
//         { type: 'sms', sent: false },
//         { type: 'whatsapp', sent: false }
//       ]
//     }
//   ])

//   const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null)
//   const [selectedPickup, setSelectedPickup] = useState<string | null>(null)
//   const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'new' | 'inactive'>('all')
//   const [searchQuery, setSearchQuery] = useState('')
//   const [isLoading, setIsLoading] = useState(false)
//   const [viewMode, setViewMode] = useState<'customers' | 'pickups' | 'analytics'>('customers')
//   const [notificationFilter, setNotificationFilter] = useState<'all' | 'sms' | 'whatsapp' | 'email'>('all')

//   // Filter customers based on selections
//   const filteredCustomers = customers.filter(customer => {
//     const matchesStatus = selectedStatus === 'all' || customer.status === selectedStatus
//     const matchesSearch = searchQuery === '' || 
//       customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       customer.phone.includes(searchQuery) ||
//       customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
//     return matchesStatus && matchesSearch
//   })

//   // Filter pickups based on selections
//   const filteredPickups = pickups.filter(pickup => {
//     const matchesNotification = notificationFilter === 'all' || 
//       pickup.notifications.some(n => n.type === notificationFilter)
//     return matchesNotification
//   })

//   // Handle socket updates
//   useEffect(() => {
//     if (!socket) return

//     socket.on('pickup-updated', (update: any) => {
//       setPickups(prev => prev.map(pickup => 
//         pickup.id === update.pickupId 
//           ? { 
//               ...pickup, 
//               status: update.status,
//               pickupTime: update.pickupTime,
//               'payment.collected': update.paymentCollected
//             }
//           : pickup
//       ))
//     })

//     socket.on('customer-notification-sent', (update: any) => {
//       setPickups(prev => prev.map(pickup => 
//         pickup.id === update.pickupId
//           ? {
//               ...pickup,
//               notifications: [...pickup.notifications, {
//                 type: update.notificationType,
//                 sent: true,
//                 sentAt: new Date().toISOString()
//               }]
//             }
//           : pickup
//       ))
//     })

//     return () => {
//       socket.off('pickup-updated')
//       socket.off('customer-notification-sent')
//     }
//   }, [socket])

//   const refreshData = async () => {
//     setIsLoading(true)
//     setTimeout(() => {
//       setIsLoading(false)
//       toast.success('Data refreshed')
//     }, 1000)
//   }

//   const getStatusIcon = (status: Customer['status']) => {
//     switch (status) {
//       case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />
//       case 'inactive': return <XCircle className="h-4 w-4 text-gray-500" />
//       case 'new': return <AlertCircle className="h-4 w-4 text-blue-500" />
//     }
//   }

//   const getPickupStatusIcon = (status: Pickup['status']) => {
//     switch (status) {
//       case 'scheduled': return <Calendar className="h-4 w-4 text-blue-500" />
//       case 'ready': return <Package className="h-4 w-4 text-green-500" />
//       case 'in_progress': return <Clock className="h-4 w-4 text-yellow-500" />
//       case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />
//       case 'expired': return <XCircle className="h-4 w-4 text-red-500" />
//       case 'cancelled': return <XCircle className="h-4 w-4 text-gray-500" />
//     }
//   }

//   const getPickupStatusColor = (status: Pickup['status']) => {
//     switch (status) {
//       case 'scheduled': return 'bg-blue-100 text-blue-800'
//       case 'ready': return 'bg-green-100 text-green-800'
//       case 'in_progress': return 'bg-yellow-100 text-yellow-800'
//       case 'completed': return 'bg-green-100 text-green-800'
//       case 'expired': return 'bg-red-100 text-red-800'
//       case 'cancelled': return 'bg-gray-100 text-gray-800'
//     }
//   }

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       month: 'short',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     })
//   }

//   const getTimeAgo = (dateString: string) => {
//     const date = new Date(dateString)
//     const now = new Date()
//     const diffMs = now.getTime() - date.getTime()
//     const diffMins = Math.floor(diffMs / 60000)
//     const diffHours = Math.floor(diffMins / 60)
//     const diffDays = Math.floor(diffHours / 24)

//     if (diffDays > 0) return `${diffDays}d ago`
//     if (diffHours > 0) return `${diffHours}h ago`
//     return `${diffMins}m ago`
//   }

//   const stats = {
//     totalCustomers: customers.length,
//     activeCustomers: customers.filter(c => c.status === 'active').length,
//     newCustomers: customers.filter(c => c.status === 'new').length,
//     totalPickups: pickups.length,
//     activePickups: pickups.filter(p => p.status === 'ready' || p.status === 'in_progress').length,
//     totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
//     avgRating: customers.filter(c => c.rating).reduce((sum, c) => sum + (c.rating || 0), 0) / customers.filter(c => c.rating).length
//   }

//   const sendNotification = (pickupId: string, type: 'sms' | 'whatsapp' | 'email') => {
//     toast.success(`${type.toUpperCase()} notification sent`)
//     // In real app, this would call your notification API
//   }

//   const resendPickupCode = (pickupId: string) => {
//     toast.success('Pickup code resent to customer')
//     // In real app, this would regenerate and send the code
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
//           <p className="text-gray-600">Manage customer pickups and notifications</p>
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
//               onClick={() => setViewMode('customers')}
//               className={cn(
//                 "px-3 py-1.5 rounded text-sm font-medium transition",
//                 viewMode === 'customers' ? "bg-white shadow-sm text-pepper-600" : "text-gray-600 hover:text-gray-900"
//               )}
//             >
//               Customers
//             </button>
//             <button
//               onClick={() => setViewMode('pickups')}
//               className={cn(
//                 "px-3 py-1.5 rounded text-sm font-medium transition",
//                 viewMode === 'pickups' ? "bg-white shadow-sm text-pepper-600" : "text-gray-600 hover:text-gray-900"
//               )}
//             >
//               Pickups
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
//             href="/dashboard/customers/new"
//             className="px-4 py-2 pepper-gradient text-white rounded-lg hover:shadow-lg transition flex items-center space-x-2"
//           >
//             <UserPlus className="h-4 w-4" />
//             <span>Add Customer</span>
//           </a>
//         </div>
//       </div>

//       {/* Stats Bar */}
//       <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
//         {[
//           { label: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'bg-blue-500' },
//           { label: 'Active Customers', value: stats.activeCustomers, icon: CheckCircle, color: 'bg-green-500' },
//           { label: 'New This Month', value: stats.newCustomers, icon: UserPlus, color: 'bg-purple-500' },
//           { label: 'Active Pickups', value: stats.activePickups, icon: Package, color: 'bg-yellow-500' },
//           { label: 'Total Revenue', value: `₦${(stats.totalRevenue / 1000).toFixed(0)}K`, icon: DollarSign, color: 'bg-emerald-500' },
//           { label: 'Avg. Rating', value: stats.avgRating.toFixed(1), icon: TrendingUp, color: 'bg-cyan-500', suffix: '★' },
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
//                   <div className="text-2xl font-bold text-gray-900">{stat.value}{stat.suffix || ''}</div>
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
//                 placeholder={
//                   viewMode === 'customers' 
//                     ? "Search customers by name, phone, or email..." 
//                     : "Search pickups by tracking number or customer..."
//                 }
//                 className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20 focus:outline-none transition"
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//               />
//             </div>
//           </div>

//           <div className="flex items-center space-x-4">
//             <div className="flex items-center space-x-2">
//               <Filter className="h-5 w-5 text-gray-500" />
//               {viewMode === 'customers' ? (
//                 <select
//                   className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20 focus:outline-none transition"
//                   value={selectedStatus}
//                   onChange={(e) => setSelectedStatus(e.target.value as any)}
//                 >
//                   <option value="all">All Status</option>
//                   <option value="active">Active</option>
//                   <option value="new">New</option>
//                   <option value="inactive">Inactive</option>
//                 </select>
//               ) : (
//                 <select
//                   className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20 focus:outline-none transition"
//                   value={notificationFilter}
//                   onChange={(e) => setNotificationFilter(e.target.value as any)}
//                 >
//                   <option value="all">All Notifications</option>
//                   <option value="sms">SMS</option>
//                   <option value="whatsapp">WhatsApp</option>
//                   <option value="email">Email</option>
//                 </select>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Main Content - Customers View */}
//       {viewMode === 'customers' && (
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Customers List */}
//           <div className="lg:col-span-2">
//             <div className="bg-white rounded-xl shadow-soft overflow-hidden border border-gray-200">
//               <div className="p-6 border-b border-gray-200">
//                 <h3 className="text-lg font-bold text-gray-900">Customer Directory</h3>
//                 <p className="text-gray-600">{filteredCustomers.length} customers found</p>
//               </div>

//               <div className="divide-y divide-gray-100">
//                 <AnimatePresence>
//                   {filteredCustomers.map((customer) => (
//                     <motion.div
//                       key={customer.id}
//                       initial={{ opacity: 0 }}
//                       animate={{ opacity: 1 }}
//                       exit={{ opacity: 0 }}
//                       onClick={() => setSelectedCustomer(customer.id === selectedCustomer ? null : customer.id)}
//                       className={cn(
//                         "p-4 cursor-pointer transition-colors",
//                         selectedCustomer === customer.id
//                           ? "bg-pepper-50 border-l-4 border-pepper-500"
//                           : "hover:bg-gray-50"
//                       )}
//                     >
//                       <div className="flex items-start space-x-4">
//                         {/* Customer Avatar */}
//                         <div className="flex-shrink-0">
//                           <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
//                             {customer.name.split(' ').map(n => n[0]).join('')}
//                           </div>
//                         </div>

//                         {/* Customer Info */}
//                         <div className="flex-1 min-w-0">
//                           <div className="flex items-start justify-between">
//                             <div>
//                               <div className="flex items-center space-x-2">
//                                 <h4 className="font-bold text-gray-900">{customer.name}</h4>
//                                 {customer.status === 'new' && (
//                                   <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
//                                     New
//                                   </span>
//                                 )}
//                                 {customer.rating && (
//                                   <span className="flex items-center text-sm text-gray-600">
//                                     {customer.rating}★
//                                   </span>
//                                 )}
//                               </div>
                              
//                               <div className="mt-2 flex items-center space-x-4 text-sm">
//                                 <div className="flex items-center space-x-1">
//                                   <Phone className="h-4 w-4 text-gray-400" />
//                                   <span className="text-gray-600">{customer.phone}</span>
//                                 </div>
//                                 {customer.email && (
//                                   <div className="flex items-center space-x-1">
//                                     <Mail className="h-4 w-4 text-gray-400" />
//                                     <span className="text-gray-600">{customer.email}</span>
//                                   </div>
//                                 )}
//                                 <div className="flex items-center space-x-1">
//                                   <Bell className="h-4 w-4 text-gray-400" />
//                                   <span className="text-gray-600 capitalize">{customer.notificationPreference}</span>
//                                 </div>
//                               </div>
//                             </div>

//                             <div className="flex items-center space-x-2">
//                               <button className="p-1 hover:bg-gray-100 rounded">
//                                 <MessageSquare className="h-4 w-4 text-gray-500" />
//                               </button>
//                               <button className="p-1 hover:bg-gray-100 rounded">
//                                 <MoreVertical className="h-4 w-4 text-gray-500" />
//                               </button>
//                             </div>
//                           </div>

//                           {/* Stats & Info */}
//                           <div className="mt-4 grid grid-cols-4 gap-4">
//                             <div className="text-center">
//                               <div className="text-lg font-bold text-gray-900">{customer.totalParcels}</div>
//                               <div className="text-xs text-gray-500">Total Parcels</div>
//                             </div>
//                             <div className="text-center">
//                               <div className="text-lg font-bold text-gray-900">{customer.completedParcels}</div>
//                               <div className="text-xs text-gray-500">Completed</div>
//                             </div>
//                             <div className="text-center">
//                               <div className="text-lg font-bold text-gray-900">{customer.pendingParcels}</div>
//                               <div className="text-xs text-gray-500">Pending</div>
//                             </div>
//                             <div className="text-center">
//                               <div className="text-lg font-bold text-gray-900">₦{(customer.totalSpent / 1000).toFixed(0)}K</div>
//                               <div className="text-xs text-gray-500">Spent</div>
//                             </div>
//                           </div>

//                           {/* Additional Info */}
//                           <div className="mt-3 flex items-center space-x-4">
//                             {customer.preferredLocation && (
//                               <div className="flex items-center space-x-1">
//                                 <MapPin className="h-4 w-4 text-gray-400" />
//                                 <span className="text-xs text-gray-600">{customer.preferredLocation}</span>
//                               </div>
//                             )}
//                             {customer.lastPickup && (
//                               <div className="flex items-center space-x-1">
//                                 <Clock className="h-4 w-4 text-gray-400" />
//                                 <span className="text-xs text-gray-600">Last pickup: {getTimeAgo(customer.lastPickup)}</span>
//                               </div>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     </motion.div>
//                   ))}
//                 </AnimatePresence>

//                 {/* Empty State */}
//                 {filteredCustomers.length === 0 && (
//                   <div className="p-12 text-center">
//                     <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//                     <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
//                     <p className="text-gray-600">
//                       {searchQuery || selectedStatus !== 'all'
//                         ? 'Try adjusting your filters'
//                         : 'Add your first customer to get started'
//                       }
//                     </p>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Sidebar - Selected Customer or Stats */}
//           <div className="space-y-6">
//             <AnimatePresence>
//               {selectedCustomer ? (() => {
//                 const customer = customers.find(c => c.id === selectedCustomer)
//                 if (!customer) return null

//                 const customerPickups = pickups.filter(p => p.customerId === customer.id)

//                 return (
//                   <motion.div
//                     initial={{ opacity: 0, y: 20 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     exit={{ opacity: 0, y: -20 }}
//                     className="bg-white rounded-xl shadow-soft p-6 border border-gray-200"
//                   >
//                     <div className="flex items-start justify-between mb-6">
//                       <div>
//                         <h3 className="text-xl font-bold text-gray-900">{customer.name}</h3>
//                         <p className="text-gray-600">Customer Details</p>
//                       </div>
//                       <button
//                         onClick={() => setSelectedCustomer(null)}
//                         className="p-2 hover:bg-gray-100 rounded-lg"
//                       >
//                         ✕
//                       </button>
//                     </div>

//                     <div className="space-y-6">
//                       {/* Contact Info */}
//                       <div>
//                         <h4 className="font-medium text-gray-900 mb-3">Contact Information</h4>
//                         <div className="space-y-3">
//                           <div className="flex items-center space-x-3">
//                             <Phone className="h-4 w-4 text-gray-400" />
//                             <div>
//                               <div className="font-medium text-gray-900">{customer.phone}</div>
//                               <div className="text-sm text-gray-600">Primary phone</div>
//                             </div>
//                           </div>
//                           {customer.email && (
//                             <div className="flex items-center space-x-3">
//                               <Mail className="h-4 w-4 text-gray-400" />
//                               <div>
//                                 <div className="font-medium text-gray-900">{customer.email}</div>
//                                 <div className="text-sm text-gray-600">Email address</div>
//                               </div>
//                             </div>
//                           )}
//                           <div className="flex items-center space-x-3">
//                             <Bell className="h-4 w-4 text-gray-400" />
//                             <div>
//                               <div className="font-medium text-gray-900 capitalize">{customer.notificationPreference}</div>
//                               <div className="text-sm text-gray-600">Notification preference</div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>

//                       {/* Customer Stats */}
//                       <div>
//                         <h4 className="font-medium text-gray-900 mb-3">Customer Statistics</h4>
//                         <div className="grid grid-cols-2 gap-3">
//                           <div className="bg-blue-50 p-3 rounded">
//                             <div className="text-sm text-blue-600">Total Parcels</div>
//                             <div className="text-xl font-bold">{customer.totalParcels}</div>
//                           </div>
//                           <div className="bg-green-50 p-3 rounded">
//                             <div className="text-sm text-green-600">Success Rate</div>
//                             <div className="text-xl font-bold">
//                               {customer.totalParcels > 0 
//                                 ? Math.round((customer.completedParcels / customer.totalParcels) * 100) 
//                                 : 0}%
//                             </div>
//                           </div>
//                           <div className="bg-purple-50 p-3 rounded">
//                             <div className="text-sm text-purple-600">Total Spent</div>
//                             <div className="text-xl font-bold">₦{customer.totalSpent.toLocaleString()}</div>
//                           </div>
//                           <div className="bg-yellow-50 p-3 rounded">
//                             <div className="text-sm text-yellow-600">Avg. Value</div>
//                             <div className="text-xl font-bold">
//                               ₦{customer.totalParcels > 0 
//                                 ? (customer.totalSpent / customer.totalParcels).toLocaleString(undefined, { maximumFractionDigits: 0 })
//                                 : 0}
//                             </div>
//                           </div>
//                         </div>
//                       </div>

//                       {/* Active Pickups */}
//                       {customerPickups.length > 0 && (
//                         <div>
//                           <h4 className="font-medium text-gray-900 mb-3">Active Pickups</h4>
//                           <div className="space-y-2">
//                             {customerPickups
//                               .filter(p => p.status === 'ready' || p.status === 'in_progress')
//                               .map(pickup => (
//                                 <div key={pickup.id} className="p-3 bg-gray-50 rounded-lg border">
//                                   <div className="flex items-center justify-between mb-2">
//                                     <span className="font-medium">{pickup.trackingNumber}</span>
//                                     <span className={cn(
//                                       "px-2 py-0.5 rounded text-xs font-medium",
//                                       getPickupStatusColor(pickup.status)
//                                     )}>
//                                       {pickup.status.replace('_', ' ')}
//                                     </span>
//                                   </div>
//                                   <div className="text-sm text-gray-600">
//                                     {pickup.location} • {formatDate(pickup.scheduledTime)}
//                                   </div>
//                                 </div>
//                               ))}
//                           </div>
//                         </div>
//                       )}

//                       {/* Actions */}
//                       <div className="flex space-x-3">
//                         <button className="flex-1 px-4 py-2 bg-pepper-500 text-white rounded-lg hover:bg-pepper-600 transition font-medium">
//                           Send Message
//                         </button>
//                         <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">
//                           View History
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
//                       <h3 className="font-bold text-gray-900">Customer Insights</h3>
//                       <p className="text-gray-600">Quick statistics</p>
//                     </div>
//                   </div>

//                   <div className="space-y-4">
//                     {[
//                       { label: 'Active Customers', value: stats.activeCustomers, total: stats.totalCustomers, color: 'bg-green-500' },
//                       { label: 'New Customers', value: stats.newCustomers, total: stats.totalCustomers, color: 'bg-blue-500' },
//                       { label: 'Pickup Success Rate', value: '94%', total: '100%', color: 'bg-purple-500' },
//                       { label: 'Avg. Customer Value', value: '₦32K', total: 'Per Month', color: 'bg-yellow-500' },
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
//                             style={{ width: typeof stat.value === 'string' && stat.value.includes('%')
//                               ? stat.value 
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
//                         Send Bulk Notification
//                       </button>
//                       <button className="w-full px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition font-medium text-sm">
//                         Export Customer List
//                       </button>
//                       <button className="w-full px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition font-medium text-sm">
//                         View Pickup Analytics
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </AnimatePresence>

//             {/* Pickup Stats */}
//             <div className="bg-gradient-to-r from-pepper-600 to-pepper-500 rounded-xl p-6 text-white">
//               <div className="flex items-center space-x-3 mb-4">
//                 <Package className="h-6 w-6" />
//                 <h3 className="font-bold">Pickup Status</h3>
//               </div>
//               <p className="text-pepper-100 text-sm mb-4">
//                 Real-time pickup monitoring
//               </p>
//               <div className="space-y-3">
//                 <div className="flex items-center justify-between">
//                   <span className="text-pepper-200">Ready for Pickup</span>
//                   <span>{pickups.filter(p => p.status === 'ready').length}</span>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span className="text-pepper-200">In Progress</span>
//                   <span>{pickups.filter(p => p.status === 'in_progress').length}</span>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span className="text-pepper-200">Completed Today</span>
//                   <span>{pickups.filter(p => p.status === 'completed').length}</span>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span className="text-pepper-200">Notifications Sent</span>
//                   <span>{pickups.reduce((sum, p) => sum + p.notifications.filter(n => n.sent).length, 0)}</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Pickups View */}
//       {viewMode === 'pickups' && (
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Pickups List */}
//           <div className="lg:col-span-2">
//             <div className="bg-white rounded-xl shadow-soft overflow-hidden border border-gray-200">
//               <div className="p-6 border-b border-gray-200">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <h3 className="text-lg font-bold text-gray-900">Pickup Management</h3>
//                     <p className="text-gray-600">{filteredPickups.length} pickups found</p>
//                   </div>
//                   <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center space-x-2">
//                     <Bell className="h-4 w-4" />
//                     <span>Send Reminders</span>
//                   </button>
//                 </div>
//               </div>

//               <div className="divide-y divide-gray-100">
//                 {filteredPickups.map(pickup => {
//                   const customer = customers.find(c => c.id === pickup.customerId)

//                   return (
//                     <div 
//                       key={pickup.id} 
//                       className={cn(
//                         "p-6 hover:bg-gray-50 transition cursor-pointer",
//                         selectedPickup === pickup.id && "bg-pepper-50"
//                       )}
//                       onClick={() => setSelectedPickup(pickup.id === selectedPickup ? null : pickup.id)}
//                     >
//                       <div className="flex items-start justify-between">
//                         <div className="flex items-start space-x-4">
//                           <div className="p-3 bg-blue-100 rounded-lg">
//                             {getPickupStatusIcon(pickup.status)}
//                           </div>
//                           <div>
//                             <div className="flex items-center space-x-3">
//                               <h4 className="font-bold text-gray-900">
//                                 {pickup.trackingNumber}
//                               </h4>
//                               <span className={cn(
//                                 "px-2 py-0.5 rounded-full text-xs font-medium",
//                                 getPickupStatusColor(pickup.status)
//                               )}>
//                                 {pickup.status.replace('_', ' ')}
//                               </span>
//                               <span className="text-sm text-gray-600">
//                                 {pickup.locationType === 'locker' ? 'Smart Locker' : 'Staffed Hub'}
//                               </span>
//                             </div>
                            
//                             <div className="mt-2 flex items-center space-x-4">
//                               {customer && (
//                                 <div className="flex items-center space-x-1">
//                                   <Users className="h-4 w-4 text-gray-400" />
//                                   <span className="text-sm text-gray-600">{customer.name}</span>
//                                 </div>
//                               )}
//                               <div className="flex items-center space-x-1">
//                                 <MapPin className="h-4 w-4 text-gray-400" />
//                                 <span className="text-sm text-gray-600">{pickup.location}</span>
//                               </div>
//                               <div className="flex items-center space-x-1">
//                                 <Clock className="h-4 w-4 text-gray-400" />
//                                 <span className="text-sm text-gray-600">{formatDate(pickup.scheduledTime)}</span>
//                               </div>
//                             </div>
//                           </div>
//                         </div>

//                         <div className="flex items-center space-x-2">
//                           <button className="p-2 hover:bg-gray-100 rounded">
//                             <QrCode className="h-4 w-4 text-gray-500" />
//                           </button>
//                           <button className="p-2 hover:bg-gray-100 rounded">
//                             <MoreVertical className="h-4 w-4 text-gray-500" />
//                           </button>
//                         </div>
//                       </div>

//                       {/* Pickup Details */}
//                       <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
//                         {/* Items */}
//                         <div>
//                           <h5 className="font-medium text-gray-900 mb-2">Items</h5>
//                           <div className="space-y-1">
//                             {pickup.items.map((item, index) => (
//                               <div key={index} className="text-sm text-gray-600">
//                                 {item.description} - ₦{item.value.toLocaleString()}
//                               </div>
//                             ))}
//                           </div>
//                         </div>

//                         {/* Payment */}
//                         <div>
//                           <h5 className="font-medium text-gray-900 mb-2">Payment</h5>
//                           <div className="space-y-1">
//                             <div className="text-sm text-gray-600">
//                               {pickup.payment.isCOD ? 'Cash on Delivery' : 'Prepaid'}
//                             </div>
//                             <div className="font-medium">
//                               ₦{pickup.payment.amount.toLocaleString()}
//                             </div>
//                             {pickup.payment.isCOD && (
//                               <div className={cn(
//                                 "text-sm",
//                                 pickup.payment.collected ? "text-green-600" : "text-yellow-600"
//                               )}>
//                                 {pickup.payment.collected ? 'Collected' : 'Pending'}
//                               </div>
//                             )}
//                           </div>
//                         </div>

//                         {/* Notifications */}
//                         <div>
//                           <h5 className="font-medium text-gray-900 mb-2">Notifications</h5>
//                           <div className="flex items-center space-x-2">
//                             {['sms', 'whatsapp', 'email'].map(type => {
//                               const notification = pickup.notifications.find(n => n.type === type)
//                               return (
//                                 <button
//                                   key={type}
//                                   onClick={(e) => {
//                                     e.stopPropagation()
//                                     sendNotification(pickup.id, type as any)
//                                   }}
//                                   className={cn(
//                                     "p-2 rounded-lg flex items-center space-x-1 text-sm",
//                                     notification?.sent
//                                       ? "bg-green-100 text-green-700 hover:bg-green-200"
//                                       : "bg-gray-100 text-gray-600 hover:bg-gray-200"
//                                   )}
//                                   title={notification?.sent 
//                                     ? `Sent at ${notification.sentAt ? formatDate(notification.sentAt) : 'N/A'}` 
//                                     : `Send ${type.toUpperCase()} notification`
//                                   }
//                                 >
//                                   <Bell className="h-3 w-3" />
//                                   <span className="uppercase text-xs">{type}</span>
//                                 </button>
//                               )
//                             })}
//                           </div>
//                         </div>
//                       </div>

//                       {/* Pickup Code */}
//                       <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
//                         <div className="flex items-center justify-between">
//                           <div>
//                             <h5 className="font-medium text-gray-900 mb-1">Pickup Code</h5>
//                             <div className="text-2xl font-bold text-pepper-600 font-mono">
//                               {pickup.pickupCode}
//                             </div>
//                             <p className="text-sm text-gray-600 mt-1">
//                               Provide this code at the {pickup.locationType === 'locker' ? 'locker' : 'hub'}
//                             </p>
//                           </div>
//                           <div className="flex items-center space-x-3">
//                             <button
//                               onClick={(e) => {
//                                 e.stopPropagation()
//                                 resendPickupCode(pickup.id)
//                               }}
//                               className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
//                             >
//                               Resend Code
//                             </button>
//                             <div className="bg-white p-2 rounded border">
//                               <DynamicQRCode
//                                 value={pickup.qrCode}
//                                 size={80}
//                                 level="M"
//                               />
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   )
//                 })}

//                 {/* Empty State */}
//                 {filteredPickups.length === 0 && (
//                   <div className="p-12 text-center">
//                     <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//                     <h3 className="text-lg font-medium text-gray-900 mb-2">No pickups found</h3>
//                     <p className="text-gray-600">
//                       {notificationFilter !== 'all'
//                         ? 'Try adjusting your filters'
//                         : 'No pickups scheduled at the moment'
//                       }
//                     </p>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Sidebar - Selected Pickup or Actions */}
//           <div className="space-y-6">
//             <AnimatePresence>
//               {selectedPickup ? (() => {
//                 const pickup = pickups.find(p => p.id === selectedPickup)
//                 if (!pickup) return null
//                 const customer = customers.find(c => c.id === pickup.customerId)

//                 return (
//                   <motion.div
//                     initial={{ opacity: 0, y: 20 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     exit={{ opacity: 0, y: -20 }}
//                     className="bg-white rounded-xl shadow-soft p-6 border border-gray-200"
//                   >
//                     <div className="flex items-start justify-between mb-6">
//                       <div>
//                         <h3 className="text-xl font-bold text-gray-900">Pickup Details</h3>
//                         <p className="text-gray-600">{pickup.trackingNumber}</p>
//                       </div>
//                       <button
//                         onClick={() => setSelectedPickup(null)}
//                         className="p-2 hover:bg-gray-100 rounded-lg"
//                       >
//                         ✕
//                       </button>
//                     </div>

//                     <div className="space-y-6">
//                       {/* Customer Info */}
//                       {customer && (
//                         <div>
//                           <h4 className="font-medium text-gray-900 mb-3">Customer</h4>
//                           <div className="flex items-center space-x-3">
//                             <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
//                               {customer.name.split(' ').map(n => n[0]).join('')}
//                             </div>
//                             <div>
//                               <div className="font-medium text-gray-900">{customer.name}</div>
//                               <div className="text-sm text-gray-600">{customer.phone}</div>
//                             </div>
//                           </div>
//                         </div>
//                       )}

//                       {/* Location Details */}
//                       <div>
//                         <h4 className="font-medium text-gray-900 mb-3">Pickup Location</h4>
//                         <div className="bg-gray-50 p-4 rounded-lg">
//                           <div className="flex items-center space-x-2 mb-2">
//                             <MapPin className="h-5 w-5 text-gray-500" />
//                             <span className="font-medium">{pickup.location}</span>
//                           </div>
//                           <div className="text-sm text-gray-600">
//                             Type: {pickup.locationType === 'locker' ? 'Smart Locker (24/7)' : 'Staffed Hub'}
//                           </div>
//                           <div className="text-sm text-gray-600">
//                             Scheduled: {formatDate(pickup.scheduledTime)}
//                           </div>
//                           {pickup.pickupTime && (
//                             <div className="text-sm text-gray-600">
//                               Picked up: {formatDate(pickup.pickupTime)}
//                             </div>
//                           )}
//                         </div>
//                       </div>

//                       {/* Payment Status */}
//                       <div>
//                         <h4 className="font-medium text-gray-900 mb-3">Payment Status</h4>
//                         <div className={cn(
//                           "p-4 rounded-lg",
//                           pickup.payment.collected 
//                             ? "bg-green-50 border border-green-200"
//                             : "bg-yellow-50 border border-yellow-200"
//                         )}>
//                           <div className="flex items-center justify-between mb-2">
//                             <div className="font-medium">
//                               {pickup.payment.isCOD ? 'Cash on Delivery' : 'Prepaid'}
//                             </div>
//                             <div className="text-xl font-bold">
//                               ₦{pickup.payment.amount.toLocaleString()}
//                             </div>
//                           </div>
//                           <div className={cn(
//                             "text-sm font-medium",
//                             pickup.payment.collected ? "text-green-700" : "text-yellow-700"
//                           )}>
//                             {pickup.payment.collected 
//                               ? `Collected ${pickup.payment.paymentMethod ? `via ${pickup.payment.paymentMethod}` : ''}`
//                               : 'Pending collection'
//                             }
//                           </div>
//                         </div>
//                       </div>

//                       {/* Notification History */}
//                       <div>
//                         <h4 className="font-medium text-gray-900 mb-3">Notification History</h4>
//                         <div className="space-y-2">
//                           {pickup.notifications.filter(n => n.sent).map((notification, index) => (
//                             <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
//                               <div className="flex items-center space-x-2">
//                                 <Bell className="h-4 w-4 text-gray-500" />
//                                 <span className="text-sm text-gray-700 uppercase">{notification.type}</span>
//                               </div>
//                               <div className="text-sm text-gray-500">
//                                 {notification.sentAt ? getTimeAgo(notification.sentAt) : 'N/A'}
//                               </div>
//                             </div>
//                           ))}
//                           {pickup.notifications.filter(n => !n.sent).length > 0 && (
//                             <button className="w-full p-2 border border-dashed border-gray-300 rounded text-gray-600 hover:bg-gray-50 transition">
//                               + Send pending notifications
//                             </button>
//                           )}
//                         </div>
//                       </div>

//                       {/* Actions */}
//                       <div className="flex space-x-3">
//                         <button className="flex-1 px-4 py-2 bg-pepper-500 text-white rounded-lg hover:bg-pepper-600 transition font-medium">
//                           Update Status
//                         </button>
//                         <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">
//                           Print Label
//                         </button>
//                       </div>
//                     </div>
//                   </motion.div>
//                 )
//               })() : (
//                 <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
//                   <div className="flex items-center space-x-3 mb-6">
//                     <div className="p-2 bg-pepper-50 rounded-lg">
//                       <Shield className="h-6 w-6 text-pepper-600" />
//                     </div>
//                     <div>
//                       <h3 className="font-bold text-gray-900">Pickup Security</h3>
//                       <p className="text-gray-600">Verification tools</p>
//                     </div>
//                   </div>

//                   <div className="space-y-4">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Verify Pickup Code
//                       </label>
//                       <div className="flex space-x-2">
//                         <input
//                           type="text"
//                           placeholder="Enter pickup code"
//                           className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
//                         />
//                         <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition">
//                           Verify
//                         </button>
//                       </div>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Scan QR Code
//                       </label>
//                       <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
//                         <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-2" />
//                         <p className="text-sm text-gray-600">Scan customer's QR code</p>
//                         <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm">
//                           Open Scanner
//                         </button>
//                       </div>
//                     </div>

//                     <div className="pt-4 border-t border-gray-200">
//                       <h4 className="font-medium text-gray-900 mb-3">Quick Stats</h4>
//                       <div className="space-y-2">
//                         <div className="flex items-center justify-between">
//                           <span className="text-sm text-gray-600">Today's Pickups</span>
//                           <span className="font-medium">{pickups.filter(p => 
//                             new Date(p.scheduledTime).toDateString() === new Date().toDateString()
//                           ).length}</span>
//                         </div>
//                         <div className="flex items-center justify-between">
//                           <span className="text-sm text-gray-600">Successful</span>
//                           <span className="font-medium text-green-600">94%</span>
//                         </div>
//                         <div className="flex items-center justify-between">
//                           <span className="text-sm text-gray-600">Avg. Pickup Time</span>
//                           <span className="font-medium">2.3 min</span>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </AnimatePresence>

//             {/* Bulk Actions */}
//             <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-6 text-white">
//               <h3 className="font-bold mb-4">Bulk Actions</h3>
//               <div className="space-y-3">
//                 <button className="w-full px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition font-medium text-sm">
//                   Send Reminders to All
//                 </button>
//                 <button className="w-full px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition font-medium text-sm">
//                   Export Pickup Report
//                 </button>
//                 <button className="w-full px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition font-medium text-sm">
//                   Generate QR Codes
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Analytics View */}
//       {viewMode === 'analytics' && (
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Customer Analytics */}
//           <div className="lg:col-span-2">
//             <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
//               <h3 className="text-lg font-bold text-gray-900 mb-6">Customer Analytics</h3>
              
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
//                 {[
//                   { label: 'Total Customers', value: stats.totalCustomers, change: '+12%' },
//                   { label: 'Active Rate', value: `${Math.round((stats.activeCustomers / stats.totalCustomers) * 100)}%`, change: '+3%' },
//                   { label: 'Avg. Parcels/Customer', value: (customers.reduce((sum, c) => sum + c.totalParcels, 0) / customers.length).toFixed(1), change: '+0.5' },
//                   { label: 'Retention Rate', value: '87%', change: '+2%' },
//                 ].map((metric, index) => (
//                   <div key={index} className="bg-gray-50 p-4 rounded-lg">
//                     <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
//                     <div className="text-sm text-gray-600">{metric.label}</div>
//                     <div className="text-xs text-green-600 mt-1">{metric.change} this month</div>
//                   </div>
//                 ))}
//               </div>

//               {/* Customer Segments */}
//               <div>
//                 <h4 className="font-medium text-gray-900 mb-4">Customer Segments</h4>
//                 <div className="space-y-3">
//                   {[
//                     { segment: 'High Value', customers: 42, avgValue: '₦125K', color: 'bg-green-500' },
//                     { segment: 'Regular', customers: 156, avgValue: '₦45K', color: 'bg-blue-500' },
//                     { segment: 'New', customers: 23, avgValue: '₦18K', color: 'bg-purple-500' },
//                     { segment: 'Inactive', customers: 34, avgValue: '₦0', color: 'bg-gray-500' },
//                   ].map((segment, index) => (
//                     <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded">
//                       <div className="flex items-center space-x-3">
//                         <div className={`w-3 h-3 ${segment.color} rounded-full`} />
//                         <div>
//                           <div className="font-medium text-gray-900">{segment.segment}</div>
//                           <div className="text-sm text-gray-600">Avg. value: {segment.avgValue}</div>
//                         </div>
//                       </div>
//                       <div className="text-right">
//                         <div className="font-bold">{segment.customers}</div>
//                         <div className="text-sm text-gray-600">customers</div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Pickup Analytics */}
//           <div className="space-y-6">
//             <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
//               <h3 className="font-bold text-gray-900 mb-4">Pickup Analytics</h3>
//               <div className="space-y-4">
//                 {[
//                   { label: 'Total Pickups Today', value: pickups.filter(p => 
//                     new Date(p.scheduledTime).toDateString() === new Date().toDateString()
//                   ).length, trend: '+15%' },
//                   { label: 'Successful Rate', value: '96%', trend: '+1%' },
//                   { label: 'Avg. Pickup Time', value: '2.4 min', trend: '-0.3 min' },
//                   { label: 'COD Collection Rate', value: '94%', trend: '+2%' },
//                   { label: 'Notification Open Rate', value: '78%', trend: '+5%' },
//                 ].map((metric, index) => (
//                   <div key={index} className="flex items-center justify-between">
//                     <span className="text-gray-700">{metric.label}</span>
//                     <div className="text-right">
//                       <div className="font-bold text-gray-900">{metric.value}</div>
//                       <div className={cn(
//                         "text-xs",
//                         metric.trend.startsWith('+') ? "text-green-600" : "text-red-600"
//                       )}>
//                         {metric.trend}
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* Notification Performance */}
//             <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
//               <h3 className="font-bold text-gray-900 mb-4">Notification Performance</h3>
//               <div className="space-y-3">
//                 {['sms', 'whatsapp', 'email'].map(type => {
//                   const sent = pickups.reduce((sum, p) => 
//                     sum + p.notifications.filter(n => n.type === type && n.sent).length, 0
//                   )
//                   const total = pickups.length
//                   const rate = total > 0 ? Math.round((sent / total) * 100) : 0
                  
//                   return (
//                     <div key={type} className="flex items-center justify-between">
//                       <div className="flex items-center space-x-2">
//                         <Bell className="h-4 w-4 text-gray-500" />
//                         <span className="text-gray-700 uppercase">{type}</span>
//                       </div>
//                       <div className="text-right">
//                         <div className="font-bold">{sent}/{total}</div>
//                         <div className="text-xs text-gray-600">{rate}% sent</div>
//                       </div>
//                     </div>
//                   )
//                 })}
//               </div>
//             </div>

//             {/* Quick Reports */}
//             <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-xl p-6 text-white">
//               <h3 className="font-bold mb-4">Generate Reports</h3>
//               <div className="space-y-3">
//                 <button className="w-full px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition font-medium text-sm">
//                   Customer Activity Report
//                 </button>
//                 <button className="w-full px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition font-medium text-sm">
//                   Pickup Performance
//                 </button>
//                 <button className="w-full px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-gray-100 transition font-medium text-sm">
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


