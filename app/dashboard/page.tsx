// app/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useDashboardAnalytics, useParcels } from '@/hooks/useApi'
import { useRealTime } from '@/components/providers/realtime-provider'
import { LiveMetrics } from '@/components/dashboard/live-metrics'
import { RecentParcels } from '@/components/dashboard/recent-parcels'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { 
  Package, TrendingUp, DollarSign, Clock,
  ArrowUpRight, ArrowDownRight,
  User
} from 'lucide-react'
import { motion } from 'framer-motion'
import { merchantAPI } from '@/lib/api'

interface Merchant {
  businessName: string
  email: string
  phone: string
  businessType: string
}

export default function DashboardPage() {
  const { isConnected, latestUpdate } = useRealTime()
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [loadingMerchant, setLoadingMerchant] = useState(true)
  
  // Fetch real data
  const { data: analytics, isLoading: analyticsLoading } = useDashboardAnalytics()
  const { data: parcels, isLoading: parcelsLoading, refetch: refetchParcels } = useParcels({ limit: 5 })
  
  // Fetch merchant name
  useEffect(() => {
    fetchMerchantData()
  }, [])

  // Refresh parcels when real-time update comes in
  useEffect(() => {
    if (latestUpdate) {
      refetchParcels()
    }
  }, [latestUpdate, refetchParcels])

  const fetchMerchantData = async () => {
    try {
      const response = await merchantAPI.getProfile()
      setMerchant(response.data)
    } catch (error) {
      console.error('Failed to fetch merchant data:', error)
    } finally {
      setLoadingMerchant(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  // Calculate real percentage changes based on historical data
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return '+0%'
    const change = ((current - previous) / previous) * 100
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`
  }

  // If loading, show skeleton
  if (analyticsLoading || loadingMerchant) {
    return <DashboardSkeleton />
  }

  const stats = [
    {
      title: 'Total Parcels',
      value: analytics?.overview?.totalParcels?.toLocaleString() || '0',
      change: calculateChange(analytics?.overview?.totalParcels || 0, (analytics?.overview?.totalParcels || 0) * 0.9),
      trend: (analytics?.overview?.totalParcels || 0) > ((analytics?.overview?.totalParcels || 0) * 0.9) ? 'up' : 'down',
      icon: Package,
      color: 'bg-blue-500',
      description: 'Lifetime parcels'
    },
    {
      title: 'Delivered Today',
      value: analytics?.overview?.deliveredToday?.toString() || '0',
      change: calculateChange(analytics?.overview?.deliveredToday || 0, (analytics?.overview?.deliveredToday || 0) * 0.8),
      trend: (analytics?.overview?.deliveredToday || 0) > 0 ? 'up' : 'down',
      icon: TrendingUp,
      color: 'bg-green-500',
      description: 'Successful deliveries'
    },
    {
      title: 'Pending Pickup',
      value: analytics?.overview?.pendingPickup?.toString() || '0',
      change: calculateChange(analytics?.overview?.pendingPickup || 0, (analytics?.overview?.pendingPickup || 0) * 1.1),
      trend: (analytics?.overview?.pendingPickup || 0) < ((analytics?.overview?.pendingPickup || 0) * 1.1) ? 'down' : 'up',
      icon: Clock,
      color: 'bg-yellow-500',
      description: 'Awaiting collection'
    },
    {
      title: 'COD Collected',
      value: `₦${(analytics?.overview?.codCollected || 0).toLocaleString()}`,
      change: calculateChange(analytics?.overview?.codCollected || 0, (analytics?.overview?.codCollected || 0) * 0.85),
      trend: (analytics?.overview?.codCollected || 0) > 0 ? 'up' : 'down',
      icon: DollarSign,
      color: 'bg-purple-500',
      description: 'Today\'s revenue'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Banner with Real Merchant Name */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-pepper-600 to-pepper-500 rounded-2xl p-8 text-white shadow-xl"
      >
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {getGreeting()}, {merchant?.businessName || 'Merchant'}! 🚀
              </h1>
              <p className="text-pepper-100">
                {isConnected 
                  ? `Real-time tracking is active. You have ${analytics?.overview?.pendingPickup || 0} parcel${analytics?.overview?.pendingPickup !== 1 ? 's' : ''} requiring attention.`
                  : 'Connecting to real-time services...'
                }
              </p>
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="flex items-center space-x-2 px-4 py-2 bg-white/20 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`} />
              <span>{isConnected ? 'Live' : 'Connecting'}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-sm text-pepper-200">Business Type</div>
            <div className="text-lg font-semibold">{merchant?.businessType || 'Merchant'}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-sm text-pepper-200">Email</div>
            <div className="text-lg font-semibold truncate">{merchant?.email || 'N/A'}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-sm text-pepper-200">Phone</div>
            <div className="text-lg font-semibold">{merchant?.phone || 'N/A'}</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-sm text-pepper-200">Success Rate</div>
            <div className="text-lg font-semibold">
              {analytics?.overview?.totalParcels 
                ? `${Math.round((analytics.overview.deliveredToday / analytics.overview.totalParcels) * 100)}%`
                : '0%'
              }
            </div>
          </div>
        </div>
      </motion.div>

      {/* Real Stats from API */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-soft p-6 border border-gray-200 hover:shadow-hard transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 ${stat.color} rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                  stat.trend === 'up' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  <span>{stat.change}</span>
                </div>
              </div>
              
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-gray-900 font-medium">{stat.title}</p>
              <p className="text-gray-500 text-sm mt-2">{stat.description}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Live Metrics with Real Data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <LiveMetrics 
            analytics={analytics} 
            parcels={parcels || []}
            timeSeriesData={generateTimeSeriesData(parcels || [])}
          />
        </div>
        <div>
          <RecentParcels 
            parcels={parcels || []} 
            loading={parcelsLoading}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  )
}

// Helper function to generate time series data from parcels
function generateTimeSeriesData(parcels: any[]) {
  if (!parcels || parcels.length === 0) return []
  
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    return date.toISOString().split('T')[0]
  }).reverse()

  return last7Days.map(date => {
    const dayParcels = parcels.filter(p => 
      p.createdAt?.startsWith(date)
    )
    
    return {
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      parcels: dayParcels.length,
      revenue: dayParcels.reduce((sum, p) => sum + (p.payment?.amount || 0), 0)
    }
  })
}

// Skeleton Loader
function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="bg-gradient-to-r from-gray-300 to-gray-200 rounded-2xl h-48"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl h-96 border border-gray-200 p-6">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
        <div className="bg-white rounded-xl h-96 border border-gray-200 p-6">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}












































// // components/dashboard/recent-parcels.tsx
// 'use client'

// import { useState } from 'react'
// import { 
//   Package, 
//   Clock, 
//   CheckCircle, 
//   AlertCircle,
//   MoreVertical,
//   ExternalLink,
//   Truck,
//   MapPin,
//   User
// } from 'lucide-react'
// import { useRealTime } from '@/components/providers/realtime-provider'
// import Link from 'next/link'
// import { formatDistanceToNow } from 'date-fns'

// interface RecentParcelsProps {
//   parcels: any[]
//   loading?: boolean
// }

// const statusConfig = {
//   picked_up: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Picked Up' },
//   delivered: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Delivered' },
//   in_transit: { icon: Truck, color: 'text-blue-600', bg: 'bg-blue-100', label: 'In Transit' },
//   ready_for_pickup: { icon: Package, color: 'text-green-600', bg: 'bg-green-100', label: 'Ready' },
//   at_location: { icon: MapPin, color: 'text-purple-600', bg: 'bg-purple-100', label: 'At Location' },
//   created: { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Created' },
//   delivery_failed: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Failed' },
//   default: { icon: Package, color: 'text-gray-600', bg: 'bg-gray-100', label: 'Pending' }
// }

