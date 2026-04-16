// app/dashboard/settings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import {
  User,
  Bell,
  Shield,
  Key,
  Users,
  Building,
  Mail,
  Phone,
  MapPin,
  Globe,
  CreditCard,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Check,
  AlertCircle,
  LogOut,
  Smartphone,
  Clock,
  Link as LinkIcon,
  Webhook,
  Settings as SettingsIcon,
  Palette,
  Moon,
  Sun,
  Package,
  CheckCircle,
  DollarSign,
  Plus,
  Receipt,
  Trash2,
  Edit,
  MoreVertical,
  Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { merchantAPI, billingAPI, authAPI } from '@/lib/api'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// Profile schema
const profileSchema = z.object({
  businessName: z.string().min(2, 'Business name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Valid phone number required'),
  businessType: z.string().min(1, 'Business type is required'),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    postalCode: z.string().optional()
  })
})

type ProfileForm = z.infer<typeof profileSchema>

// Notification settings schema
const notificationSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  parcelCreated: z.boolean(),
  parcelPickedUp: z.boolean(),
  parcelDelayed: z.boolean(),
  paymentReceived: z.boolean(),
  lowWalletBalance: z.boolean(),
  marketingEmails: z.boolean()
})

type NotificationForm = z.infer<typeof notificationSchema>

interface ApiKey {
  _id?: string
  key: string
  createdAt: string
  lastUsed?: string
  name: string
  environment: 'live' | 'test'
}

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'viewer'
  status: 'active' | 'pending' | 'inactive'
  avatar?: string
  lastActive?: string
}

interface MerchantProfile {
  businessName: string
  email: string
  phone: string
  businessType: string
  address?: {
    street: string
    city: string
    state: string
    country: string
    postalCode: string
  }
  billing?: {
    walletBalance: number
    creditLimit: number
    autoTopUp: boolean
    topUpThreshold: number
  }
  settings?: {
    smsNotifications: boolean
    emailNotifications: boolean
    autoApproveReturns: boolean
    defaultLockerSize: string
  }
  webhookUrl?: string
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'api' | 'team' | 'security' | 'billing'>('profile')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [merchant, setMerchant] = useState<MerchantProfile | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({})
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState('30')
  const [sessions, setSessions] = useState<any[]>([])
  const [billingHistory, setBillingHistory] = useState<any[]>([])

  // Fetch merchant data on mount
  useEffect(() => {
    fetchMerchantData()
  }, [])

