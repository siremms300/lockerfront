// components/admin/locations/create-location-modal.tsx
'use client'

import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CreateLocationModalProps {
  isOpen: boolean
  onClose: () => void
  location?: any
}

export function CreateLocationModal({ isOpen, onClose, location }: CreateLocationModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-bold">
            {location ? 'Edit Location' : 'Add New Location'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Location Name</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., Ikeja Mall Locker"
              defaultValue={location?.name || ''}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <select className="w-full px-3 py-2 border rounded-lg">
              <option value="locker">Smart Locker</option>
              <option value="hub">Staffed Hub</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Address</label>
            <textarea 
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
              placeholder="Full address..."
              defaultValue={location?.address || ''}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-end space-x-3 p-6 border-t">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg">
            Cancel
          </button>
          <button className="px-4 py-2 pepper-gradient text-white rounded-lg">
            {location ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}



