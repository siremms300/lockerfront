// app/dashboard/parcels/page.tsx - Updated
'use client'

import { useState, useMemo } from 'react'
import { useParcels, useUpdateParcel } from '@/hooks/useApi'
import { ParcelTable } from '@/components/parcels/parcel-table'
import { ParcelFilters } from '@/components/parcels/parcel-filters'
import { Package, RefreshCw, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'  // <-- ADD THIS IMPORT
import Link from 'next/link'

export default function ParcelsPage() {
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    page: 1,
    limit: 20
  })
  
  // Fetch real parcels
  const { data: parcels, isLoading, refetch } = useParcels(filters)
  const updateParcel = useUpdateParcel()
  
  // Handle status update
  const handleStatusUpdate = async (id: string, status: string) => {
    await updateParcel.mutateAsync({ 
      id, 
      data: { delivery: { status } } 
    })
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parcel Management</h1>
          <p className="text-gray-600">
            {isLoading ? 'Loading...' : `${parcels?.length || 0} parcels found`}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => refetch()}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw className={cn("h-5 w-5 text-gray-600", isLoading && "animate-spin")} />
          </button>
          
          <Link
            href="/dashboard/parcels/create"
            className="px-4 py-2 pepper-gradient text-white rounded-lg hover:shadow-lg transition flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Parcel</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <ParcelFilters filters={filters} onFilterChange={setFilters} />

      {/* Table */}
      <ParcelTable 
        parcels={parcels || []} 
        loading={isLoading}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  )
}




























































// // app/dashboard/parcels/page.tsx
// 'use client'

// import { useState, useEffect, useMemo } from 'react'
// import { 
//   Package, 
//   Search, 
//   Filter, 
//   Download, 
//   MoreVertical, 
//   Eye, 
//   Edit, 
//   Trash2,
//   RefreshCw,
//   Plus,
//   CheckCircle,
//   Clock,
//   XCircle,
//   AlertCircle,
//   Truck,
//   MapPin,
//   User
// } from 'lucide-react'
// import { motion, AnimatePresence } from 'framer-motion'
// import { useSocket } from '@/lib/socket'
// import { parcelAPI } from '@/lib/api'
// import { toast } from 'react-hot-toast'
// import { cn } from '@/lib/utils'

// type ParcelStatus = 'created' | 'in_transit' | 'at_location' | 'ready_for_pickup' | 'picked_up' | 'delivery_failed' | 'return_requested' | 'returned' | 'expired' | 'cancelled'

// interface Parcel {
//   _id: string
//   trackingNumber: string
//   customer: {
//     name: string
//     phone: string
//     email?: string
//   }
//   items: Array<{
//     description: string
//     quantity: number
//     value: number
//     weight: number
//   }>
//   delivery: {
//     pickupType: 'locker' | 'staffed_hub'
//     status: ParcelStatus
//     location?: string
//     pickupDeadline: string
//   }
//   payment: {
//     isCOD: boolean
//     amount: number
//     collected: boolean
//   }
//   createdAt: string
// }

// const statusConfig: Record<ParcelStatus, { label: string; color: string; icon: any }> = {
//   created: { label: 'Created', color: 'bg-blue-100 text-blue-800', icon: Package },
//   in_transit: { label: 'In Transit', color: 'bg-yellow-100 text-yellow-800', icon: Truck },
//   at_location: { label: 'At Location', color: 'bg-purple-100 text-purple-800', icon: MapPin },
//   ready_for_pickup: { label: 'Ready', color: 'bg-green-100 text-green-800', icon: CheckCircle },
//   picked_up: { label: 'Picked Up', color: 'bg-green-100 text-green-800', icon: CheckCircle },
//   delivery_failed: { label: 'Failed', color: 'bg-red-100 text-red-800', icon: XCircle },
//   return_requested: { label: 'Return Requested', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
//   returned: { label: 'Returned', color: 'bg-gray-100 text-gray-800', icon: RefreshCw },
//   expired: { label: 'Expired', color: 'bg-gray-100 text-gray-800', icon: Clock },
//   cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
// }

// export default function ParcelsPage() {
//   const socket = useSocket()
//   const [parcels, setParcels] = useState<Parcel[]>([])
//   const [loading, setLoading] = useState(true)
//   const [search, setSearch] = useState('')
//   const [selectedStatus, setSelectedStatus] = useState<ParcelStatus | 'all'>('all')
//   const [selectedParcels, setSelectedParcels] = useState<string[]>([])
//   const [bulkAction, setBulkAction] = useState<string>('')

//   // Fetch parcels on mount
//   useEffect(() => {
//     fetchParcels()
//   }, [])

//   // Socket listeners for real-time updates
//   useEffect(() => {
//     if (!socket) return

//     socket.on('parcel-updated', handleParcelUpdate)
//     socket.on('bulk-job-progress', handleBulkProgress)
//     socket.on('bulk-job-complete', handleBulkComplete)

//     return () => {
//       socket.off('parcel-updated', handleParcelUpdate)
//       socket.off('bulk-job-progress', handleBulkProgress)
//       socket.off('bulk-job-complete', handleBulkComplete)
//     }
//   }, [socket])

//   const fetchParcels = async () => {
//     try {
//       setLoading(true)
//       const response = await parcelAPI.getAll()
//       setParcels(response.data.parcels || [])
//     } catch (error) {
//       toast.error('Failed to fetch parcels')
//     } finally {
//       setLoading(false)
//     }
//   }

//   const handleParcelUpdate = (update: any) => {
//     setParcels(prev => prev.map(p => 
//       p._id === update.parcelId 
//         ? { ...p, delivery: { ...p.delivery, status: update.status } }
//         : p
//     ))
//   }

//   const handleBulkProgress = (data: any) => {
//     console.log('Bulk job progress:', data)
//   }

//   const handleBulkComplete = (data: any) => {
//     toast.success(`Bulk operation completed: ${data.result.success} successful, ${data.result.failed} failed`)
//     fetchParcels()
//     setSelectedParcels([])
//     setBulkAction('')
//   }

//   const filteredParcels = useMemo(() => {
//     return parcels.filter(parcel => {
//       const matchesSearch = search === '' || 
//         parcel.trackingNumber.toLowerCase().includes(search.toLowerCase()) ||
//         parcel.customer.name.toLowerCase().includes(search.toLowerCase()) ||
//         parcel.customer.phone.includes(search)
      
//       const matchesStatus = selectedStatus === 'all' || parcel.delivery.status === selectedStatus
      
//       return matchesSearch && matchesStatus
//     })
//   }, [parcels, search, selectedStatus])

//   const handleSelectAll = (checked: boolean) => {
//     if (checked) {
//       setSelectedParcels(filteredParcels.map(p => p._id))
//     } else {
//       setSelectedParcels([])
//     }
//   }

//   const handleBulkAction = (action: string) => {
//     if (selectedParcels.length === 0) {
//       toast.error('Please select parcels first')
//       return
//     }

//     setBulkAction(action)
//     socket?.emit('bulk-shipments', {
//       action,
//       parcelIds: selectedParcels
//     })
//   }

//   const getStatusIcon = (status: ParcelStatus) => {
//     const Icon = statusConfig[status].icon
//     return <Icon className="h-4 w-4 mr-2" />
//   }

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       month: 'short',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     })
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Parcel Management</h1>
//           <p className="text-gray-600">Track and manage all your shipments</p>
//         </div>
        
//         <div className="flex items-center space-x-3">
//           <button
//             onClick={fetchParcels}
//             className="p-2 hover:bg-gray-100 rounded-lg transition"
//             title="Refresh"
//           >
//             <RefreshCw className={cn("h-5 w-5 text-gray-600", loading && "animate-spin")} />
//           </button>
          
//           <a
//             href="/dashboard/parcels/create"
//             className="px-4 py-2 pepper-gradient text-white rounded-lg hover:shadow-lg transition flex items-center space-x-2"
//           >
//             <Plus className="h-4 w-4" />
//             <span>New Parcel</span>
//           </a>
//         </div>
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
//                 placeholder="Search by tracking number, customer name, or phone..."
//                 className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20 focus:outline-none transition"
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//               />
//             </div>
//           </div>

//           {/* Status Filter */}
//           <div className="flex items-center space-x-4">
//             <div className="flex items-center space-x-2">
//               <Filter className="h-5 w-5 text-gray-500" />
//               <span className="text-sm font-medium text-gray-700">Status:</span>
//             </div>
//             <select
//               className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20 focus:outline-none transition"
//               value={selectedStatus}
//               onChange={(e) => setSelectedStatus(e.target.value as ParcelStatus | 'all')}
//             >
//               <option value="all">All Statuses</option>
//               {Object.entries(statusConfig).map(([status, config]) => (
//                 <option key={status} value={status}>
//                   {config.label}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Export Button */}
//           <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center space-x-2">
//             <Download className="h-4 w-4" />
//             <span>Export</span>
//           </button>
//         </div>

//         {/* Bulk Actions */}
//         {selectedParcels.length > 0 && (
//           <motion.div
//             initial={{ opacity: 0, height: 0 }}
//             animate={{ opacity: 1, height: 'auto' }}
//             exit={{ opacity: 0, height: 0 }}
//             className="mt-4 p-3 bg-pepper-50 rounded-lg border border-pepper-200"
//           >
//             <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
//               <div className="flex items-center space-x-3">
//                 <span className="text-pepper-700 font-medium">
//                   {selectedParcels.length} parcel{selectedParcels.length !== 1 ? 's' : ''} selected
//                 </span>
//                 <button
//                   onClick={() => setSelectedParcels([])}
//                   className="text-sm text-pepper-600 hover:text-pepper-700"
//                 >
//                   Clear selection
//                 </button>
//               </div>
              
//               <div className="flex items-center space-x-2">
//                 <select
//                   className="px-3 py-2 bg-white rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20 focus:outline-none transition"
//                   value={bulkAction}
//                   onChange={(e) => handleBulkAction(e.target.value)}
//                   disabled={bulkAction !== ''}
//                 >
//                   <option value="">Bulk Actions</option>
//                   <option value="mark_ready">Mark as Ready for Pickup</option>
//                   <option value="send_reminder">Send Pickup Reminder</option>
//                   <option value="update_status">Update Status</option>
//                   <option value="generate_labels">Generate Labels</option>
//                   <option value="cancel">Cancel Shipments</option>
//                 </select>
                
//                 {bulkAction && (
//                   <div className="flex items-center space-x-2 text-sm text-gray-600">
//                     <RefreshCw className="h-4 w-4 animate-spin" />
//                     <span>Processing...</span>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </motion.div>
//         )}
//       </div>

