// // components/admin/locations/create-location-modal.tsx
// 'use client'

// import { X } from 'lucide-react'
// import { cn } from '@/lib/utils'

// interface CreateLocationModalProps {
//   isOpen: boolean
//   onClose: () => void
//   location?: any
// }

// export function CreateLocationModal({ isOpen, onClose, location }: CreateLocationModalProps) {
//   if (!isOpen) return null

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
//       <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
//         <div className="flex items-center justify-between p-6 border-b">
//           <h3 className="text-lg font-bold">
//             {location ? 'Edit Location' : 'Add New Location'}
//           </h3>
//           <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
//             <X className="h-5 w-5" />
//           </button>
//         </div>
        
//         <div className="p-6 space-y-4">
//           <div>
//             <label className="block text-sm font-medium mb-2">Location Name</label>
//             <input 
//               type="text" 
//               className="w-full px-3 py-2 border rounded-lg"
//               placeholder="e.g., Ikeja Mall Locker"
//               defaultValue={location?.name || ''}
//             />
//           </div>
          
//           <div>
//             <label className="block text-sm font-medium mb-2">Type</label>
//             <select className="w-full px-3 py-2 border rounded-lg">
//               <option value="locker">Smart Locker</option>
//               <option value="hub">Staffed Hub</option>
//             </select>
//           </div>
          
//           <div>
//             <label className="block text-sm font-medium mb-2">Address</label>
//             <textarea 
//               className="w-full px-3 py-2 border rounded-lg"
//               rows={3}
//               placeholder="Full address..."
//               defaultValue={location?.address || ''}
//             />
//           </div>
//         </div>
        
//         <div className="flex items-center justify-end space-x-3 p-6 border-t">
//           <button onClick={onClose} className="px-4 py-2 border rounded-lg">
//             Cancel
//           </button>
//           <button className="px-4 py-2 pepper-gradient text-white rounded-lg">
//             {location ? 'Update' : 'Create'}
//           </button>
//         </div>
//       </div>
//     </div>
//   )
// }








// // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@2

// components/admin/locations/create-location-modal.tsx
'use client'

import { useState, useEffect } from 'react'
import { X, MapPin } from 'lucide-react'

interface CreateLocationModalProps {
  isOpen: boolean
  onClose: () => void
  location?: any
}

export function CreateLocationModal({ isOpen, onClose, location }: CreateLocationModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    lockers: 16,
    type: 'standard',
  })

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name || '',
        address: location.address || '',
        city: location.city || '',
        state: location.state || '',
        zipCode: location.zipCode || '',
        lockers: location.lockers || 16,
        type: location.type || 'standard',
      })
    } else {
      setFormData({
        name: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        lockers: 16,
        type: 'standard',
      })
    }
  }, [location, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-bold">
              {location ? 'Edit Location' : 'Add New Location'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Downtown Hub"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="express">Express</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="123 Main Street"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="New York"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State *
              </label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="NY"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ZIP Code *
              </label>
              <input
                type="text"
                required
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="10001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Lockers *
              </label>
              <input
                type="number"
                required
                min="1"
                max="100"
                value={formData.lockers}
                onChange={(e) => setFormData({ ...formData, lockers: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {location ? 'Update Location' : 'Create Location'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}