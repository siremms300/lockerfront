// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { NotificationProvider } from '@/components/notifications/notification-provider'
import { FloatingNotifications } from '@/components/notifications/floating-notifications'
import { Providers } from './providers'  // Add this import

export const metadata: Metadata = {
  title: 'Locker Network | Merchant Portal',
  description: 'Advanced logistics platform for African e-commerce',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-white text-gray-900 font-sans antialiased">
        <Providers>  {/* Wrap with Providers */}
          <NotificationProvider>
            {children}
            <FloatingNotifications />
          </NotificationProvider>
        </Providers>
      </body>
    </html>
  )
}





















// // app/layout.tsx (Update to include NotificationProvider)
// import type { Metadata } from 'next'
// import './globals.css'
// import { NotificationProvider } from '@/components/notifications/notification-provider'
// import { FloatingNotifications } from '@/components/notifications/floating-notifications'

// export const metadata: Metadata = {
//   title: 'Locker Network | Merchant Portal',
//   description: 'Advanced logistics platform for African e-commerce',
//   keywords: ['logistics', 'locker', 'africa', 'e-commerce', 'delivery', 'pickup'],
// }

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   return (
//     <html lang="en" className="scroll-smooth">
//       <body className="min-h-screen bg-white text-gray-900 font-sans antialiased">
//         <NotificationProvider>
//           {children}
//           <FloatingNotifications />
//         </NotificationProvider>
//       </body>
//     </html>
//   )
// }



































// // app/layout.tsx
// import type { Metadata } from 'next'
// import './globals.css'

// export const metadata: Metadata = {
//   title: 'Locker Network | Merchant Portal',
//   description: 'Advanced logistics platform for African e-commerce',
//   keywords: ['logistics', 'locker', 'africa', 'e-commerce', 'delivery', 'pickup'],
// }

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   return (
//     <html lang="en" className="scroll-smooth">
//       <body className="min-h-screen bg-white text-gray-900 font-sans antialiased">
//         {children}
//       </body>
//     </html>
//   )
// }


















// // app/layout.tsx
// import type { Metadata } from 'next'
// import { Inter } from 'next/font/google'
// import './globals.css'

// const inter = Inter({ subsets: ['latin'] })

// export const metadata: Metadata = {
//   title: 'Locker Network | Merchant Portal',
//   description: 'Advanced logistics platform for African e-commerce',
// }

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   return (
//     <html lang="en">
//       <body className={`${inter.className} bg-gray-50 text-gray-900`}>
//         {children}
//       </body>
//     </html>
//   )
// }