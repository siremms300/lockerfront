 
// app/dashboard/layout.tsx - FIXED
'use client'

import { DashboardSidebar } from '@/components/layout/dashboard-sidebar'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { RealTimeProvider } from '@/components/providers/realtime-provider'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <RealTimeProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile menu button - NOW OUTSIDE SIDEBAR */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg border border-gray-200"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        
        {/* Fixed Sidebar */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          <DashboardSidebar sidebarOpen={false} setSidebarOpen={() => {}} />
        </div>
        
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Mobile sidebar - conditionally rendered */}
        <div className={`lg:hidden fixed inset-y-0 left-0 z-40 w-72 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <DashboardSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        </div>
        
        {/* Main content area */}
        <div className="lg:pl-72">
          {/* Sticky Header */}
          <div className="sticky top-0 z-40 lg:static">
            <DashboardHeader />
          </div>
          
          {/* Main content */}
          <main className="py-8 px-4 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </RealTimeProvider>
  )
}



























// 'use client'
// // app/dashboard/layout.tsx - FIXED
// import { DashboardSidebar } from '@/components/layout/dashboard-sidebar'
// import { DashboardHeader } from '@/components/layout/dashboard-header'
// import { RealTimeProvider } from '@/components/providers/realtime-provider'
// import { Menu } from 'lucide-react'
// import { useState } from 'react'

// export default function DashboardLayout({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   const [sidebarOpen, setSidebarOpen] = useState(false)

//   return (
//     <RealTimeProvider>
//       <div className="min-h-screen bg-gray-50">
//         {/* Mobile menu button - NOW OUTSIDE SIDEBAR */}
//         <button
//           onClick={() => setSidebarOpen(true)}
//           className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg border border-gray-200"
//         >
//           <Menu className="h-6 w-6" />
//         </button>
        
//         {/* Fixed Sidebar */}
//         <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
//           <DashboardSidebar sidebarOpen={false} setSidebarOpen={() => {}} />
//         </div>
        
//         {/* Mobile sidebar overlay */}
//         {sidebarOpen && (
//           <div 
//             className="lg:hidden fixed inset-0 z-40 bg-black/50"
//             onClick={() => setSidebarOpen(false)}
//           />
//         )}
        
//         {/* Mobile sidebar - conditionally rendered */}
//         <div className={`lg:hidden fixed inset-y-0 left-0 z-40 w-72 transform transition-transform duration-300 ease-in-out ${
//           sidebarOpen ? 'translate-x-0' : '-translate-x-full'
//         }`}>
//           <DashboardSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
//         </div>
        
//         {/* Main content area */}
//         <div className="lg:pl-72">
//           {/* Sticky Header */}
//           <div className="sticky top-0 z-40 lg:static">
//             <DashboardHeader />
//           </div>
          
//           {/* Main content */}
//           <main className="py-8 px-4 sm:px-6 lg:px-8">
//             {children}
//           </main>
//         </div>
//       </div>
//     </RealTimeProvider>
//   )
// }


































// // app/dashboard/layout.tsx - FIXED
// import { DashboardSidebar } from '@/components/layout/dashboard-sidebar'
// import { DashboardHeader } from '@/components/layout/dashboard-header'
// import { RealTimeProvider } from '@/components/providers/realtime-provider'

// export default function DashboardLayout({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   return (
//     <RealTimeProvider>
//       <div className="min-h-screen bg-gray-50">
//         {/* Fixed Sidebar */}
//         <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
//           <DashboardSidebar />
//         </div>
        
//         {/* Main content area */}
//         <div className="lg:pl-72">
//           {/* Sticky Header */}
//           <div className="sticky top-0 z-40 lg:static">
//             <DashboardHeader />
//           </div>
          
//           {/* Main content */}
//           <main className="py-8 px-4 sm:px-6 lg:px-8">
//             {children}
//           </main>
//         </div>
//       </div>
//     </RealTimeProvider>
//   )
// }




































// // app/dashboard/layout.tsx
// import { DashboardSidebar } from '@/components/layout/dashboard-sidebar'
// import {DashboardHeader} from '@/components/layout/dashboard-header'
// import { RealTimeProvider } from '@/components/providers/realtime-provider'

// export default function DashboardLayout({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   return (
//     <RealTimeProvider>
//       <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-100">
//         <DashboardSidebar />
//         <div className="lg:pl-72">
//           <DashboardHeader />
//           <main className="py-8 px-4 sm:px-6 lg:px-8">
//             {children}
//           </main>
//         </div>
//       </div>
//     </RealTimeProvider>
//   )
// }