//       {/* Parcels Table */}
//       <div className="bg-white rounded-xl shadow-soft overflow-hidden border border-gray-200">
//         {loading ? (
//           <div className="p-12 text-center">
//             <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pepper-500 mb-4"></div>
//             <p className="text-gray-600">Loading parcels...</p>
//           </div>
//         ) : filteredParcels.length === 0 ? (
//           <div className="p-12 text-center">
//             <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//             <h3 className="text-lg font-medium text-gray-900 mb-2">No parcels found</h3>
//             <p className="text-gray-600">
//               {search || selectedStatus !== 'all' 
//                 ? 'Try adjusting your filters'
//                 : 'Get started by creating your first parcel'
//               }
//             </p>
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead>
//                 <tr className="bg-gray-50 border-b border-gray-200">
//                   <th className="py-3 px-4 text-left">
//                     <input
//                       type="checkbox"
//                       checked={selectedParcels.length === filteredParcels.length && filteredParcels.length > 0}
//                       onChange={(e) => handleSelectAll(e.target.checked)}
//                       className="h-4 w-4 text-pepper-600 rounded border-gray-300 focus:ring-pepper-500"
//                     />
//                   </th>
//                   <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Tracking Number
//                   </th>
//                   <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Customer
//                   </th>
//                   <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Items
//                   </th>
//                   <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Status
//                   </th>
//                   <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Payment
//                   </th>
//                   <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Created
//                   </th>
//                   <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-200">
//                 <AnimatePresence>
//                   {filteredParcels.map((parcel) => (
//                     <motion.tr
//                       key={parcel._id}
//                       initial={{ opacity: 0, y: 20 }}
//                       animate={{ opacity: 1, y: 0 }}
//                       exit={{ opacity: 0, y: -20 }}
//                       className="hover:bg-gray-50 transition-colors"
//                     >
//                       <td className="py-3 px-4">
//                         <input
//                           type="checkbox"
//                           checked={selectedParcels.includes(parcel._id)}
//                           onChange={(e) => {
//                             if (e.target.checked) {
//                               setSelectedParcels([...selectedParcels, parcel._id])
//                             } else {
//                               setSelectedParcels(selectedParcels.filter(id => id !== parcel._id))
//                             }
//                           }}
//                           className="h-4 w-4 text-pepper-600 rounded border-gray-300 focus:ring-pepper-500"
//                         />
//                       </td>
//                       <td className="py-3 px-4">
//                         <div>
//                           <div className="font-medium text-gray-900">{parcel.trackingNumber}</div>
//                           <div className="text-sm text-gray-500">
//                             {parcel.delivery.pickupType === 'locker' ? 'Smart Locker' : 'Staffed Hub'}
//                           </div>
//                         </div>
//                       </td>
//                       <td className="py-3 px-4">
//                         <div>
//                           <div className="font-medium text-gray-900">{parcel.customer.name}</div>
//                           <div className="text-sm text-gray-500">{parcel.customer.phone}</div>
//                         </div>
//                       </td>
//                       <td className="py-3 px-4">
//                         <div>
//                           <div className="font-medium text-gray-900">
//                             {parcel.items[0]?.description || 'No description'}
//                           </div>
//                           <div className="text-sm text-gray-500">
//                             {parcel.items.length} item{parcel.items.length !== 1 ? 's' : ''} • ₦{parcel.items.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
//                           </div>
//                         </div>
//                       </td>
//                       <td className="py-3 px-4">
//                         <span className={cn(
//                           "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
//                           statusConfig[parcel.delivery.status].color
//                         )}>
//                           {getStatusIcon(parcel.delivery.status)}
//                           {statusConfig[parcel.delivery.status].label}
//                         </span>
//                       </td>
//                       <td className="py-3 px-4">
//                         <div>
//                           <div className="font-medium text-gray-900">
//                             {parcel.payment.isCOD ? 'Cash on Delivery' : 'Prepaid'}
//                           </div>
//                           <div className="text-sm text-gray-500">
//                             ₦{parcel.payment.amount.toLocaleString()} • 
//                             <span className={parcel.payment.collected ? "text-green-600 ml-1" : "text-yellow-600 ml-1"}>
//                               {parcel.payment.collected ? ' Collected' : ' Pending'}
//                             </span>
//                           </div>
//                         </div>
//                       </td>
//                       <td className="py-3 px-4 text-sm text-gray-500">
//                         {formatDate(parcel.createdAt)}
//                       </td>
//                       <td className="py-3 px-4">
//                         <div className="flex items-center space-x-2">
//                           <button
//                             title="View"
//                             className="p-1 hover:bg-gray-100 rounded transition"
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
//                           <button className="p-1 hover:bg-gray-100 rounded transition">
//                             <MoreVertical className="h-4 w-4 text-gray-600" />
//                           </button>
//                         </div>
//                       </td>
//                     </motion.tr>
//                   ))}
//                 </AnimatePresence>
//               </tbody>
//             </table>
//           </div>
//         )}

//         {/* Pagination */}
//         {filteredParcels.length > 0 && (
//           <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
//             <div className="text-sm text-gray-500">
//               Showing <span className="font-medium">{filteredParcels.length}</span> parcels
//             </div>
//             <div className="flex items-center space-x-2">
//               <button className="px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm">
//                 Previous
//               </button>
//               <button className="px-3 py-1 pepper-gradient text-white rounded-lg text-sm">
//                 1
//               </button>
//               <button className="px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm">
//                 2
//               </button>
//               <button className="px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm">
//                 3
//               </button>
//               <button className="px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm">
//                 Next
//               </button>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Stats Summary */}
//       <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
//         {Object.entries(statusConfig).map(([status, config]) => {
//           const count = parcels.filter(p => p.delivery.status === status).length
//           const Icon = config.icon
          
//           if (count === 0) return null
          
//           return (
//             <div key={status} className="bg-white rounded-lg shadow-soft p-4 border border-gray-200">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <div className="text-2xl font-bold text-gray-900">{count}</div>
//                   <div className="text-sm text-gray-500">{config.label}</div>
//                 </div>
//                 <div className={cn("p-2 rounded-lg", config.color)}>
//                   <Icon className="h-5 w-5" />
//                 </div>
//               </div>
//             </div>
//           )
//         }).filter(Boolean)}
//       </div>

//       {/* Real-time Updates Indicator */}
//       <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-hard p-3 border border-gray-200 flex items-center space-x-2">
//         <div className={`w-2 h-2 rounded-full ${socket?.isConnected() ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
//         <span className="text-sm text-gray-700">
//           {socket?.isConnected() ? 'Live updates active' : 'Connecting...'}
//         </span>
//       </div>
//     </div>
//   )
// }