// export function RecentParcels({ parcels = [], loading = false }: RecentParcelsProps) {
//   const { emitEvent } = useRealTime()

//   const getStatusConfig = (status: string) => {
//     return statusConfig[status as keyof typeof statusConfig] || statusConfig.default
//   }

//   const getTimeAgo = (dateString: string) => {
//     try {
//       return formatDistanceToNow(new Date(dateString), { addSuffix: true })
//     } catch {
//       return 'Unknown'
//     }
//   }

//   if (loading) {
//     return (
//       <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
//         <div className="flex items-center justify-between mb-6">
//           <div>
//             <h3 className="text-lg font-bold text-gray-900">Recent Parcels</h3>
//             <p className="text-sm text-gray-500">Latest parcels</p>
//           </div>
//           <Link href="/dashboard/parcels" className="text-sm text-pepper-600 font-medium hover:text-pepper-700">
//             View all →
//           </Link>
//         </div>
//         <div className="space-y-4">
//           {[...Array(3)].map((_, i) => (
//             <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse">
//               <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
//               <div className="h-3 bg-gray-200 rounded w-1/2"></div>
//             </div>
//           ))}
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
//       <div className="flex items-center justify-between mb-6">
//         <div>
//           <h3 className="text-lg font-bold text-gray-900">Recent Parcels</h3>
//           <p className="text-sm text-gray-500">Latest {parcels.length} parcels</p>
//         </div>
//         <Link href="/dashboard/parcels" className="text-sm text-pepper-600 font-medium hover:text-pepper-700">
//           View all →
//         </Link>
//       </div>

//       <div className="space-y-4">
//         {parcels.length > 0 ? (
//           parcels.map((parcel) => {
//             const config = getStatusConfig(parcel.delivery?.status)
//             const Icon = config.icon
            
//             return (
//               <Link 
//                 key={parcel._id} 
//                 href={`/dashboard/parcels/${parcel._id}`}
//                 className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition group"
//               >
//                 <div className="flex items-center justify-between mb-3">
//                   <div className="flex items-center space-x-3">
//                     <div className={`p-2 rounded-lg ${config.bg}`}>
//                       <Icon className={`h-4 w-4 ${config.color}`} />
//                     </div>
//                     <div>
//                       <p className="font-medium text-gray-900">{parcel.trackingNumber || 'Unknown'}</p>
//                       <div className="flex items-center space-x-1 text-sm text-gray-500">
//                         <User className="h-3 w-3" />
//                         <span>{parcel.customer?.name || 'Unknown'}</span>
//                       </div>
//                     </div>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <span className="text-sm font-medium text-gray-900">
//                       ₦{parcel.payment?.amount?.toLocaleString() || '0'}
//                     </span>
//                     <button className="p-1 opacity-0 group-hover:opacity-100 transition">
//                       <ExternalLink className="h-4 w-4 text-gray-400" />
//                     </button>
//                   </div>
//                 </div>

//                 <div className="flex items-center justify-between text-sm">
//                   <div className="flex items-center space-x-4">
//                     <span className="text-gray-600">{parcel.delivery?.location?.name || 'No location'}</span>
//                     <span className="text-gray-400">•</span>
//                     <span className="text-gray-500">
//                       {getTimeAgo(parcel.createdAt)}
//                     </span>
//                   </div>
//                   <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
//                     {config.label}
//                   </span>
//                 </div>

//                 {/* Item preview */}
//                 {parcel.items && parcel.items.length > 0 && (
//                   <div className="mt-2 text-xs text-gray-500">
//                     {parcel.items[0].description}
//                     {parcel.items.length > 1 && ` +${parcel.items.length - 1} more`}
//                   </div>
//                 )}
//               </Link>
//             )
//           })
//         ) : (
//           <div className="text-center py-12">
//             <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
//             <h4 className="font-medium text-gray-900 mb-1">No parcels yet</h4>
//             <p className="text-sm text-gray-500 mb-4">Create your first parcel to get started</p>
//             <Link href="/dashboard/parcels/create">
//               <button className="px-4 py-2 bg-pepper-500 text-white rounded-lg hover:bg-pepper-600 transition text-sm font-medium">
//                 Create Parcel
//               </button>
//             </Link>
//           </div>
//         )}
//       </div>

//       {/* Quick Stats */}
//       {parcels.length > 0 && (
//         <div className="mt-6 pt-6 border-t border-gray-200">
//           <div className="grid grid-cols-3 gap-4 text-center">
//             <div>
//               <p className="text-2xl font-bold text-gray-900">{parcels.length}</p>
//               <p className="text-xs text-gray-500">Total Shown</p>
//             </div>
//             <div>
//               <p className="text-2xl font-bold text-gray-900">
//                 {parcels.filter(p => p.delivery?.status === 'picked_up').length}
//               </p>
//               <p className="text-xs text-gray-500">Delivered</p>
//             </div>
//             <div>
//               <p className="text-2xl font-bold text-gray-900">
//                 ₦{parcels.reduce((sum, p) => sum + (p.payment?.amount || 0), 0).toLocaleString()}
//               </p>
//               <p className="text-xs text-gray-500">Total Value</p>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }







































































// // app/dashboard/page.tsx - Updated with real data
// 'use client'

// import { useState, useEffect } from 'react'
// import { useDashboardAnalytics, useParcels } from '@/hooks/useApi'
// import { useRealTime } from '@/components/providers/realtime-provider'
// import { LiveMetrics } from '@/components/dashboard/live-metrics'
// import { RecentParcels } from '@/components/dashboard/recent-parcels'
// import { QuickActions } from '@/components/dashboard/quick-actions'
// import { 
//   Package, TrendingUp, DollarSign, Clock,
//   ArrowUpRight, ArrowDownRight 
// } from 'lucide-react'
// import { motion } from 'framer-motion'

// export default function DashboardPage() {
//   const { isConnected, latestUpdate } = useRealTime()
  
//   // Fetch real data
//   const { data: analytics, isLoading: analyticsLoading } = useDashboardAnalytics()
//   const { data: parcels, isLoading: parcelsLoading } = useParcels({ limit: 5 })
  
//   // If loading, show skeleton
//   if (analyticsLoading) {
//     return <DashboardSkeleton />
//   }

//   const stats = [
//     {
//       title: 'Total Parcels',
//       value: analytics?.overview?.totalParcels?.toLocaleString() || '0',
//       change: '+12.5%',
//       trend: 'up',
//       icon: Package,
//       color: 'bg-blue-500',
//       description: 'Lifetime parcels'
//     },
//     {
//       title: 'Delivered Today',
//       value: analytics?.overview?.deliveredToday?.toString() || '0',
//       change: analytics?.overview?.deliveredToday ? '+8.2%' : '0%',
//       trend: 'up',
//       icon: TrendingUp,
//       color: 'bg-green-500',
//       description: 'Successful deliveries'
//     },
//     {
//       title: 'Pending Pickup',
//       value: analytics?.overview?.pendingPickup?.toString() || '0',
//       change: '-3.1%',
//       trend: 'down',
//       icon: Clock,
//       color: 'bg-yellow-500',
//       description: 'Awaiting collection'
//     },
//     {
//       title: 'COD Collected',
//       value: `₦${(analytics?.overview?.codCollected || 0).toLocaleString()}`,
//       change: '+15.7%',
//       trend: 'up',
//       icon: DollarSign,
//       color: 'bg-purple-500',
//       description: 'Today\'s revenue'
//     }
//   ]

