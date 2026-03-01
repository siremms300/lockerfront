// components/auth/with-permission.tsx
'use client'

import { ComponentType } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function withPermission<P extends object>(
  WrappedComponent: ComponentType<P>,
  requiredPermission?: string,
  requiredRole?: string | string[],
  redirectTo = '/dashboard'
) {
  return function WithPermissionComponent(props: P) {
    const { user, loading, can, hasRole } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!loading && !user) {
        router.push('/login')
        return
      }

      if (!loading && user) {
        // Check role
        if (requiredRole && !hasRole(requiredRole)) {
          router.push(redirectTo)
          return
        }

        // Check permission
        if (requiredPermission && !can[requiredPermission as keyof typeof can]?.()) {
          router.push(redirectTo)
          return
        }
      }
    }, [loading, user, router])

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pepper-500" />
        </div>
      )
    }

    if (!user) return null

    // Check role
    if (requiredRole && !hasRole(requiredRole)) {
      return null
    }

    // Check permission
    if (requiredPermission && !can[requiredPermission as keyof typeof can]?.()) {
      return null
    }

    return <WrappedComponent {...props} />
  }
}