 // components/layout/dashboard-sidebar.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Package, 
  BarChart3, 
  Settings, 
  CreditCard, 
  MapPin,
  Users,
  Bell,
  HelpCircle,
  LogOut,
  Menu,
  X,
  Zap,
  Home,
  FileText,
  Truck,
  UserCog  // Add this import
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth' // Add this import

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Parcels', href: '/dashboard/parcels', icon: Package },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Locations', href: '/dashboard/locations', icon: MapPin },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Drivers', href: '/dashboard/drivers', icon: Truck },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

// Admin-only navigation item
const adminNavItem = { name: 'User Management', href: '/dashboard/users', icon: UserCog }

interface DashboardSidebarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export function DashboardSidebar({ sidebarOpen, setSidebarOpen }: DashboardSidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth() // Get the current user
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  // Conditionally add User Management to navigation if admin
  const navItems = isAdmin ? [...navigation, adminNavItem] : navigation

  return (
    <>
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72
        bg-white border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-auto
        flex flex-col h-full
      `}>
        {/* Logo & Close button for mobile */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center space-x-3" onClick={() => setSidebarOpen(false)}>
            <div className="relative">
              <div className="absolute inset-0 bg-pepper-500/20 rounded-lg blur" />
              <div className="relative p-2 bg-pepper-500 rounded-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 font-display">Locker Network</h1>
              <p className="text-xs text-gray-500">Merchant Portal</p>
            </div>
          </Link>
          
          {/* Close button for mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${isActive
                    ? 'bg-pepper-500/10 text-pepper-600 border-l-4 border-pepper-500'
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-pepper-500 rounded-full animate-pulse" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Live Status */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <div className="bg-gradient-to-r from-pepper-500/5 to-transparent p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="h-4 w-4 text-pepper-500" />
              <span className="text-sm font-medium text-gray-700">
                Live Updates Active
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-500">
                Real-time tracking enabled
              </span>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <div className="space-y-2">
            <button className="flex items-center space-x-3 w-full p-3 rounded-lg text-gray-600 hover:bg-gray-100">
              <Bell className="h-5 w-5" />
              <span>Notifications</span>
            </button>
            <button className="flex items-center space-x-3 w-full p-3 rounded-lg text-gray-600 hover:bg-gray-100">
              <HelpCircle className="h-5 w-5" />
              <span>Help & Support</span>
            </button>
            <button className="flex items-center space-x-3 w-full p-3 rounded-lg text-red-600 hover:bg-red-50">
              <LogOut className="h-5 w-5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}













































// // components/layout/dashboard-sidebar.tsx - UPDATED
// 'use client'

// import { useState } from 'react'
// import Link from 'next/link'
// import { usePathname } from 'next/navigation'
// import { 
//   Package, 
//   BarChart3, 
//   Settings, 
//   CreditCard, 
//   MapPin,
//   Users,
//   Bell,
//   HelpCircle,
//   LogOut,
//   Menu,
//   X,
//   Zap,
//   Home,
//   FileText,
//   Truck
// } from 'lucide-react'

// const navigation = [
//   { name: 'Dashboard', href: '/dashboard', icon: Home },
//   { name: 'Parcels', href: '/dashboard/parcels', icon: Package },
//   { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
//   { name: 'Locations', href: '/dashboard/locations', icon: MapPin },
//   { name: 'Customers', href: '/dashboard/customers', icon: Users },
//   { name: 'Drivers', href: '/dashboard/drivers', icon: Truck },
//   { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
//   { name: 'Settings', href: '/dashboard/settings', icon: Settings },
// ]

// interface DashboardSidebarProps {
//   sidebarOpen: boolean
//   setSidebarOpen: (open: boolean) => void
// }

// export function DashboardSidebar({ sidebarOpen, setSidebarOpen }: DashboardSidebarProps) {
//   const pathname = usePathname()

//   return (
//     <>
//       {/* Sidebar */}
//       <aside className={`
//         fixed inset-y-0 left-0 z-40 w-72
//         bg-white border-r border-gray-200
//         transform transition-transform duration-300 ease-in-out
//         ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
//         lg:translate-x-0 lg:static lg:inset-auto
//         flex flex-col h-full
//       `}>
//         {/* Logo & Close button for mobile */}
//         <div className="p-6 border-b border-gray-200 flex-shrink-0 flex items-center justify-between">
//           <Link href="/dashboard" className="flex items-center space-x-3" onClick={() => setSidebarOpen(false)}>
//             <div className="relative">
//               <div className="absolute inset-0 bg-pepper-500/20 rounded-lg blur" />
//               <div className="relative p-2 bg-pepper-500 rounded-lg">
//                 <Package className="h-6 w-6 text-white" />
//               </div>
//             </div>
//             <div>
//               <h1 className="text-xl font-bold text-gray-900 font-display">Locker Network</h1>
//               <p className="text-xs text-gray-500">Merchant Portal</p>
//             </div>
//           </Link>
          
//           {/* Close button for mobile */}
//           <button
//             onClick={() => setSidebarOpen(false)}
//             className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
//           >
//             <X className="h-5 w-5" />
//           </button>
//         </div>

//         {/* Navigation */}
//         <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
//           {navigation.map((item) => {
//             const isActive = pathname === item.href
//             const Icon = item.icon
            
//             return (
//               <Link
//                 key={item.name}
//                 href={item.href}
//                 onClick={() => setSidebarOpen(false)}
//                 className={`
//                   flex items-center space-x-3 px-4 py-3 rounded-lg
//                   transition-all duration-200
//                   ${isActive
//                     ? 'bg-pepper-500/10 text-pepper-600 border-l-4 border-pepper-500'
//                     : 'text-gray-600 hover:bg-gray-100'
//                   }
//                 `}
//               >
//                 <Icon className="h-5 w-5" />
//                 <span className="font-medium">{item.name}</span>
//                 {isActive && (
//                   <div className="ml-auto w-2 h-2 bg-pepper-500 rounded-full animate-pulse" />
//                 )}
//               </Link>
//             )
//           })}
//         </nav>

//         {/* Live Status */}
//         <div className="p-4 border-t border-gray-200 flex-shrink-0">
//           <div className="bg-gradient-to-r from-pepper-500/5 to-transparent p-4 rounded-lg">
//             <div className="flex items-center space-x-2 mb-2">
//               <Zap className="h-4 w-4 text-pepper-500" />
//               <span className="text-sm font-medium text-gray-700">
//                 Live Updates Active
//               </span>
//             </div>
//             <div className="flex items-center space-x-2">
//               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
//               <span className="text-xs text-gray-500">
//                 Real-time tracking enabled
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* Bottom section */}
//         <div className="p-4 border-t border-gray-200 flex-shrink-0">
//           <div className="space-y-2">
//             {/* @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ */}
//             <button className="flex items-center space-x-3 w-full p-3 rounded-lg text-gray-600 hover:bg-gray-100">
//               <Bell className="h-5 w-5" href='/dashboard/settings'/>
//               <span>Notifications</span>
//             </button>
//             <button className="flex items-center space-x-3 w-full p-3 rounded-lg text-gray-600 hover:bg-gray-100">
//               <HelpCircle className="h-5 w-5" />
//               <span>Help & Support</span>
//             </button>
//             <button className="flex items-center space-x-3 w-full p-3 rounded-lg text-red-600 hover:bg-red-50">
//               <LogOut className="h-5 w-5" />
//               <span>Log out</span>
//             </button>
//           </div>
//         </div>
//       </aside>
//     </>
//   )
// }



































// // components/layout/dashboard-sidebar.tsx - UPDATED
// 'use client'

// import { useState } from 'react'
// import Link from 'next/link'
// import { usePathname } from 'next/navigation'
// import { 
//   Package, 
//   BarChart3, 
//   Settings, 
//   CreditCard, 
//   MapPin,
//   Users,
//   Bell,
//   HelpCircle,
//   LogOut,
//   Menu,
//   X,
//   Zap,
//   Home,
//   FileText,
//   Truck
// } from 'lucide-react'

// const navigation = [
//   { name: 'Dashboard', href: '/dashboard', icon: Home },
//   { name: 'Parcels', href: '/dashboard/parcels', icon: Package },
//   { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
//   { name: 'Locations', href: '/dashboard/locations', icon: MapPin },
//   { name: 'Customers', href: '/dashboard/customers', icon: Users },
//   { name: 'Drivers', href: '/dashboard/drivers', icon: Truck },
//   { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
//   { name: 'Settings', href: '/dashboard/settings', icon: Settings },
// ]

// export function DashboardSidebar() {
//   const [isOpen, setIsOpen] = useState(false)
//   const pathname = usePathname()

//   return (
//     <>
//       {/* Mobile menu button */}
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg border border-gray-200"
//       >
//         {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
//       </button>

//       {/* Mobile sidebar overlay */}
//       {isOpen && (
//         <div 
//           className="lg:hidden fixed inset-0 z-40 bg-black/50"
//           onClick={() => setIsOpen(false)}
//         />
//       )}

//       {/* Sidebar */}
//       <aside className={`
//         fixed inset-y-0 left-0 z-40 w-72
//         bg-white border-r border-gray-200
//         transform transition-transform duration-300 ease-in-out
//         ${isOpen ? 'translate-x-0' : '-translate-x-full'}
//         lg:translate-x-0 lg:static lg:inset-auto
//         flex flex-col h-full
//       `}>
//         {/* Logo */}
//         <div className="p-6 border-b border-gray-200 flex-shrink-0">
//           <Link href="/dashboard" className="flex items-center space-x-3" onClick={() => setIsOpen(false)}>
//             <div className="relative">
//               <div className="absolute inset-0 bg-pepper-500/20 rounded-lg blur" />
//               <div className="relative p-2 bg-pepper-500 rounded-lg">
//                 <Package className="h-6 w-6 text-white" />
//               </div>
//             </div>
//             <div>
//               <h1 className="text-xl font-bold text-gray-900 font-display">Locker Network</h1>
//               <p className="text-xs text-gray-500">Merchant Portal</p>
//             </div>
//           </Link>
//         </div>

//         {/* Navigation */}
//         <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
//           {navigation.map((item) => {
//             const isActive = pathname === item.href
//             const Icon = item.icon
            
//             return (
//               <Link
//                 key={item.name}
//                 href={item.href}
//                 onClick={() => setIsOpen(false)}
//                 className={`
//                   flex items-center space-x-3 px-4 py-3 rounded-lg
//                   transition-all duration-200
//                   ${isActive
//                     ? 'bg-pepper-500/10 text-pepper-600 border-l-4 border-pepper-500'
//                     : 'text-gray-600 hover:bg-gray-100'
//                   }
//                 `}
//               >
//                 <Icon className="h-5 w-5" />
//                 <span className="font-medium">{item.name}</span>
//                 {isActive && (
//                   <div className="ml-auto w-2 h-2 bg-pepper-500 rounded-full animate-pulse" />
//                 )}
//               </Link>
//             )
//           })}
//         </nav>

//         {/* Live Status */}
//         <div className="p-4 border-t border-gray-200 flex-shrink-0">
//           <div className="bg-gradient-to-r from-pepper-500/5 to-transparent p-4 rounded-lg">
//             <div className="flex items-center space-x-2 mb-2">
//               <Zap className="h-4 w-4 text-pepper-500" />
//               <span className="text-sm font-medium text-gray-700">
//                 Live Updates Active
//               </span>
//             </div>
//             <div className="flex items-center space-x-2">
//               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
//               <span className="text-xs text-gray-500">
//                 Real-time tracking enabled
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* Bottom section */}
//         <div className="p-4 border-t border-gray-200 flex-shrink-0">
//           <div className="space-y-2">
//             <button className="flex items-center space-x-3 w-full p-3 rounded-lg text-gray-600 hover:bg-gray-100">
//               <Bell className="h-5 w-5" />
//               <span>Notifications</span>
//             </button>
//             <button className="flex items-center space-x-3 w-full p-3 rounded-lg text-gray-600 hover:bg-gray-100">
//               <HelpCircle className="h-5 w-5" />
//               <span>Help & Support</span>
//             </button>
//             <button className="flex items-center space-x-3 w-full p-3 rounded-lg text-red-600 hover:bg-red-50">
//               <LogOut className="h-5 w-5" />
//               <span>Log out</span>
//             </button>
//           </div>
//         </div>
//       </aside>
//     </>
//   )
// }







