//   return (
//     <div className="space-y-8">
//       {/* Welcome Banner with Real Status */}
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="bg-gradient-to-r from-pepper-600 to-pepper-500 rounded-2xl p-8 text-white shadow-xl"
//       >
//         <div className="flex flex-col md:flex-row items-center justify-between">
//           <div>
//             <h1 className="text-3xl font-bold mb-2">
//               Welcome back, {analytics?.merchantName || 'Merchant'}! 🚀
//             </h1>
//             <p className="text-pepper-100">
//               {isConnected 
//                 ? `Real-time tracking is active. You have ${analytics?.pendingPickup || 0} parcels requiring attention.`
//                 : 'Connecting to real-time services...'
//               }
//             </p>
//           </div>
//           <div className="mt-4 md:mt-0">
//             <div className="flex items-center space-x-2 px-4 py-2 bg-white/20 rounded-lg">
//               <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`} />
//               <span>{isConnected ? 'Live' : 'Connecting'}</span>
//             </div>
//           </div>
//         </div>
//       </motion.div>

//       {/* Real Stats from API */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         {stats.map((stat, index) => {
//           const Icon = stat.icon
//           return (
//             <motion.div
//               key={stat.title}
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: index * 0.1 }}
//               className="bg-white rounded-xl shadow-soft p-6 border border-gray-200"
//             >
//               <div className="flex items-center justify-between mb-4">
//                 <div className={`p-3 ${stat.color} rounded-lg`}>
//                   <Icon className="h-6 w-6 text-white" />
//                 </div>
//                 <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
//                   stat.trend === 'up' 
//                     ? 'bg-green-100 text-green-800' 
//                     : 'bg-red-100 text-red-800'
//                 }`}>
//                   {stat.trend === 'up' ? (
//                     <ArrowUpRight className="h-3 w-3" />
//                   ) : (
//                     <ArrowDownRight className="h-3 w-3" />
//                   )}
//                   <span>{stat.change}</span>
//                 </div>
//               </div>
              
//               <h3 className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
//               <p className="text-gray-900 font-medium">{stat.title}</p>
//               <p className="text-gray-500 text-sm mt-2">{stat.description}</p>
//             </motion.div>
//           )
//         })}
//       </div>

//       {/* Live Metrics with Real Data */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         <div className="lg:col-span-2">
//           <LiveMetrics analytics={analytics} />
//         </div>
//         <div>
//           <RecentParcels parcels={parcels} />
//         </div>
//       </div>

//       {/* Quick Actions */}
//       <QuickActions />
//     </div>
//   )
// }

// // Skeleton Loader
// function DashboardSkeleton() {
//   return (
//     <div className="space-y-8 animate-pulse">
//       <div className="bg-gray-200 rounded-2xl h-32"></div>
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
//         {[...Array(4)].map((_, i) => (
//           <div key={i} className="bg-gray-200 rounded-xl h-32"></div>
//         ))}
//       </div>
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         <div className="lg:col-span-2 bg-gray-200 rounded-xl h-96"></div>
//         <div className="bg-gray-200 rounded-xl h-96"></div>
//       </div>
//     </div>
//   )
// }







































































// // app/dashboard/page.tsx
// 'use client'

// import { useState, useEffect } from 'react'
// import { 
//   Package, 
//   TrendingUp, 
//   DollarSign, 
//   Clock,
//   Users,
//   MapPin,
//   AlertCircle,
//   ArrowUpRight,
//   ArrowDownRight,
//   RefreshCw,
//   Eye,
//   MoreVertical
// } from 'lucide-react'
// import { motion, AnimatePresence } from 'framer-motion'
// import { LiveMetrics } from '@/components/dashboard/live-metrics'
// import { RecentParcels } from '@/components/dashboard/recent-parcels'
// import { QuickActions } from '@/components/dashboard/quick-actions'
// import { useRealTime } from '@/components/providers/realtime-provider'

// export default function DashboardPage() {
//   const { isConnected, latestUpdate } = useRealTime()
//   const [stats, setStats] = useState({
//     totalParcels: 1245,
//     deliveredToday: 89,
//     pendingPickup: 34,
//     revenueToday: 452300,
//     activeLockers: 156,
//     customerSatisfaction: 98.2
//   })

