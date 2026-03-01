'use client'

import { Bell, Search, Menu } from 'lucide-react'
import { useState } from 'react'

export function AdminHeader() {
  const [notifications, setNotifications] = useState(3)

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search admin panel..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <Bell className="h-5 w-5 text-gray-600" />
              {notifications > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
              )}
            </button>
          </div>

          {/* System Status */}
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">System: Normal</span>
          </div>

          {/* Quick Stats */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">243 Users</div>
              <div className="text-xs text-gray-500">48 Locations</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}