  const fetchMerchantData = async () => {
    try {
      setInitialLoading(true)
      
      // Fetch merchant profile
      const profileRes = await merchantAPI.getProfile()
      setMerchant(profileRes.data)
      
      // Fetch API keys
      try {
        const apiKeysRes = await merchantAPI.getApiKeys()
        setApiKeys(apiKeysRes.data.keys || [])
      } catch (error) {
        console.error('Failed to fetch API keys:', error)
      }
      
      // Fetch team members
      try {
        const teamRes = await merchantAPI.getTeamMembers()
        setTeamMembers(teamRes.data.members || [])
      } catch (error) {
        console.error('Failed to fetch team members:', error)
      }
      
      // Fetch active sessions
      try {
        const sessionsRes = await authAPI.getActiveSessions()
        setSessions(sessionsRes.data.sessions || [])
      } catch (error) {
        console.error('Failed to fetch sessions:', error)
      }
      
      // Fetch billing history
      try {
        const billingRes = await billingAPI.getTransactions({ limit: 5 })
        setBillingHistory(billingRes.data.transactions || [])
      } catch (error) {
        console.error('Failed to fetch billing history:', error)
      }
      
    } catch (error: any) {
      toast.error('Failed to load settings')
      console.error('Error fetching merchant data:', error)
    } finally {
      setInitialLoading(false)
    }
  }

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors, isDirty: profileDirty },
    reset: resetProfile
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: merchant ? {
      businessName: merchant.businessName,
      email: merchant.email,
      phone: merchant.phone,
      businessType: merchant.businessType,
      address: merchant.address || {
        street: '',
        city: '',
        state: '',
        country: 'Nigeria',
        postalCode: ''
      }
    } : undefined
  })

  // Update form when merchant data loads
  useEffect(() => {
    if (merchant) {
      resetProfile({
        businessName: merchant.businessName,
        email: merchant.email,
        phone: merchant.phone,
        businessType: merchant.businessType,
        address: merchant.address || {
          street: '',
          city: '',
          state: '',
          country: 'Nigeria',
          postalCode: ''
        }
      })
    }
  }, [merchant, resetProfile])

  // Notification form
  const {
    register: registerNotifications,
    handleSubmit: handleSubmitNotifications,
    formState: { isDirty: notificationsDirty },
    reset: resetNotifications
  } = useForm<NotificationForm>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: merchant?.settings?.emailNotifications ?? true,
      smsNotifications: merchant?.settings?.smsNotifications ?? true,
      pushNotifications: false,
      parcelCreated: true,
      parcelPickedUp: true,
      parcelDelayed: true,
      paymentReceived: true,
      lowWalletBalance: merchant?.billing?.autoTopUp ?? false,
      marketingEmails: false
    }
  })

  // Update notification form when merchant data loads
  useEffect(() => {
    if (merchant) {
      resetNotifications({
        emailNotifications: merchant.settings?.emailNotifications ?? true,
        smsNotifications: merchant.settings?.smsNotifications ?? true,
        pushNotifications: false,
        parcelCreated: true,
        parcelPickedUp: true,
        parcelDelayed: true,
        paymentReceived: true,
        lowWalletBalance: merchant.billing?.autoTopUp ?? false,
        marketingEmails: false
      })
    }
  }, [merchant, resetNotifications])

  const onProfileSubmit = async (data: ProfileForm) => {
    setLoading(true)
    try {
      const response = await merchantAPI.updateProfile(data)
      setMerchant(response.data)
      toast.success('Profile updated successfully')
      resetProfile(data)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const onNotificationSubmit = async (data: NotificationForm) => {
    setLoading(true)
    try {
      await merchantAPI.updateSettings({
        emailNotifications: data.emailNotifications,
        smsNotifications: data.smsNotifications,
        autoTopUp: data.lowWalletBalance
      })
      toast.success('Notification settings updated')
      resetNotifications(data)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update settings')
    } finally {
      setLoading(false)
    }
  }

  const generateApiKey = async () => {
    try {
      const response = await merchantAPI.generateApiKey()
      setApiKeys([...apiKeys, response.data])
      toast.success('New API key generated')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to generate API key')
    }
  }

  const revokeApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) return
    
    try {
      await merchantAPI.revokeApiKey(keyId)
      setApiKeys(apiKeys.filter(k => k._id !== keyId))
      toast.success('API key revoked')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to revoke API key')
    }
  }

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(keyId)
    setTimeout(() => setCopiedKey(null), 2000)
    toast.success('Copied to clipboard')
  }

  const updateTeamMemberRole = async (memberId: string, role: string) => {
    try {
      await merchantAPI.updateTeamMember(memberId, { role })
      setTeamMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, role: role as any } : m
      ))
      toast.success('Team member role updated')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update role')
    }
  }

  const removeTeamMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return
    
    try {
      await merchantAPI.removeTeamMember(memberId)
      setTeamMembers(prev => prev.filter(m => m.id !== memberId))
      toast.success('Team member removed')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to remove team member')
    }
  }

  const revokeSession = async (sessionId: string) => {
    try {
      await authAPI.revokeSession(sessionId)
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      toast.success('Session revoked')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to revoke session')
    }
  }

  const updatePassword = async (data: { current: string; new: string; confirm: string }) => {
    if (data.new !== data.confirm) {
      toast.error('New passwords do not match')
      return
    }
    
    try {
      await authAPI.changePassword({
        currentPassword: data.current,
        newPassword: data.new
      })
      toast.success('Password updated successfully')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update password')
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard }
  ]

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-pepper-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-soft p-4 sticky top-24">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={cn(
                        "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all",
                        activeTab === tab.id
                          ? "bg-pepper-50 text-pepper-600 border-l-4 border-pepper-500"
                          : "text-gray-600 hover:bg-gray-100"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  )
                })}
              </nav>

              {/* System Status */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-green-700">System Status</span>
                  </div>
                  <p className="text-xs text-green-600">All systems operational</p>
                  <p className="text-xs text-gray-500 mt-2">Last checked: Just now</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-soft p-6 lg:p-8">
              <AnimatePresence mode="wait">
                {/* Profile Settings */}
                {activeTab === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
                      <p className="text-gray-600">Update your business information</p>
                    </div>

                    <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business Name *
                          </label>
                          <input
                            {...registerProfile('businessName')}
                            className={cn(
                              "w-full px-4 py-3 rounded-lg border",
                              "border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
                              profileErrors.businessName && "border-red-500"
                            )}
                          />
                          {profileErrors.businessName && (
                            <p className="mt-1 text-sm text-red-600">{profileErrors.businessName.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address *
                          </label>
                          <input
                            {...registerProfile('email')}
                            type="email"
                            className={cn(
                              "w-full px-4 py-3 rounded-lg border",
                              "border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
                              profileErrors.email && "border-red-500"
                            )}
                          />
                          {profileErrors.email && (
                            <p className="mt-1 text-sm text-red-600">{profileErrors.email.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number *
                          </label>
                          <input
                            {...registerProfile('phone')}
                            className={cn(
                              "w-full px-4 py-3 rounded-lg border",
                              "border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20",
                              profileErrors.phone && "border-red-500"
                            )}
                          />
                          {profileErrors.phone && (
                            <p className="mt-1 text-sm text-red-600">{profileErrors.phone.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business Type *
                          </label>
                          <select
                            {...registerProfile('businessType')}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                          >
                            <option value="E-commerce">E-commerce</option>
                            <option value="Retail">Retail</option>
                            <option value="Logistics">Logistics</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-medium text-gray-900 mb-4">Business Address</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Street Address
                            </label>
                            <input
                              {...registerProfile('address.street')}
                              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              City
                            </label>
                            <input
                              {...registerProfile('address.city')}
                              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              State
                            </label>
                            <input
                              {...registerProfile('address.state')}
                              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Country
                            </label>
                            <input
                              {...registerProfile('address.country')}
                              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Postal Code
                            </label>
                            <input
                              {...registerProfile('address.postalCode')}
                              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-4 pt-6 border-t">
                        <button
                          type="button"
                          onClick={() => merchant && resetProfile()}
                          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                          disabled={!profileDirty}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading || !profileDirty}
                          className="px-6 py-3 pepper-gradient text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 flex items-center space-x-2"
                        >
                          {loading ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              <span>Save Changes</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* Notification Settings */}
                {activeTab === 'notifications' && (
                  <motion.div
                    key="notifications"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Notification Preferences</h2>
                      <p className="text-gray-600">Choose how you want to receive updates</p>
                    </div>

                    <form onSubmit={handleSubmitNotifications(onNotificationSubmit)} className="space-y-6">
                      {/* Delivery Channels */}
                      <div className="space-y-4">
                        <h3 className="font-medium text-gray-900">Delivery Channels</h3>
                        
                        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                          <div className="flex items-center space-x-3">
                            <Mail className="h-5 w-5 text-gray-600" />
                            <div>
                              <div className="font-medium">Email Notifications</div>
                              <div className="text-sm text-gray-500">Receive updates via email</div>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            {...registerNotifications('emailNotifications')}
                            className="h-5 w-5 text-pepper-600 rounded"
                          />
                        </label>

                        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                          <div className="flex items-center space-x-3">
                            <Smartphone className="h-5 w-5 text-gray-600" />
                            <div>
                              <div className="font-medium">SMS Notifications</div>
                              <div className="text-sm text-gray-500">Receive updates via SMS</div>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            {...registerNotifications('smsNotifications')}
                            className="h-5 w-5 text-pepper-600 rounded"
                          />
                        </label>

                        <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                          <div className="flex items-center space-x-3">
                            <Bell className="h-5 w-5 text-gray-600" />
                            <div>
                              <div className="font-medium">Push Notifications</div>
                              <div className="text-sm text-gray-500">Receive updates in browser</div>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            {...registerNotifications('pushNotifications')}
                            className="h-5 w-5 text-pepper-600 rounded"
                          />
                        </label>
                      </div>

                      {/* Event Types */}
                      <div className="space-y-4">
                        <h3 className="font-medium text-gray-900">Events to Notify</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { id: 'parcelCreated', label: 'Parcel Created', icon: Package },
                            { id: 'parcelPickedUp', label: 'Parcel Picked Up', icon: CheckCircle },
                            { id: 'parcelDelayed', label: 'Parcel Delayed', icon: Clock },
                            { id: 'paymentReceived', label: 'Payment Received', icon: DollarSign },
                            { id: 'lowWalletBalance', label: 'Low Wallet Balance', icon: AlertCircle },
                            { id: 'marketingEmails', label: 'Marketing Emails', icon: Mail }
                          ].map((event) => {
                            const Icon = event.icon
                            return (
                              <label
                                key={event.id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                              >
                                <div className="flex items-center space-x-3">
                                  <Icon className="h-4 w-4 text-gray-600" />
                                  <span className="text-sm">{event.label}</span>
                                </div>
                                <input
                                  type="checkbox"
                                  {...registerNotifications(event.id as any)}
                                  className="h-4 w-4 text-pepper-600 rounded"
                                />
                              </label>
                            )
                          })}
                        </div>
                      </div>

                      <div className="flex justify-end space-x-4 pt-6 border-t">
                        <button
                          type="button"
                          onClick={() => merchant && resetNotifications()}
                          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                          disabled={!notificationsDirty}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading || !notificationsDirty}
                          className="px-6 py-3 pepper-gradient text-white rounded-lg hover:shadow-lg transition disabled:opacity-50 flex items-center space-x-2"
                        >
                          {loading ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              <span>Save Preferences</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* API Keys */}
                {activeTab === 'api' && (
                  <motion.div
                    key="api"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">API Keys</h2>
                      <p className="text-gray-600">Manage API keys for programmatic access</p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-800">Security Notice</h4>
                          <p className="text-sm text-blue-700">
                            API keys provide full access to your account. Keep them secure and never share them publicly.
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={generateApiKey}
                      className="px-4 py-2 bg-pepper-500 text-white rounded-lg hover:bg-pepper-600 transition flex items-center space-x-2"
                    >
                      <Key className="h-4 w-4" />
                      <span>Generate New API Key</span>
                    </button>

                    <div className="space-y-4">
                      {apiKeys.map((apiKey, index) => (
                        <div key={apiKey._id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium text-gray-900">{apiKey.name}</h4>
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-xs font-medium",
                                  apiKey.environment === 'live' 
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                )}>
                                  {apiKey.environment}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">
                                Created: {new Date(apiKey.createdAt).toLocaleDateString()}
                                {apiKey.lastUsed && ` • Last used: ${new Date(apiKey.lastUsed).toLocaleDateString()}`}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => copyToClipboard(apiKey.key, apiKey._id || apiKey.key)}
                                className="p-2 hover:bg-gray-100 rounded"
                                title="Copy"
                              >
                                {copiedKey === (apiKey._id || apiKey.key) ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4 text-gray-600" />
                                )}
                              </button>
                              <button
                                onClick={() => setShowApiKey(prev => ({ ...prev, [apiKey._id || apiKey.key]: !prev[apiKey._id || apiKey.key] }))}
                                className="p-2 hover:bg-gray-100 rounded"
                                title={showApiKey[apiKey._id || apiKey.key] ? 'Hide' : 'Show'}
                              >
                                {showApiKey[apiKey._id || apiKey.key] ? (
                                  <EyeOff className="h-4 w-4 text-gray-600" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-600" />
                                )}
                              </button>
                              <button
                                onClick={() => apiKey._id && revokeApiKey(apiKey._id)}
                                className="p-2 hover:bg-red-50 rounded text-red-600"
                                title="Revoke"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 p-3 rounded font-mono text-sm">
                            {showApiKey[apiKey._id || apiKey.key] ? apiKey.key : '•'.repeat(40)}
                          </div>
                        </div>
                      ))}

                      {apiKeys.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                          No API keys generated yet
                        </div>
                      )}
                    </div>

                    {/* Webhook Configuration */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <h3 className="font-medium text-gray-900 mb-4">Webhook Configuration</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Webhook URL
                          </label>
                          <div className="flex space-x-2">
                            <input
                              type="url"
                              placeholder="https://your-server.com/webhook"
                              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                              defaultValue={merchant?.webhookUrl || ''}
                            />
                            <button className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                              Test
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            We'll send POST requests to this URL for real-time events
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {['parcel.created', 'parcel.picked_up', 'payment.received', 'locker.offline'].map((event) => (
                            <label key={event} className="flex items-center space-x-2">
                              <input type="checkbox" className="h-4 w-4 text-pepper-600 rounded" defaultChecked />
                              <span className="text-sm text-gray-700">{event}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Team Management */}
                {activeTab === 'team' && (
                  <motion.div
                    key="team"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Team Members</h2>
                        <p className="text-gray-600">Manage who has access to your account</p>
                      </div>
                      <button className="px-4 py-2 bg-pepper-500 text-white rounded-lg hover:bg-pepper-600 transition flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>Invite Member</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {teamMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition">
                          <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                              {member.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium text-gray-900">{member.name}</h4>
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-xs font-medium",
                                  member.status === 'active' ? "bg-green-100 text-green-800" :
                                  member.status === 'pending' ? "bg-yellow-100 text-yellow-800" :
                                  "bg-gray-100 text-gray-800"
                                )}>
                                  {member.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{member.email}</p>
                              {member.lastActive && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Last active: {new Date(member.lastActive).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <select
                              value={member.role}
                              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                              onChange={(e) => updateTeamMemberRole(member.id, e.target.value)}
                            >
                              <option value="admin">Admin</option>
                              <option value="manager">Manager</option>
                              <option value="viewer">Viewer</option>
                            </select>
                            <button 
                              onClick={() => removeTeamMember(member.id)}
                              className="p-2 hover:bg-red-50 rounded text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {teamMembers.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                          No team members yet
                        </div>
                      )}
                    </div>

                    {/* Role Descriptions */}
                    <div className="bg-gray-50 rounded-lg p-4 mt-6">
                      <h4 className="font-medium text-gray-900 mb-3">Role Permissions</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h5 className="font-medium text-sm text-gray-900">Admin</h5>
                          <p className="text-xs text-gray-600 mt-1">Full access to all features, billing, and team management</p>
                        </div>
                        <div>
                          <h5 className="font-medium text-sm text-gray-900">Manager</h5>
                          <p className="text-xs text-gray-600 mt-1">Can create parcels, view analytics, but cannot manage billing or team</p>
                        </div>
                        <div>
                          <h5 className="font-medium text-sm text-gray-900">Viewer</h5>
                          <p className="text-xs text-gray-600 mt-1">Read-only access to parcels and analytics</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Security Settings */}
                {activeTab === 'security' && (
                  <motion.div
                    key="security"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Security Settings</h2>
                      <p className="text-gray-600">Manage your account security</p>
                    </div>

                    {/* Password Change */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900">Change Password</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Password
                          </label>
                          <input
                            id="current-password"
                            type="password"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                          </label>
                          <input
                            id="new-password"
                            type="password"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm New Password
                          </label>
                          <input
                            id="confirm-password"
                            type="password"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                          />
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          const current = (document.getElementById('current-password') as HTMLInputElement).value
                          const newPass = (document.getElementById('new-password') as HTMLInputElement).value
                          const confirm = (document.getElementById('confirm-password') as HTMLInputElement).value
                          updatePassword({ current: current, new: newPass, confirm })
                        }}
                        className="px-4 py-2 bg-pepper-500 text-white rounded-lg hover:bg-pepper-600 transition"
                      >
                        Update Password
                      </button>
                    </div>

                    {/* Two-Factor Authentication */}
                    <div className="pt-6 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                          <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={twoFactorEnabled}
                            onChange={() => setTwoFactorEnabled(!twoFactorEnabled)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        </label>
                      </div>
                      
                      {twoFactorEnabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-4 p-4 bg-gray-50 rounded-lg"
                        >
                          <p className="text-sm text-gray-600 mb-4">
                            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                          </p>
                          <div className="flex items-center space-x-6">
                            <div className="bg-white p-4 rounded-lg">
                              {/* QR Code placeholder */}
                              <div className="w-32 h-32 bg-gray-300 flex items-center justify-center text-gray-600">
                                QR
                              </div>
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm font-medium">Setup key:</p>
                              <code className="px-3 py-2 bg-gray-800 text-white rounded text-sm">
                                JBSWY3DPEHPK3PXP
                              </code>
                              <button className="text-sm text-pepper-600 hover:text-pepper-700">
                                Copy key
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Session Settings */}
                    <div className="pt-6 border-t border-gray-200">
                      <h3 className="font-medium text-gray-900 mb-4">Session Settings</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Session Timeout (minutes)
                          </label>
                          <select
                            value={sessionTimeout}
                            onChange={(e) => setSessionTimeout(e.target.value)}
                            className="px-4 py-3 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                          >
                            <option value="15">15 minutes</option>
                            <option value="30">30 minutes</option>
                            <option value="60">1 hour</option>
                            <option value="120">2 hours</option>
                            <option value="240">4 hours</option>
                          </select>
                        </div>

                        <button className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition">
                          Log out all other devices
                        </button>
                      </div>
                    </div>

                    {/* Active Sessions */}
                    <div className="pt-6 border-t border-gray-200">
                      <h3 className="font-medium text-gray-900 mb-4">Active Sessions</h3>
                      
                      <div className="space-y-3">
                        {sessions.map((session, index) => (
                          <div key={session.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Smartphone className="h-5 w-5 text-gray-500" />
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">{session.device || 'Unknown Device'}</span>
                                  {session.current && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                                      Current
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">
                                  {session.location || 'Unknown location'} • {session.ip || 'Unknown IP'}
                                </p>
                              </div>
                            </div>
                            {!session.current && (
                              <button 
                                onClick={() => revokeSession(session.id)}
                                className="text-sm text-red-600 hover:text-red-700"
                              >
                                Revoke
                              </button>
                            )}
                          </div>
                        ))}

                        {sessions.length === 0 && (
                          <div className="text-center py-6 text-gray-500">
                            No active sessions
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Billing Settings */}
                {activeTab === 'billing' && (
                  <motion.div
                    key="billing"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Billing Settings</h2>
                      <p className="text-gray-600">Manage your payment methods and billing preferences</p>
                    </div>

                    {/* Current Plan */}
                    <div className="bg-gradient-to-r from-pepper-600 to-pepper-500 rounded-xl p-6 text-white">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold">Current Plan</h3>
                          <p className="text-pepper-100">Business Pro</p>
                        </div>
                        <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Active</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-pepper-200 text-sm">Wallet Balance</div>
                          <div className="text-2xl font-bold">
                            {merchant?.billing?.walletBalance 
                              ? formatCurrency(merchant.billing.walletBalance) 
                              : formatCurrency(0)}
                          </div>
                        </div>
                        <div>
                          <div className="text-pepper-200 text-sm">Credit Limit</div>
                          <div className="text-2xl font-bold">
                            {merchant?.billing?.creditLimit 
                              ? formatCurrency(merchant.billing.creditLimit) 
                              : formatCurrency(500000)}
                          </div>
                        </div>
                      </div>
                      <button className="mt-4 px-4 py-2 bg-white text-pepper-600 rounded-lg hover:bg-gray-100 transition">
                        View Billing Details
                      </button>
                    </div>

                    {/* Payment Methods */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900">Payment Methods</h3>
                      
                      <div className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <CreditCard className="h-6 w-6 text-gray-500" />
                            <div>
                              <div className="font-medium">Paystack</div>
                              <p className="text-sm text-gray-600">Secure payments via Paystack</p>
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Default
                          </span>
                        </div>
                      </div>

                      <button className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-pepper-500 hover:bg-pepper-50 transition flex items-center justify-center space-x-2">
                        <Plus className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-600">Add Payment Method</span>
                      </button>
                    </div>

                    {/* Billing Address */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900">Billing Address</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Street Address"
                          className="px-4 py-3 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                          defaultValue={merchant?.address?.street || ''}
                        />
                        <input
                          type="text"
                          placeholder="City"
                          className="px-4 py-3 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                          defaultValue={merchant?.address?.city || ''}
                        />
                        <input
                          type="text"
                          placeholder="State"
                          className="px-4 py-3 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                          defaultValue={merchant?.address?.state || ''}
                        />
                        <input
                          type="text"
                          placeholder="Postal Code"
                          className="px-4 py-3 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                          defaultValue={merchant?.address?.postalCode || ''}
                        />
                      </div>
                    </div>

                    {/* Tax Information */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900">Tax Information</h3>
                      <input
                        type="text"
                        placeholder="Tax ID / VAT Number"
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                      />
                      <p className="text-xs text-gray-500">
                        Required for generating tax invoices
                      </p>
                    </div>

                    {/* Billing History */}
                    <div className="pt-6 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-gray-900">Billing History</h3>
                        <button className="text-sm text-pepper-600 hover:text-pepper-700">
                          View All
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        {billingHistory.map((tx, index) => (
                          <div key={tx._id || index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Receipt className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-900">
                                {new Date(tx.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4">
                              <span className="font-medium">{formatCurrency(tx.amount)}</span>
                              <span className={cn(
                                "text-xs capitalize",
                                tx.status === 'success' ? "text-green-600" :
                                tx.status === 'pending' ? "text-yellow-600" : "text-red-600"
                              )}>
                                {tx.status}
                              </span>
                              <button className="text-sm text-pepper-600 hover:text-pepper-700">
                                Download
                              </button>
                            </div>
                          </div>
                        ))}

                        {billingHistory.length === 0 && (
                          <div className="text-center py-6 text-gray-500">
                            No billing history yet
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0
  }).format(amount)
}