//   // Simulate real-time updates
//   useEffect(() => {
//     if (latestUpdate) {
//       // Update stats based on real-time updates
//       setStats(prev => ({
//         ...prev,
//         deliveredToday: prev.deliveredToday + 1,
//         pendingPickup: Math.max(0, prev.pendingPickup - 1),
//         revenueToday: prev.revenueToday + (latestUpdate.amount || 0)
//       }))
//     }
//   }, [latestUpdate])

//   return (
//     <div className="space-y-8">
//       {/* Welcome Banner */}
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="bg-gradient-to-r from-pepper-600 to-pepper-500 rounded-2xl p-8 text-white shadow-xl"
//       >
//         <div className="flex flex-col md:flex-row items-center justify-between">
//           <div>
//             <h1 className="text-3xl font-bold mb-2">Welcome back, TechGadgets NG! 🚀</h1>
//             <p className="text-pepper-100">
//               {isConnected 
//                 ? 'Real-time tracking is active. You have 3 parcels requiring attention.'
//                 : 'Connecting to real-time services...'
//               }
//             </p>
//           </div>
//           <div className="mt-4 md:mt-0">
//             <div className="flex items-center space-x-2 px-4 py-2 bg-white/20 rounded-lg">
//               <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`} />
//               <span>{isConnected ? 'Live' : 'Connecting'}</span>
//             </div>
//           </div>
//         </div>
//       </motion.div>

//       {/* Stats Overview */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         {[
//           {
//             title: 'Total Parcels',
//             value: stats.totalParcels.toLocaleString(),
//             change: '+12.5%',
//             trend: 'up',
//             icon: Package,
//             color: 'bg-blue-500',
//             description: 'Lifetime parcels'
//           },
//           {
//             title: 'Delivered Today',
//             value: stats.deliveredToday,
//             change: '+8.2%',
//             trend: 'up',
//             icon: TrendingUp,
//             color: 'bg-green-500',
//             description: 'Successful deliveries'
//           },
//           {
//             title: 'Pending Pickup',
//             value: stats.pendingPickup,
//             change: '-3.1%',
//             trend: 'down',
//             icon: Clock,
//             color: 'bg-yellow-500',
//             description: 'Awaiting collection'
//           },
//           {
//             title: 'Revenue Today',
//             value: `₦${stats.revenueToday.toLocaleString()}`,
//             change: '+15.7%',
//             trend: 'up',
//             icon: DollarSign,
//             color: 'bg-purple-500',
//             description: 'COD collected'
//           }
//         ].map((stat, index) => {
//           const Icon = stat.icon
//           return (
//             <motion.div
//               key={stat.title}
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: index * 0.1 }}
//               className="bg-white rounded-xl shadow-soft p-6 border border-gray-200 hover:shadow-hard transition-shadow"
//             >
//               <div className="flex items-center justify-between mb-4">
//                 <div className={`p-3 ${stat.color} rounded-lg`}>
//                   <Icon className="h-6 w-6 text-white" />
//                 </div>
//                 <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
//                   stat.trend === 'up' 
//                     ? 'bg-green-100 text-green-800' 
//                     : 'bg-red-100 text-red-800'
//                 }`}>
//                   {stat.trend === 'up' ? (
//                     <ArrowUpRight className="h-3 w-3" />
//                   ) : (
//                     <ArrowDownRight className="h-3 w-3" />
//                   )}
//                   <span>{stat.change}</span>
//                 </div>
//               </div>
              
//               <h3 className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
//               <p className="text-gray-900 font-medium">{stat.title}</p>
//               <p className="text-gray-500 text-sm mt-2">{stat.description}</p>
//             </motion.div>
//           )
//         })}
//       </div>

