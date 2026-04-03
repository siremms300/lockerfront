'use client'

import { Edit, Trash2, MoreVertical } from 'lucide-react'

interface Role {
  id: string
  name: string
  description: string
  users: number
  permissions: string[]
  createdAt: string
}

interface RoleTableProps {
  onEdit: (role: Role) => void
  onDelete: (role: Role) => void
}

export function RoleTable({ onEdit, onDelete }: RoleTableProps) {
  const sampleRoles: Role[] = [
    {
      id: '1',
      name: 'Super Admin',
      description: 'Full system access',
      users: 2,
      permissions: ['parcels.create', 'parcels.view', 'users.manage', 'roles.manage'],
      createdAt: '2024-01-01'
    },
    {
      id: '2',
      name: 'Location Manager',
      description: 'Manage specific locations',
      users: 5,
      permissions: ['parcels.create', 'parcels.view', 'locations.view'],
      createdAt: '2024-01-15'
    },
    {
      id: '3',
      name: 'Support Staff',
      description: 'Customer support access',
      users: 8,
      permissions: ['parcels.view', 'customers.view'],
      createdAt: '2024-02-01'
    }
  ]

  return (
    <div className="bg-white rounded-lg shadow-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Users</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sampleRoles.map((role) => (
              <tr key={role.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{role.name}</p>
                    <p className="text-sm text-gray-500">{role.description}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{role.users}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 2).map((perm) => (
                      <span key={perm} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        {perm}
                      </span>
                    ))}
                    {role.permissions.length > 2 && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        +{role.permissions.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{role.createdAt}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onEdit(role)}
                      className="text-blue-600 hover:text-blue-800 transition"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onDelete(role)}
                      className="text-red-600 hover:text-red-800 transition"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}