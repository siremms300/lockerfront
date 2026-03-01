// components/admin/users/edit-user-modal.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  Save, 
  Loader2, 
  Mail, 
  Phone, 
  Building,
  Store,
  User as UserIcon,
  Package,
  DollarSign,
  Calendar,
  Shield,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { adminAPI } from '@/lib/api'
import { cn } from '@/lib/utils'

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
  type: 'merchant'
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
  type: 'customer'
}

type User = Merchant | Customer

interface EditUserModalProps {
  user: User | null
  onClose: () => void
  onSuccess: () => void
}

export function EditUserModal({ user, onClose, onSuccess }: EditUserModalProps) {
  const [loading, setLoading] = useState(false)
  const [merchantForm, setMerchantForm] = useState({
    businessName: '',
    email: '',
    phone: '',
    businessType: '',
    role: 'merchant' as 'merchant' | 'admin' | 'super_admin',
    isActive: true,
  })

  const [customerForm, setCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'active' as 'active' | 'inactive' | 'new',
  })

  useEffect(() => {
    if (user) {
      if (user.type === 'merchant') {
        const m = user as Merchant
        setMerchantForm({
          businessName: m.businessName,
          email: m.email,
          phone: m.phone || '',
          businessType: m.businessType || '',
          role: m.role,
          isActive: m.isActive,
        })
      } else {
        const c = user as Customer
        setCustomerForm({
          name: c.name,
          email: c.email || '',
          phone: c.phone || '',
          status: c.status,
        })
      }
    }
  }, [user])

  if (!user) return null

  const isMerchant = user.type === 'merchant'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setLoading(true)
    try {
      if (isMerchant) {
        await adminAPI.updateMerchant(user._id, merchantForm)
        toast.success('Merchant updated successfully')
      } else {
        await adminAPI.updateCustomer(user._id, customerForm)
        toast.success('Customer updated successfully')
      }
      
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update user')
    } finally {
      setLoading(false)
    }
  }

  const getUserAvatar = () => {
    if (isMerchant) {
      return (user as Merchant).businessName.charAt(0).toUpperCase()
    } else {
      return (user as Customer).name.charAt(0).toUpperCase()
    }
  }

  const getUserDisplayName = () => {
    if (isMerchant) {
      return (user as Merchant).businessName
    } else {
      return (user as Customer).name
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg",
                  isMerchant 
                    ? "bg-gradient-to-br from-pepper-500 to-pepper-600"
                    : "bg-gradient-to-br from-blue-500 to-purple-600"
                )}>
                  {getUserAvatar()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Edit {isMerchant ? 'Merchant' : 'Customer'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {getUserDisplayName()}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Stats Section - Different for merchants vs customers */}
            {!isMerchant && (
              <div className="mb-6 grid grid-cols-3 gap-3">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <Package className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-gray-900">
                    {(user as Customer).totalParcels}
                  </div>
                  <div className="text-xs text-gray-500">Total Parcels</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-gray-900">
                    {(user as Customer).completedParcels}
                  </div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <DollarSign className="h-4 w-4 text-purple-600 mx-auto mb-1" />
                  <div className="text-lg font-bold text-gray-900">
                    {formatCurrency((user as Customer).totalSpent)}
                  </div>
                  <div className="text-xs text-gray-500">Total Spent</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isMerchant ? (
                /* Merchant Form */
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name
                    </label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={merchantForm.businessName}
                        onChange={(e) => setMerchantForm({ ...merchantForm, businessName: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        value={merchantForm.email}
                        onChange={(e) => setMerchantForm({ ...merchantForm, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={merchantForm.phone}
                      onChange={(e) => setMerchantForm({ ...merchantForm, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Type
                    </label>
                    <input
                      type="text"
                      value={merchantForm.businessType}
                      onChange={(e) => setMerchantForm({ ...merchantForm, businessType: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                      placeholder="e.g., E-commerce, Retail"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <select
                      value={merchantForm.role}
                      onChange={(e) => setMerchantForm({ ...merchantForm, role: e.target.value as any })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                    >
                      <option value="merchant">Merchant</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={merchantForm.isActive}
                      onChange={(e) => setMerchantForm({ ...merchantForm, isActive: e.target.checked })}
                      className="h-5 w-5 text-pepper-600 rounded"
                      id="isActive"
                    />
                    <label htmlFor="isActive" className="font-medium text-gray-900">
                      Account is active
                    </label>
                  </div>

                  {/* Merchant Metadata */}
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Member since</span>
                      <span className="font-medium">
                        {new Date((user as Merchant).createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {(user as Merchant).lastLogin && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Last login</span>
                        <span className="font-medium">
                          {new Date((user as Merchant).lastLogin!).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Customer Form */
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Customer Name
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={customerForm.name}
                        onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        value={customerForm.email}
                        onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={customerForm.phone}
                      onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={customerForm.status}
                      onChange={(e) => setCustomerForm({ ...customerForm, status: e.target.value as any })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="new">New</option>
                    </select>
                  </div>

                  {/* Customer Metadata */}
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Customer since</span>
                      <span className="font-medium">
                        {new Date((user as Customer).joinedDate).toLocaleDateString()}
                      </span>
                    </div>
                    {(user as Customer).lastPickup && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Last pickup</span>
                        <span className="font-medium">
                          {new Date((user as Customer).lastPickup!).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Success rate</span>
                      <span className="font-medium">
                        {(user as Customer).totalParcels > 0
                          ? Math.round(((user as Customer).completedParcels / (user as Customer).totalParcels) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-pepper-500 text-white rounded-lg hover:bg-pepper-600 transition font-medium flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}