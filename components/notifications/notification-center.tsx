// components/notifications/notification-center.tsx
'use client'

import { useState } from 'react'
import { 
  Bell, 
  Check, 
  Trash2, 
  Filter, 
  Search,
  Package,
  DollarSign,
  Shield,
  Settings,
  AlertCircle,
  Clock
} from 'lucide-react'
import { useNotifications } from './notification-provider'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export function NotificationCenter() {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAll 
  } = useNotifications()
  
  const [filter, setFilter] = useState<'all' | 'unread' | 'parcel' | 'payment' | 'system'>('all')
  const [search, setSearch] = useState('')

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && !notification.read) ||
      (filter === notification.type)
    
    const matchesSearch = search === '' ||
      notification.title.toLowerCase().includes(search.toLowerCase()) ||
      notification.message.toLowerCase().includes(search.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'parcel': return <Package className="h-5 w-5" />
      case 'payment': return <DollarSign className="h-5 w-5" />
      case 'security': return <Shield className="h-5 w-5" />
      case 'maintenance': return <Settings className="h-5 w-5" />
      case 'system': return <AlertCircle className="h-5 w-5" />
      default: return <Bell className="h-5 w-5" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'parcel': return 'Parcel Updates'
      case 'payment': return 'Payment Notifications'
      case 'security': return 'Security Alerts'
      case 'maintenance': return 'Maintenance'
      case 'system': return 'System Updates'
      default: return 'General'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Notification Center</h1>
          <p className="text-gray-600">Manage all your alerts and updates in one place</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-pepper-50 rounded-lg">
                    <Bell className="h-6 w-6 text-pepper-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Notifications</h3>
                    <p className="text-sm text-gray-600">{unreadCount} unread</p>
                  </div>
                </div>

                <button
                  onClick={markAllAsRead}
                  className="w-full px-4 py-2 bg-pepper-500 text-white rounded-lg hover:bg-pepper-600 transition font-medium mb-4"
                  disabled={unreadCount === 0}
                >
                  Mark all as read
                </button>

                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all notifications?')) {
                      clearAll()
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                  disabled={notifications.length === 0}
                >
                  Clear all
                </button>
              </div>

              {/* Filters */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Filters</h4>
                <div className="space-y-2">
                  {['all', 'unread', 'parcel', 'payment', 'system'].map((filterType) => (
                    <button
                      key={filterType}
                      onClick={() => setFilter(filterType as any)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg transition",
                        filter === filterType
                          ? "bg-pepper-50 text-pepper-700 font-medium"
                          : "text-gray-600 hover:bg-gray-100"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="capitalize">{filterType}</span>
                        {filterType !== 'all' && filterType !== 'unread' && (
                          <span className="text-xs text-gray-500">
                            {notifications.filter(n => n.type === filterType).length}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notification Types */}
              <div className="mt-8">
                <h4 className="font-medium text-gray-900 mb-3">Notification Types</h4>
                <div className="space-y-3">
                  {['parcel', 'payment', 'system', 'security', 'maintenance'].map((type) => {
                    const count = notifications.filter(n => n.type === type).length
                    const unread = notifications.filter(n => n.type === type && !n.read).length
                    
                    return (
                      <div key={type} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <div className={cn(
                            "p-2 rounded-lg",
                            type === 'parcel' ? "bg-blue-100 text-blue-600" :
                            type === 'payment' ? "bg-green-100 text-green-600" :
                            type === 'system' ? "bg-yellow-100 text-yellow-600" :
                            type === 'security' ? "bg-red-100 text-red-600" : "bg-purple-100 text-purple-600"
                          )}>
                            {getTypeIcon(type)}
                          </div>
                          <span className="text-sm text-gray-700">{getTypeLabel(type)}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{count}</div>
                          {unread > 0 && (
                            <div className="text-xs text-pepper-600">{unread} unread</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-soft overflow-hidden border border-gray-200">
              {/* Toolbar */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search notifications..."
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20 focus:outline-none transition"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Filter className="h-5 w-5 text-gray-500" />
                    <span className="text-sm text-gray-700">Sorted by: Newest</span>
                  </div>
                </div>
              </div>

              {/* Notifications List */}
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {filteredNotifications.length === 0 ? (
                  <div className="p-12 text-center">
                    <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No notifications found</h3>
                    <p className="text-gray-600">
                      {search ? 'Try a different search term' : 'You have no notifications'}
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-6 hover:bg-gray-50 transition-colors",
                        !notification.read && "bg-pepper-50/30"
                      )}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={cn(
                          "p-3 rounded-lg",
                          notification.type === 'parcel' ? "bg-blue-100" :
                          notification.type === 'payment' ? "bg-green-100" :
                          notification.type === 'system' ? "bg-yellow-100" :
                          notification.type === 'security' ? "bg-red-100" : "bg-purple-100"
                        )}>
                          {getTypeIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center space-x-3">
                                <h4 className="font-bold text-gray-900">{notification.title}</h4>
                                {!notification.read && (
                                  <span className="px-2 py-0.5 bg-pepper-500 text-white text-xs rounded-full">
                                    New
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-600 mt-2">{notification.message}</p>
                              
                              {notification.metadata && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {notification.metadata.trackingNumber && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                      #{notification.metadata.trackingNumber}
                                    </span>
                                  )}
                                  {notification.metadata.amount && (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                      ₦{notification.metadata.amount.toLocaleString()}
                                    </span>
                                  )}
                                  {notification.metadata.parcelId && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                      Parcel ID: {notification.metadata.parcelId.slice(-6)}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-2 hover:bg-gray-200 rounded"
                                title="Mark as read"
                              >
                                <Check className="h-4 w-4 text-gray-500" />
                              </button>
                              <button
                                onClick={() => removeNotification(notification.id)}
                                className="p-2 hover:bg-gray-200 rounded"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4 text-gray-500" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center space-x-4">
                              <span className="text-sm text-gray-500">
                                {format(notification.timestamp, 'MMM d, yyyy • h:mm a')}
                              </span>
                              <span className={cn(
                                "px-2 py-0.5 rounded text-xs font-medium",
                                notification.type === 'parcel' ? "bg-blue-100 text-blue-800" :
                                notification.type === 'payment' ? "bg-green-100 text-green-800" :
                                notification.type === 'system' ? "bg-yellow-100 text-yellow-800" :
                                notification.type === 'security' ? "bg-red-100 text-red-800" : "bg-purple-100 text-purple-800"
                              )}>
                                {getTypeLabel(notification.type)}
                              </span>
                            </div>
                            
                            {notification.action && (
                              <button
                                onClick={notification.action.onClick}
                                className="px-4 py-2 bg-pepper-500 text-white rounded-lg hover:bg-pepper-600 transition text-sm font-medium"
                              >
                                {notification.action.label}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {filteredNotifications.length} of {notifications.length} notifications
                  </div>
                  <div className="flex items-center space-x-4">
                    <button className="text-sm text-gray-600 hover:text-gray-900">
                      Notification Settings
                    </button>
                    <button className="text-sm text-gray-600 hover:text-gray-900">
                      Export Logs
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}