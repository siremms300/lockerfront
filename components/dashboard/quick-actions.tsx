// components/dashboard/quick-actions.tsx
'use client'

import { 
  PackagePlus, 
  Upload, 
  QrCode, 
  MapPin, 
  Users,
  FileText,
  Bell,
  Settings,
  Zap,
  ArrowRight,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { parcelAPI, locationAPI, customerAPI } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'

interface RecentFile {
  id: string
  name: string
  type: 'csv' | 'xlsx' | 'pdf'
  date: string
  size: string
  url?: string
}

interface SystemUpdate {
  id: string
  title: string
  description: string
  type: 'performance' | 'feature' | 'maintenance' | 'security'
  publishedAt: string
  read: boolean
}

export function QuickActions() {
  const router = useRouter()
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([])
  const [systemUpdates, setSystemUpdates] = useState<SystemUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  // Fetch recent exports and system updates
  useEffect(() => {
    fetchRecentFiles()
    fetchSystemUpdates()
  }, [])

  const fetchRecentFiles = async () => {
    try {
      // In a real app, you'd fetch this from your backend
      // For now, we'll use localStorage to track recent exports
      const stored = localStorage.getItem('recentExports')
      if (stored) {
        setRecentFiles(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Failed to fetch recent files:', error)
    }
  }

  const fetchSystemUpdates = async () => {
    try {
      // In a real app, fetch from backend
      // Mock data for now - replace with actual API call
      const mockUpdates = [
        {
          id: '1',
          title: 'Performance Update',
          description: 'System response time improved by 40%',
          type: 'performance',
          publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          read: false
        },
        {
          id: '2',
          title: 'New Feature: Bulk QR Generation',
          description: 'Generate QR codes for multiple parcels at once',
          type: 'feature',
          publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          read: true
        },
        {
          id: '3',
          title: 'Security Update',
          description: 'Enhanced API security with new authentication methods',
          type: 'security',
          publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          read: true
        }
      ]
      setSystemUpdates(mockUpdates)
    } catch (error) {
      console.error('Failed to fetch system updates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAction = async (action: string) => {
    switch (action) {
      case 'create-parcel':
        router.push('/dashboard/parcels/create')
        break
      case 'bulk-upload':
        handleBulkUpload()
        break
      case 'generate-qr':
        router.push('/dashboard/parcels?tab=qr')
        break
      case 'add-location':
        router.push('/dashboard/locations/new')
        break
      case 'add-customer':
        router.push('/dashboard/customers/new')
        break
      case 'generate-report':
        handleGenerateReport()
        break
    }
  }

  const handleBulkUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,.xlsx,.xls'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)

      try {
        // In a real app, you'd upload to your backend
        // const response = await parcelAPI.bulkUpload(formData)
        
        // Simulate upload
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Save to recent files
        const newFile: RecentFile = {
          id: Date.now().toString(),
          name: file.name,
          type: file.name.endsWith('.csv') ? 'csv' : 'xlsx',
          date: new Date().toISOString(),
          size: formatFileSize(file.size)
        }
        
        const updated = [newFile, ...recentFiles].slice(0, 5)
        setRecentFiles(updated)
        localStorage.setItem('recentExports', JSON.stringify(updated))
        
        toast.success(`Successfully uploaded ${file.name}`)
      } catch (error) {
        toast.error('Failed to upload file')
      } finally {
        setUploading(false)
      }
    }
    input.click()
  }

  const handleGenerateReport = async () => {
    try {
      // In a real app, you'd generate a report
      toast.loading('Generating report...')
      
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const reportFile: RecentFile = {
        id: Date.now().toString(),
        name: `analytics_report_${new Date().toISOString().split('T')[0]}.pdf`,
        type: 'pdf',
        date: new Date().toISOString(),
        size: '2.4 MB'
      }
      
      const updated = [reportFile, ...recentFiles].slice(0, 5)
      setRecentFiles(updated)
      localStorage.setItem('recentExports', JSON.stringify(updated))
      
      toast.dismiss()
      toast.success('Report generated successfully')
    } catch (error) {
      toast.error('Failed to generate report')
    }
  }

  const handleDownloadFile = (file: RecentFile) => {
    // In a real app, you'd trigger download
    toast.success(`Downloading ${file.name}`)
  }

  const handleMarkAsRead = (updateId: string) => {
    setSystemUpdates(prev => 
      prev.map(u => u.id === updateId ? { ...u, read: true } : u)
    )
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return 'Unknown'
    }
  }

  const quickActions = [
    { 
      id: 'create-parcel',
      icon: PackagePlus, 
      label: 'Create Parcel', 
      color: 'bg-pepper-500', 
      description: 'Create new delivery',
      href: '/dashboard/parcels/create'
    },
    { 
      id: 'bulk-upload',
      icon: Upload, 
      label: 'Bulk Upload', 
      color: 'bg-blue-500', 
      description: uploading ? 'Uploading...' : 'Upload CSV file',
      disabled: uploading
    },
    { 
      id: 'generate-qr',
      icon: QrCode, 
      label: 'Generate QR', 
      color: 'bg-green-500', 
      description: 'Create QR codes',
      href: '/dashboard/parcels?tab=qr'
    },
    { 
      id: 'add-location',
      icon: MapPin, 
      label: 'Add Location', 
      color: 'bg-purple-500', 
      description: 'New pickup point',
      href: '/dashboard/locations/new'
    },
    { 
      id: 'add-customer',
      icon: Users, 
      label: 'Add Customer', 
      color: 'bg-yellow-500', 
      description: 'New customer profile',
      href: '/dashboard/customers/new'
    },
    { 
      id: 'generate-report',
      icon: FileText, 
      label: 'Generate Report', 
      color: 'bg-indigo-500', 
      description: 'Export analytics'
    },
  ]

  const unreadUpdates = systemUpdates.filter(u => !u.read).length

  return (
    <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
          <p className="text-sm text-gray-500">Frequently used tasks</p>
        </div>
        <Link 
          href="/dashboard/settings?tab=preferences"
          className="flex items-center space-x-2 text-sm text-pepper-600 font-medium hover:text-pepper-700"
        >
          <span>Customize</span>
          <Settings className="h-4 w-4" />
        </Link>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action.id)}
              disabled={action.disabled}
              className={`flex flex-col items-center p-4 border border-gray-200 rounded-xl hover:border-pepper-300 hover:shadow-md transition-all group ${
                action.disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <div className={`${action.color} p-3 rounded-lg mb-3 group-hover:scale-110 transition-transform`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <span className="font-medium text-gray-900 text-sm">{action.label}</span>
              <span className="text-xs text-gray-500 mt-1 text-center">
                {action.description}
              </span>
              {action.disabled && (
                <span className="text-xs text-pepper-500 mt-1 animate-pulse">
                  Processing...
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Files */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Recent Files</h4>
            <button 
              onClick={fetchRecentFiles}
              className="p-1 hover:bg-gray-100 rounded"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4 text-gray-500" />
            </button>
          </div>
          
          <div className="space-y-3">
            {recentFiles.length > 0 ? (
              recentFiles.map((file) => (
                <div 
                  key={file.id} 
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition cursor-pointer group"
                  onClick={() => handleDownloadFile(file)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-white transition">
                      <FileText className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatTimeAgo(file.date)} • {file.size}
                      </p>
                    </div>
                  </div>
                  <Download className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition" />
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Download className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No recent files</p>
                <p className="text-xs mt-1">Generate reports to see them here</p>
              </div>
            )}
          </div>
        </div>

        {/* System Updates */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">System Updates</h4>
            {unreadUpdates > 0 && (
              <span className="px-2 py-0.5 bg-pepper-500 text-white text-xs rounded-full">
                {unreadUpdates} new
              </span>
            )}
          </div>
          
          <div className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                <div className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
                <div className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
              </div>
            ) : (
              systemUpdates.slice(0, 2).map((update) => {
                const bgColor = {
                  performance: 'bg-blue-50 border-blue-100',
                  feature: 'bg-green-50 border-green-100',
                  maintenance: 'bg-yellow-50 border-yellow-100',
                  security: 'bg-red-50 border-red-100'
                }[update.type]

                const iconColor = {
                  performance: 'text-blue-600 bg-blue-100',
                  feature: 'text-green-600 bg-green-100',
                  maintenance: 'text-yellow-600 bg-yellow-100',
                  security: 'text-red-600 bg-red-100'
                }[update.type]

                return (
                  <div 
                    key={update.id}
                    className={`p-4 rounded-lg border relative ${
                      !update.read ? 'ring-2 ring-pepper-500/20' : ''
                    } ${bgColor}`}
                    onClick={() => handleMarkAsRead(update.id)}
                  >
                    {!update.read && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-pepper-500 rounded-full animate-pulse" />
                    )}
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${iconColor}`}>
                        {update.type === 'performance' && <Zap className="h-4 w-4" />}
                        {update.type === 'feature' && <Bell className="h-4 w-4" />}
                        {update.type === 'maintenance' && <Settings className="h-4 w-4" />}
                        {update.type === 'security' && <AlertCircle className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{update.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{update.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatTimeAgo(update.publishedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}

            <Link 
              href="/dashboard/updates"
              className="w-full p-3 border border-dashed border-gray-300 rounded-lg hover:border-pepper-300 hover:bg-pepper-50 transition flex items-center justify-center space-x-2 group"
            >
              <span className="text-sm text-gray-600 group-hover:text-pepper-600">
                View all updates
              </span>
              <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-pepper-600" />
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="font-medium text-gray-900">Quick Stats</div>
            <div className="text-xs text-gray-500 mt-1">
              {recentFiles.length} files exported
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-900">Updates</div>
            <div className="text-xs text-gray-500 mt-1">
              {unreadUpdates} unread
            </div>
          </div>
          <div>
            <div className="font-medium text-gray-900">Actions</div>
            <div className="text-xs text-gray-500 mt-1">
              6 available
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

























































// // components/dashboard/quick-actions.tsx
// 'use client'

// import { 
//   PackagePlus, 
//   Upload, 
//   QrCode, 
//   MapPin, 
//   Users,
//   FileText,
//   Bell,
//   Settings,
//   Zap,
//   ArrowRight
// } from 'lucide-react'
// import { useState } from 'react'

// const quickActions = [
//   { icon: PackagePlus, label: 'Create Parcel', color: 'bg-pepper-500', description: 'Create new delivery' },
//   { icon: Upload, label: 'Bulk Upload', color: 'bg-blue-500', description: 'Upload CSV file' },
//   { icon: QrCode, label: 'Generate QR', color: 'bg-green-500', description: 'Create QR codes' },
//   { icon: MapPin, label: 'Add Location', color: 'bg-purple-500', description: 'New pickup point' },
//   { icon: Users, label: 'Add Customer', color: 'bg-yellow-500', description: 'New customer profile' },
//   { icon: FileText, label: 'Generate Report', color: 'bg-indigo-500', description: 'Export analytics' },
// ]

// export function QuickActions() {
//   const [recentFiles, setRecentFiles] = useState([
//     { name: 'customers.csv', date: 'Today, 10:30 AM', size: '2.4 MB' },
//     { name: 'parcels_export.xlsx', date: 'Yesterday, 3:45 PM', size: '5.7 MB' },
//     { name: 'analytics_report.pdf', date: 'Nov 12, 9:15 AM', size: '3.2 MB' },
//   ])

//   return (
//     <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
//       <div className="flex items-center justify-between mb-6">
//         <div>
//           <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
//           <p className="text-sm text-gray-500">Frequently used tasks</p>
//         </div>
//         <button className="flex items-center space-x-2 text-sm text-pepper-600 font-medium hover:text-pepper-700">
//           <span>Customize</span>
//           <Settings className="h-4 w-4" />
//         </button>
//       </div>

//       {/* Quick Action Buttons */}
//       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
//         {quickActions.map((action, index) => {
//           const Icon = action.icon
//           return (
//             <button
//               key={index}
//               className="flex flex-col items-center p-4 border border-gray-200 rounded-xl hover:border-pepper-300 hover:shadow-md transition-all group"
//             >
//               <div className={`${action.color} p-3 rounded-lg mb-3 group-hover:scale-110 transition-transform`}>
//                 <Icon className="h-6 w-6 text-white" />
//               </div>
//               <span className="font-medium text-gray-900 text-sm">{action.label}</span>
//               <span className="text-xs text-gray-500 mt-1">{action.description}</span>
//             </button>
//           )
//         })}
//       </div>

//       {/* Recent Files & Notifications */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         {/* Recent Files */}
//         <div>
//           <h4 className="font-medium text-gray-900 mb-4">Recent Files</h4>
//           <div className="space-y-3">
//             {recentFiles.map((file, index) => (
//               <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition">
//                 <div className="flex items-center space-x-3">
//                   <div className="p-2 bg-gray-100 rounded-lg">
//                     <FileText className="h-4 w-4 text-gray-600" />
//                   </div>
//                   <div>
//                     <p className="font-medium text-gray-900 text-sm">{file.name}</p>
//                     <p className="text-xs text-gray-500">{file.date}</p>
//                   </div>
//                 </div>
//                 <span className="text-xs text-gray-500">{file.size}</span>
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* System Updates */}
//         <div>
//           <h4 className="font-medium text-gray-900 mb-4">System Updates</h4>
//           <div className="space-y-3">
//             <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
//               <div className="flex items-start space-x-3">
//                 <div className="p-2 bg-blue-100 rounded-lg">
//                   <Zap className="h-4 w-4 text-blue-600" />
//                 </div>
//                 <div>
//                   <p className="font-medium text-gray-900 text-sm">Performance Update</p>
//                   <p className="text-xs text-gray-600 mt-1">
//                     System response time improved by 40%
//                   </p>
//                 </div>
//               </div>
//             </div>
            
//             <div className="p-4 bg-green-50 rounded-lg border border-green-100">
//               <div className="flex items-start space-x-3">
//                 <div className="p-2 bg-green-100 rounded-lg">
//                   <Bell className="h-4 w-4 text-green-600" />
//                 </div>
//                 <div>
//                   <p className="font-medium text-gray-900 text-sm">New Feature</p>
//                   <p className="text-xs text-gray-600 mt-1">
//                     Bulk QR code generation now available
//                   </p>
//                 </div>
//               </div>
//             </div>

//             <button className="w-full p-3 border border-dashed border-gray-300 rounded-lg hover:border-pepper-300 hover:bg-pepper-50 transition flex items-center justify-center space-x-2 group">
//               <span className="text-sm text-gray-600 group-hover:text-pepper-600">View all updates</span>
//               <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-pepper-600" />
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }