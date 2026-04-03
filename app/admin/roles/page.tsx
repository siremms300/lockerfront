'use client'

import { useState } from 'react'
import { Shield, UserPlus, Search, Filter, MoreVertical } from 'lucide-react'
import { RoleTable } from '@/components/admin/roles/role-table'
import { CreateRoleModal } from '@/components/admin/roles/create-role-modal'

interface Role {
  id: string
  name: string
  description: string
  users: number
  permissions: string[]
  createdAt: string
}

export default function RolesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPermission, setFilterPermission] = useState('all')

  const permissions = [
    { id: 'parcels.create', name: 'Create Parcels', category: 'Parcels' },
    { id: 'parcels.view', name: 'View Parcels', category: 'Parcels' },
    { id: 'parcels.edit', name: 'Edit Parcels', category: 'Parcels' },
    { id: 'parcels.delete', name: 'Delete Parcels', category: 'Parcels' },
    { id: 'users.manage', name: 'Manage Users', category: 'Users' },
    { id: 'roles.manage', name: 'Manage Roles', category: 'Roles' },
    { id: 'locations.view', name: 'View Locations', category: 'Locations' },
    { id: 'locations.manage', name: 'Manage Locations', category: 'Locations' },
    { id: 'customers.view', name: 'View Customers', category: 'Customers' },
    { id: 'reports.view', name: 'View Reports', category: 'Reports' },
    { id: 'settings.manage', name: 'Manage Settings', category: 'System' },
    { id: 'audit.logs', name: 'View Audit Logs', category: 'System' },
  ]

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = []
    acc[perm.category].push(perm)
    return acc
  }, {} as Record<string, typeof permissions>)

  const handleEdit = (role: Role) => {
    setSelectedRole(role)
    setShowCreateModal(true)
  }

  const handleDelete = (role: Role) => {
    if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      console.log('Delete role:', role)
      // Add delete logic here
    }
  }

  const handleCreate = () => {
    setSelectedRole(null)
    setShowCreateModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
          <p className="text-gray-600">Manage user roles and permissions</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
        >
          <UserPlus className="h-4 w-4" />
          <span>Create Role</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Roles</p>
              <p className="text-2xl font-bold">8</p>
            </div>
            <Shield className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Permissions</p>
              <p className="text-2xl font-bold">{permissions.length}</p>
            </div>
            <Filter className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Users</p>
              <p className="text-2xl font-bold">156</p>
            </div>
            <UserPlus className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Permission Categories</p>
              <p className="text-2xl font-bold">{Object.keys(groupedPermissions).length}</p>
            </div>
            <MoreVertical className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-soft p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filterPermission}
              onChange={(e) => setFilterPermission(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Permissions</option>
              {Object.keys(groupedPermissions).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Permissions Legend */}
      <div className="bg-white rounded-lg shadow-soft p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Permission Categories</h3>
        <div className="flex flex-wrap gap-2">
          {Object.keys(groupedPermissions).map((category) => (
            <span
              key={category}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
            >
              {category} ({groupedPermissions[category].length})
            </span>
          ))}
        </div>
      </div>

      {/* Role Table */}
      <RoleTable onEdit={handleEdit} onDelete={handleDelete} />

      {/* Create/Edit Modal */}
      <CreateRoleModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        role={selectedRole}
      />
    </div>
  )
}