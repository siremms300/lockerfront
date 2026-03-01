// components/notifications/floating-notifications.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications } from './notification-provider'
import { cn } from '@/lib/utils'

export function FloatingNotifications() {
  const { notifications } = useNotifications()
  const [visibleNotification, setVisibleNotification] = useState<string | null>(null)

  useEffect(() => {
    // Show newest unread notification as floating
    const newestUnread = notifications.find(n => !n.read)
    if (newestUnread && newestUnread.id !== visibleNotification) {
      setVisibleNotification(newestUnread.id)
      
      // Auto-hide after 8 seconds
      const timer = setTimeout(() => {
        setVisibleNotification(null)
      }, 8000)

      return () => clearTimeout(timer)
    }
  }, [notifications, visibleNotification])

  const notification = notifications.find(n => n.id === visibleNotification)
  if (!notification) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, x: 20 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={{ opacity: 0, y: 20, x: 20 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <div className="bg-white rounded-xl shadow-hard p-4 border-l-4 border-pepper-500 max-w-sm">
          <div className="flex items-start space-x-3">
            <div className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center text-white",
              notification.type === 'parcel' ? 'bg-blue-500' :
              notification.type === 'payment' ? 'bg-green-500' :
              notification.type === 'security' ? 'bg-red-500' :
              notification.type === 'maintenance' ? 'bg-purple-500' : 'bg-yellow-500'
            )}>
              {notification.type === 'parcel' ? '📦' :
               notification.type === 'payment' ? '💰' :
               notification.type === 'security' ? '🔒' :
               notification.type === 'maintenance' ? '🛠️' : '⚙️'}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{notification.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
              {notification.action && (
                <button
                  onClick={notification.action.onClick}
                  className="text-sm text-pepper-600 font-medium mt-2 hover:text-pepper-700"
                >
                  {notification.action.label} →
                </button>
              )}
            </div>
            <button
              onClick={() => setVisibleNotification(null)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              ✕
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}