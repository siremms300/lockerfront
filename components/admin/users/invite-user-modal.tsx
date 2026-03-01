// components/admin/users/invite-user-modal.tsx
'use client'

import { useState } from 'react'
import { X, Mail, Send, Loader2, AlertCircle, Store, User as UserIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { adminAPI } from '@/lib/api'
import { cn } from '@/lib/utils'

interface InviteUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function InviteUserModal({ isOpen, onClose, onSuccess }: InviteUserModalProps) {
  const [loading, setLoading] = useState(false)
  const [userType, setUserType] = useState<'merchant' | 'customer'>('merchant')
  const [formData, setFormData] = useState({
    email: '',
    businessName: '',
    name: '',
    phone: '',
    role: 'merchant' as 'merchant' | 'admin' | 'super_admin',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address'
    }
    
    if (userType === 'merchant') {
      if (!formData.businessName) {
        newErrors.businessName = 'Business name is required'
      }
      if (!formData.phone) {
        newErrors.phone = 'Phone number is required'
      }
    } else {
      if (!formData.name) {
        newErrors.name = 'Customer name is required'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    try {
      if (userType === 'merchant') {
        await adminAPI.inviteMerchant({
          email: formData.email,
          businessName: formData.businessName,
          phone: formData.phone,
          role: formData.role,
        })
        toast.success(`Merchant invitation sent to ${formData.email}`)
      } else {
        // For customers, you might want to create them directly
        await adminAPI.createCustomer({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        })
        toast.success(`Customer ${formData.name} created successfully`)
      }
      
      onSuccess()
      onClose()
      resetForm()
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to ${userType === 'merchant' ? 'invite' : 'create'} user`)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      businessName: '',
      name: '',
      phone: '',
      role: 'merchant',
    })
    setErrors({})
    setUserType('merchant')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

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
            onClick={handleClose}
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
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {userType === 'merchant' ? 'Invite Merchant' : 'Add Customer'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {userType === 'merchant' 
                    ? 'Send an invitation to join as a merchant'
                    : 'Add a new customer to the system'}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* User Type Toggle */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserType('merchant')}
                  className={cn(
                    "flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition",
                    userType === 'merchant'
                      ? "border-pepper-500 bg-pepper-50 text-pepper-700"
                      : "border-gray-300 hover:border-gray-400"
                  )}
                >
                  <Store className="h-5 w-5" />
                  <span className="font-medium">Merchant</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('customer')}
                  className={cn(
                    "flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition",
                    userType === 'customer'
                      ? "border-pepper-500 bg-pepper-50 text-pepper-700"
                      : "border-gray-300 hover:border-gray-400"
                  )}
                >
                  <UserIcon className="h-5 w-5" />
                  <span className="font-medium">Customer</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email - Common for both */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value })
                      if (errors.email) setErrors({ ...errors, email: '' })
                    }}
                    className={cn(
                      "w-full pl-10 pr-4 py-3 rounded-lg border",
                      "focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
                      errors.email ? "border-red-500" : "border-gray-300"
                    )}
                    placeholder="john@example.com"
                    disabled={loading}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Merchant-specific fields */}
              {userType === 'merchant' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name *
                    </label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={formData.businessName}
                        onChange={(e) => {
                          setFormData({ ...formData, businessName: e.target.value })
                          if (errors.businessName) setErrors({ ...errors, businessName: '' })
                        }}
                        className={cn(
                          "w-full pl-10 pr-4 py-3 rounded-lg border",
                          "focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
                          errors.businessName ? "border-red-500" : "border-gray-300"
                        )}
                        placeholder="TechGadgets NG"
                        disabled={loading}
                      />
                    </div>
                    {errors.businessName && (
                      <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                      disabled={loading}
                    >
                      <option value="merchant">Merchant</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                </>
              )}

              {/* Customer-specific fields */}
              {userType === 'customer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name *
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value })
                        if (errors.name) setErrors({ ...errors, name: '' })
                      }}
                      className={cn(
                        "w-full pl-10 pr-4 py-3 rounded-lg border",
                        "focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
                        errors.name ? "border-red-500" : "border-gray-300"
                      )}
                      placeholder="John Doe"
                      disabled={loading}
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>
              )}

              {/* Phone - Common for both */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number {userType === 'merchant' && '*'}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value })
                    if (errors.phone) setErrors({ ...errors, phone: '' })
                  }}
                  className={cn(
                    "w-full px-4 py-3 rounded-lg border",
                    "focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
                    errors.phone ? "border-red-500" : "border-gray-300"
                  )}
                  placeholder="+234 800 000 0000"
                  disabled={loading}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">
                      {userType === 'merchant' ? 'What happens next?' : 'Customer Creation'}
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      {userType === 'merchant' 
                        ? 'An invitation email will be sent. They\'ll need to set up their account and password.'
                        : 'The customer will be created and available for parcel assignments.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
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
                      <span>{userType === 'merchant' ? 'Sending...' : 'Creating...'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>{userType === 'merchant' ? 'Send Invite' : 'Create Customer'}</span>
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