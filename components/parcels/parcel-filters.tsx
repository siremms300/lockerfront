// components/parcels/parcel-filters.tsx
'use client'

import { Search, Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ParcelFiltersProps {
  filters: {
    search: string
    status: string
    page: number
    limit: number
  }
  onFilterChange: (filters: any) => void
}

export function ParcelFilters({ filters, onFilterChange }: ParcelFiltersProps) {
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'created', label: 'Created' },
    { value: 'in_transit', label: 'In Transit' },
    { value: 'at_location', label: 'At Location' },
    { value: 'ready_for_pickup', label: 'Ready for Pickup' },
    { value: 'picked_up', label: 'Picked Up' },
    { value: 'delivery_failed', label: 'Delivery Failed' },
  ]

  return (
    <div className="bg-white rounded-xl shadow-soft p-4 border border-gray-200">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by tracking number or customer..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20 focus:outline-none transition"
              value={filters.search}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value, page: 1 })}
            />
            {filters.search && (
              <button
                onClick={() => onFilterChange({ ...filters, search: '', page: 1 })}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <select
              className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20 focus:outline-none transition"
              value={filters.status}
              onChange={(e) => onFilterChange({ ...filters, status: e.target.value, page: 1 })}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}