// // components/layout/dashboard-sidebar.tsx
// 'use client'

// import { useState } from 'react'
// import Link from 'next/link'
// import { usePathname } from 'next/navigation'
// import { 
//   Package, 
//   BarChart3, 
//   Settings, 
//   CreditCard, 
//   MapPin,
//   Users,
//   Bell,
//   HelpCircle,
//   LogOut,
//   Menu,
//   X,
//   Zap,
//   Home,
//   FileText,
//   Truck
// } from 'lucide-react'

// const navigation = [
//   { name: 'Dashboard', href: '/dashboard', icon: Home },
//   { name: 'Parcels', href: '/dashboard/parcels', icon: Package },
//   { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
//   { name: 'Locations', href: '/dashboard/locations', icon: MapPin },
//   { name: 'Customers', href: '/dashboard/customers', icon: Users },
//   { name: 'Drivers', href: '/dashboard/drivers', icon: Truck },
//   { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
//   { name: 'Settings', href: '/dashboard/settings', icon: Settings },
// ]

// export function DashboardSidebar() {
//   const [isOpen, setIsOpen] = useState(false)
//   const pathname = usePathname()

//   return (
//     <>
//       {/* Mobile menu button */}
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg border border-gray-200"
//       >
//         {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
//       </button>

//       {/* Sidebar */}
//       <aside className={`
//         fixed inset-y-0 left-0 z-40 w-72
//         bg-white border-r border-gray-200
//         transform transition-transform duration-300 ease-in-out
//         ${isOpen ? 'translate-x-0' : '-translate-x-full'}
//         lg:translate-x-0 lg:static lg:inset-auto
//         overflow-y-auto
//       `}>
//         {/* Logo */}
//         <div className="p-6 border-b border-gray-200">
//           <Link href="/dashboard" className="flex items-center space-x-3">
//             <div className="relative">
//               <div className="absolute inset-0 bg-pepper-500/20 rounded-lg blur" />
//               <div className="relative p-2 bg-pepper-500 rounded-lg">
//                 <Package className="h-6 w-6 text-white" />
//               </div>
//             </div>
//             <div>
//               <h1 className="text-xl font-bold text-gray-900 font-display">Locker Network</h1>
//               <p className="text-xs text-gray-500">Merchant Portal</p>
//             </div>
//           </Link>
//         </div>

