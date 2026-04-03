'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface Permission {
  id: string
  name: string
  category: string
}

interface Role {
  id?: string
  name: string
  description: string
  permissions: string[]
}

interface CreateRoleModalProps {
  isOpen: boolean
  onClose: () => void
  role?: Role | null
}

export function CreateRoleModal({ isOpen, onClose, role }: CreateRoleModalProps) {
  const [formData, setFormData] = useState<Role>({
    name: role?.name || '',
    description: role?.description || '',
    permissions: role?.permissions || []
  })

  if (!isOpen) return null

  const permissionsList: Permission[] = [
    { id: 'parcels.create', name: 'Create Parcels', category: 'Parcels' },
    { id: 'parcels.view', name: 'View Parcels', category: 'Parcels' },
    { id: 'parcels.edit', name: 'Edit Parcels', category: 'Parcels' },
    { id: 'parcels.delete', name: 'Delete Parcels', category: 'Parcels' },
    { id: 'users.manage', name: 'Manage Users', category: 'Users' },
    { id: 'roles.manage', name: 'Manage Roles', category: 'Roles' },
    { id: 'locations.view', name: 'View Locations', category: 'Locations' },
    { id: 'locations.manage', name: 'Manage Locations', category: 'Locations' },
    { id: 'customers.view', name: 'View Customers', category: 'Customers' },
    { id: 'reports.view', name: 'View Reports', category: 'Reports' }
  ]

  // Type-safe groupBy operation
  const groupedPermissions = permissionsList.reduce<Record<string, Permission[]>>((acc, perm: Permission) => {
    const category = perm.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(perm)
    return acc
  }, {})

  const togglePermission = (permissionId: string): void => {
    setFormData((prev: Role) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((p: string) => p !== permissionId)
        : [...prev.permissions, permissionId]
    }))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    console.log('Role data:', formData)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-bold">
            {role ? 'Edit Role' : 'Create New Role'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
            type="button"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Location Manager"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the role's responsibilities..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permissions
            </label>
            <div className="border border-gray-200 rounded-lg divide-y">
              {Object.entries(groupedPermissions).map(([category, perms]: [string, Permission[]]) => (
                <div key={category} className="p-4">
                  <h4 className="font-medium text-gray-900 mb-3">{category}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {perms.map((perm: Permission) => (
                      <label key={perm.id} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(perm.id)}
                          onChange={() => togglePermission(perm.id)}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{perm.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
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
              {role ? 'Update Role' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}