// components/notifications/notification-bell.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, Check, Trash2, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications } from './notification-provider'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'parcel': return '📦'
      case 'payment': return '💰'
      case 'system': return '⚙️'
      case 'security': return '🔒'
      case 'maintenance': return '🛠️'
      default: return '🔔'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'parcel': return 'bg-blue-100 text-blue-800'
      case 'payment': return 'bg-green-100 text-green-800'
      case 'system': return 'bg-yellow-100 text-yellow-800'
      case 'security': return 'bg-red-100 text-red-800'
      case 'maintenance': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-pepper-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Notifications</h3>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-pepper-600 hover:text-pepper-700 font-medium"
                    >
                      Mark all as read
                    </button>
                  )}
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <Settings className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {unreadCount > 0 
                  ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                  : 'All caught up!'
                }
              </p>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h4 className="font-medium text-gray-900 mb-1">No notifications</h4>
                  <p className="text-gray-600 text-sm">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 hover:bg-gray-50 transition-colors",
                        !notification.read && "bg-pepper-50/50"
                      )}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={cn(
                          "h-10 w-10 rounded-lg flex items-center justify-center text-lg",
                          getTypeColor(notification.type)
                        )}>
                          {getTypeIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900 text-sm">
                                {notification.title}
                              </h4>
                              <p className="text-gray-600 text-sm mt-1">
                                {notification.message}
                              </p>
                            </div>
                            <button
                              onClick={() => removeNotification(notification.id)}
                              className="p-1 hover:bg-gray-200 rounded ml-2"
                              title="Remove"
                            >
                              <Trash2 className="h-3 w-3 text-gray-400" />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                            </span>
                            <div className="flex items-center space-x-2">
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-xs text-pepper-600 hover:text-pepper-700 font-medium"
                                >
                                  Mark read
                                </button>
                              )}
                              {notification.action && (
                                <button
                                  onClick={notification.action.onClick}
                                  className="text-xs font-medium text-pepper-600 hover:text-pepper-700"
                                >
                                  {notification.action.label}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <a
                  href="/dashboard/notifications"
                  className="text-sm font-medium text-pepper-600 hover:text-pepper-700"
                >
                  View all notifications
                </a>
                {notifications.length > 0 && (
                  <button
                    onClick={() => {
                      // Clear all notifications
                      if (confirm('Clear all notifications?')) {
                        // This would be implemented in the provider
                      }
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}