// components/parcels/parcel-table.tsx
'use client'

import { useState } from 'react'
import { 
  Package, 
  Eye, 
  Edit, 
  Trash2, 
  MoreVertical,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  MapPin
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { format } from 'date-fns'

interface Parcel {
  _id: string
  trackingNumber: string
  customer: {
    name: string
    phone: string
  }
  items: Array<{
    description: string
    quantity: number
    value: number
  }>
  delivery: {
    status: string
    pickupType: 'locker' | 'staffed_hub'
    location?: any
  }
  payment: {
    isCOD: boolean
    amount: number
    collected: boolean
  }
  createdAt: string
}

interface ParcelTableProps {
  parcels: Parcel[]
  loading: boolean
  onStatusUpdate: (id: string, status: string) => void
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  created: { label: 'Created', color: 'bg-blue-100 text-blue-800', icon: Package },
  in_transit: { label: 'In Transit', color: 'bg-yellow-100 text-yellow-800', icon: Truck },
  at_location: { label: 'At Location', color: 'bg-purple-100 text-purple-800', icon: MapPin },
  ready_for_pickup: { label: 'Ready', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  picked_up: { label: 'Picked Up', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  delivery_failed: { label: 'Failed', color: 'bg-red-100 text-red-800', icon: XCircle },
}

export function ParcelTable({ parcels, loading, onStatusUpdate }: ParcelTableProps) {
  const [selectedParcels, setSelectedParcels] = useState<string[]>([])

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-soft p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pepper-500"></div>
          <span className="ml-3 text-gray-600">Loading parcels...</span>
        </div>
      </div>
    )
  }

  if (!parcels || parcels.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-soft p-12 text-center border border-gray-200">
        <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-gray-900 mb-2">No parcels found</h3>
        <p className="text-gray-600 mb-6">Get started by creating your first parcel</p>
        <Link
          href="/dashboard/parcels/create"
          className="px-6 py-3 pepper-gradient text-white rounded-lg hover:shadow-lg transition inline-flex items-center space-x-2"
        >
          <span>Create New Parcel</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-soft overflow-hidden border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-3 px-4 text-left">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-pepper-600 rounded border-gray-300"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedParcels(parcels.map(p => p._id))
                    } else {
                      setSelectedParcels([])
                    }
                  }}
                />
              </th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Tracking</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {parcels.map((parcel) => {
              const StatusIcon = statusConfig[parcel.delivery.status]?.icon || Package
              
              return (
                <tr key={parcel._id} className="hover:bg-gray-50 transition">
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedParcels.includes(parcel._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedParcels([...selectedParcels, parcel._id])
                        } else {
                          setSelectedParcels(selectedParcels.filter(id => id !== parcel._id))
                        }
                      }}
                      className="h-4 w-4 text-pepper-600 rounded border-gray-300"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{parcel.trackingNumber}</div>
                    <div className="text-xs text-gray-500">
                      {parcel.delivery.pickupType === 'locker' ? 'Smart Locker' : 'Staffed Hub'}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">{parcel.customer.name}</div>
                    <div className="text-xs text-gray-500">{parcel.customer.phone}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">
                      {parcel.items?.[0]?.description || 'No items'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {parcel.items?.length || 0} items
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={cn(
                      "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                      statusConfig[parcel.delivery.status]?.color || 'bg-gray-100 text-gray-800'
                    )}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig[parcel.delivery.status]?.label || parcel.delivery.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-gray-900">
                      ₦{parcel.payment?.amount?.toLocaleString() || 0}
                    </div>
                    <div className="text-xs text-gray-500">
                      {parcel.payment?.isCOD ? 'COD' : 'Prepaid'}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">
                    {format(new Date(parcel.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Link href={`/dashboard/parcels/${parcel._id}`}>
                        <button className="p-1 hover:bg-gray-100 rounded" title="View">
                          <Eye className="h-4 w-4 text-gray-600" />
                        </button>
                      </Link>
                      <Link href={`/dashboard/parcels/${parcel._id}/edit`}>
                        <button className="p-1 hover:bg-gray-100 rounded" title="Edit">
                          <Edit className="h-4 w-4 text-gray-600" />
                        </button>
                      </Link>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreVertical className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}