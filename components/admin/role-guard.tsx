'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ShieldAlert } from 'lucide-react'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: string[]
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const router = useRouter()
  const [hasAccess, setHasAccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // In a real app, you would:
        // 1. Get user from localStorage/context
        // 2. Verify token with backend
        // 3. Check if user role is in allowedRoles
        
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        const token = localStorage.getItem('token')
        
        if (!token || !user.role) {
          router.push('/login')
          return
        }

        // Mock role check - replace with actual logic
        // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ THIS SHOULD BE ADMIN, BUT WE ARE USING MERCHANT FOR DEV AND DEBUG PURPOSE
        const userRole = 'merchant' // Get from user object
        const hasRole = allowedRoles.includes(userRole)
        
        if (!hasRole) {
          router.push('/dashboard')
          return
        }

        setHasAccess(true)
      } catch (error) {
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAccess()
  }, [router, allowedRoles])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pepper-500"></div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShieldAlert className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}



