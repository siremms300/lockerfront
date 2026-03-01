// app/admin/layout.tsx (Updated with proper auth)
'use client'

import { AdminSidebar } from '@/components/admin/sidebar'
import { AdminHeader } from '@/components/admin/header'
import { withPermission } from '@/components/auth/with-permission'

function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="ml-64">
        <AdminHeader />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

// Only users with admin role can access admin pages
export default withPermission(AdminLayout, undefined, 'admin', '/dashboard')






































// // app/admin/layout.tsx
// 'use client'

// import { AdminSidebar } from '@/components/admin/sidebar'
// import { AdminHeader } from '@/components/admin/header'
// import { RoleGuard } from '@/components/admin/role-guard'

// export default function AdminLayout({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   return (
//     <RoleGuard allowedRoles={['admin', 'super_admin']}>
//       <div className="min-h-screen bg-gray-50">
//         <AdminSidebar />
//         <div className="ml-64">
//           <AdminHeader />
//           <main className="p-6">
//             {children}
//           </main>
//         </div>
//       </div>
//     </RoleGuard>
//   )
// }