//         {/* Navigation */}
//         <nav className="p-4 space-y-1">
//           {navigation.map((item) => {
//             const isActive = pathname === item.href
//             const Icon = item.icon
            
//             return (
//               <Link
//                 key={item.name}
//                 href={item.href}
//                 onClick={() => setIsOpen(false)}
//                 className={`
//                   flex items-center space-x-3 px-4 py-3 rounded-lg
//                   transition-all duration-200
//                   ${isActive
//                     ? 'bg-pepper-500/10 text-pepper-600 border-l-4 border-pepper-500'
//                     : 'text-gray-600 hover:bg-gray-100'
//                   }
//                 `}
//               >
//                 <Icon className="h-5 w-5" />
//                 <span className="font-medium">{item.name}</span>
//                 {isActive && (
//                   <div className="ml-auto w-2 h-2 bg-pepper-500 rounded-full animate-pulse" />
//                 )}
//               </Link>
//             )
//           })}
//         </nav>

//         {/* Live Status */}
//         <div className="p-4 border-t border-gray-200 mt-4">
//           <div className="bg-gradient-to-r from-pepper-500/5 to-transparent p-4 rounded-lg">
//             <div className="flex items-center space-x-2 mb-2">
//               <Zap className="h-4 w-4 text-pepper-500" />
//               <span className="text-sm font-medium text-gray-700">
//                 Live Updates Active
//               </span>
//             </div>
//             <div className="flex items-center space-x-2">
//               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
//               <span className="text-xs text-gray-500">
//                 Real-time tracking enabled
//               </span>
//             </div>
//           </div>
//         </div>

//         {/* Bottom section */}
//         <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
//           <div className="space-y-2">
//             <button className="flex items-center space-x-3 w-full p-3 rounded-lg text-gray-600 hover:bg-gray-100">
//               <Bell className="h-5 w-5" />
//               <span>Notifications</span>
//             </button>
//             <button className="flex items-center space-x-3 w-full p-3 rounded-lg text-gray-600 hover:bg-gray-100">
//               <HelpCircle className="h-5 w-5" />
//               <span>Help & Support</span>
//             </button>
//             <button className="flex items-center space-x-3 w-full p-3 rounded-lg text-red-600 hover:bg-red-50">
//               <LogOut className="h-5 w-5" />
//               <span>Log out</span>
//             </button>
//           </div>
//         </div>
//       </aside>
//     </>
//   )
// }