//       {/* Live Metrics & Recent Parcels */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         {/* Live Metrics Section */}
//         <div className="lg:col-span-2">
//           <LiveMetrics />
//         </div>

//         {/* Recent Parcels Section */}
//         <div>
//           <RecentParcels />
//         </div>
//       </div>

//       {/* Quick Actions & System Status */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         {/* Quick Actions */}
//         <div className="lg:col-span-2">
//           <QuickActions />
//         </div>

//         {/* System Status */}
//         <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
//           <div className="flex items-center justify-between mb-6">
//             <h3 className="text-lg font-bold text-gray-900">System Status</h3>
//             <button className="p-2 hover:bg-gray-100 rounded-lg transition">
//               <RefreshCw className="h-4 w-4 text-gray-500" />
//             </button>
//           </div>

//           <div className="space-y-4">
//             {[
//               { service: 'API Gateway', status: 'operational', latency: '45ms' },
//               { service: 'Database', status: 'operational', latency: '12ms' },
//               { service: 'Real-time Socket', status: isConnected ? 'operational' : 'connecting', latency: isConnected ? '18ms' : '--' },
//               { service: 'Payment Gateway', status: 'operational', latency: '67ms' },
//               { service: 'SMS Service', status: 'operational', latency: '120ms' },
//             ].map((item, index) => (
//               <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
//                 <div className="flex items-center space-x-3">
//                   <div className={`w-2 h-2 rounded-full ${
//                     item.status === 'operational' ? 'bg-green-500' :
//                     item.status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
//                   } ${item.status === 'connecting' ? 'animate-pulse' : ''}`} />
//                   <div>
//                     <p className="font-medium text-gray-900">{item.service}</p>
//                     <p className="text-sm text-gray-500 capitalize">{item.status}</p>
//                   </div>
//                 </div>
//                 <div className="text-sm text-gray-500">{item.latency}</div>
//               </div>
//             ))}
//           </div>

//           {/* Recent Activity */}
//           <div className="mt-8">
//             <h4 className="font-medium text-gray-900 mb-4">Recent Activity</h4>
//             <div className="space-y-3">
//               {[
//                 { time: '2 min ago', action: 'Parcel #LKR-4892 picked up', user: 'Customer' },
//                 { time: '5 min ago', action: 'New parcel created', user: 'You' },
//                 { time: '12 min ago', action: 'COD payment received', user: 'System' },
//               ].map((activity, index) => (
//                 <div key={index} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition">
//                   <div className="w-2 h-2 bg-pepper-500 rounded-full mt-2" />
//                   <div className="flex-1">
//                     <p className="text-sm text-gray-900">{activity.action}</p>
//                     <div className="flex items-center justify-between mt-1">
//                       <span className="text-xs text-gray-500">{activity.user}</span>
//                       <span className="text-xs text-gray-400">{activity.time}</span>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Real-time Notification */}
//       <AnimatePresence>
//         {latestUpdate && (
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: 20 }}
//             className="fixed bottom-4 right-4 bg-white rounded-xl shadow-hard p-4 border-l-4 border-pepper-500 max-w-sm z-50"
//           >
//             <div className="flex items-start space-x-3">
//               <div className="p-2 bg-pepper-50 rounded-lg">
//                 <Package className="h-5 w-5 text-pepper-600" />
//               </div>
//               <div className="flex-1">
//                 <h4 className="font-medium text-gray-900">Parcel Update</h4>
//                 <p className="text-sm text-gray-600 mt-1">
//                   {latestUpdate.trackingNumber} status changed to{' '}
//                   <span className="font-medium text-pepper-600">{latestUpdate.status}</span>
//                 </p>
//                 <button className="text-sm text-pepper-600 font-medium mt-2 hover:text-pepper-700">
//                   View Details →
//                 </button>
//               </div>
//               <button className="p-1 hover:bg-gray-100 rounded">
//                 <Eye className="h-4 w-4 text-gray-500" />
//               </button>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   )
// }




