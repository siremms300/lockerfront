// app/admin/roles/page.tsx
'use client'

import { useState } from 'react'
import { Shield, UserPlus, Search, Filter, MoreVertical } from 'lucide-react'
import { RoleTable } from '@/components/admin/roles/role-table'
import { CreateRoleModal } from '@/components/admin/roles/create-role-modal'

const permissions = [
  { id: 'parcels.create', name: 'Create Parcels', category: 'Parcels' },
  { id: 'parcels.read', name: 'View Parcels', category: 'Parcels' },
  { id: 'parcels.update', name: 'Update Parcels', category: 'Parcels' },
  { id: 'parcels.delete', name: 'Delete Parcels', category: 'Parcels' },
  { id: 'users.manage', name: 'Manage Users', category: 'Users' },
  { id: 'locations.manage', name: 'Manage Locations', category: 'Locations' },
  { id: 'billing.view', name: 'View Billing', category: 'Billing' },
  { id: 'billing.manage', name: 'Manage Billing', category: 'Billing' },
  { id: 'analytics.view', name: 'View Analytics', category: 'Analytics' },
  { id: 'settings.manage', name: 'Manage Settings', category: 'System' },
]

export default function RolesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState<any>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
          <p className="text-gray-600">Define and manage user permissions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 pepper-gradient text-white rounded-lg hover:shadow-lg transition flex items-center space-x-2"
        >
          <UserPlus className="h-4 w-4" />
          <span>Create Role</span>
        </button>
      </div>

      {/* Role Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Roles', value: '12', icon: Shield, color: 'bg-blue-500' },
          { label: 'Admin Users', value: '5', icon: Shield, color: 'bg-green-500' },
          { label: 'Manager Users', value: '15', icon: Shield, color: 'bg-purple-500' },
          { label: 'Custom Roles', value: '8', icon: Shield, color: 'bg-yellow-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-4 rounded-lg shadow-soft">
            <div className="flex items-center space-x-3">
              <div className={`p-2 ${stat.color} rounded-lg`}>
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Permissions Overview */}
      <div className="bg-white rounded-lg shadow-soft p-6">
        <h3 className="text-lg font-bold mb-4">Permission Matrix</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {['Parcels', 'Users', 'Locations', 'Billing'].map((category) => (
            <div key={category} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium mb-3">{category} Permissions</h4>
              <div className="space-y-2">
                {permissions
                  .filter(p => p.category === category)
                  .map(permission => (
                    <div key={permission.id} className="flex items-center justify-between">
                      <span className="text-sm">{permission.name}</span>
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-pepper-600 rounded"
                        defaultChecked={Math.random() > 0.5}
                      />
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Roles Table */}
      <RoleTable onEdit={setSelectedRole} />

      {/* Create/Edit Modal */}
      <CreateRoleModal
        isOpen={showCreateModal || !!selectedRole}
        onClose={() => {
          setShowCreateModal(false)
          setSelectedRole(null)
        }}
        role={selectedRole}
        permissions={permissions}
      />
    </div>
  )
}



