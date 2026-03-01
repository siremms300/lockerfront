// components/layout/dashboard-header.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Bell, 
  Search, 
  ChevronDown,
  Zap,
  Wifi,
  Battery,
  User,
  LogOut,
  Settings,
  CreditCard,
  Package,
  HelpCircle
} from 'lucide-react'
import { useRealTime } from '@/components/providers/realtime-provider' 
import { NotificationBell } from '@/components/notifications/notification-bell'
import { merchantAPI, authAPI } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Merchant {
  businessName: string
  email: string
  phone: string
  businessType: string
  avatar?: string
  billing?: {
    walletBalance: number
  }
}

export function DashboardHeader() {
  const router = useRouter()
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const { isConnected } = useRealTime()

  // Fetch merchant data on mount
  useEffect(() => {
    fetchMerchantData()
  }, [])

  const fetchMerchantData = async () => {
    try {
      const response = await merchantAPI.getProfile()
      setMerchant(response.data)
    } catch (error) {
      console.error('Failed to fetch merchant data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await authAPI.logout()
      localStorage.removeItem('token')
      localStorage.removeItem('merchant')
      toast.success('Logged out successfully')
      router.push('/login')
    } catch (error) {
      toast.error('Failed to logout')
    }
  }





// components/layout/dashboard-header.tsx - Update logout function @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@2
// const handleLogout = async () => {
//   try {
//     console.log('Logging out...')
    
//     // Call logout endpoint
//     await authAPI.logout()
    
//     // Clear local storage
//     localStorage.removeItem('token')
//     localStorage.removeItem('merchant')
    
//     // Clear any other stored data
//     localStorage.removeItem('user')
//     localStorage.removeItem('permissions')
    
//     // Disconnect socket if you have one
//     if (socketService) {
//       socketService.disconnect()
//     }
    
//     // Clear axios default headers
//     delete api.defaults.headers.common['Authorization']
    
//     toast.success('Logged out successfully')
    
//     // Redirect to login
//     router.push('/login')
    
//   } catch (error: any) {
//     console.error('Logout error:', error)
    
//     // Even if API fails, still clear local storage and redirect
//     localStorage.removeItem('token')
//     localStorage.removeItem('merchant')
//     localStorage.removeItem('user')
//     localStorage.removeItem('permissions')
    
//     delete api.defaults.headers.common['Authorization']
    
//     toast.error('Logged out locally')
//     router.push('/login')
//   }
// }








  // components/layout/dashboard-header.tsx - Update logout function







  

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    
    if (query.length < 2) {
      setShowSearchResults(false)
      return
    }

    try {
      // Search parcels
      const parcelsRes = await fetch(`/api/parcels?search=${query}&limit=5`)
      const parcels = await parcelsRes.json()
      
      // Search customers
      const customersRes = await fetch(`/api/customers?search=${query}&limit=5`)
      const customers = await customersRes.json()
      
      setSearchResults([
        ...(parcels.parcels || []).map((p: any) => ({ ...p, type: 'parcel' })),
        ...(customers.customers || []).map((c: any) => ({ ...c, type: 'customer' }))
      ])
      setShowSearchResults(true)
    } catch (error) {
      console.error('Search failed:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-200 lg:border-none">
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Mobile: Page title */}
          <div className="lg:hidden">
            <h1 className="text-lg font-semibold text-gray-900">
              {merchant?.businessName || 'Dashboard'}
            </h1>
          </div>

          {/* Desktop: Search with results */}
          <div className="hidden lg:flex flex-1 max-w-xl relative">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="search"
                placeholder="Search parcels, customers, or locations..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20 focus:outline-none transition"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
              />
            </div>

            {/* Search Results Dropdown */}
            <AnimatePresence>
              {showSearchResults && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
                >
                  <div className="p-2 max-h-96 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <Link
                        key={index}
                        href={result.type === 'parcel' 
                          ? `/dashboard/parcels/${result._id}`
                          : `/dashboard/customers/${result._id}`
                        }
                        className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition"
                      >
                        <div className={cn(
                          "p-2 rounded-lg",
                          result.type === 'parcel' ? "bg-blue-100" : "bg-green-100"
                        )}>
                          {result.type === 'parcel' ? (
                            <Package className="h-4 w-4 text-blue-600" />
                          ) : (
                            <User className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {result.type === 'parcel' ? result.trackingNumber : result.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {result.type === 'parcel' 
                              ? result.customer?.name 
                              : `${result.totalParcels} parcels • ${result.phone}`
                            }
                          </div>
                        </div>
                        {result.type === 'parcel' && result.delivery?.status && (
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            result.delivery.status === 'picked_up' ? "bg-green-100 text-green-800" :
                            result.delivery.status === 'in_transit' ? "bg-yellow-100 text-yellow-800" :
                            result.delivery.status === 'ready_for_pickup' ? "bg-blue-100 text-blue-800" :
                            "bg-gray-100 text-gray-800"
                          )}>
                            {result.delivery.status.replace('_', ' ')}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-4">
            {/* Mobile: Search button */}
            <button className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
              <Search className="h-5 w-5 text-gray-600" />
            </button>

            {/* Connection Status */}
            <div className="hidden md:flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              <span className="text-sm font-medium text-gray-700">
                {isConnected ? 'Live' : 'Offline'}
              </span>
              <Wifi className="h-4 w-4 text-gray-500" />
            </div>

            {/* Notifications */}
            <NotificationBell />

            {/* Quick Actions */}
            <div className="hidden md:flex items-center space-x-2">
              <Link href="/dashboard/parcels/create">
                <button className="px-4 py-2 bg-pepper-500 text-white rounded-lg hover:bg-pepper-600 transition flex items-center space-x-2">
                  <Zap className="h-4 w-4" />
                  <span>New Parcel</span>
                </button>
              </Link>
            </div>

            {/* User Profile with Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <div className="h-8 w-8 bg-gradient-to-br from-pepper-500 to-pepper-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {merchant ? getInitials(merchant.businessName) : <User className="h-4 w-4" />}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {merchant?.businessName || 'Loading...'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {merchant?.businessType || 'Merchant'}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>

              {/* User Dropdown Menu */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
                  >
                    {/* User Info */}
                    <div className="p-4 bg-gradient-to-r from-pepper-50 to-transparent border-b border-gray-200">
                      <p className="font-medium text-gray-900">{merchant?.businessName}</p>
                      <p className="text-sm text-gray-600">{merchant?.email}</p>
                      <p className="text-xs text-gray-500 mt-1">{merchant?.phone}</p>
                    </div>

                    {/* Balance Info */}
                    {merchant?.billing && (
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Wallet Balance</span>
                          <span className="font-bold text-pepper-600">
                            {formatCurrency(merchant.billing.walletBalance || 0)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Menu Items */}
                    <div className="p-2">
                      <Link href="/dashboard/settings?tab=profile">
                        <button className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition text-left">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700">Profile Settings</span>
                        </button>
                      </Link>
                      <Link href="/dashboard/settings?tab=billing">
                        <button className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition text-left">
                          <CreditCard className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700">Billing</span>
                        </button>
                      </Link>
                      <Link href="/dashboard/settings?tab=api">
                        <button className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition text-left">
                          <Settings className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700">API Keys</span>
                        </button>
                      </Link>
                      <Link href="/support">
                        <button className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition text-left">
                          <HelpCircle className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-700">Help & Support</span>
                        </button>
                      </Link>
                      <div className="border-t border-gray-200 my-2"></div>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-50 rounded-lg transition text-left text-red-600"
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="text-sm">Logout</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Mobile: Real-time Status Bar */}
        <div className="lg:hidden mt-2 flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              <span className="text-gray-600">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
            {merchant?.billing && (
              <div className="text-gray-600">
                Balance: {formatCurrency(merchant.billing.walletBalance || 0)}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}










































// // components/layout/dashboard-header.tsx - UPDATED
// 'use client'

// import { useState } from 'react'
// import { 
//   Bell, 
//   Search, 
//   ChevronDown,
//   Zap,
//   Wifi,
//   Battery,
//   User
// } from 'lucide-react'
// import { useRealTime } from '@/components/providers/realtime-provider' 
// import { NotificationBell } from '@/components/notifications/notification-bell'




// export function DashboardHeader() {
//   const [notifications, setNotifications] = useState(3)
//   const { isConnected, connectionStatus } = useRealTime()

//   return (
//     <header className="sticky top-0 z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-200 lg:border-none">
//       <div className="px-4 sm:px-6 lg:px-8 py-4">
//         <div className="flex items-center justify-between">
//           {/* Mobile: Page title */}
//           <div className="lg:hidden">
//             <h1 className="text-lg font-semibold text-gray-900"></h1>
//           </div>

//           {/* Desktop: Search */}
//           <div className="hidden lg:flex flex-1 max-w-xl">
//             <div className="relative w-full">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//               <input
//                 type="search"
//                 placeholder="Search parcels, customers, or locations..."
//                 className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20 focus:outline-none transition"
//               />
//             </div>
//           </div>

//           {/* Right side - Actions */}
//           <div className="flex items-center space-x-4">
//             {/* Mobile: Search button */}
//             <button className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
//               <Search className="h-5 w-5 text-gray-600" />
//             </button>

//             {/* Connection Status */}
//             <div className="hidden md:flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100">
//               <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
//               <span className="text-sm font-medium text-gray-700">
//                 {isConnected ? 'Live' : 'Offline'}
//               </span>
//               <Wifi className="h-4 w-4 text-gray-500" />
//             </div>

//             {/* Notifications */}
//             {/* <button className="relative p-2 hover:bg-gray-100 rounded-lg transition">
//               <Bell className="h-6 w-6 text-gray-600" />
//               {notifications > 0 && (
//                 <span className="absolute -top-1 -right-1 h-5 w-5 bg-pepper-500 text-white text-xs rounded-full flex items-center justify-center">
//                   {notifications}
//                 </span>
//               )}
//             </button> */}
//             <NotificationBell />

//             {/* Quick Actions */}
//             <div className="hidden md:flex items-center space-x-2">
//               <button className="px-4 py-2 bg-pepper-500 text-white rounded-lg hover:bg-pepper-600 transition flex items-center space-x-2">
//                 <Zap className="h-4 w-4" />
//                 <span>New Parcel</span>
//               </button>
//             </div>

//             {/* User Profile */}
//             <div className="flex items-center space-x-3">
//               <div className="hidden md:block text-right">
//                 <p className="text-sm font-medium text-gray-900">TechGadgets NG</p>
//                 <p className="text-xs text-gray-500">Merchant Account</p>
//               </div>
//               <div className="relative">
//                 <button className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition">
//                   <div className="h-8 w-8 bg-pepper-100 rounded-full flex items-center justify-center">
//                     <User className="h-4 w-4 text-pepper-600" />
//                   </div>
//                   <ChevronDown className="h-4 w-4 text-gray-500" />
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Mobile: Real-time Status Bar */}
//         <div className="lg:hidden mt-2 flex items-center justify-between text-sm">
//           <div className="flex items-center space-x-4">
//             <div className="flex items-center space-x-2">
//               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
//               <span className="text-gray-600">System: Operational</span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </header>
//   )
// }




































// // components/layout/dashboard-header.tsx
// 'use client'

// import { useState } from 'react'
// import { 
//   Bell, 
//   Search, 
//   ChevronDown,
//   Zap,
//   Wifi,
//   Battery,
//   User
// } from 'lucide-react'
// import { useRealTime } from '../providers/realtime-provider'

// export function DashboardHeader() {
//   const [notifications, setNotifications] = useState(3)
//   const { isConnected, connectionStatus } = useRealTime()

//   return (
//     <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200">
//       <div className="px-4 sm:px-6 lg:px-8 py-4">
//         <div className="flex items-center justify-between">
//           {/* Left side - Search */}
//           <div className="flex-1 max-w-xl">
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//               <input
//                 type="search"
//                 placeholder="Search parcels, customers, or locations..."
//                 className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20 focus:outline-none transition"
//               />
//             </div>
//           </div>

//           {/* Right side - Actions */}
//           <div className="flex items-center space-x-4">
//             {/* Connection Status */}
//             <div className="hidden md:flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100">
//               <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
//               <span className="text-sm font-medium text-gray-700">
//                 {isConnected ? 'Live' : 'Offline'}
//               </span>
//               <Wifi className="h-4 w-4 text-gray-500" />
//             </div>

//             {/* Notifications */}
//             <button className="relative p-2 hover:bg-gray-100 rounded-lg transition">
//               <Bell className="h-6 w-6 text-gray-600" />
//               {notifications > 0 && (
//                 <span className="absolute -top-1 -right-1 h-5 w-5 bg-pepper-500 text-white text-xs rounded-full flex items-center justify-center">
//                   {notifications}
//                 </span>
//               )}
//             </button>

//             {/* Quick Actions */}
//             <div className="hidden md:flex items-center space-x-2">
//               <button className="px-4 py-2 bg-pepper-500 text-white rounded-lg hover:bg-pepper-600 transition flex items-center space-x-2">
//                 <Zap className="h-4 w-4" />
//                 <span>New Parcel</span>
//               </button>
//             </div>

//             {/* User Profile */}
//             <div className="flex items-center space-x-3">
//               <div className="hidden md:block text-right">
//                 <p className="text-sm font-medium text-gray-900">TechGadgets NG</p>
//                 <p className="text-xs text-gray-500">Merchant Account</p>
//               </div>
//               <div className="relative">
//                 <button className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition">
//                   <div className="h-8 w-8 bg-pepper-100 rounded-full flex items-center justify-center">
//                     <User className="h-4 w-4 text-pepper-600" />
//                   </div>
//                   <ChevronDown className="h-4 w-4 text-gray-500" />
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Real-time Status Bar */}
//         <div className="mt-2 flex items-center justify-between text-sm">
//           <div className="flex items-center space-x-4">
//             <div className="flex items-center space-x-2">
//               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
//               <span className="text-gray-600">System: Operational</span>
//             </div>
//             <div className="flex items-center space-x-2">
//               <Battery className="h-4 w-4 text-green-500" />
//               <span className="text-gray-600">API: 99.7% uptime</span>
//             </div>
//           </div>
//           <div className="text-gray-500">
//             Last sync: <span className="font-medium text-gray-700">Just now</span>
//           </div>
//         </div>
//       </div>
//     </header>
//   )
// }