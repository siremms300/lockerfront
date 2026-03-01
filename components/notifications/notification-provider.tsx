// components/notifications/notification-provider.tsx
'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { toast, Toaster } from 'react-hot-toast'
import { useSocket } from '@/lib/socket'
import { cn } from '@/lib/utils'

export type NotificationType = 'parcel' | 'system' | 'payment' | 'security' | 'maintenance'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: Date
  read: boolean
  action?: {
    label: string
    onClick: () => void
  }
  metadata?: {
    parcelId?: string
    locationId?: string
    amount?: number
    trackingNumber?: string
  }
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const socket = useSocket()
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'parcel',
      title: 'Parcel Picked Up',
      message: 'Parcel #LKR-4892 has been picked up by customer',
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      read: false,
      metadata: { parcelId: '1', trackingNumber: 'LKR-4892' }
    },
    {
      id: '2',
      type: 'payment',
      title: 'COD Collected',
      message: '₦25,000 collected for parcel #LKR-4891',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      read: false,
      metadata: { amount: 25000, trackingNumber: 'LKR-4891' }
    },
    {
      id: '3',
      type: 'system',
      title: 'System Update',
      message: 'Scheduled maintenance tonight from 2-4 AM',
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      read: true,
      action: {
        label: 'View Details',
        onClick: () => console.log('View maintenance details')
      }
    },
    {
      id: '4',
      type: 'security',
      title: 'Security Alert',
      message: 'Multiple failed login attempts detected',
      timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
      read: true
    }
  ])

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    // Handle parcel updates
    socket.on('parcel-updated', (data: any) => {
      const statusMessages: Record<string, string> = {
        'picked_up': 'has been picked up by customer',
        'at_location': 'has arrived at pickup location',
        'ready_for_pickup': 'is ready for pickup',
        'delivery_failed': 'delivery failed - requires attention',
        'return_requested': 'return has been requested'
      }

      const message = statusMessages[data.status]
      if (message) {
        addNotification({
          type: 'parcel',
          title: `Parcel ${data.status.replace('_', ' ').toUpperCase()}`,
          message: `Parcel #${data.trackingNumber} ${message}`,
          metadata: {
            parcelId: data.parcelId,
            trackingNumber: data.trackingNumber
          },
          action: {
            label: 'View Parcel',
            onClick: () => window.open(`/dashboard/parcels/${data.parcelId}`, '_blank')
          }
        })
      }
    })

    // Handle locker status updates
    socket.on('locker-status-update', (data: any) => {
      const statusMessages: Record<string, string> = {
        'online': 'is now back online',
        'offline': 'has gone offline',
        'maintenance': 'is under maintenance',
        'full': 'is at full capacity'
      }

      const message = statusMessages[data.status]
      if (message) {
        addNotification({
          type: 'system',
          title: `Locker ${data.status.toUpperCase()}`,
          message: `Locker "${data.locationName}" ${message}`,
          metadata: { locationId: data.locationId }
        })
      }
    })

    // Handle payment updates
    socket.on('payment-updated', (data: any) => {
      addNotification({
        type: 'payment',
        title: data.success ? 'Payment Successful' : 'Payment Failed',
        message: data.success 
          ? `₦${data.amount.toLocaleString()} collected for parcel #${data.trackingNumber}`
          : `Failed to collect ₦${data.amount.toLocaleString()} for parcel #${data.trackingNumber}`,
        metadata: {
          amount: data.amount,
          trackingNumber: data.trackingNumber
        }
      })
    })

    return () => {
      socket.off('parcel-updated')
      socket.off('locker-status-update')
      socket.off('payment-updated')
    }
  }, [socket])

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    }

    setNotifications(prev => [newNotification, ...prev])

    // Show toast notification
    showToastNotification(newNotification)
  }, [])

  const showToastNotification = (notification: Notification) => {
    const typeConfig = {
      parcel: { icon: '📦', color: 'bg-blue-500' },
      payment: { icon: '💰', color: 'bg-green-500' },
      system: { icon: '⚙️', color: 'bg-yellow-500' },
      security: { icon: '🔒', color: 'bg-red-500' },
      maintenance: { icon: '🛠️', color: 'bg-purple-500' }
    }

    const config = typeConfig[notification.type]

    toast.custom((t) => (
      <div
        className={cn(
          "max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5",
          t.visible ? 'animate-enter' : 'animate-leave'
        )}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center text-white", config.color)}>
                {config.icon}
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">
                {notification.title}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {notification.message}
              </p>
              <div className="mt-3 flex space-x-3">
                {notification.action && (
                  <button
                    onClick={() => {
                      notification.action?.onClick()
                      toast.dismiss(t.id)
                    }}
                    className="text-sm font-medium text-pepper-600 hover:text-pepper-500"
                  >
                    {notification.action.label}
                  </button>
                )}
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none"
          >
            ✕
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      position: 'top-right',
    })
  }

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    )
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearAll
    }}>
      {children}
      <Toaster />
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}