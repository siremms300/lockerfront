// hooks/useAuth.ts
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { merchantAPI } from '@/lib/api'

interface User {
  _id: string
  businessName: string
  email: string
  phone: string
  role: 'admin' | 'merchant' | 'super_admin'
  permissions?: string[]
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await merchantAPI.getProfile()
      setUser(response.data)
    } catch (error) {
      console.error('Failed to fetch user:', error)
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }

  const hasRole = (roles: string | string[]) => {
    if (!user) return false
    const roleList = Array.isArray(roles) ? roles : [roles]
    return roleList.includes(user.role)
  }

  const hasPermission = (permission: string) => {
    if (!user) return false
    
    // Admins have all permissions
    if (user.role === 'admin' || user.role === 'super_admin') return true
    
    // Check granular permissions
    return user.permissions?.includes(permission) || false
  }

  const can = {
    viewLocations: () => hasPermission('locations:view'),
    createLocation: () => hasPermission('locations:create'),
    editLocation: () => hasPermission('locations:edit'),
    deleteLocation: () => hasPermission('locations:delete'),
    
    viewParcels: () => hasPermission('parcels:view'),
    createParcel: () => hasPermission('parcels:create'),
    editParcel: () => hasPermission('parcels:edit'),
    deleteParcel: () => hasPermission('parcels:delete'),
    
    viewDrivers: () => hasPermission('drivers:view'),
    createDriver: () => hasPermission('drivers:create'),
    editDriver: () => hasPermission('drivers:edit'),
    deleteDriver: () => hasPermission('drivers:delete'),
    
    viewCustomers: () => hasPermission('customers:view'),
    createCustomer: () => hasPermission('customers:create'),
    editCustomer: () => hasPermission('customers:edit'),
    deleteCustomer: () => hasPermission('customers:delete'),
    
    viewBilling: () => hasPermission('billing:view'),
    manageBilling: () => hasPermission('billing:manage'),
    
    viewAnalytics: () => hasPermission('analytics:view'),
    
    viewSettings: () => hasPermission('settings:view'),
    editSettings: () => hasPermission('settings:edit'),
    
    manageUsers: () => hasPermission('users:manage'),
    manageRoles: () => hasPermission('roles:manage'),
    
    isAdmin: () => user?.role === 'admin' || user?.role === 'super_admin',
    isMerchant: () => user?.role === 'merchant',
  }

  return { user, loading, can, hasRole, hasPermission }
}