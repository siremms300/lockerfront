// components/auth/permission-guard.tsx
'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'

interface PermissionGuardProps {
  children: ReactNode
  permission?: string
  role?: string | string[]
  fallback?: ReactNode
}

export function PermissionGuard({ 
  children, 
  permission, 
  role, 
  fallback = null 
}: PermissionGuardProps) {
  const { user, loading, can, hasRole } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-pepper-500" />
      </div>
    )
  }

  if (!user) return null

  // Check role if specified
  if (role && !hasRole(role)) {
    return fallback
  }

  // Check permission if specified
  if (permission && !can[permission as keyof typeof can]?.()) {
    return fallback
  }

  return <>{children}</>
}