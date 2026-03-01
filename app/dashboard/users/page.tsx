// app/admin/users/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Shield, 
  Mail, 
  Phone, 
  Building,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  RefreshCw,
  CheckCircle,
  XCircle,
  Package,
  User as UserIcon,
  Store
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { adminAPI, merchantAPI, customerAPI } from '@/lib/api'
import { InviteUserModal } from '@/components/admin/users/invite-user-modal'
import { EditUserModal } from '@/components/admin/users/edit-user-modal'

// Merchant type from your backend
interface Merchant {
  _id: string
  businessName: string
  email: string
  phone: string
  role: 'admin' | 'merchant' | 'super_admin'
  businessType: string
  isActive: boolean
  createdAt: string
  lastLogin?: string
  type: 'merchant' // Discriminator
}

// Customer type from your backend
interface Customer {
  _id: string
  name: string
  email?: string
  phone: string
  totalParcels: number
  completedParcels: number
  totalSpent: number
  status: 'active' | 'inactive' | 'new'
  joinedDate: string
  lastPickup?: string
  type: 'customer' // Discriminator
}

type User = Merchant | Customer

export default function AdminUsersPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [search, setSearch] = useState('')
  const [userType, setUserType] = useState<'all' | 'merchant' | 'customer'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'new'>('all')

  useEffect(() => {
    fetchAllUsers()
  }, [])

  const fetchAllUsers = async () => {
    try {
      setLoading(true)
      
      // Fetch merchants
      const merchantsRes = await adminAPI.getMerchants()
      const merchantsData = merchantsRes.data.merchants.map((m: any) => ({
        ...m,
        type: 'merchant' as const
      }))
      
      // Fetch customers
      const customersRes = await adminAPI.getCustomers()
      const customersData = customersRes.data.customers.map((c: any) => ({
        ...c,
        type: 'customer' as const
      }))
      
      setMerchants(merchantsData)
      setCustomers(customersData)
      
    } catch (error) {
      toast.error('Failed to load users')
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredUsers = (): User[] => {
    const allUsers: User[] = [...merchants, ...customers]
    
    return allUsers.filter(user => {
      // Filter by type
      if (userType !== 'all' && user.type !== userType) return false
      
      // Filter by status (different for merchants vs customers)
      if (statusFilter !== 'all') {
        if (user.type === 'merchant') {
          const merchant = user as Merchant
          if (statusFilter === 'active' && !merchant.isActive) return false
          if (statusFilter === 'inactive' && merchant.isActive) return false
          if (statusFilter === 'new') return false // Merchants don't have 'new' status
        } else {
          const customer = user as Customer
          if (customer.status !== statusFilter) return false
        }
      }
      
      // Search
      if (search) {
        const searchLower = search.toLowerCase()
        if (user.type === 'merchant') {
          const merchant = user as Merchant
          return merchant.businessName.toLowerCase().includes(searchLower) ||
                 merchant.email.toLowerCase().includes(searchLower) ||
                 merchant.phone.includes(searchLower)
        } else {
          const customer = user as Customer
          return customer.name.toLowerCase().includes(searchLower) ||
                 (customer.email?.toLowerCase() || '').includes(searchLower) ||
                 customer.phone.includes(searchLower)
        }
      }
      
      return true
    }).sort((a, b) => {
      // Sort by creation date (newest first)
      const dateA = new Date(a.type === 'merchant' ? a.createdAt : a.joinedDate)
      const dateB = new Date(b.type === 'merchant' ? b.createdAt : b.joinedDate)
      return dateB.getTime() - dateA.getTime()
    })
  }

  const handleToggleStatus = async (user: User) => {
    try {
      if (user.type === 'merchant') {
        const merchant = user as Merchant
        await adminAPI.updateMerchantStatus(merchant._id, {
          isActive: !merchant.isActive
        })
        toast.success(`Merchant ${merchant.isActive ? 'deactivated' : 'activated'}`)
      } else {
        const customer = user as Customer
        const newStatus = customer.status === 'active' ? 'inactive' : 'active'
        await adminAPI.updateCustomerStatus(customer._id, {
          status: newStatus
        })
        toast.success(`Customer ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
      }
      fetchAllUsers()
    } catch (error) {
      toast.error('Failed to update user status')
    }
  }

  const filteredUsers = getFilteredUsers()

  const getUserAvatar = (user: User) => {
    if (user.type === 'merchant') {
      const merchant = user as Merchant
      return merchant.businessName.charAt(0).toUpperCase()
    } else {
      const customer = user as Customer
      return customer.name.charAt(0).toUpperCase()
    }
  }

  const getUserDisplayName = (user: User) => {
    if (user.type === 'merchant') {
      return (user as Merchant).businessName
    } else {
      return (user as Customer).name
    }
  }

  const getUserEmail = (user: User) => {
    if (user.type === 'merchant') {
      return (user as Merchant).email
    } else {
      return (user as Customer).email || 'No email'
    }
  }

  const getUserPhone = (user: User) => {
    return user.phone
  }

  const getUserStatus = (user: User) => {
    if (user.type === 'merchant') {
      return (user as Merchant).isActive ? 'active' : 'inactive'
    } else {
      return (user as Customer).status
    }
  }

  const getUserDate = (user: User) => {
    if (user.type === 'merchant') {
      return (user as Merchant).createdAt
    } else {
      return (user as Customer).joinedDate
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage all merchants and customers</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchAllUsers}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Refresh"
          >
            <RefreshCw className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-pepper-500 text-white rounded-lg hover:bg-pepper-600 transition flex items-center space-x-2"
          >
            <UserPlus className="h-4 w-4" />
            <span>Invite Merchant</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-soft p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name, email, or phone..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <select
                value={userType}
                onChange={(e) => setUserType(e.target.value as any)}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="all">All Users</option>
                <option value="merchant">Merchants Only</option>
                <option value="customer">Customers Only</option>
              </select>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="new">New</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Merchants</p>
              <p className="text-2xl font-bold">{merchants.length}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Store className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Customers</p>
              <p className="text-2xl font-bold">{customers.length}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Merchants</p>
              <p className="text-2xl font-bold">
                {merchants.filter(m => m.isActive).length}
              </p>
            </div>
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">New Customers</p>
              <p className="text-2xl font-bold">
                {customers.filter(c => c.status === 'new').length}
              </p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <UserPlus className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stats</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={`${user.type}-${user._id}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold",
                        user.type === 'merchant' 
                          ? "bg-gradient-to-br from-pepper-500 to-pepper-600"
                          : "bg-gradient-to-br from-blue-500 to-purple-600"
                      )}>
                        {getUserAvatar(user)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{getUserDisplayName(user)}</div>
                        <div className="text-sm text-gray-500">{getUserEmail(user)}</div>
                        <div className="text-xs text-gray-400">{getUserPhone(user)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium inline-flex items-center space-x-1",
                      user.type === 'merchant'
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    )}>
                      {user.type === 'merchant' ? (
                        <>
                          <Store className="h-3 w-3 mr-1" />
                          <span>Merchant</span>
                        </>
                      ) : (
                        <>
                          <UserIcon className="h-3 w-3 mr-1" />
                          <span>Customer</span>
                        </>
                      )}
                    </span>
                    {user.type === 'merchant' && (user as Merchant).role && (
                      <div className="mt-1">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          (user as Merchant).role === 'admin' ? "bg-green-100 text-green-800" :
                          (user as Merchant).role === 'super_admin' ? "bg-purple-100 text-purple-800" :
                          "bg-gray-100 text-gray-800"
                        )}>
                          {(user as Merchant).role}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleStatus(user)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1",
                        getUserStatus(user) === 'active' ? "bg-green-100 text-green-800" :
                        getUserStatus(user) === 'inactive' ? "bg-gray-100 text-gray-800" :
                        "bg-blue-100 text-blue-800"
                      )}
                    >
                      {getUserStatus(user) === 'active' ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : getUserStatus(user) === 'new' ? (
                        <UserPlus className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      <span className="capitalize">{getUserStatus(user)}</span>
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(getUserDate(user)).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    {user.type === 'customer' ? (
                      <div className="text-sm">
                        <div>Parcels: {(user as Customer).totalParcels}</div>
                        <div className="text-xs text-gray-500">
                          Spent: ₦{((user as Customer).totalSpent / 1000).toFixed(0)}K
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        {(user as Merchant).businessType || 'N/A'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4 text-gray-600" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreVertical className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredUsers.length === 0 && (
          <div className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">
              {search || userType !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No users in the system yet'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <InviteUserModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={fetchAllUsers}
      />
      
      <EditUserModal
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSuccess={fetchAllUsers}
      />
    </div>
  )
}