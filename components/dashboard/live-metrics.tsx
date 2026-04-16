// components/dashboard/live-metrics.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { 
  TrendingUp, 
  Calendar, 
  Filter, 
  Clock, 
  Package, 
  CheckCircle, 
  Truck,
  AlertCircle,
  Zap
} from 'lucide-react'

interface LiveMetricsProps {
  analytics?: any
  parcels?: any[]
  timeSeriesData?: Array<{
    date: string
    parcels: number
    revenue: number
  }>
}

export function LiveMetrics({ analytics, parcels = [], timeSeriesData = [] }: LiveMetricsProps) {
  const [timeRange, setTimeRange] = useState('today')
  const [metrics, setMetrics] = useState({
    peakHour: 'Calculating...',
    avgDeliveryTime: 'Calculating...',
    successRate: '0%',
    busyLockers: 0,
    totalActive: 0,
    pendingCOD: 0
  })

  const [statusData, setStatusData] = useState<any[]>([])

  // Calculate metrics from real data
  useEffect(() => {
    if (parcels.length > 0) {
      calculateMetrics()
      calculateStatusDistribution()
    }
  }, [parcels])

  const calculateMetrics = () => {
    // Calculate peak hour from parcel creation times
    const hourCounts: Record<number, number> = {}
    parcels.forEach(p => {
      if (p.createdAt) {
        const hour = new Date(p.createdAt).getHours()
        hourCounts[hour] = (hourCounts[hour] || 0) + 1
      }
    })

    let peakHour = '12 PM'
    let maxCount = 0
    Object.entries(hourCounts).forEach(([hour, count]) => {
      if (count > maxCount) {
        maxCount = count
        const hourNum = parseInt(hour)
        peakHour = hourNum === 0 ? '12 AM' : 
                   hourNum < 12 ? `${hourNum} AM` :
                   hourNum === 12 ? '12 PM' : `${hourNum - 12} PM`
      }
    })

    // Calculate average delivery time
    const completedParcels = parcels.filter(p => 
      p.delivery?.status === 'picked_up' && p.createdAt && p.updatedAt
    )
    
    let totalTime = 0
    completedParcels.forEach(p => {
      const created = new Date(p.createdAt).getTime()
      const completed = new Date(p.updatedAt).getTime()
      totalTime += (completed - created) / (1000 * 60 * 60) // hours
    })
    
    const avgTime = completedParcels.length > 0 
      ? (totalTime / completedParcels.length).toFixed(1)
      : '0'

    // Calculate success rate
    const totalDeliveries = parcels.length
    const successful = parcels.filter(p => 
      p.delivery?.status === 'picked_up'
    ).length
    
    const successRate = totalDeliveries > 0 
      ? Math.round((successful / totalDeliveries) * 100)
      : 0

    // Calculate active parcels
    const activeStatuses = ['created', 'in_transit', 'at_location', 'ready_for_pickup']
    const totalActive = parcels.filter(p => 
      activeStatuses.includes(p.delivery?.status)
    ).length

    // Calculate pending COD
    const pendingCOD = parcels
      .filter(p => p.payment?.isCOD && !p.payment?.collected)
      .reduce((sum, p) => sum + (p.payment?.amount || 0), 0)

    setMetrics({
      peakHour,
      avgDeliveryTime: avgTime === '0' ? 'No data' : `${avgTime} hours`,
      successRate: `${successRate}%`,
      busyLockers: Math.min(totalActive, 24),
      totalActive,
      pendingCOD
    })
  }

  const calculateStatusDistribution = () => {
    const statusCounts: Record<string, number> = {}
    
    parcels.forEach(p => {
      const status = p.delivery?.status || 'unknown'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })

    const colors: Record<string, string> = {
      picked_up: '#10B981',
      delivered: '#10B981',
      in_transit: '#3B82F6',
      ready_for_pickup: '#F59E0B',
      at_location: '#8B5CF6',
      created: '#6B7280',
      delivery_failed: '#EF4444'
    }

    const data = Object.entries(statusCounts)
      .map(([status, count]) => ({
        name: status.replace(/_/g, ' ').toUpperCase(),
        value: count,
        color: colors[status] || '#6B7280'
      }))
      .filter(item => item.value > 0)

    setStatusData(data)
  }

  // Generate hourly delivery data from real parcels
  const generateHourlyData = () => {
    const hours = ['6 AM', '8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM']
    const hourMap: Record<string, number> = {
      '6': 0, '8': 0, '10': 0, '12': 0, '14': 0, '16': 0, '18': 0, '20': 0
    }

    parcels.forEach(p => {
      if (p.createdAt) {
        const hour = new Date(p.createdAt).getHours()
        if (hourMap[hour] !== undefined) {
          hourMap[hour]++
        }
      }
    })

    return hours.map((hour, index) => ({
      hour,
      deliveries: Object.values(hourMap)[index] || 0
    }))
  }

  const hourlyData = parcels.length > 0 ? generateHourlyData() : []

  return (
    <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Live Delivery Metrics</h3>
          <p className="text-sm text-gray-500">Real-time tracking and analytics</p>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setTimeRange('today')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition ${
              timeRange === 'today' 
                ? 'bg-pepper-500 text-white' 
                : 'border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span className="text-sm">Today</span>
          </button>
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            <Filter className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Peak Hour', value: metrics.peakHour, icon: Clock, color: 'blue' },
          { label: 'Avg Delivery', value: metrics.avgDeliveryTime, icon: Truck, color: 'green' },
          { label: 'Success Rate', value: metrics.successRate, icon: CheckCircle, color: 'purple' },
          { label: 'Active Parcels', value: metrics.totalActive, icon: Package, color: 'orange' },
        ].map((stat, index) => {
          const Icon = stat.icon
          const colorClasses = {
            blue: 'bg-blue-50 text-blue-600',
            green: 'bg-green-50 text-green-600',
            purple: 'bg-purple-50 text-purple-600',
            orange: 'bg-orange-50 text-orange-600'
          }
          
          return (
            <div key={index} className="bg-gray-50 p-4 rounded-lg hover:shadow-md transition">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-xs text-gray-400 animate-pulse">● LIVE</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Delivery Trend Chart */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Delivery Trend</h4>
          <div className="h-64">
            {hourlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="hour" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="deliveries" 
                    stroke="#ff0000" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6, stroke: '#ff0000', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No delivery data available
              </div>
            )}
          </div>
        </div>

        {/* Status Distribution */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Status Distribution</h4>
          <div className="h-64">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No status data available
              </div>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {statusData.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Time Series Chart (if timeSeriesData provided) */}
      {timeSeriesData.length > 0 && (
        <div className="mt-8">
          <h4 className="font-medium text-gray-900 mb-4">7-Day Trend</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis yAxisId="left" stroke="#6b7280" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="#6b7280" fontSize={12} />
                <Tooltip />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="parcels" 
                  stroke="#ff0000" 
                  strokeWidth={2}
                  name="Parcels"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Revenue (₦)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="mt-8 p-4 bg-gradient-to-r from-pepper-50 to-orange-50 rounded-lg border border-pepper-100">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-pepper-100 rounded-lg">
            <Zap className="h-5 w-5 text-pepper-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900">Live Performance Insight</h4>
            <p className="text-sm text-gray-600 mt-1">
              {parcels.length > 0 ? (
                <>
                  {metrics.totalActive > 0 
                    ? `${metrics.totalActive} active parcels in the system. `
                    : 'No active parcels at the moment. '
                  }
                  {metrics.pendingCOD > 0 && (
                    <>₦{(metrics.pendingCOD / 1000).toFixed(0)}K in COD pending collection. </>
                  )}
                  Peak activity is at {metrics.peakHour}. 
                  Success rate is {metrics.successRate}.
                </>
              ) : (
                'No parcels to analyze yet. Create your first parcel to see insights.'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* COD Summary if available */}
      {metrics.pendingCOD > 0 && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">COD Collection Alert</span>
            </div>
            <span className="text-sm font-bold text-yellow-800">
              ₦{(metrics.pendingCOD / 1000).toFixed(0)}K pending
            </span>
          </div>
        </div>
      )}
    </div>
  )
}












































// // components/dashboard/live-metrics.tsx
// 'use client'

// import { useState, useEffect } from 'react'
// import { 
//   LineChart, 
//   Line, 
//   BarChart, 
//   Bar, 
//   XAxis, 
//   YAxis, 
//   CartesianGrid, 
//   Tooltip, 
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell
// } from 'recharts'
// import { TrendingUp, Calendar, Filter } from 'lucide-react'

// const deliveryData = [
//   { hour: '6 AM', deliveries: 12 },
//   { hour: '8 AM', deliveries: 25 },
//   { hour: '10 AM', deliveries: 45 },
//   { hour: '12 PM', deliveries: 68 },
//   { hour: '2 PM', deliveries: 52 },
//   { hour: '4 PM', deliveries: 39 },
//   { hour: '6 PM', deliveries: 28 },
//   { hour: '8 PM', deliveries: 18 },
// ]

// const statusData = [
//   { name: 'Delivered', value: 65, color: '#10B981' },
//   { name: 'In Transit', value: 20, color: '#3B82F6' },
//   { name: 'Pending', value: 10, color: '#F59E0B' },
//   { name: 'Returned', value: 5, color: '#EF4444' },
// ]

// export function LiveMetrics() {
//   const [timeRange, setTimeRange] = useState('today')
//   const [metrics, setMetrics] = useState({
//     peakHour: '12 PM',
//     avgDeliveryTime: '2.4 hours',
//     successRate: '98.2%',
//     busyLockers: 12
//   })

//   return (
//     <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
//       <div className="flex items-center justify-between mb-6">
//         <div>
//           <h3 className="text-lg font-bold text-gray-900">Live Delivery Metrics</h3>
//           <p className="text-sm text-gray-500">Real-time tracking and analytics</p>
//         </div>
//         <div className="flex items-center space-x-2">
//           <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
//             <Calendar className="h-4 w-4 text-gray-500" />
//             <span className="text-sm text-gray-700">Today</span>
//           </button>
//           <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
//             <Filter className="h-4 w-4 text-gray-500" />
//           </button>
//         </div>
//       </div>

//       {/* Stats Overview */}
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
//         {[
//           { label: 'Peak Hour', value: metrics.peakHour, change: '+12%' },
//           { label: 'Avg Delivery', value: metrics.avgDeliveryTime, change: '-8%' },
//           { label: 'Success Rate', value: metrics.successRate, change: '+0.5%' },
//           { label: 'Busy Lockers', value: metrics.busyLockers, change: '+3' },
//         ].map((stat, index) => (
//           <div key={index} className="bg-gray-50 p-4 rounded-lg">
//             <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
//             <div className="flex items-center justify-between">
//               <p className="text-xl font-bold text-gray-900">{stat.value}</p>
//               <div className={`flex items-center space-x-1 text-xs font-medium ${
//                 stat.change.startsWith('+') 
//                   ? 'text-green-600 bg-green-50' 
//                   : 'text-red-600 bg-red-50'
//               } px-2 py-1 rounded-full`}>
//                 <TrendingUp className="h-3 w-3" />
//                 <span>{stat.change}</span>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Charts */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//         {/* Delivery Trend Chart */}
//         <div>
//           <h4 className="font-medium text-gray-900 mb-4">Delivery Trend</h4>
//           <div className="h-64">
//             <ResponsiveContainer width="100%" height="100%">
//               <LineChart data={deliveryData}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                 <XAxis dataKey="hour" stroke="#6b7280" fontSize={12} />
//                 <YAxis stroke="#6b7280" fontSize={12} />
//                 <Tooltip 
//                   contentStyle={{ 
//                     backgroundColor: 'white',
//                     border: '1px solid #e5e7eb',
//                     borderRadius: '8px',
//                     boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
//                   }}
//                 />
//                 <Line 
//                   type="monotone" 
//                   dataKey="deliveries" 
//                   stroke="#ff0000" 
//                   strokeWidth={2}
//                   dot={{ r: 4 }}
//                   activeDot={{ r: 6, stroke: '#ff0000', strokeWidth: 2 }}
//                 />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         {/* Status Distribution */}
//         <div>
//           <h4 className="font-medium text-gray-900 mb-4">Status Distribution</h4>
//           <div className="h-64">
//             <ResponsiveContainer width="100%" height="100%">
//               <PieChart>
//                 <Pie
//                   data={statusData}
//                   cx="50%"
//                   cy="50%"
//                   innerRadius={60}
//                   outerRadius={80}
//                   paddingAngle={5}
//                   dataKey="value"
//                 >
//                   {statusData.map((entry, index) => (
//                     <Cell key={`cell-${index}`} fill={entry.color} />
//                   ))}
//                 </Pie>
//                 <Tooltip 
//                   contentStyle={{ 
//                     backgroundColor: 'white',
//                     border: '1px solid #e5e7eb',
//                     borderRadius: '8px',
//                     boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
//                   }}
//                 />
//               </PieChart>
//             </ResponsiveContainer>
//             <div className="flex flex-wrap justify-center gap-4 mt-4">
//               {statusData.map((item, index) => (
//                 <div key={index} className="flex items-center space-x-2">
//                   <div 
//                     className="w-3 h-3 rounded-full" 
//                     style={{ backgroundColor: item.color }}
//                   />
//                   <span className="text-sm text-gray-600">{item.name}: {item.value}%</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Insights */}
//       <div className="mt-8 p-4 bg-pepper-50 rounded-lg border border-pepper-100">
//         <div className="flex items-start space-x-3">
//           <div className="p-2 bg-pepper-100 rounded-lg">
//             <TrendingUp className="h-5 w-5 text-pepper-600" />
//           </div>
//           <div>
//             <h4 className="font-medium text-gray-900">Performance Insight</h4>
//             <p className="text-sm text-gray-600 mt-1">
//               Deliveries are 23% higher than yesterday. Consider adding more locker capacity 
//               at Lekki Phase 1 location during peak hours (12 PM - 2 PM).
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }





