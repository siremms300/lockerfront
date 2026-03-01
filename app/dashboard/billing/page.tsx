// app/dashboard/billing/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  DollarSign, 
  CreditCard, 
  Receipt, 
  TrendingUp, 
  TrendingDown,
  Download,
  RefreshCw,
  Filter,
  Search,
  Eye,
  MoreVertical,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Banknote,
  Wallet,
  BarChart3,
  PieChart,
  FileText,
  Printer,
  Share2,
  Zap,
  Shield,
  Loader2,
  Copy,
  ExternalLink
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { billingAPI } from '@/lib/api'
import dynamic from 'next/dynamic'
import { format, formatDistanceToNow } from 'date-fns'

const DynamicInvoicePDF = dynamic(() => import('@/components/billing/invoice-pdf'), { ssr: false })

interface Invoice {
  _id: string
  invoiceNumber: string
  period: string
  issueDate: string
  dueDate: string
  status: 'paid' | 'pending' | 'overdue' | 'draft'
  amount: number
  paidAmount: number
  balance: number
  items: Array<{
    description: string
    quantity: number
    rate: number
    amount: number
  }>
  transactions: Array<{
    transactionId: {
      _id: string
      reference: string
      method: string
    }
    amount: number
    date: string
  }>
}

interface Transaction {
  _id: string
  type: 'credit' | 'debit'
  amount: number
  description: string
  reference: string
  paystackReference?: string
  status: 'success' | 'pending' | 'failed'
  method: 'card' | 'bank_transfer' | 'wallet' | 'cash'
  balance: number
  createdAt: string
}

interface Wallet {
  balance: number
  pendingBalance: number
  creditLimit: number
  availableCredit: number
  autoTopUp: boolean
  topUpThreshold: number
  lastTopUp?: string
  paystackAuthorization?: {
    card_type: string
    last4: string
  }
}

interface CODSummary {
  totalCOD: number
  collected: number
  pending: number
  overdue: number
  collectionRate: number
}

interface BillingStats {
  totalRevenue: number
  paidAmount: number
  pendingAmount: number
  overdueAmount: number
  walletBalance: number
  pendingBalance: number
  creditLimit: number
  availableCredit: number
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [codSummary, setCodSummary] = useState<CODSummary | null>(null)
  const [stats, setStats] = useState<BillingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'paid' | 'pending' | 'overdue' | 'draft'>('all')
  const [selectedType, setSelectedType] = useState<'all' | 'credit' | 'debit'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<'overview' | 'invoices' | 'transactions' | 'cod'>('overview')
  const [topUpAmount, setTopUpAmount] = useState<number>(5000)
  const [showTopUpModal, setShowTopUpModal] = useState(false)
  const [pagination, setPagination] = useState({
    invoices: { page: 1, limit: 20, total: 0, pages: 0 },
    transactions: { page: 1, limit: 20, total: 0, pages: 0 }
  })

  useEffect(() => {
    fetchAllData()
  }, [])

  useEffect(() => {
    if (viewMode === 'invoices') {
      fetchInvoices()
    }
  }, [selectedStatus, searchQuery, pagination.invoices.page])

  useEffect(() => {
    if (viewMode === 'transactions') {
      fetchTransactions()
    }
  }, [selectedType, pagination.transactions.page])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      const [walletRes, codRes, statsRes, invoicesRes, transactionsRes] = await Promise.all([
        billingAPI.getWallet(),
        billingAPI.getCODSummary(),
        billingAPI.getAnalytics(),
        billingAPI.getInvoices({ limit: 5 }),
        billingAPI.getTransactions({ limit: 5 })
      ])
      
      setWallet(walletRes.data)
      setCodSummary(codRes.data)
      setStats(statsRes.data)
      setInvoices(invoicesRes.data.invoices || [])
      setTransactions(transactionsRes.data.transactions || [])
      setPagination(prev => ({
        ...prev,
        invoices: invoicesRes.data.pagination || prev.invoices,
        transactions: transactionsRes.data.pagination || prev.transactions
      }))
    } catch (error: any) {
      toast.error('Failed to load billing data')
      console.error('Error fetching billing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInvoices = async () => {
    try {
      const response = await billingAPI.getInvoices({
        status: selectedStatus,
        search: searchQuery,
        page: pagination.invoices.page,
        limit: pagination.invoices.limit
      })
      setInvoices(response.data.invoices)
      setPagination(prev => ({
        ...prev,
        invoices: response.data.pagination
      }))
    } catch (error) {
      toast.error('Failed to load invoices')
    }
  }

  const fetchTransactions = async () => {
    try {
      const response = await billingAPI.getTransactions({
        type: selectedType,
        page: pagination.transactions.page,
        limit: pagination.transactions.limit
      })
      setTransactions(response.data.transactions)
      setPagination(prev => ({
        ...prev,
        transactions: response.data.pagination
      }))
    } catch (error) {
      toast.error('Failed to load transactions')
    }
  }

  const refreshData = async () => {
    setIsRefreshing(true)
    await fetchAllData()
    setIsRefreshing(false)
    toast.success('Billing data refreshed')
  }

  const handleTopUp = async () => {
    try {
      const merchant = JSON.parse(localStorage.getItem('merchant') || '{}')
      const response = await billingAPI.initializeTopUp({
        amount: topUpAmount,
        email: merchant.email
      })
      
      // Redirect to Paystack checkout
      window.location.href = response.data.authorization_url
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to initialize top-up')
    }
  }

  const handlePayInvoice = async (invoiceId: string) => {
    toast.success('Redirecting to payment...')
    // You could implement invoice payment via Paystack here
  }

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      const invoice = invoices.find(i => i._id === invoiceId)
      if (!invoice) return
      
      // Generate PDF (you'd implement this)
      toast.success('Invoice downloaded')
    } catch (error) {
      toast.error('Failed to download invoice')
    }
  }

  const getStatusIcon = (status: Invoice['status']) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'overdue': return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'draft': return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
    }
  }

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'credit': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'debit': return <TrendingDown className="h-4 w-4 text-red-500" />
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy')
  }

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy • h:mm a')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl p-4 animate-pulse h-96"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Payments</h1>
          <p className="text-gray-600">Manage invoices, payments, and wallet</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={refreshData}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            title="Refresh"
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-5 w-5 text-gray-600", isRefreshing && "animate-spin")} />
          </button>

          <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('overview')}
              className={cn(
                "px-3 py-1.5 rounded text-sm font-medium transition",
                viewMode === 'overview' ? "bg-white shadow-sm text-pepper-600" : "text-gray-600 hover:text-gray-900"
              )}
            >
              Overview
            </button>
            <button
              onClick={() => setViewMode('invoices')}
              className={cn(
                "px-3 py-1.5 rounded text-sm font-medium transition",
                viewMode === 'invoices' ? "bg-white shadow-sm text-pepper-600" : "text-gray-600 hover:text-gray-900"
              )}
            >
              Invoices
            </button>
            <button
              onClick={() => setViewMode('transactions')}
              className={cn(
                "px-3 py-1.5 rounded text-sm font-medium transition",
                viewMode === 'transactions' ? "bg-white shadow-sm text-pepper-600" : "text-gray-600 hover:text-gray-900"
              )}
            >
              Transactions
            </button>
            <button
              onClick={() => setViewMode('cod')}
              className={cn(
                "px-3 py-1.5 rounded text-sm font-medium transition",
                viewMode === 'cod' ? "bg-white shadow-sm text-pepper-600" : "text-gray-600 hover:text-gray-900"
              )}
            >
              COD
            </button>
          </div>

          <button
            onClick={() => setShowTopUpModal(true)}
            className="px-4 py-2 pepper-gradient text-white rounded-lg hover:shadow-lg transition flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Top Up Wallet</span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: 'Total Revenue', value: formatCurrency(stats?.totalRevenue || 0), icon: DollarSign, color: 'bg-blue-500' },
          { label: 'Wallet Balance', value: formatCurrency(wallet?.balance || 0), icon: Wallet, color: 'bg-green-500' },
          { label: 'Pending Payments', value: formatCurrency(stats?.pendingAmount || 0), icon: Clock, color: 'bg-yellow-500' },
          { label: 'Overdue Amount', value: formatCurrency(stats?.overdueAmount || 0), icon: AlertCircle, color: 'bg-red-500' },
          { label: 'COD Collected', value: formatCurrency(codSummary?.collected || 0), icon: Banknote, color: 'bg-emerald-500' },
          { label: 'Paid Amount', value: formatCurrency(stats?.paidAmount || 0), icon: CheckCircle, color: 'bg-purple-500' },
        ].map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-soft p-4 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
                <div className={`p-2 ${stat.color} rounded-lg`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Main Content - Overview */}
      {viewMode === 'overview' && wallet && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Wallet Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Wallet Summary</h3>
                  <p className="text-gray-600">Current balance and credit information</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-gray-100 rounded">
                    <Eye className="h-4 w-4 text-gray-500" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded">
                    <MoreVertical className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Current Balance */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <Wallet className="h-8 w-8" />
                    <Zap className="h-6 w-6" />
                  </div>
                  <div className="text-3xl font-bold mb-2">{formatCurrency(wallet.balance)}</div>
                  <div className="text-blue-100">Available Balance</div>
                  {wallet.lastTopUp && (
                    <div className="text-sm text-blue-200 mt-2">
                      Last top-up: {formatDistanceToNow(new Date(wallet.lastTopUp), { addSuffix: true })}
                    </div>
                  )}
                </div>

                {/* Credit Information */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Credit Limit</div>
                    <div className="text-xl font-bold text-gray-900">{formatCurrency(wallet.creditLimit)}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Available Credit</div>
                    <div className="text-xl font-bold text-gray-900">{formatCurrency(wallet.availableCredit)}</div>
                  </div>
                </div>

                {/* Pending & Settings */}
                <div className="space-y-4">
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="text-sm text-yellow-700">Pending Balance</div>
                    <div className="text-xl font-bold text-yellow-800">{formatCurrency(wallet.pendingBalance)}</div>
                    <div className="text-xs text-yellow-600 mt-1">Awaiting settlement</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Auto Top-up</div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {wallet.autoTopUp ? 'Enabled' : 'Disabled'}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={wallet.autoTopUp}
                          onChange={async () => {
                            try {
                              const newState = !wallet.autoTopUp
                              await billingAPI.setupAutoTopUp({
                                enabled: newState,
                                threshold: wallet.topUpThreshold
                              })
                              setWallet(prev => prev ? { ...prev, autoTopUp: newState } : null)
                              toast.success(`Auto top-up ${newState ? 'enabled' : 'disabled'}`)
                            } catch (error) {
                              toast.error('Failed to update auto top-up')
                            }
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </div>
                    {wallet.autoTopUp && (
                      <div className="text-xs text-gray-600 mt-2">
                        Threshold: {formatCurrency(wallet.topUpThreshold)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Paystack Card Info */}
              {wallet.paystackAuthorization && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        Saved Card: {wallet.paystackAuthorization.card_type} •••• {wallet.paystackAuthorization.last4}
                      </span>
                    </div>
                    <span className="text-xs text-green-600">Default payment method</span>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                <button 
                  onClick={() => setShowTopUpModal(true)}
                  className="p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition flex flex-col items-center justify-center"
                >
                  <Plus className="h-5 w-5 mb-1" />
                  <span className="text-sm font-medium">Top Up</span>
                </button>
                <button className="p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition flex flex-col items-center justify-center">
                  <Download className="h-5 w-5 mb-1" />
                  <span className="text-sm font-medium">Withdraw</span>
                </button>
                <button className="p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition flex flex-col items-center justify-center">
                  <Receipt className="h-5 w-5 mb-1" />
                  <span className="text-sm font-medium">Statements</span>
                </button>
                <button className="p-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition flex flex-col items-center justify-center">
                  <BarChart3 className="h-5 w-5 mb-1" />
                  <span className="text-sm font-medium">Analytics</span>
                </button>
              </div>
            </div>

            {/* Recent Invoices */}
            <div className="mt-6 bg-white rounded-xl shadow-soft p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Recent Invoices</h3>
                  <p className="text-gray-600">Latest billing statements</p>
                </div>
                <button 
                  onClick={() => setViewMode('invoices')}
                  className="text-pepper-600 hover:text-pepper-700 font-medium"
                >
                  View All
                </button>
              </div>

              <div className="space-y-4">
                {invoices.slice(0, 3).map(invoice => (
                  <div key={invoice._id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{invoice.invoiceNumber}</div>
                        <div className="text-sm text-gray-600">{invoice.period}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">{formatCurrency(invoice.amount)}</div>
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          getStatusColor(invoice.status)
                        )}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <div className="text-gray-600">
                        Issued: {formatDate(invoice.issueDate)} • Due: {formatDate(invoice.dueDate)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => setSelectedInvoice(invoice._id)}
                          className="text-pepper-600 hover:text-pepper-700"
                        >
                          View
                        </button>
                        <button 
                          onClick={() => handleDownloadInvoice(invoice._id)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* COD Summary */}
            {codSummary && (
              <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <Banknote className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">COD Summary</h3>
                    <p className="text-gray-600">Cash on Delivery tracking</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700">Total COD</span>
                      <span className="font-bold">{formatCurrency(codSummary.totalCOD)}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700">Collected</span>
                      <span className="font-bold text-green-600">{formatCurrency(codSummary.collected)}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${codSummary.collectionRate}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700">Pending</span>
                      <span className="font-bold text-yellow-600">{formatCurrency(codSummary.pending)}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500 transition-all duration-300"
                        style={{ width: codSummary.totalCOD > 0 ? `${(codSummary.pending / codSummary.totalCOD) * 100}%` : 0 }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700">Overdue</span>
                      <span className="font-bold text-red-600">{formatCurrency(codSummary.overdue)}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 transition-all duration-300"
                        style={{ width: codSummary.totalCOD > 0 ? `${(codSummary.overdue / codSummary.totalCOD) * 100}%` : 0 }}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{codSummary.collectionRate.toFixed(1)}%</div>
                      <div className="text-sm text-gray-600">Collection Rate</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Methods */}
            <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">Payment Methods</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="font-medium text-gray-900">Paystack</div>
                      <div className="text-sm text-gray-600">
                        {wallet?.paystackAuthorization 
                          ? `${wallet.paystackAuthorization.card_type} •••• ${wallet.paystackAuthorization.last4}`
                          : 'No card saved'}
                      </div>
                    </div>
                  </div>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-xs font-medium",
                    wallet?.paystackAuthorization ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  )}>
                    {wallet?.paystackAuthorization ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded">
                  <div className="flex items-center space-x-3">
                    <Banknote className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="font-medium text-gray-900">Bank Transfer</div>
                      <div className="text-sm text-gray-600">Manual top-up</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                    Available
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowTopUpModal(true)}
                className="w-full mt-4 p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                + Add Payment Method
              </button>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-r from-pepper-600 to-pepper-500 rounded-xl p-6 text-white">
              <h3 className="font-bold mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-pepper-200">Avg. Invoice Amount</span>
                  <span>{invoices.length > 0 ? formatCurrency(stats.totalRevenue / invoices.length) : formatCurrency(0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-pepper-200">On-time Payments</span>
                  <span>87%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-pepper-200">Pending Settlements</span>
                  <span>{formatCurrency(wallet.pendingBalance)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-pepper-200">Payment Success Rate</span>
                  <span>94%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoices View */}
      {viewMode === 'invoices' && (
        <div className="bg-white rounded-xl shadow-soft overflow-hidden border border-gray-200">
          {/* Toolbar */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <Filter className="h-5 w-5 text-gray-500" />
                <select
                  className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20 focus:outline-none transition"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search invoices by number..."
                  className="pl-10 pr-4 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20 focus:outline-none transition w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
                <button className="px-4 py-2 bg-pepper-500 text-white rounded-lg hover:bg-pepper-600 transition flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>New Invoice</span>
                </button>
              </div>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <AnimatePresence>
                  {invoices.map(invoice => (
                    <motion.tr
                      key={invoice._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{invoice.invoiceNumber}</div>
                        <div className="text-sm text-gray-500">Issued: {formatDate(invoice.issueDate)}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-gray-700">{invoice.period}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className={cn(
                          "font-medium",
                          invoice.status === 'overdue' ? "text-red-600" : "text-gray-700"
                        )}>
                          {formatDate(invoice.dueDate)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{formatCurrency(invoice.amount)}</div>
                        <div className="text-sm text-gray-500">
                          Paid: {formatCurrency(invoice.paidAmount)} • Balance: {formatCurrency(invoice.balance)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-medium inline-flex items-center space-x-1",
                          getStatusColor(invoice.status)
                        )}>
                          {getStatusIcon(invoice.status)}
                          <span>{invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedInvoice(invoice._id)}
                            className="p-1 hover:bg-gray-100 rounded transition"
                            title="View"
                          >
                            <Eye className="h-4 w-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDownloadInvoice(invoice._id)}
                            className="p-1 hover:bg-gray-100 rounded transition"
                            title="Download"
                          >
                            <Download className="h-4 w-4 text-gray-600" />
                          </button>
                          {invoice.status !== 'paid' && (
                            <button
                              onClick={() => handlePayInvoice(invoice._id)}
                              className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
                            >
                              Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {invoices.length === 0 && (
            <div className="p-12 text-center">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
              <p className="text-gray-600">
                {searchQuery || selectedStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No invoices have been generated yet'
                }
              </p>
            </div>
          )}

          {/* Pagination */}
          {pagination.invoices.pages > 1 && (
            <div className="p-6 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {pagination.invoices.page} of {pagination.invoices.pages}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPagination(prev => ({
                    ...prev,
                    invoices: { ...prev.invoices, page: prev.invoices.page - 1 }
                  }))}
                  disabled={pagination.invoices.page === 1}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({
                    ...prev,
                    invoices: { ...prev.invoices, page: prev.invoices.page + 1 }
                  }))}
                  disabled={pagination.invoices.page === pagination.invoices.pages}
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transactions View */}
      {viewMode === 'transactions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transactions List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-soft overflow-hidden border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Transaction History</h3>
                    <p className="text-gray-600">All wallet transactions</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Filter className="h-5 w-5 text-gray-500" />
                      <select
                        className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20 focus:outline-none transition"
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value as any)}
                      >
                        <option value="all">All Types</option>
                        <option value="credit">Credits</option>
                        <option value="debit">Debits</option>
                      </select>
                    </div>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center space-x-2">
                      <Download className="h-4 w-4" />
                      <span>Export</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {transactions.map(transaction => (
                  <div key={transaction._id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={cn(
                          "p-3 rounded-lg",
                          transaction.type === 'credit' ? "bg-green-100" : "bg-red-100"
                        )}>
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{transaction.description}</div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>{formatDateTime(transaction.createdAt)}</span>
                            <span>•</span>
                            <span>Ref: {transaction.reference.slice(0, 8)}...</span>
                            {transaction.paystackReference && (
                              <button
                                onClick={() => copyToClipboard(transaction.paystackReference!)}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={cn(
                          "text-lg font-bold",
                          transaction.type === 'credit' ? "text-green-600" : "text-red-600"
                        )}>
                          {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </div>
                        <div className="flex items-center justify-end space-x-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium",
                            transaction.status === 'success' ? "bg-green-100 text-green-800" :
                            transaction.status === 'pending' ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          )}>
                            {transaction.status}
                          </span>
                          <span className="text-sm text-gray-600 capitalize">
                            {transaction.method.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-600">
                      Balance after transaction: {formatCurrency(transaction.balance)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Transaction Summary */}
            <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">Transaction Summary</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Total Credits</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(transactions
                      .filter(t => t.type === 'credit' && t.status === 'success')
                      .reduce((sum, t) => sum + t.amount, 0))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Total Debits</span>
                  <span className="font-bold text-red-600">
                    {formatCurrency(transactions
                      .filter(t => t.type === 'debit' && t.status === 'success')
                      .reduce((sum, t) => sum + t.amount, 0))}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <span className="text-gray-900 font-medium">Net Flow</span>
                  <span className={cn(
                    "text-lg font-bold",
                    (wallet?.balance || 0) >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {(wallet?.balance || 0) >= 0 ? '+' : ''}{formatCurrency(wallet?.balance || 0)}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">By Payment Method</h4>
                <div className="space-y-2">
                  {['card', 'bank_transfer', 'wallet', 'cash'].map(method => {
                    const total = transactions
                      .filter(t => t.method === method && t.status === 'success')
                      .reduce((sum, t) => sum + t.amount, 0)
                    if (total === 0) return null
                    return (
                      <div key={method} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 capitalize">{method.replace('_', ' ')}</span>
                        <span className="font-medium">{formatCurrency(total)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Recent Settlements */}
            <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">Recent Settlements</h3>
              <div className="space-y-3">
                {transactions
                  .filter(t => t.type === 'credit' && t.status === 'pending')
                  .slice(0, 4)
                  .map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <div>
                        <div className="font-medium text-gray-900">{formatDate(transaction.createdAt)}</div>
                        <div className="text-sm text-gray-600 capitalize">{transaction.status}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(transaction.amount)}</div>
                        <div className="text-xs text-yellow-600">Pending</div>
                      </div>
                    </div>
                  ))}
                {transactions.filter(t => t.type === 'credit' && t.status === 'pending').length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No pending settlements</p>
                )}
              </div>
            </div>

            {/* Payment Actions */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-6 text-white">
              <h3 className="font-bold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => setShowTopUpModal(true)}
                  className="w-full px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition font-medium text-sm"
                >
                  Top Up Wallet
                </button>
                <button className="w-full px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition font-medium text-sm">
                  Request Payout
                </button>
                <button className="w-full px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition font-medium text-sm">
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COD Management View */}
      {viewMode === 'cod' && codSummary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COD Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">COD Management</h3>
                  <p className="text-gray-600">Track and reconcile cash on delivery payments</p>
                </div>
                <button className="px-4 py-2 pepper-gradient text-white rounded-lg hover:shadow-lg transition flex items-center space-x-2">
                  <Banknote className="h-4 w-4" />
                  <span>Initiate Settlement</span>
                </button>
              </div>

              {/* COD Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total COD', value: formatCurrency(codSummary.totalCOD), color: 'bg-blue-500' },
                  { label: 'Collected', value: formatCurrency(codSummary.collected), color: 'bg-green-500' },
                  { label: 'Pending', value: formatCurrency(codSummary.pending), color: 'bg-yellow-500' },
                  { label: 'Overdue', value: formatCurrency(codSummary.overdue), color: 'bg-red-500' },
                ].map((stat, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                    <div className={`h-1 ${stat.color} rounded-full mt-2`} />
                  </div>
                ))}
              </div>

              {/* COD Transactions */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Recent COD Transactions</h4>
                {/* You'd fetch these from your parcels with COD */}
                <p className="text-gray-500 text-center py-8">COD transaction history coming soon</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Settlement Schedule */}
            <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">Settlement Schedule</h3>
              <div className="space-y-3">
                {[
                  { period: 'Daily', next: 'Today 6 PM', amount: formatCurrency(codSummary.collected) },
                  { period: 'Weekly', next: 'Friday', amount: formatCurrency(codSummary.collected * 7) },
                  { period: 'Monthly', next: 'Apr 1', amount: formatCurrency(codSummary.collected * 30) },
                ].map((schedule, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-900">{schedule.period}</div>
                      <div className="text-sm text-gray-600">Next: {schedule.next}</div>
                    </div>
                    <div className="text-lg font-bold">{schedule.amount}</div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                Configure Schedule
              </button>
            </div>

            {/* COD Actions */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl p-6 text-white">
              <h3 className="font-bold mb-4">COD Actions</h3>
              <div className="space-y-3">
                <button className="w-full px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition font-medium text-sm">
                  Send Collection Reminders
                </button>
                <button className="w-full px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition font-medium text-sm">
                  Generate COD Report
                </button>
                <button className="w-full px-4 py-2 bg-white text-emerald-600 rounded-lg hover:bg-gray-100 transition font-medium text-sm">
                  Export All Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Up Modal */}
      <AnimatePresence>
        {showTopUpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto"
            onClick={() => setShowTopUpModal(false)}
          >
            <div className="flex items-center justify-center min-h-screen p-4">
              <div className="fixed inset-0 bg-black/50" />
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold mb-4">Top Up Wallet</h3>
                <p className="text-gray-600 mb-6">Enter amount to add to your wallet</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Amount (₦)</label>
                    <input
                      type="number"
                      min="1000"
                      step="1000"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(Number(e.target.value))}
                      className="w-full px-4 py-3 border rounded-lg focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20"
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum: ₦1,000</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[5000, 10000, 20000, 50000, 100000, 200000].map(amount => (
                      <button
                        key={amount}
                        onClick={() => setTopUpAmount(amount)}
                        className="p-2 border rounded hover:bg-gray-50 transition text-sm"
                      >
                        ₦{amount.toLocaleString()}
                      </button>
                    ))}
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      You'll be redirected to Paystack's secure payment page to complete your transaction.
                    </p>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => setShowTopUpModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleTopUp}
                      className="flex-1 px-4 py-2 pepper-gradient text-white rounded-lg hover:shadow-lg transition"
                    >
                      Proceed to Paystack
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Invoice Modal */}
      <AnimatePresence>
        {selectedInvoice && (() => {
          const invoice = invoices.find(inv => inv._id === selectedInvoice)
          if (!invoice) return null

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 overflow-y-auto"
            >
              <div className="flex items-center justify-center min-h-screen p-4">
                <div className="fixed inset-0 bg-black/50" onClick={() => setSelectedInvoice(null)} />
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl">
                  <DynamicInvoicePDF invoice={invoice} onClose={() => setSelectedInvoice(null)} />
                </div>
              </div>
            </motion.div>
          )
        })()}
      </AnimatePresence>
    </div>
  )
}
























































































// // app/dashboard/billing/page.tsx
// 'use client'

// import { useState, useEffect } from 'react'
// import { 
//   DollarSign, 
//   CreditCard, 
//   Receipt, 
//   TrendingUp, 
//   TrendingDown,
//   Download,
//   RefreshCw,
//   Filter,
//   Search,
//   Eye,
//   MoreVertical,
//   Plus,
//   Calendar,
//   Clock,
//   CheckCircle,
//   XCircle,
//   AlertCircle,
//   Banknote,
//   Wallet,
//   BarChart3,
//   PieChart,
//   FileText,
//   Printer,
//   Share2,
//   Zap,
//   Shield
// } from 'lucide-react'
// import { motion, AnimatePresence } from 'framer-motion'
// import { toast } from 'react-hot-toast'
// import { cn } from '@/lib/utils'
// import dynamic from 'next/dynamic'

// const DynamicInvoicePDF = dynamic(() => import('@/components/billing/invoice-pdf'), { ssr: false })

// interface Invoice {
//   id: string
//   invoiceNumber: string
//   customerId: string
//   customerName: string
//   period: string
//   issueDate: string
//   dueDate: string
//   status: 'paid' | 'pending' | 'overdue' | 'draft'
//   amount: number
//   paidAmount: number
//   balance: number
//   items: Array<{
//     description: string
//     quantity: number
//     rate: number
//     amount: number
//   }>
//   transactions: Array<{
//     id: string
//     date: string
//     amount: number
//     method: 'card' | 'bank_transfer' | 'wallet' | 'cash'
//     reference: string
//     status: 'success' | 'pending' | 'failed'
//   }>
// }

// interface Transaction {
//   id: string
//   date: string
//   type: 'credit' | 'debit'
//   amount: number
//   description: string
//   reference: string
//   status: 'completed' | 'pending' | 'failed'
//   method: 'card' | 'bank_transfer' | 'wallet' | 'cash'
//   balance: number
// }

// interface Wallet {
//   balance: number
//   pendingBalance: number
//   creditLimit: number
//   availableCredit: number
//   autoTopUp: boolean
//   topUpThreshold: number
//   lastTopUp: string
// }

// interface CODSummary {
//   totalCOD: number
//   collected: number
//   pending: number
//   overdue: number
//   collectionRate: number
// }

// export default function BillingPage() {
//   const [invoices, setInvoices] = useState<Invoice[]>([
//     {
//       id: '1',
//       invoiceNumber: 'INV-2024-001',
//       customerId: '1',
//       customerName: 'TechGadgets NG',
//       period: 'January 2024',
//       issueDate: '2024-01-01',
//       dueDate: '2024-01-31',
//       status: 'paid',
//       amount: 125000,
//       paidAmount: 125000,
//       balance: 0,
//       items: [
//         { description: 'Smart Locker Usage (50 parcels)', quantity: 50, rate: 1500, amount: 75000 },
//         { description: 'Staffed Hub Service Fee', quantity: 1, rate: 25000, amount: 25000 },
//         { description: 'SMS Notifications (200 messages)', quantity: 200, rate: 25, amount: 5000 },
//         { description: 'WhatsApp API Calls', quantity: 100, rate: 20, amount: 2000 },
//       ],
//       transactions: [
//         { id: 'T1', date: '2024-01-15', amount: 125000, method: 'bank_transfer', reference: 'TRX-001234', status: 'success' }
//       ]
//     },
//     {
//       id: '2',
//       invoiceNumber: 'INV-2024-002',
//       customerId: '1',
//       customerName: 'TechGadgets NG',
//       period: 'February 2024',
//       issueDate: '2024-02-01',
//       dueDate: '2024-02-28',
//       status: 'pending',
//       amount: 142500,
//       paidAmount: 50000,
//       balance: 92500,
//       items: [
//         { description: 'Smart Locker Usage (65 parcels)', quantity: 65, rate: 1500, amount: 97500 },
//         { description: 'Staffed Hub Service Fee', quantity: 1, rate: 25000, amount: 25000 },
//         { description: 'SMS Notifications (250 messages)', quantity: 250, rate: 25, amount: 6250 },
//         { description: 'WhatsApp API Calls', quantity: 150, rate: 20, amount: 3000 },
//         { description: 'COD Collection Fee', quantity: 1, rate: 10750, amount: 10750 },
//       ],
//       transactions: [
//         { id: 'T2', date: '2024-02-10', amount: 50000, method: 'wallet', reference: 'TRX-001235', status: 'success' }
//       ]
//     },
//     {
//       id: '3',
//       invoiceNumber: 'INV-2024-003',
//       customerId: '2',
//       customerName: 'FashionHub Africa',
//       period: 'January 2024',
//       issueDate: '2024-01-01',
//       dueDate: '2024-01-31',
//       status: 'overdue',
//       amount: 87500,
//       paidAmount: 0,
//       balance: 87500,
//       items: [
//         { description: 'Smart Locker Usage (35 parcels)', quantity: 35, rate: 1500, amount: 52500 },
//         { description: 'SMS Notifications (100 messages)', quantity: 100, rate: 25, amount: 2500 },
//         { description: 'COD Collection Fee', quantity: 1, rate: 32500, amount: 32500 },
//       ],
//       transactions: []
//     },
//     {
//       id: '4',
//       invoiceNumber: 'INV-2024-004',
//       customerId: '3',
//       customerName: 'GadgetZone Ltd',
//       period: 'February 2024',
//       issueDate: '2024-02-01',
//       dueDate: '2024-02-28',
//       status: 'draft',
//       amount: 68500,
//       paidAmount: 0,
//       balance: 68500,
//       items: [
//         { description: 'Smart Locker Usage (28 parcels)', quantity: 28, rate: 1500, amount: 42000 },
//         { description: 'SMS Notifications (80 messages)', quantity: 80, rate: 25, amount: 2000 },
//         { description: 'WhatsApp API Calls', quantity: 75, rate: 20, amount: 1500 },
//         { description: 'COD Collection Fee', quantity: 1, rate: 23000, amount: 23000 },
//       ],
//       transactions: []
//     },
//     {
//       id: '5',
//       invoiceNumber: 'INV-2024-005',
//       customerId: '1',
//       customerName: 'TechGadgets NG',
//       period: 'March 2024',
//       issueDate: '2024-03-01',
//       dueDate: '2024-03-31',
//       status: 'pending',
//       amount: 168000,
//       paidAmount: 0,
//       balance: 168000,
//       items: [
//         { description: 'Smart Locker Usage (85 parcels)', quantity: 85, rate: 1500, amount: 127500 },
//         { description: 'Staffed Hub Service Fee', quantity: 1, rate: 25000, amount: 25000 },
//         { description: 'SMS Notifications (300 messages)', quantity: 300, rate: 25, amount: 7500 },
//         { description: 'WhatsApp API Calls', quantity: 200, rate: 20, amount: 4000 },
//         { description: 'COD Collection Fee', quantity: 1, rate: 8000, amount: 8000 },
//       ],
//       transactions: []
//     }
//   ])

//   const [transactions, setTransactions] = useState<Transaction[]>([
//     { id: '1', date: '2024-03-15', type: 'credit', amount: 50000, description: 'Wallet Top-up', reference: 'TRX-001236', status: 'completed', method: 'bank_transfer', balance: 150000 },
//     { id: '2', date: '2024-03-14', type: 'debit', amount: 2500, description: 'SMS Notifications', reference: 'TRX-001237', status: 'completed', method: 'wallet', balance: 100000 },
//     { id: '3', date: '2024-03-13', type: 'debit', amount: 1500, description: 'WhatsApp API Calls', reference: 'TRX-001238', status: 'completed', method: 'wallet', balance: 102500 },
//     { id: '4', date: '2024-03-12', type: 'credit', amount: 125000, description: 'COD Collection', reference: 'TRX-001239', status: 'pending', method: 'cash', balance: 104000 },
//     { id: '5', date: '2024-03-11', type: 'debit', amount: 75000, description: 'Locker Usage Fee', reference: 'TRX-001240', status: 'completed', method: 'wallet', balance: 104000 },
//     { id: '6', date: '2024-03-10', type: 'credit', amount: 100000, description: 'Wallet Top-up', reference: 'TRX-001241', status: 'completed', method: 'card', balance: 179000 },
//     { id: '7', date: '2024-03-09', type: 'debit', amount: 25000, description: 'Staffed Hub Fee', reference: 'TRX-001242', status: 'completed', method: 'wallet', balance: 79000 },
//     { id: '8', date: '2024-03-08', type: 'debit', amount: 10750, description: 'COD Collection Fee', reference: 'TRX-001243', status: 'failed', method: 'wallet', balance: 104000 },
//   ])

//   const [wallet, setWallet] = useState<Wallet>({
//     balance: 150000,
//     pendingBalance: 125000,
//     creditLimit: 500000,
//     availableCredit: 350000,
//     autoTopUp: true,
//     topUpThreshold: 50000,
//     lastTopUp: '2024-03-15'
//   })

//   const [codSummary, setCodSummary] = useState<CODSummary>({
//     totalCOD: 450000,
//     collected: 325000,
//     pending: 125000,
//     overdue: 25000,
//     collectionRate: 72.2
//   })

//   const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null)
//   const [selectedStatus, setSelectedStatus] = useState<'all' | 'paid' | 'pending' | 'overdue' | 'draft'>('all')
//   const [selectedType, setSelectedType] = useState<'all' | 'credit' | 'debit'>('all')
//   const [searchQuery, setSearchQuery] = useState('')
//   const [isLoading, setIsLoading] = useState(false)
//   const [viewMode, setViewMode] = useState<'overview' | 'invoices' | 'transactions' | 'cod'>('overview')
//   const [showInvoiceModal, setShowInvoiceModal] = useState(false)

//   // Filter invoices based on selections
//   const filteredInvoices = invoices.filter(invoice => {
//     const matchesStatus = selectedStatus === 'all' || invoice.status === selectedStatus
//     const matchesSearch = searchQuery === '' || 
//       invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       invoice.customerName.toLowerCase().includes(searchQuery.toLowerCase())
//     return matchesStatus && matchesSearch
//   })

//   // Filter transactions based on selections
//   const filteredTransactions = transactions.filter(transaction => {
//     const matchesType = selectedType === 'all' || transaction.type === selectedType
//     return matchesType
//   })

//   const refreshData = async () => {
//     setIsLoading(true)
//     setTimeout(() => {
//       setIsLoading(false)
//       toast.success('Billing data refreshed')
//     }, 1000)
//   }

//   const getStatusIcon = (status: Invoice['status']) => {
//     switch (status) {
//       case 'paid': return <CheckCircle className="h-4 w-4 text-green-500" />
//       case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />
//       case 'overdue': return <AlertCircle className="h-4 w-4 text-red-500" />
//       case 'draft': return <FileText className="h-4 w-4 text-gray-500" />
//     }
//   }

//   const getStatusColor = (status: Invoice['status']) => {
//     switch (status) {
//       case 'paid': return 'bg-green-100 text-green-800'
//       case 'pending': return 'bg-yellow-100 text-yellow-800'
//       case 'overdue': return 'bg-red-100 text-red-800'
//       case 'draft': return 'bg-gray-100 text-gray-800'
//     }
//   }

//   const getTransactionIcon = (type: Transaction['type']) => {
//     switch (type) {
//       case 'credit': return <TrendingUp className="h-4 w-4 text-green-500" />
//       case 'debit': return <TrendingDown className="h-4 w-4 text-red-500" />
//     }
//   }

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       month: 'short',
//       day: 'numeric',
//       year: 'numeric'
//     })
//   }

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat('en-NG', {
//       style: 'currency',
//       currency: 'NGN',
//       minimumFractionDigits: 0
//     }).format(amount)
//   }

//   const handlePayInvoice = (invoiceId: string) => {
//     toast.success('Payment initiated for invoice')
//     // In real app, this would trigger payment gateway
//   }

//   const handleDownloadInvoice = (invoiceId: string) => {
//     toast.success('Invoice downloaded')
//     // In real app, this would generate PDF
//   }

//   const handleTopUpWallet = () => {
//     toast.success('Wallet top-up initiated')
//     // In real app, this would open payment modal
//   }

//   const stats = {
//     totalRevenue: invoices.reduce((sum, inv) => sum + inv.amount, 0),
//     paidAmount: invoices.reduce((sum, inv) => sum + inv.paidAmount, 0),
//     pendingAmount: invoices.reduce((sum, inv) => sum + inv.balance, 0),
//     overdueAmount: invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.balance, 0),
//     walletBalance: wallet.balance,
//     codCollected: codSummary.collected
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Billing & Payments</h1>
//           <p className="text-gray-600">Manage invoices, payments, and wallet</p>
//         </div>

//         <div className="flex items-center space-x-3">
//           <button
//             onClick={refreshData}
//             className="p-2 hover:bg-gray-100 rounded-lg transition"
//             title="Refresh"
//           >
//             <RefreshCw className={cn("h-5 w-5 text-gray-600", isLoading && "animate-spin")} />
//           </button>

//           <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
//             <button
//               onClick={() => setViewMode('overview')}
//               className={cn(
//                 "px-3 py-1.5 rounded text-sm font-medium transition",
//                 viewMode === 'overview' ? "bg-white shadow-sm text-pepper-600" : "text-gray-600 hover:text-gray-900"
//               )}
//             >
//               Overview
//             </button>
//             <button
//               onClick={() => setViewMode('invoices')}
//               className={cn(
//                 "px-3 py-1.5 rounded text-sm font-medium transition",
//                 viewMode === 'invoices' ? "bg-white shadow-sm text-pepper-600" : "text-gray-600 hover:text-gray-900"
//               )}
//             >
//               Invoices
//             </button>
//             <button
//               onClick={() => setViewMode('transactions')}
//               className={cn(
//                 "px-3 py-1.5 rounded text-sm font-medium transition",
//                 viewMode === 'transactions' ? "bg-white shadow-sm text-pepper-600" : "text-gray-600 hover:text-gray-900"
//               )}
//             >
//               Transactions
//             </button>
//             <button
//               onClick={() => setViewMode('cod')}
//               className={cn(
//                 "px-3 py-1.5 rounded text-sm font-medium transition",
//                 viewMode === 'cod' ? "bg-white shadow-sm text-pepper-600" : "text-gray-600 hover:text-gray-900"
//               )}
//             >
//               COD
//             </button>
//           </div>

//           <button
//             onClick={handleTopUpWallet}
//             className="px-4 py-2 pepper-gradient text-white rounded-lg hover:shadow-lg transition flex items-center space-x-2"
//           >
//             <Plus className="h-4 w-4" />
//             <span>Top Up Wallet</span>
//           </button>
//         </div>
//       </div>

//       {/* Stats Bar */}
//       <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
//         {[
//           { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'bg-blue-500' },
//           { label: 'Wallet Balance', value: formatCurrency(stats.walletBalance), icon: Wallet, color: 'bg-green-500' },
//           { label: 'Pending Payments', value: formatCurrency(stats.pendingAmount), icon: Clock, color: 'bg-yellow-500' },
//           { label: 'Overdue Amount', value: formatCurrency(stats.overdueAmount), icon: AlertCircle, color: 'bg-red-500' },
//           { label: 'COD Collected', value: formatCurrency(stats.codCollected), icon: Banknote, color: 'bg-emerald-500' },
//           { label: 'Paid Amount', value: formatCurrency(stats.paidAmount), icon: CheckCircle, color: 'bg-purple-500' },
//         ].map((stat, index) => {
//           const Icon = stat.icon
//           return (
//             <motion.div
//               key={stat.label}
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: index * 0.1 }}
//               className="bg-white rounded-xl shadow-soft p-4 border border-gray-200"
//             >
//               <div className="flex items-center justify-between">
//                 <div>
//                   <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
//                   <div className="text-sm text-gray-500">{stat.label}</div>
//                 </div>
//                 <div className={`p-2 ${stat.color} rounded-lg`}>
//                   <Icon className="h-5 w-5 text-white" />
//                 </div>
//               </div>
//             </motion.div>
//           )
//         })}
//       </div>

//       {/* Main Content - Overview */}
//       {viewMode === 'overview' && (
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Wallet Summary */}
//           <div className="lg:col-span-2">
//             <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
//               <div className="flex items-center justify-between mb-6">
//                 <div>
//                   <h3 className="text-lg font-bold text-gray-900">Wallet Summary</h3>
//                   <p className="text-gray-600">Current balance and credit information</p>
//                 </div>
//                 <div className="flex items-center space-x-2">
//                   <button className="p-2 hover:bg-gray-100 rounded">
//                     <Eye className="h-4 w-4 text-gray-500" />
//                   </button>
//                   <button className="p-2 hover:bg-gray-100 rounded">
//                     <MoreVertical className="h-4 w-4 text-gray-500" />
//                   </button>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//                 {/* Current Balance */}
//                 <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
//                   <div className="flex items-center justify-between mb-4">
//                     <Wallet className="h-8 w-8" />
//                     <Zap className="h-6 w-6" />
//                   </div>
//                   <div className="text-3xl font-bold mb-2">{formatCurrency(wallet.balance)}</div>
//                   <div className="text-blue-100">Available Balance</div>
//                   <div className="text-sm text-blue-200 mt-2">
//                     {wallet.autoTopUp ? 'Auto top-up enabled' : 'Auto top-up disabled'}
//                   </div>
//                 </div>

//                 {/* Credit Information */}
//                 <div className="space-y-4">
//                   <div className="bg-gray-50 p-4 rounded-lg">
//                     <div className="text-sm text-gray-600">Credit Limit</div>
//                     <div className="text-xl font-bold text-gray-900">{formatCurrency(wallet.creditLimit)}</div>
//                   </div>
//                   <div className="bg-gray-50 p-4 rounded-lg">
//                     <div className="text-sm text-gray-600">Available Credit</div>
//                     <div className="text-xl font-bold text-gray-900">{formatCurrency(wallet.availableCredit)}</div>
//                   </div>
//                 </div>

//                 {/* Pending & Settings */}
//                 <div className="space-y-4">
//                   <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
//                     <div className="text-sm text-yellow-700">Pending Balance</div>
//                     <div className="text-xl font-bold text-yellow-800">{formatCurrency(wallet.pendingBalance)}</div>
//                     <div className="text-xs text-yellow-600 mt-1">Awaiting settlement</div>
//                   </div>
//                   <div className="bg-gray-50 p-4 rounded-lg">
//                     <div className="text-sm text-gray-600">Auto Top-up</div>
//                     <div className="flex items-center justify-between">
//                       <span className="font-medium">
//                         {wallet.autoTopUp ? 'Enabled' : 'Disabled'}
//                       </span>
//                       <label className="relative inline-flex items-center cursor-pointer">
//                         <input
//                           type="checkbox"
//                           checked={wallet.autoTopUp}
//                           onChange={() => setWallet(prev => ({ ...prev, autoTopUp: !prev.autoTopUp }))}
//                           className="sr-only peer"
//                         />
//                         <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
//                       </label>
//                     </div>
//                     {wallet.autoTopUp && (
//                       <div className="text-xs text-gray-600 mt-2">
//                         Threshold: {formatCurrency(wallet.topUpThreshold)}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Quick Actions */}
//               <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
//                 <button className="p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition flex flex-col items-center justify-center">
//                   <Plus className="h-5 w-5 mb-1" />
//                   <span className="text-sm font-medium">Top Up</span>
//                 </button>
//                 <button className="p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition flex flex-col items-center justify-center">
//                   <Download className="h-5 w-5 mb-1" />
//                   <span className="text-sm font-medium">Withdraw</span>
//                 </button>
//                 <button className="p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition flex flex-col items-center justify-center">
//                   <Receipt className="h-5 w-5 mb-1" />
//                   <span className="text-sm font-medium">Statements</span>
//                 </button>
//                 <button className="p-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition flex flex-col items-center justify-center">
//                   <BarChart3 className="h-5 w-5 mb-1" />
//                   <span className="text-sm font-medium">Analytics</span>
//                 </button>
//               </div>
//             </div>

//             {/* Recent Invoices */}
//             <div className="mt-6 bg-white rounded-xl shadow-soft p-6 border border-gray-200">
//               <div className="flex items-center justify-between mb-6">
//                 <div>
//                   <h3 className="text-lg font-bold text-gray-900">Recent Invoices</h3>
//                   <p className="text-gray-600">Latest billing statements</p>
//                 </div>
//                 <a href="#" className="text-pepper-600 hover:text-pepper-700 font-medium">
//                   View All
//                 </a>
//               </div>

//               <div className="space-y-4">
//                 {invoices.slice(0, 3).map(invoice => (
//                   <div key={invoice.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
//                     <div className="flex items-center justify-between">
//                       <div>
//                         <div className="font-medium text-gray-900">{invoice.invoiceNumber}</div>
//                         <div className="text-sm text-gray-600">{invoice.customerName} • {invoice.period}</div>
//                       </div>
//                       <div className="text-right">
//                         <div className="text-lg font-bold text-gray-900">{formatCurrency(invoice.amount)}</div>
//                         <span className={cn(
//                           "px-2 py-1 rounded-full text-xs font-medium",
//                           getStatusColor(invoice.status)
//                         )}>
//                           {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
//                         </span>
//                       </div>
//                     </div>
//                     <div className="mt-3 flex items-center justify-between text-sm">
//                       <div className="text-gray-600">
//                         Issued: {formatDate(invoice.issueDate)} • Due: {formatDate(invoice.dueDate)}
//                       </div>
//                       <div className="flex items-center space-x-2">
//                         <button className="text-pepper-600 hover:text-pepper-700">
//                           View
//                         </button>
//                         <button className="text-gray-600 hover:text-gray-900">
//                           Download
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* Sidebar */}
//           <div className="space-y-6">
//             {/* COD Summary */}
//             <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
//               <div className="flex items-center space-x-3 mb-6">
//                 <div className="p-2 bg-emerald-50 rounded-lg">
//                   <Banknote className="h-6 w-6 text-emerald-600" />
//                 </div>
//                 <div>
//                   <h3 className="font-bold text-gray-900">COD Summary</h3>
//                   <p className="text-gray-600">Cash on Delivery tracking</p>
//                 </div>
//               </div>

//               <div className="space-y-4">
//                 <div>
//                   <div className="flex items-center justify-between mb-1">
//                     <span className="text-sm text-gray-700">Total COD</span>
//                     <span className="font-bold">{formatCurrency(codSummary.totalCOD)}</span>
//                   </div>
//                   <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
//                     <div
//                       className="h-full bg-emerald-500 transition-all duration-300"
//                       style={{ width: '100%' }}
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <div className="flex items-center justify-between mb-1">
//                     <span className="text-sm text-gray-700">Collected</span>
//                     <span className="font-bold text-green-600">{formatCurrency(codSummary.collected)}</span>
//                   </div>
//                   <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
//                     <div
//                       className="h-full bg-green-500 transition-all duration-300"
//                       style={{ width: `${codSummary.collectionRate}%` }}
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <div className="flex items-center justify-between mb-1">
//                     <span className="text-sm text-gray-700">Pending</span>
//                     <span className="font-bold text-yellow-600">{formatCurrency(codSummary.pending)}</span>
//                   </div>
//                   <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
//                     <div
//                       className="h-full bg-yellow-500 transition-all duration-300"
//                       style={{ width: `${(codSummary.pending / codSummary.totalCOD) * 100}%` }}
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <div className="flex items-center justify-between mb-1">
//                     <span className="text-sm text-gray-700">Overdue</span>
//                     <span className="font-bold text-red-600">{formatCurrency(codSummary.overdue)}</span>
//                   </div>
//                   <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
//                     <div
//                       className="h-full bg-red-500 transition-all duration-300"
//                       style={{ width: `${(codSummary.overdue / codSummary.totalCOD) * 100}%` }}
//                     />
//                   </div>
//                 </div>

//                 <div className="pt-4 border-t border-gray-200">
//                   <div className="text-center">
//                     <div className="text-2xl font-bold text-gray-900">{codSummary.collectionRate}%</div>
//                     <div className="text-sm text-gray-600">Collection Rate</div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Payment Methods */}
//             <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
//               <h3 className="font-bold text-gray-900 mb-4">Payment Methods</h3>
//               <div className="space-y-3">
//                 {[
//                   { type: 'Bank Transfer', status: 'active', lastUsed: 'Today' },
//                   { type: 'Credit Card', status: 'active', lastUsed: '2 days ago' },
//                   { type: 'Wallet', status: 'active', lastUsed: 'Now' },
//                   { type: 'PayPal', status: 'inactive', lastUsed: '1 month ago' },
//                 ].map((method, index) => (
//                   <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded">
//                     <div className="flex items-center space-x-3">
//                       <CreditCard className="h-5 w-5 text-gray-500" />
//                       <div>
//                         <div className="font-medium text-gray-900">{method.type}</div>
//                         <div className="text-sm text-gray-600">Last used {method.lastUsed}</div>
//                       </div>
//                     </div>
//                     <span className={cn(
//                       "px-2 py-0.5 rounded text-xs font-medium",
//                       method.status === 'active' ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
//                     )}>
//                       {method.status}
//                     </span>
//                   </div>
//                 ))}
//               </div>
//               <button className="w-full mt-4 p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
//                 + Add Payment Method
//               </button>
//             </div>

//             {/* Quick Stats */}
//             <div className="bg-gradient-to-r from-pepper-600 to-pepper-500 rounded-xl p-6 text-white">
//               <h3 className="font-bold mb-4">Quick Stats</h3>
//               <div className="space-y-3">
//                 <div className="flex items-center justify-between">
//                   <span className="text-pepper-200">Avg. Invoice Amount</span>
//                   <span>{formatCurrency(stats.totalRevenue / invoices.length)}</span>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span className="text-pepper-200">On-time Payments</span>
//                   <span>87%</span>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span className="text-pepper-200">Pending Settlements</span>
//                   <span>{formatCurrency(wallet.pendingBalance)}</span>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span className="text-pepper-200">Payment Success Rate</span>
//                   <span>94%</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Invoices View */}
//       {viewMode === 'invoices' && (
//         <div className="bg-white rounded-xl shadow-soft overflow-hidden border border-gray-200">
//           {/* Toolbar */}
//           <div className="p-6 border-b border-gray-200">
//             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//               <div className="flex items-center space-x-4">
//                 <Filter className="h-5 w-5 text-gray-500" />
//                 <select
//                   className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20 focus:outline-none transition"
//                   value={selectedStatus}
//                   onChange={(e) => setSelectedStatus(e.target.value as any)}
//                 >
//                   <option value="all">All Status</option>
//                   <option value="paid">Paid</option>
//                   <option value="pending">Pending</option>
//                   <option value="overdue">Overdue</option>
//                   <option value="draft">Draft</option>
//                 </select>
//               </div>

//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//                 <input
//                   type="text"
//                   placeholder="Search invoices by number or customer..."
//                   className="pl-10 pr-4 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20 focus:outline-none transition w-64"
//                   value={searchQuery}
//                   onChange={(e) => setSearchQuery(e.target.value)}
//                 />
//               </div>

//               <div className="flex items-center space-x-2">
//                 <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center space-x-2">
//                   <Download className="h-4 w-4" />
//                   <span>Export</span>
//                 </button>
//                 <button className="px-4 py-2 bg-pepper-500 text-white rounded-lg hover:bg-pepper-600 transition flex items-center space-x-2">
//                   <Plus className="h-4 w-4" />
//                   <span>New Invoice</span>
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* Invoices Table */}
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead>
//                 <tr className="bg-gray-50 border-b border-gray-200">
//                   <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Invoice
//                   </th>
//                   <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Customer
//                   </th>
//                   <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Period
//                   </th>
//                   <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Due Date
//                   </th>
//                   <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Amount
//                   </th>
//                   <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Status
//                   </th>
//                   <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-200">
//                 <AnimatePresence>
//                   {filteredInvoices.map(invoice => (
//                     <motion.tr
//                       key={invoice.id}
//                       initial={{ opacity: 0 }}
//                       animate={{ opacity: 1 }}
//                       exit={{ opacity: 0 }}
//                       className="hover:bg-gray-50 transition-colors"
//                     >
//                       <td className="py-3 px-4">
//                         <div className="font-medium text-gray-900">{invoice.invoiceNumber}</div>
//                         <div className="text-sm text-gray-500">Issued: {formatDate(invoice.issueDate)}</div>
//                       </td>
//                       <td className="py-3 px-4">
//                         <div className="font-medium text-gray-900">{invoice.customerName}</div>
//                       </td>
//                       <td className="py-3 px-4">
//                         <div className="text-gray-700">{invoice.period}</div>
//                       </td>
//                       <td className="py-3 px-4">
//                         <div className={cn(
//                           "font-medium",
//                           invoice.status === 'overdue' ? "text-red-600" : "text-gray-700"
//                         )}>
//                           {formatDate(invoice.dueDate)}
//                         </div>
//                       </td>
//                       <td className="py-3 px-4">
//                         <div className="font-bold text-gray-900">{formatCurrency(invoice.amount)}</div>
//                         <div className="text-sm text-gray-500">
//                           Paid: {formatCurrency(invoice.paidAmount)} • Balance: {formatCurrency(invoice.balance)}
//                         </div>
//                       </td>
//                       <td className="py-3 px-4">
//                         <span className={cn(
//                           "px-3 py-1 rounded-full text-xs font-medium inline-flex items-center space-x-1",
//                           getStatusColor(invoice.status)
//                         )}>
//                           {getStatusIcon(invoice.status)}
//                           <span>{invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}</span>
//                         </span>
//                       </td>
//                       <td className="py-3 px-4">
//                         <div className="flex items-center space-x-2">
//                           <button
//                             onClick={() => setSelectedInvoice(invoice.id)}
//                             className="p-1 hover:bg-gray-100 rounded transition"
//                             title="View"
//                           >
//                             <Eye className="h-4 w-4 text-gray-600" />
//                           </button>
//                           <button
//                             onClick={() => handleDownloadInvoice(invoice.id)}
//                             className="p-1 hover:bg-gray-100 rounded transition"
//                             title="Download"
//                           >
//                             <Download className="h-4 w-4 text-gray-600" />
//                           </button>
//                           {invoice.status !== 'paid' && (
//                             <button
//                               onClick={() => handlePayInvoice(invoice.id)}
//                               className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
//                             >
//                               Pay
//                             </button>
//                           )}
//                         </div>
//                       </td>
//                     </motion.tr>
//                   ))}
//                 </AnimatePresence>
//               </tbody>
//             </table>
//           </div>

//           {/* Empty State */}
//           {filteredInvoices.length === 0 && (
//             <div className="p-12 text-center">
//               <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//               <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
//               <p className="text-gray-600">
//                 {searchQuery || selectedStatus !== 'all'
//                   ? 'Try adjusting your filters'
//                   : 'No invoices have been generated yet'
//                 }
//               </p>
//             </div>
//           )}

//           {/* Summary */}
//           <div className="p-6 border-t border-gray-200 bg-gray-50">
//             <div className="flex items-center justify-between">
//               <div>
//                 <div className="text-sm text-gray-600">
//                   Showing {filteredInvoices.length} of {invoices.length} invoices
//                 </div>
//                 <div className="text-sm text-gray-600">
//                   Total: {formatCurrency(filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0))}
//                 </div>
//               </div>
//               <div className="flex items-center space-x-2">
//                 <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
//                   Previous
//                 </button>
//                 <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
//                   Next
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Transactions View */}
//       {viewMode === 'transactions' && (
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* Transactions List */}
//           <div className="lg:col-span-2">
//             <div className="bg-white rounded-xl shadow-soft overflow-hidden border border-gray-200">
//               <div className="p-6 border-b border-gray-200">
//                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//                   <div>
//                     <h3 className="text-lg font-bold text-gray-900">Transaction History</h3>
//                     <p className="text-gray-600">All wallet transactions</p>
//                   </div>
//                   <div className="flex items-center space-x-4">
//                     <div className="flex items-center space-x-2">
//                       <Filter className="h-5 w-5 text-gray-500" />
//                       <select
//                         className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-300 focus:border-pepper-500 focus:ring-2 focus:ring-pepper-500/20 focus:outline-none transition"
//                         value={selectedType}
//                         onChange={(e) => setSelectedType(e.target.value as any)}
//                       >
//                         <option value="all">All Types</option>
//                         <option value="credit">Credits</option>
//                         <option value="debit">Debits</option>
//                       </select>
//                     </div>
//                     <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center space-x-2">
//                       <Download className="h-4 w-4" />
//                       <span>Export</span>
//                     </button>
//                   </div>
//                 </div>
//               </div>

//               <div className="divide-y divide-gray-100">
//                 {filteredTransactions.map(transaction => (
//                   <div key={transaction.id} className="p-6 hover:bg-gray-50 transition">
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center space-x-4">
//                         <div className={cn(
//                           "p-3 rounded-lg",
//                           transaction.type === 'credit' ? "bg-green-100" : "bg-red-100"
//                         )}>
//                           {getTransactionIcon(transaction.type)}
//                         </div>
//                         <div>
//                           <div className="font-medium text-gray-900">{transaction.description}</div>
//                           <div className="text-sm text-gray-600">
//                             {formatDate(transaction.date)} • Ref: {transaction.reference}
//                           </div>
//                         </div>
//                       </div>
//                       <div className="text-right">
//                         <div className={cn(
//                           "text-lg font-bold",
//                           transaction.type === 'credit' ? "text-green-600" : "text-red-600"
//                         )}>
//                           {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
//                         </div>
//                         <div className="text-sm text-gray-600 capitalize">
//                           {transaction.method.replace('_', ' ')} • {transaction.status}
//                         </div>
//                       </div>
//                     </div>
//                     <div className="mt-4 flex items-center justify-between text-sm">
//                       <div className="text-gray-600">
//                         Balance after transaction: {formatCurrency(transaction.balance)}
//                       </div>
//                       <div className="flex items-center space-x-2">
//                         <button className="text-pepper-600 hover:text-pepper-700">
//                           View Details
//                         </button>
//                         {transaction.status === 'failed' && (
//                           <button className="text-red-600 hover:text-red-700">
//                             Retry
//                           </button>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* Sidebar */}
//           <div className="space-y-6">
//             {/* Transaction Summary */}
//             <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
//               <h3 className="font-bold text-gray-900 mb-4">Transaction Summary</h3>
//               <div className="space-y-4">
//                 <div className="flex items-center justify-between">
//                   <span className="text-gray-700">Total Credits</span>
//                   <span className="font-bold text-green-600">
//                     {formatCurrency(transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0))}
//                   </span>
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span className="text-gray-700">Total Debits</span>
//                   <span className="font-bold text-red-600">
//                     {formatCurrency(transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0))}
//                   </span>
//                 </div>
//                 <div className="flex items-center justify-between border-t border-gray-200 pt-4">
//                   <span className="text-gray-900 font-medium">Net Flow</span>
//                   <span className={cn(
//                     "text-lg font-bold",
//                     wallet.balance >= 0 ? "text-green-600" : "text-red-600"
//                   )}>
//                     {wallet.balance >= 0 ? '+' : ''}{formatCurrency(wallet.balance)}
//                   </span>
//                 </div>
//               </div>

//               <div className="mt-6">
//                 <h4 className="font-medium text-gray-900 mb-3">By Payment Method</h4>
//                 <div className="space-y-2">
//                   {['card', 'bank_transfer', 'wallet', 'cash'].map(method => {
//                     const total = transactions
//                       .filter(t => t.method === method)
//                       .reduce((sum, t) => sum + t.amount, 0)
//                     return (
//                       <div key={method} className="flex items-center justify-between">
//                         <span className="text-sm text-gray-600 capitalize">{method.replace('_', ' ')}</span>
//                         <span className="font-medium">{formatCurrency(total)}</span>
//                       </div>
//                     )
//                   })}
//                 </div>
//               </div>
//             </div>

//             {/* Recent Settlements */}
//             <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
//               <h3 className="font-bold text-gray-900 mb-4">Recent Settlements</h3>
//               <div className="space-y-3">
//                 {[
//                   { date: 'Today', amount: 125000, status: 'pending' },
//                   { date: 'Yesterday', amount: 87500, status: 'completed' },
//                   { date: 'Mar 13', amount: 62500, status: 'completed' },
//                   { date: 'Mar 12', amount: 112500, status: 'completed' },
//                 ].map((settlement, index) => (
//                   <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
//                     <div>
//                       <div className="font-medium text-gray-900">{settlement.date}</div>
//                       <div className="text-sm text-gray-600 capitalize">{settlement.status}</div>
//                     </div>
//                     <div className="text-right">
//                       <div className="font-bold">{formatCurrency(settlement.amount)}</div>
//                       <div className={cn(
//                         "text-xs",
//                         settlement.status === 'completed' ? "text-green-600" : "text-yellow-600"
//                       )}>
//                         {settlement.status}
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//               <button className="w-full mt-4 p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
//                 View All Settlements
//               </button>
//             </div>

//             {/* Payment Actions */}
//             <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-6 text-white">
//               <h3 className="font-bold mb-4">Quick Actions</h3>
//               <div className="space-y-3">
//                 <button className="w-full px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition font-medium text-sm">
//                   Initiate Settlement
//                 </button>
//                 <button className="w-full px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition font-medium text-sm">
//                   Request Payout
//                 </button>
//                 <button className="w-full px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition font-medium text-sm">
//                   Generate Report
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* COD Management View */}
//       {viewMode === 'cod' && (
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* COD Summary */}
//           <div className="lg:col-span-2">
//             <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
//               <div className="flex items-center justify-between mb-6">
//                 <div>
//                   <h3 className="text-lg font-bold text-gray-900">COD Management</h3>
//                   <p className="text-gray-600">Track and reconcile cash on delivery payments</p>
//                 </div>
//                 <button className="px-4 py-2 pepper-gradient text-white rounded-lg hover:shadow-lg transition flex items-center space-x-2">
//                   <Banknote className="h-4 w-4" />
//                   <span>Initiate Settlement</span>
//                 </button>
//               </div>

//               {/* COD Stats */}
//               <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//                 {[
//                   { label: 'Total COD', value: formatCurrency(codSummary.totalCOD), color: 'bg-blue-500' },
//                   { label: 'Collected', value: formatCurrency(codSummary.collected), color: 'bg-green-500' },
//                   { label: 'Pending', value: formatCurrency(codSummary.pending), color: 'bg-yellow-500' },
//                   { label: 'Overdue', value: formatCurrency(codSummary.overdue), color: 'bg-red-500' },
//                 ].map((stat, index) => (
//                   <div key={index} className="bg-gray-50 p-4 rounded-lg">
//                     <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
//                     <div className="text-sm text-gray-600">{stat.label}</div>
//                     <div className={`h-1 ${stat.color} rounded-full mt-2`} />
//                   </div>
//                 ))}
//               </div>

//               {/* COD Transactions */}
//               <div className="space-y-4">
//                 <h4 className="font-medium text-gray-900">Recent COD Transactions</h4>
//                 {[
//                   { customer: 'TechGadgets NG', amount: 125000, date: 'Today', status: 'collected', driver: 'Adebayo Johnson' },
//                   { customer: 'FashionHub Africa', amount: 87500, date: 'Yesterday', status: 'pending', driver: 'Chinedu Okoro' },
//                   { customer: 'GadgetZone Ltd', amount: 68500, date: 'Mar 14', status: 'collected', driver: 'Grace Oluwaseun' },
//                   { customer: 'ElectroMart', amount: 112000, date: 'Mar 13', status: 'overdue', driver: 'Fatima Bello' },
//                   { customer: 'PhoneWorld', amount: 56000, date: 'Mar 12', status: 'collected', driver: 'Emmanuel Nwankwo' },
//                 ].map((transaction, index) => (
//                   <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
//                     <div className="flex items-center justify-between">
//                       <div>
//                         <div className="font-medium text-gray-900">{transaction.customer}</div>
//                         <div className="text-sm text-gray-600">
//                           {transaction.date} • Driver: {transaction.driver}
//                         </div>
//                       </div>
//                       <div className="text-right">
//                         <div className="text-lg font-bold text-gray-900">{formatCurrency(transaction.amount)}</div>
//                         <span className={cn(
//                           "px-2 py-0.5 rounded text-xs font-medium",
//                           transaction.status === 'collected' ? "bg-green-100 text-green-800" :
//                           transaction.status === 'pending' ? "bg-yellow-100 text-yellow-800" :
//                           "bg-red-100 text-red-800"
//                         )}>
//                           {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
//                         </span>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* Sidebar */}
//           <div className="space-y-6">
//             {/* Settlement Schedule */}
//             <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
//               <h3 className="font-bold text-gray-900 mb-4">Settlement Schedule</h3>
//               <div className="space-y-3">
//                 {[
//                   { period: 'Daily', next: 'Today 6 PM', amount: formatCurrency(125000) },
//                   { period: 'Weekly', next: 'Friday', amount: formatCurrency(450000) },
//                   { period: 'Bi-weekly', next: 'Mar 29', amount: formatCurrency(875000) },
//                   { period: 'Monthly', next: 'Apr 1', amount: formatCurrency(1250000) },
//                 ].map((schedule, index) => (
//                   <div key={index} className="p-3 bg-gray-50 rounded-lg">
//                     <div className="flex items-center justify-between mb-2">
//                       <div className="font-medium text-gray-900">{schedule.period}</div>
//                       <div className="text-sm text-gray-600">Next: {schedule.next}</div>
//                     </div>
//                     <div className="text-lg font-bold">{schedule.amount}</div>
//                   </div>
//                 ))}
//               </div>
//               <button className="w-full mt-4 p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
//                 Configure Schedule
//               </button>
//             </div>

//             {/* Driver COD Performance */}
//             <div className="bg-white rounded-xl shadow-soft p-6 border border-gray-200">
//               <h3 className="font-bold text-gray-900 mb-4">Driver COD Performance</h3>
//               <div className="space-y-3">
//                 {[
//                   { driver: 'Adebayo Johnson', collected: 125000, pending: 25000, rate: '94%' },
//                   { driver: 'Chinedu Okoro', collected: 87500, pending: 15000, rate: '85%' },
//                   { driver: 'Grace Oluwaseun', collected: 112000, pending: 18000, rate: '86%' },
//                   { driver: 'Fatima Bello', collected: 68500, pending: 32000, rate: '68%' },
//                 ].map((driver, index) => (
//                   <div key={index} className="p-2 hover:bg-gray-50 rounded">
//                     <div className="flex items-center justify-between mb-1">
//                       <span className="font-medium">{driver.driver}</span>
//                       <span className="text-sm text-gray-600">{driver.rate}</span>
//                     </div>
//                     <div className="text-sm text-gray-600">
//                       Collected: {formatCurrency(driver.collected)} • Pending: {formatCurrency(driver.pending)}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             {/* COD Actions */}
//             <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl p-6 text-white">
//               <h3 className="font-bold mb-4">COD Actions</h3>
//               <div className="space-y-3">
//                 <button className="w-full px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition font-medium text-sm">
//                   Send Collection Reminders
//                 </button>
//                 <button className="w-full px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition font-medium text-sm">
//                   Generate COD Report
//                 </button>
//                 <button className="w-full px-4 py-2 bg-white text-emerald-600 rounded-lg hover:bg-gray-100 transition font-medium text-sm">
//                   Export All Data
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Invoice Modal */}
//       <AnimatePresence>
//         {selectedInvoice && (() => {
//           const invoice = invoices.find(inv => inv.id === selectedInvoice)
//           if (!invoice) return null

//           return (
//             <motion.div
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               className="fixed inset-0 z-50 overflow-y-auto"
//             >
//               <div className="flex items-center justify-center min-h-screen p-4">
//                 <div className="fixed inset-0 bg-black/50" onClick={() => setSelectedInvoice(null)} />
//                 <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl">
//                   <DynamicInvoicePDF invoice={invoice} onClose={() => setSelectedInvoice(null)} />
//                 </div>
//               </div>
//             </motion.div>
//           )
//         })()}
//       </AnimatePresence>
//     </div>
//   )
// }



